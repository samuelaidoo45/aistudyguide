'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/app/lib/supabase'
import { Info, ChevronLeft, Loader2, RefreshCw, BookOpen, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

// Define types
interface Topic {
  id: string
  title?: string
  name?: string
  description?: string
  main_outline?: string
  created_at: string
  last_accessed?: string
  progress?: number
  category?: string
  total_study_time?: number
  user_id: string
}

interface SubOutline {
  id: string
  topic_id: string
  title: string
  content: string
  created_at: string
  last_accessed?: string
}

interface Note {
  id: string
  topic_id: string
  section_title: string
  content: string
  created_at: string
}

type ViewState = "main" | "suboutline" | "notes";

export default function TopicPage() {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [subOutlines, setSubOutlines] = useState<Record<string, SubOutline>>({})
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [loading, setLoading] = useState(true)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ViewState>("main")
  const outlineRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        console.log('Fetching data for topic ID:', topicId)
        
        // Fetch topic
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', topicId)
          .single()

        if (topicError) {
          console.error('Error loading topic:', topicError)
          toast.error('Topic not found')
          setLoading(false)
          return
        }

        if (!topic) {
          toast.error('Topic not found')
          setLoading(false)
          return
        }

        // Update last_accessed timestamp
        await supabase
          .from('topics')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', topicId)

        console.log('Topic data loaded successfully:', {
          topic: topic.title || topic.name
        })

        // Process the main outline to make items clickable
        if (topic.main_outline) {
          topic.main_outline = makeOutlineItemsClickable(topic.main_outline)
        }

        setTopic(topic)
      } catch (error: any) {
        console.error('Error loading topic data:', error)
        toast.error(error.message || 'Failed to load topic data')
      } finally {
        setLoading(false)
      }
    }

    fetchTopicData()
  }, [topicId, supabase])

  // Make outline items clickable
  const makeOutlineItemsClickable = (html: string): string => {
    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Find all h2 elements and add the necessary classes and attributes
    const h2Elements = tempDiv.querySelectorAll('h2')
    h2Elements.forEach(h2 => {
      h2.classList.add('outline-item', 'cursor-pointer', 'hover:text-indigo-600', 'transition-colors')
      h2.setAttribute('role', 'button')
      h2.setAttribute('tabindex', '0')
      
      // Store the original text for easier access
      const itemText = h2.textContent?.trim() || ''
      h2.setAttribute('data-section', itemText)
    })
    
    // Find all list items and add the necessary classes and attributes
    const listItems = tempDiv.querySelectorAll('li')
    listItems.forEach(li => {
      li.classList.add('subtopic-item', 'cursor-pointer', 'hover:text-indigo-600', 'transition-colors')
      li.setAttribute('role', 'button')
      li.setAttribute('tabindex', '0')
      
      // Store the original text for easier access
      const itemText = li.textContent?.trim() || ''
      li.setAttribute('data-section', itemText)
    })
    
    return tempDiv.innerHTML
  }

  // Make suboutline items clickable
  const makeSubOutlineItemsClickable = (html: string): string => {
    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Find all h3 elements and add the necessary classes and attributes
    const h3Elements = tempDiv.querySelectorAll('h3')
    h3Elements.forEach(h3 => {
      h3.classList.add('suboutline-item', 'cursor-pointer', 'hover:text-indigo-600', 'transition-colors')
      h3.setAttribute('role', 'button')
      h3.setAttribute('tabindex', '0')
      
      // Store the original text for easier access
      const itemText = h3.textContent?.trim() || ''
      h3.setAttribute('data-subsubtopic', itemText)
    })
    
    // Find all list items and add the necessary classes and attributes
    const listItems = tempDiv.querySelectorAll('li')
    listItems.forEach(li => {
      li.classList.add('note-item', 'cursor-pointer', 'hover:text-indigo-600', 'transition-colors')
      li.setAttribute('role', 'button')
      li.setAttribute('tabindex', '0')
      
      // Store the original text for easier access
      const itemText = li.textContent?.trim() || ''
      li.setAttribute('data-subsubtopic', itemText)
    })
    
    // Find all section-card elements and add the necessary classes
    const sectionCards = tempDiv.querySelectorAll('.section-card')
    sectionCards.forEach(card => {
      // Find the section title
      const sectionTitle = card.querySelector('.section-title')
      if (sectionTitle) {
        sectionTitle.classList.add('suboutline-item', 'cursor-pointer', 'hover:text-indigo-600', 'transition-colors')
        sectionTitle.setAttribute('role', 'button')
        sectionTitle.setAttribute('tabindex', '0')
        
        // Store the original text for easier access
        const titleText = sectionTitle.textContent?.trim() || ''
        sectionTitle.setAttribute('data-subsubtopic', titleText)
        
        // Find all subtopic items within this section
        const subtopicItems = card.querySelectorAll('.subtopic-item')
        subtopicItems.forEach(item => {
          item.classList.add('note-item', 'cursor-pointer', 'hover:text-indigo-600', 'transition-colors')
          item.setAttribute('role', 'button')
          item.setAttribute('tabindex', '0')
          
          // Store the original text for easier access
          const spanElement = item.querySelector('span')
          const itemText = spanElement ? spanElement.textContent?.trim() || '' : item.textContent?.trim() || ''
          item.setAttribute('data-subsubtopic', itemText)
          
          // Store the parent section for context
          item.setAttribute('data-parent-section', titleText)
        })
      }
    })
    
    return tempDiv.innerHTML
  }

  // Handle click on main outline items
  const handleMainOutlineClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    
    // Find the closest clickable element
    const clickedItem = target.closest('.outline-item') || 
                        target.closest('.subtopic-item') || 
                        target.closest('h2') ||
                        target.closest('li')
    
    if (!clickedItem) return
    
    // Extract the text content, prioritizing data attributes and specific elements
    let sectionTitle = ''
    
    // Check for data attributes first (most reliable)
    if (clickedItem.hasAttribute('data-section')) {
      const dataSection = clickedItem.getAttribute('data-section')
      if (dataSection) {
        sectionTitle = dataSection
      }
    }
    
    // If no data attribute, try to find specific elements
    if (!sectionTitle) {
      const spanElement = clickedItem.querySelector('span')
      if (spanElement) {
        sectionTitle = spanElement.textContent?.trim() || ''
      } else {
        // Fallback to the item's text content
        sectionTitle = clickedItem.textContent?.trim() || ''
      }
    }
    
    // Clean up the section title
    sectionTitle = sectionTitle.replace(/[\n\r]+/g, ' ').trim()
    
    if (!sectionTitle) return
    
    console.log('Clicked section:', sectionTitle)
    
    // Add active class to the clicked item
    const allItems = document.querySelectorAll('.prose .outline-item, .prose .subtopic-item, .prose h2, .prose li')
    allItems.forEach(item => item.classList.remove('active'))
    clickedItem.classList.add('active')
    
    setActiveSection(sectionTitle)
    
    // Show visual feedback
    toast.success(`Generating detailed outline for "${sectionTitle}"`)
    
    // Check if we already have this section's suboutline
    if (subOutlines[sectionTitle]) {
      setViewState("suboutline")
    } else {
      fetchOrGenerateSubOutline(sectionTitle)
    }
  }

  // Handle click on suboutline items
  const handleSubOutlineClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    
    // Find the closest clickable element
    const clickedItem = target.closest('.suboutline-item') || 
                        target.closest('.note-item') || 
                        target.closest('h3') ||
                        target.closest('li')
    
    if (!clickedItem) return
    
    // Extract the text content, prioritizing data attributes and specific elements
    let sectionTitle = ''
    
    // Check for data attributes first (most reliable)
    if (clickedItem.hasAttribute('data-subsubtopic')) {
      const dataSubsubtopic = clickedItem.getAttribute('data-subsubtopic')
      if (dataSubsubtopic) {
        sectionTitle = dataSubsubtopic
      }
    }
    
    // If no data attribute, try to find specific elements
    if (!sectionTitle) {
      const spanElement = clickedItem.querySelector('span')
      if (spanElement) {
        sectionTitle = spanElement.textContent?.trim() || ''
      } else {
        // Fallback to the item's text content
        sectionTitle = clickedItem.textContent?.trim() || ''
      }
    }
    
    // Clean up the section title
    sectionTitle = sectionTitle.replace(/[\n\r]+/g, ' ').trim()
    
    // Remove any HTML tags that might be present
    sectionTitle = sectionTitle.replace(/<[^>]*>/g, '')
    
    if (!sectionTitle || !activeSection) return
    
    console.log('Clicked subsection:', sectionTitle)
    
    // Add active class to the clicked item
    const allItems = document.querySelectorAll('.suboutline-content .suboutline-item, .suboutline-content .note-item, .suboutline-content li')
    allItems.forEach(item => item.classList.remove('active'))
    clickedItem.classList.add('active')
    
    // Generate or fetch notes for this subsection
    const fullSectionTitle = `${activeSection}: ${sectionTitle}`
    
    // Check if we already have notes for this section
    if (notes[fullSectionTitle]) {
      console.log('Using existing notes for:', fullSectionTitle)
      setViewState("notes")
    } else {
      // Show visual feedback
      toast.success(`Generating notes for "${sectionTitle}"`)
      
      // Fetch or generate notes
      fetchOrGenerateNotes(fullSectionTitle)
    }
  }

  // Fetch or generate suboutline for a section
  const fetchOrGenerateSubOutline = async (sectionTitle: string) => {
    try {
      setGeneratingContent(true)
      setActiveSection(sectionTitle)
      
      // First check if we already have this subtopic in the database
      const { data: existingSubtopic, error: fetchError } = await supabase
        .from('subtopics')
        .select('*')
        .eq('topic_id', topicId)
        .eq('title', sectionTitle)
        .single()
      
      if (!fetchError && existingSubtopic) {
        // We found an existing subtopic
        // Process to make items clickable
        existingSubtopic.content = makeSubOutlineItemsClickable(existingSubtopic.content)
        
        setSubOutlines(prev => ({
          ...prev,
          [sectionTitle]: existingSubtopic
        }))
        setViewState("suboutline")
        return
      }
      
      // No existing subtopic, generate a new one
      toast.loading(`Generating detailed outline for "${sectionTitle}"...`, { id: 'generating-content' })
      
      console.log('Generating suboutline for:', {
        subtopic: sectionTitle,
        mainTopic: topic?.title || topic?.name,
        description: topic?.description
      })
      
      // Create a temporary suboutline object to display while generating
      const tempSubOutline = {
        id: 'temp-id',
        topic_id: topicId,
        title: sectionTitle,
        content: '<div class="animate-pulse">Generating detailed outline...</div>',
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }
      
      // Set the temporary suboutline and switch to suboutline view immediately
      setSubOutlines(prev => ({
        ...prev,
        [sectionTitle]: tempSubOutline
      }))
      setViewState("suboutline")
      
      const response = await fetch('/api/generateSubOutline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "generateOutlineHTML",
          subtopic: sectionTitle,
          mainTopic: topic?.title || topic?.name,
          description: topic?.description
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API response error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to generate detailed outline: ${response.status} ${response.statusText}. ${errorText}`)
      }
      
      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available for streaming response')
      }
      
      let outlineHtml = ''
      const decoder = new TextDecoder()
      let buffer = ''
      
      // Read the stream
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Process the buffer to ensure we have complete HTML elements
          const lastCloseTagIndex = buffer.lastIndexOf('</');
          if (lastCloseTagIndex !== -1) {
            const nextOpenTagIndex = buffer.indexOf('<', lastCloseTagIndex);
            if (nextOpenTagIndex !== -1) {
              const completeHtml = buffer.substring(0, nextOpenTagIndex);
              outlineHtml += completeHtml;
              
              // Update the UI with the complete HTML
              setSubOutlines(prev => ({
                ...prev,
                [sectionTitle]: {
                  ...prev[sectionTitle],
                  content: prev[sectionTitle]?.content === tempSubOutline.content 
                    ? makeSubOutlineItemsClickable(completeHtml) 
                    : prev[sectionTitle]?.content + makeSubOutlineItemsClickable(completeHtml)
                }
              }))
              
              buffer = buffer.substring(nextOpenTagIndex);
            } else {
              // If no next opening tag, we can safely add everything up to the last closing tag
              const completeHtml = buffer.substring(0, lastCloseTagIndex + 2); // +2 to include the closing tag
              outlineHtml += completeHtml;
              
              // Update the UI with the complete HTML
              setSubOutlines(prev => ({
                ...prev,
                [sectionTitle]: {
                  ...prev[sectionTitle],
                  content: prev[sectionTitle]?.content === tempSubOutline.content 
                    ? makeSubOutlineItemsClickable(completeHtml) 
                    : prev[sectionTitle]?.content + makeSubOutlineItemsClickable(completeHtml)
                }
              }))
              
              buffer = buffer.substring(lastCloseTagIndex + 2);
            }
          }
        }
      } catch (streamError: any) {
        console.error('Error reading stream:', streamError)
        throw new Error(`Error reading stream: ${streamError.message}`)
      }
      
      // Add any remaining buffer content
      if (buffer) {
        outlineHtml += buffer;
        
        // Update the UI with the remaining buffer
        setSubOutlines(prev => ({
          ...prev,
          [sectionTitle]: {
            ...prev[sectionTitle],
            content: prev[sectionTitle]?.content === tempSubOutline.content 
              ? makeSubOutlineItemsClickable(buffer) 
              : prev[sectionTitle]?.content + makeSubOutlineItemsClickable(buffer)
          }
        }))
      }
      
      if (!outlineHtml || outlineHtml.trim() === '') {
        console.error('Empty outline HTML received')
        throw new Error('No detailed outline generated - received empty response')
      }
      
      console.log('Generated suboutline HTML:', outlineHtml.substring(0, 100) + '...');
      
      // Process the outline to make items clickable
      const processedOutline = makeSubOutlineItemsClickable(outlineHtml)
      
      // Save to database
      try {
        // Save to subtopics table
        const { data: newSubtopic, error: saveError } = await supabase
          .from('subtopics')
          .insert({
            topic_id: topicId,
            title: sectionTitle,
            content: processedOutline,
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString()
          })
          .select()
          .single()
        
        if (saveError) {
          console.error('Error saving to subtopics table:', saveError)
          throw saveError
        }
        
        // Update state with the subtopic data
        setSubOutlines(prev => ({
          ...prev,
          [sectionTitle]: {
            ...newSubtopic,
            content: processedOutline
          }
        }))
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError)
        // Don't throw here, we already have the content in the UI
        toast.error(`Failed to save outline to database: ${dbError.message}`, { id: 'db-error' })
      }
      
      toast.success('Detailed outline generated', { id: 'generating-content' })
    } catch (error: any) {
      console.error('Error generating detailed outline:', error)
      toast.error(error.message || 'Failed to generate detailed outline', { id: 'generating-content' })
    } finally {
      setGeneratingContent(false)
    }
  }

  // Fetch or generate notes for a section
  const fetchOrGenerateNotes = async (sectionTitle: string) => {
    try {
      setGeneratingContent(true)
      setActiveSection(sectionTitle)
      
      // First check if we already have notes for this section in the database
      // We need to join with subtopics to find notes by topic_id and section_title
      const { data: subtopicForNotes, error: subtopicError } = await supabase
        .from('subtopics')
        .select('id')
        .eq('topic_id', topicId)
        .eq('title', sectionTitle)
        .single();
      
      let existingNotes = null;
      
      if (!subtopicError && subtopicForNotes) {
        // Now get the notes for this subtopic
        const { data: notes, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('subtopic_id', subtopicForNotes.id)
          .single();
          
        if (!notesError && notes) {
          existingNotes = {
            ...notes,
            topic_id: topicId,
            section_title: sectionTitle // Add this for compatibility with our UI
          };
        }
      }
      
      if (existingNotes) {
        // We found existing notes
        setNotes(prev => ({
          ...prev,
          [sectionTitle]: existingNotes
        }))
        setViewState("notes")
        return
      }
      
      // No existing notes, generate new ones
      toast.loading(`Generating notes for "${sectionTitle}"...`, { id: 'generating-content' })
      
      // Parse the section title to extract the main section and subtopic
      let subtopic = sectionTitle
      if (sectionTitle.includes(':')) {
        const parts = sectionTitle.split(':')
        subtopic = parts[1].trim()
      }
      
      console.log('Generating notes for:', {
        topicTitle: topic?.title || topic?.name,
        sectionTitle,
        subtopic,
        description: topic?.description
      })
      
      // Create a temporary notes object to display while generating
      const tempNotes = {
        id: 'temp-id',
        topic_id: topicId,
        section_title: sectionTitle,
        content: '<div class="animate-pulse">Generating notes...</div>',
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }
      
      // Set the temporary notes and switch to notes view immediately
      setNotes(prev => ({
        ...prev,
        [sectionTitle]: tempNotes
      }))
      setViewState("notes")
      
      const response = await fetch('/api/generateNotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicTitle: topic?.title || topic?.name,
          sectionTitle,
          subtopic,
          description: topic?.description
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API response error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to generate notes: ${response.status} ${response.statusText}. ${errorText}`)
      }
      
      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available for streaming response')
      }
      
      let notesHtml = ''
      const decoder = new TextDecoder()
      let buffer = ''
      
      // Read the stream
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Process the buffer to ensure we have complete HTML elements
          const lastCloseTagIndex = buffer.lastIndexOf('</');
          if (lastCloseTagIndex !== -1) {
            const nextOpenTagIndex = buffer.indexOf('<', lastCloseTagIndex);
            if (nextOpenTagIndex !== -1) {
              const completeHtml = buffer.substring(0, nextOpenTagIndex);
              notesHtml += completeHtml;
              
              // Update the UI with the complete HTML
              setNotes(prev => ({
                ...prev,
                [sectionTitle]: {
                  ...prev[sectionTitle],
                  content: prev[sectionTitle]?.content === tempNotes.content 
                    ? completeHtml 
                    : prev[sectionTitle]?.content + completeHtml
                }
              }))
              
              buffer = buffer.substring(nextOpenTagIndex);
            } else {
              // If no next opening tag, we can safely add everything up to the last closing tag
              const completeHtml = buffer.substring(0, lastCloseTagIndex + 2); // +2 to include the closing tag
              notesHtml += completeHtml;
              
              // Update the UI with the complete HTML
              setNotes(prev => ({
                ...prev,
                [sectionTitle]: {
                  ...prev[sectionTitle],
                  content: prev[sectionTitle]?.content === tempNotes.content 
                    ? completeHtml 
                    : prev[sectionTitle]?.content + completeHtml
                }
              }))
              
              buffer = buffer.substring(lastCloseTagIndex + 2);
            }
          }
        }
      } catch (streamError: any) {
        console.error('Error reading stream:', streamError)
        throw new Error(`Error reading stream: ${streamError.message}`)
      }
      
      // Add any remaining buffer content
      if (buffer) {
        notesHtml += buffer;
        
        // Update the UI with the remaining buffer
        setNotes(prev => ({
          ...prev,
          [sectionTitle]: {
            ...prev[sectionTitle],
            content: prev[sectionTitle]?.content === tempNotes.content 
              ? buffer 
              : prev[sectionTitle]?.content + buffer
          }
        }))
      }
      
      if (!notesHtml || notesHtml.trim() === '') {
        console.error('Empty notes HTML received')
        throw new Error('No notes generated - received empty response')
      }
      
      console.log('Generated notes HTML:', notesHtml.substring(0, 100) + '...');
      
      // DISABLED: Saving to database
      // Instead, just keep the notes in memory
      const finalNotes = {
        id: `temp-${Date.now()}`,
        topic_id: topicId,
        section_title: sectionTitle,
        content: notesHtml,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      };
      
      // Update state with the notes data
      setNotes(prev => ({
        ...prev,
        [sectionTitle]: finalNotes
      }));
      
      toast.success('Notes generated', { id: 'generating-content' })
    } catch (error: any) {
      console.error('Error generating notes:', error)
      toast.error(error.message || 'Failed to generate notes', { id: 'generating-content' })
    } finally {
      setGeneratingContent(false)
    }
  }

  // Generate outline from API
  const generateOutline = async () => {
    try {
      setGeneratingContent(true)
      toast.loading('Generating outline...', { id: 'generating-outline' })
      
      console.log('Generating outline for:', {
        title: topic?.title || topic?.name,
        description: topic?.description
      })
      
      // Create a temporary outline to display while generating
      const tempOutline = '<div class="animate-pulse">Generating detailed outline...</div>'
      
      // If topic exists, update its main_outline property
      if (topic) {
        setTopic({
          ...topic,
          main_outline: tempOutline
        })
      }
      
      const response = await fetch('/api/generateOutline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "generateOutlineHTML",
          title: topic?.title || topic?.name,
          description: topic?.description
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API response error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to generate outline: ${response.status} ${response.statusText}. ${errorText}`)
      }
      
      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available for streaming response')
      }
      
      let outlineHtml = ''
      const decoder = new TextDecoder()
      let buffer = ''
      
      // Read the stream
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Process the buffer to ensure we have complete HTML elements
          const lastCloseTagIndex = buffer.lastIndexOf('</');
          if (lastCloseTagIndex !== -1) {
            const nextOpenTagIndex = buffer.indexOf('<', lastCloseTagIndex);
            if (nextOpenTagIndex !== -1) {
              const completeHtml = buffer.substring(0, nextOpenTagIndex);
              outlineHtml += completeHtml;
              
              // Update the UI with the complete HTML
              if (topic) {
                setTopic(prevTopic => {
                  if (!prevTopic) return prevTopic;
                  return {
                    ...prevTopic,
                    main_outline: prevTopic.main_outline === tempOutline 
                      ? makeOutlineItemsClickable(completeHtml) 
                      : (prevTopic.main_outline || '') + makeOutlineItemsClickable(completeHtml)
                  };
                });
              }
              
              buffer = buffer.substring(nextOpenTagIndex);
            } else {
              // If no next opening tag, we can safely add everything up to the last closing tag
              const completeHtml = buffer.substring(0, lastCloseTagIndex + 2); // +2 to include the closing tag
              outlineHtml += completeHtml;
              
              // Update the UI with the complete HTML
              if (topic) {
                setTopic(prevTopic => {
                  if (!prevTopic) return prevTopic;
                  return {
                    ...prevTopic,
                    main_outline: prevTopic.main_outline === tempOutline 
                      ? makeOutlineItemsClickable(completeHtml) 
                      : (prevTopic.main_outline || '') + makeOutlineItemsClickable(completeHtml)
                  };
                });
              }
              
              buffer = buffer.substring(lastCloseTagIndex + 2);
            }
          }
        }
      } catch (streamError: any) {
        console.error('Error reading stream:', streamError)
        throw new Error(`Error reading stream: ${streamError.message}`)
      }
      
      // Add any remaining buffer content
      if (buffer) {
        outlineHtml += buffer;
        
        // Update the UI with the remaining buffer
        if (topic) {
          setTopic(prevTopic => {
            if (!prevTopic) return prevTopic;
            return {
              ...prevTopic,
              main_outline: prevTopic.main_outline === tempOutline 
                ? makeOutlineItemsClickable(buffer) 
                : (prevTopic.main_outline || '') + makeOutlineItemsClickable(buffer)
            };
          });
        }
      }
      
      if (!outlineHtml || outlineHtml.trim() === '') {
        console.error('Empty outline HTML received')
        throw new Error('No outline generated - received empty response')
      }
      
      console.log('Generated outline HTML:', outlineHtml.substring(0, 100) + '...');
      
      // Process the outline to make items clickable
      const processedOutline = makeOutlineItemsClickable(outlineHtml)
      
      // Save to database
      try {
        const { error: updateError } = await supabase
          .from('topics')
          .update({
            main_outline: processedOutline,
            updated_at: new Date().toISOString()
          })
          .eq('id', topicId)
        
        if (updateError) {
          console.error('Error updating topic with outline:', updateError)
          throw updateError
        }
        
        // Update the topic in state
        if (topic) {
          setTopic({
            ...topic,
            main_outline: processedOutline
          })
        }
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError)
        // Don't throw here, we already have the content in the UI
        toast.error(`Failed to save outline to database: ${dbError.message}`, { id: 'db-error' })
      }
      
      // Reset states
      setGeneratingContent(false)
      toast.success('Outline generated', { id: 'generating-outline' })
    } catch (error: any) {
      console.error('Error generating outline:', error)
      toast.error(error.message || 'Failed to generate outline', { id: 'generating-outline' })
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Sanitize HTML content
  const sanitizeHtml = (html?: string) => {
    if (!html) return ''
    // In a real app, you would use a library like DOMPurify
    return html
  }

  // Handle back button clicks
  const handleBackToMain = () => {
    setViewState("main")
    setActiveSection(null)
  }

  const handleBackToSubOutline = async () => {
    // Make sure we preserve the active section when going back to suboutline
    if (activeSection) {
      // First check if we already have this suboutline in state
      if (subOutlines[activeSection]) {
        console.log('Using cached suboutline for:', activeSection);
        setViewState("suboutline");
      } else {
        // If not in state, check if it exists in the database
        console.log('Checking database for suboutline:', activeSection);
        
        // Show loading state while we check
        toast.loading('Loading suboutline...', { id: 'loading-suboutline' });
        
        try {
          // Check if the suboutline exists in the database
          const { data: existingSubtopic, error } = await supabase
            .from('subtopics')
            .select('*')
            .eq('topic_id', topicId)
            .eq('title', activeSection)
            .single();
            
          if (!error && existingSubtopic) {
            console.log('Found suboutline in database:', existingSubtopic);
            
            // Process to make items clickable
            existingSubtopic.content = makeSubOutlineItemsClickable(existingSubtopic.content);
            
            // Update state with the suboutline
            setSubOutlines(prev => ({
              ...prev,
              [activeSection]: existingSubtopic
            }));
            
            setViewState("suboutline");
            toast.success('Suboutline loaded', { id: 'loading-suboutline' });
          } else {
            console.log('Suboutline not found in database, generating new one');
            // If not in database, generate a new one
            fetchOrGenerateSubOutline(activeSection);
            toast.dismiss('loading-suboutline');
          }
        } catch (error: any) {
          console.error('Error checking for suboutline:', error);
          // If error, generate a new one
          fetchOrGenerateSubOutline(activeSection);
          toast.dismiss('loading-suboutline');
        }
      }
    } else {
      // Fallback to main view if no active section
      console.log('No active section, returning to main view');
      setViewState("main");
    }
  }

  // Render main outline view
  const renderMainOutline = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-bg-secondary rounded-xl shadow-md p-6 border border-border-primary transition-colors duration-200"
    >
      <div className="mb-6 flex justify-between">
        <h2 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          Main Outline
        </h2>
        <button
          onClick={generateOutline}
          disabled={generatingContent}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center dark:bg-indigo-700 dark:hover:bg-indigo-600 dark:disabled:bg-indigo-800/50"
        >
          {generatingContent ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Outline
            </>
          )}
        </button>
      </div>
      
      {topic?.main_outline && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg flex items-start transition-colors duration-200">
          <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-700 dark:text-indigo-300 text-sm">
            Click on any section below to see a detailed outline. Each section can be explored further to generate comprehensive study notes.
          </p>
        </div>
      )}
      
      {topic?.main_outline ? (
        <div 
          className="outline-content text-text-primary transition-colors duration-200"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(topic.main_outline) }}
          onClick={handleMainOutlineClick}
        />
      ) : (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No outline available</h3>
          <p className="text-gray-500 mb-4">Generate an outline to get started with this topic</p>
          <button
            onClick={generateOutline}
            disabled={generatingContent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow disabled:bg-indigo-300 disabled:cursor-not-allowed inline-flex items-center"
          >
            {generatingContent ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Outline
              </>
            )}
          </button>
        </div>
      )}
      
      <style jsx global>{`
        .outline-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.5rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          transition: color 0.2s;
        }
        
        .outline-content h2:hover {
          color: #4f46e5;
        }
        
        .outline-content h2:first-child {
          margin-top: 0;
        }
        
        .outline-content ul,
        .outline-content ol {
          margin: 1rem 0;
          padding-left: 1.75rem;
        }
        
        .outline-content li {
          margin-bottom: 0.75rem;
          color: #4b5563;
          position: relative;
          line-height: 1.7;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
        
        .outline-content li:hover {
          color: #4f46e5;
          background-color: #f3f4f6;
        }
        
        .outline-content ul li::before {
          content: "•";
          color: #6366f1;
          font-weight: bold;
          position: absolute;
          left: -1.25rem;
        }
        
        .outline-content ol {
          counter-reset: item;
        }
        
        .outline-content ol li {
          counter-increment: item;
        }
        
        .outline-content ol li::before {
          content: counter(item) ".";
          color: #6366f1;
          font-weight: 600;
          position: absolute;
          left: -1.5rem;
        }
        
        .outline-content .subtopic-item {
          cursor: pointer;
          transition: all 0.2s;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
        
        .outline-content .subtopic-item:hover {
          color: #4f46e5;
          background-color: #f3f4f6;
        }
        
        .outline-content .section-card {
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1.5rem 0;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        
        .outline-content .section-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border-color: #d1d5db;
        }
        
        .outline-content .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>
    </motion.div>
  )

  // Render suboutline view
  const renderSubOutline = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-bg-secondary rounded-xl shadow-md p-6 border border-border-primary transition-colors duration-200"
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            onClick={handleBackToMain}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to main outline
          </button>
          <h3 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200">
            {activeSection}
          </h3>
        </div>
        {generatingContent && (
          <div className="flex items-center text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Generating...</span>
          </div>
        )}
      </div>
      
      {activeSection && subOutlines[activeSection] && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg flex items-start transition-colors duration-200">
          <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-700 dark:text-indigo-300 text-sm">
            Click on any subtopic below to generate detailed study notes for that specific area.
          </p>
        </div>
      )}
      
      {activeSection && subOutlines[activeSection] ? (
        <div 
          className="suboutline-content text-text-primary transition-colors duration-200"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(subOutlines[activeSection].content) }}
          onClick={handleSubOutlineClick}
        />
      ) : (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
      )}
      
      <style jsx global>{`
        .suboutline-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.5rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          transition: color 0.2s;
        }
        
        .suboutline-content h3:hover {
          color: #4f46e5;
        }
        
        .suboutline-content h3:first-child {
          margin-top: 0;
        }
        
        .suboutline-content ul,
        .suboutline-content ol {
          margin: 1rem 0;
          padding-left: 1.75rem;
        }
        
        .suboutline-content li {
          margin-bottom: 0.75rem;
          color: #4b5563;
          position: relative;
          line-height: 1.7;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
        
        .suboutline-content li:hover {
          color: #4f46e5;
          background-color: #f3f4f6;
        }
        
        .suboutline-content ul li::before {
          content: "•";
          color: #6366f1;
          font-weight: bold;
          position: absolute;
          left: -1.25rem;
        }
        
        .suboutline-content ol {
          counter-reset: item;
        }
        
        .suboutline-content ol li {
          counter-increment: item;
        }
        
        .suboutline-content ol li::before {
          content: counter(item) ".";
          color: #6366f1;
          font-weight: 600;
          position: absolute;
          left: -1.5rem;
        }
        
        .suboutline-content .section-card {
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1.5rem 0;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        
        .suboutline-content .section-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border-color: #d1d5db;
        }
        
        .suboutline-content .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>
    </motion.div>
  )

  // Render notes view
  const renderNotes = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-bg-secondary rounded-xl shadow-md p-6 border border-border-primary transition-colors duration-200"
    >
      <div className="mb-6">
        <button
          onClick={handleBackToSubOutline}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to sub-outline
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-text-primary transition-colors duration-200">
              {activeSection && activeSection.includes(': ') 
                ? activeSection.split(': ')[1] 
                : activeSection}
            </h3>
            {activeSection && activeSection.includes(': ') && (
              <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-1 transition-colors duration-200">
                {activeSection.split(': ')[0]}
              </p>
            )}
          </div>
          {generatingContent && (
            <div className="flex items-center text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
        </div>
      </div>
      
      {activeSection && notes[activeSection] ? (
        <div 
          className="notes-content prose prose-indigo dark:prose-invert max-w-none text-text-primary transition-colors duration-200"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(notes[activeSection].content) }}
        />
      ) : (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
      )}
      
      <style jsx global>{`
        .notes-content {
          font-size: 1rem;
          line-height: 1.75;
          color: #374151;
        }
        
        .notes-content h1,
        .notes-content h2,
        .notes-content h3,
        .notes-content h4 {
          color: #1f2937;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
          line-height: 1.3;
        }
        
        .notes-content h1 {
          font-size: 1.875rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        
        .notes-content h2 {
          font-size: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        
        .notes-content h3 {
          font-size: 1.25rem;
        }
        
        .notes-content h4 {
          font-size: 1.125rem;
        }
        
        .notes-content p {
          margin-bottom: 1.25rem;
        }
        
        .notes-content ul,
        .notes-content ol {
          margin: 1.25rem 0;
          padding-left: 1.75rem;
        }
        
        .notes-content li {
          margin-bottom: 0.5rem;
          position: relative;
        }
        
        .notes-content ul li::before {
          content: "•";
          color: #6366f1;
          font-weight: bold;
          position: absolute;
          left: -1.25rem;
        }
        
        .notes-content ol {
          counter-reset: item;
        }
        
        .notes-content ol li {
          counter-increment: item;
        }
        
        .notes-content ol li::before {
          content: counter(item) ".";
          color: #6366f1;
          font-weight: 600;
          position: absolute;
          left: -1.5rem;
        }
        
        .notes-content a {
          color: #4f46e5;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
        }
        
        .notes-content a:hover {
          color: #4338ca;
        }
        
        .notes-content blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f9fafb;
          padding: 1rem;
          border-radius: 0.25rem;
        }
        
        .notes-content code {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #6366f1;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        
        .notes-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .notes-content pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: 0.875rem;
        }
        
        .notes-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
        
        .notes-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          overflow: hidden;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .notes-content th {
          background-color: #f3f4f6;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .notes-content td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .notes-content tr:last-child td {
          border-bottom: none;
        }
        
        .notes-content tr:nth-child(even) {
          background-color: #f9fafb;
        }
      `}</style>
    </motion.div>
  )

  return (
    <DashboardLayout>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4 max-w-6xl mx-auto">
        {/* Topic Header */}
        {!loading && topic && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{topic.title || topic.name || 'Untitled Topic'}</h1>
                <p className="text-gray-600 mt-2">{topic.description || 'No description available'}</p>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="mr-4">Category: {topic.category || 'Uncategorized'}</span>
                  <span className="mr-4">Created: {formatDate(topic.created_at)}</span>
                  <span>Last studied: {formatDate(topic.last_accessed)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{topic.progress || 0}% Complete</div>
                <div className="w-32 bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${topic.progress || 0}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Total study time: {Math.floor((topic.total_study_time || 0) / 60)}h {(topic.total_study_time || 0) % 60}m
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : topic ? (
          <>
            {viewState === "main" && renderMainOutline()}
            {viewState === "suboutline" && renderSubOutline()}
            {viewState === "notes" && renderNotes()}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Topic Not Found</h2>
            <p className="text-gray-500">The topic you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 