'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/app/lib/supabase'
import { Info, ChevronLeft, Loader2, RefreshCw, BookOpen, FileText, ArrowLeft, Download, Volume2, Brain, ChevronRight } from 'lucide-react'
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
  subtopic_id: string
  title: string
  content: string
  created_at: string
}

type ViewState = "main" | "suboutline" | "notes";

export default function TopicPage() {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [mainOutline, setMainOutline] = useState<string>("")
  const [subOutlines, setSubOutlines] = useState<Record<string, SubOutline>>({})
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [loading, setLoading] = useState(true)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("")
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ViewState>("main")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [isGeneratingDiveDeeper, setIsGeneratingDiveDeeper] = useState(false)
  const [quizContent, setQuizContent] = useState<string>("")
  const [diveDeeper, setDiveDeeper] = useState<string>("")
  const [followUpQuestion, setFollowUpQuestion] = useState<string>("")
  const [isQuizzing, setIsQuizzing] = useState<boolean>(false)
  const [isDivingDeeper, setIsDivingDeeper] = useState<boolean>(false)
  const [notesView, setNotesView] = useState<"notes" | "quiz" | "diveDeeper">("notes")
  const [user, setUser] = useState<any>(null)
  const outlineRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const topicId = params.id as string
  const supabase = createClient()
  const router = useRouter()
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null
  const utterance = typeof window !== 'undefined' ? new SpeechSynthesisUtterance() : null

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
      
      // Add card styling
      h2.classList.add('card-style')
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
      
      // Add card styling
      li.classList.add('card-style')
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
      
      // Add card styling
      h3.classList.add('card-style')
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
      
      // Add card styling
      li.classList.add('card-style')
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
        
        // Add enhanced section card styling
        card.classList.add('enhanced-section-card')

        // Store the original text for easier access
        const itemText = sectionTitle.textContent?.trim() || ''
        sectionTitle.setAttribute('data-subsubtopic', itemText)
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
    
    // Add active class to the clicked item with visual feedback
    const allItems = document.querySelectorAll('.prose .outline-item, .prose .subtopic-item, .prose h2, .prose li')
    allItems.forEach(item => {
      item.classList.remove('active')
      item.classList.remove('active-highlight')
    })
    
    // Add active class with animation
    clickedItem.classList.add('active')
    clickedItem.classList.add('active-highlight')
    
    // Add a temporary highlight effect
    const htmlClickedItem = clickedItem as HTMLElement
    htmlClickedItem.style.transition = 'background-color 0.3s ease'
    const originalBackground = window.getComputedStyle(htmlClickedItem).backgroundColor
    htmlClickedItem.style.backgroundColor = 'var(--primary-100)'
    
    setTimeout(() => {
      htmlClickedItem.style.backgroundColor = ''
    }, 300)
    
    // Remove the highlight class after animation completes
    setTimeout(() => {
      clickedItem.classList.remove('active-highlight')
    }, 1000)
    
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
    
    // Find the closest clickable element - expand the selectors to catch more potential elements
    const clickedItem = target.closest('.suboutline-item') || 
                        target.closest('.note-item') || 
                        target.closest('h3') ||
                        target.closest('li') ||
                        target.closest('[data-subsubtopic]') ||
                        target.closest('.card-style') ||
                        target.closest('.section-title') ||
                        target.closest('.enhanced-section-card')
    
    if (!clickedItem) {
      console.log('No clickable item found:', target)
      return
    }
    
    // Extract the text content, prioritizing data attributes and specific elements
    let sectionTitle = ''
    
    // Check for data attributes first (most reliable)
    if (clickedItem.hasAttribute('data-subsubtopic')) {
      const dataSubsubtopic = clickedItem.getAttribute('data-subsubtopic')
      if (dataSubsubtopic) {
        sectionTitle = dataSubsubtopic
        console.log('Found section title from data attribute:', sectionTitle)
      }
    }
    
    // If no data attribute, try to find specific elements
    if (!sectionTitle) {
      const spanElement = clickedItem.querySelector('span')
      if (spanElement) {
        sectionTitle = spanElement.textContent?.trim() || ''
        console.log('Found section title from span:', sectionTitle)
      } else {
        // Fallback to the item's text content
        sectionTitle = clickedItem.textContent?.trim() || ''
        console.log('Using element text content as section title:', sectionTitle)
      }
    }
    
    // Clean up the section title
    sectionTitle = sectionTitle.replace(/[\n\r]+/g, ' ').trim()
    
    // Remove any HTML tags that might be present
    sectionTitle = sectionTitle.replace(/<[^>]*>/g, '')
    
    if (!sectionTitle) {
      console.error('Could not extract section title from clicked element')
      return
    }
    
    if (!activeSection) {
      console.error('No active section set')
      return
    }
    
    console.log('Clicked subsection:', sectionTitle)
    
    // Add active class to the clicked item with visual feedback
    const allItems = document.querySelectorAll('.suboutline-content .suboutline-item, .suboutline-content .note-item, .suboutline-content li, .suboutline-content [data-subsubtopic], .suboutline-content .card-style')
    allItems.forEach(item => {
      item.classList.remove('active')
      item.classList.remove('active-highlight')
    })
    
    // Add active class with animation
    clickedItem.classList.add('active')
    clickedItem.classList.add('active-highlight')
    
    // Add a temporary highlight effect
    const htmlClickedItem = clickedItem as HTMLElement
    htmlClickedItem.style.transition = 'background-color 0.3s ease'
    const originalBackground = window.getComputedStyle(htmlClickedItem).backgroundColor
    htmlClickedItem.style.backgroundColor = 'var(--primary-100)'
    
    setTimeout(() => {
      htmlClickedItem.style.backgroundColor = ''
    }, 300)
    
    // Remove the highlight class after animation completes
    setTimeout(() => {
      clickedItem.classList.remove('active-highlight')
    }, 1000)
    
    // Store the active subsection for better navigation
    setActiveSubSection(sectionTitle);
    
    // Generate or fetch notes for this subsection
    const notesKey = sectionTitle;
    console.log('Notes key for this subsection:', notesKey);
    
    // Check if we already have notes for this specific subsection
    if (notes[notesKey]) {
      console.log('Using existing notes for:', notesKey);
      setViewState("notes");
    } else {
      // Show visual feedback
      toast.success(`Generating notes for "${sectionTitle}"`);
      
      // Fetch or generate notes for this specific subsection
      fetchOrGenerateNotes(notesKey);
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
      setSubOutlines(prev => ({
        ...prev,
        [sectionTitle]: {
          id: '',
          topic_id: topicId,
          title: sectionTitle,
          content: '<div class="p-4 text-center"><div class="spinner"></div><p class="mt-2">Generating detailed outline...</p></div>',
          created_at: new Date().toISOString()
        }
      }))
      
      setViewState("suboutline")
      
      // Generate suboutline using streaming API
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
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }
      
      let subOutlineContent = ''
      const decoder = new TextDecoder()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          subOutlineContent += chunk
          
          // Process the content to make items clickable
          const processedContent = makeSubOutlineItemsClickable(subOutlineContent)
          
          // Update the suboutline content as we receive chunks
          setSubOutlines(prev => ({
            ...prev,
            [sectionTitle]: {
              ...prev[sectionTitle],
              content: processedContent
            }
          }))
        }
        
        // Save the suboutline to the database
        const { data: newSubtopic, error: saveError } = await supabase
          .from('subtopics')
          .insert({
            topic_id: topicId,
            title: sectionTitle,
            content: subOutlineContent,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (saveError) {
          console.error('Error saving subtopic:', saveError)
          throw new Error('Failed to save subtopic')
        }
        
        // Update with the database ID
        try {
          setSubOutlines(prev => ({
            ...prev,
            [sectionTitle]: {
              ...prev[sectionTitle],
              id: newSubtopic.id
            }
          }))
        } catch (dbError: any) {
          console.error('Error updating subtopic with ID:', dbError)
        }
      } catch (streamError: any) {
        console.error('Streaming error:', streamError)
        toast.error('Error generating outline. Please try again.')
        
        // Set error content
        setSubOutlines(prev => ({
          ...prev,
          [sectionTitle]: {
            ...prev[sectionTitle],
            content: '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate outline. Please try again.</p></div>'
          }
        }))
      }
    } catch (error: any) {
      console.error('Error in fetchOrGenerateSubOutline:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      toast.dismiss('generating-content')
      setGeneratingContent(false)
    }
  }

  // Fetch or generate notes for a section
  const fetchOrGenerateNotes = async (sectionTitle: string) => {
    if (!activeSection || !sectionTitle) return;
    
    setGeneratingContent(true);
    
    try {
      // Check if we already have notes for this section
      if (notes[sectionTitle]) {
        setActiveSubSection(sectionTitle);
        setViewState("notes");
        setGeneratingContent(false);
        return;
      }
      
      // Get the subtopic ID
      const subtopicId = subOutlines[activeSection]?.id;
      
      if (!subtopicId) {
        throw new Error('Subtopic ID not found');
      }
            
      // Check if notes exist in the database
      const { data: existingNotes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('title', sectionTitle)
        .maybeSingle();
      
      if (notesError) {
        console.error('Error fetching notes:', notesError ? JSON.stringify(notesError) : 'Unknown error');
      }
      
      if (existingNotes) {
        // Use existing notes from database
        setNotes(prev => ({
          ...prev,
          [sectionTitle]: existingNotes
        }));
        setActiveSubSection(sectionTitle);
        setViewState("notes");
        setGeneratingContent(false);
      } else {
        // Generate new notes
        try {
          // Generate notes using streaming API
          const response = await fetch('/api/generateNotes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: topic?.title || topic?.name,
              sectionTitle: activeSection,
              subtopic: sectionTitle
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to generate notes');
          }
          
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No reader available');
          }
          
          let notesContent = '';
          const decoder = new TextDecoder();
          
          // Create a temporary notes object to update as we stream
          setNotes(prev => ({
            ...prev,
            [sectionTitle]: { 
              id: '', 
              subtopic_id: subtopicId, 
              title: sectionTitle, 
              content: 'Generating notes...', 
              created_at: new Date().toISOString() 
            }
          }));
          
          setActiveSubSection(sectionTitle);
          setViewState("notes");
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            notesContent += chunk;
            
            // Update the notes content as we receive chunks
            setNotes(prev => ({
              ...prev,
              [sectionTitle]: { 
                ...prev[sectionTitle], 
                content: notesContent 
              }
            }));
          }
          
          // Save the notes to the database
          const { data: newNote, error: createError } = await supabase
            .from('notes')
            .insert({
              subtopic_id: subtopicId,
              title: sectionTitle,
              content: notesContent,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating note:', createError);
          } else {
            // Update the notes with the database ID
            setNotes(prev => ({
              ...prev,
              [sectionTitle]: newNote
            }));
          }
        } catch (error) {
          console.error('Error generating notes:', error);
          toast.error('Failed to generate notes. Please try again.');
          
          // Set error content
          setNotes(prev => ({
            ...prev,
            [sectionTitle]: { 
              id: '', 
              subtopic_id: subtopicId, 
              title: sectionTitle, 
              content: '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate notes. Please try again.</p></div>', 
              created_at: new Date().toISOString() 
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error in fetchOrGenerateNotes:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setGeneratingContent(false);
    }
  };

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
    if (!html) return '';
    
    // Remove any markdown code block markers
    let sanitized = html;
    
    // Remove opening code block markers with language specification
    sanitized = sanitized.replace(/```(html|javascript|js|typescript|ts|css|python|java|c|cpp|csharp|ruby|go|rust|php|swift|kotlin|bash|shell|sql|json|xml|yaml|markdown|plaintext|text)\s*/gi, '');
    
    // Remove simple code block markers
    sanitized = sanitized.replace(/```\s*/g, '');
    
    // Convert inline code to styled spans
    sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Remove any potentially dangerous tags or attributes
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/on\w+=\w+/g, '');
    
    return sanitized;
  }

  // Handle back button clicks
  const handleBackToMain = () => {
    setViewState("main")
    setActiveSection("")
  }

  const handleBackToSubOutline = async () => {
    // Make sure we preserve the active section when going back to suboutline
    if (activeSection) {
      console.log('Going back to suboutline for:', activeSection);
      
      // Check if we have the suboutline data in state
      if (subOutlines[activeSection]) {
        console.log('Using cached suboutline data');
        setViewState("suboutline");
        } else {
        // If not in state, we need to fetch or generate it
        console.log('Suboutline data not found in cache, fetching or generating');
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
            await fetchOrGenerateSubOutline(activeSection);
            toast.dismiss('loading-suboutline');
          }
        } catch (error: any) {
          console.error('Error checking for suboutline:', error);
          toast.error('Failed to load suboutline', { id: 'loading-suboutline' });
          // Fallback to main view if there's an error
          setViewState("main");
        }
      }
    } else {
      // Fallback to main view if no active section
      console.log('No active section, returning to main view');
      setViewState("main");
    }
  }

  // Export notes to Word
  const exportToWord = () => {
    if (!activeSubSection || !notes[activeSubSection]) return;
    
    const content = notes[activeSubSection].content;
    const fileName = `${activeSubSection.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.doc`;
    
    // Create a blob with the content
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${activeSubSection} Notes</title>
      </head>
      <body>
        <h1>${activeSubSection}</h1>
        <p><em>From: ${activeSection}</em></p>
        ${content}
      </body>
      </html>
    `], { type: 'application/msword' });
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported to Word: ${fileName}`);
  };
  
  // Export notes to PDF
  const exportToPDF = () => {
    if (!activeSubSection || !notes[activeSubSection]) return;
    
    toast.loading('Preparing PDF...', { id: 'pdf-export' });
    
    try {
      // Create a styled HTML document for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${activeSubSection} Notes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .subtitle {
              color: #6366f1;
              font-style: italic;
              margin-bottom: 20px;
            }
            .content {
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <h1>${activeSubSection}</h1>
          <div class="subtitle">From: ${activeSection}</div>
          <div class="content">${notes[activeSubSection].content}</div>
        </body>
        </html>
      `;
      
      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'application/pdf' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeSubSection.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`;
      
      // Append the link to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF downloaded', { id: 'pdf-export' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-export' });
    }
  };
  
  // Text-to-speech functionality
  const listenToNotes = () => {
    if (!activeSubSection || !notes[activeSubSection]) return;
    
    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      toast.success('Stopped reading notes');
    } else {
      // Start speaking
      const content = notes[activeSubSection].content;
      
      // Extract text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || '';
      
      const utterance = new SpeechSynthesisUtterance(textContent);
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      toast.success('Reading notes aloud');
    }
  };
  
  // Generate a quiz based on the notes
  async function generateQuiz() {
    if (isQuizzing) return;
    
    setIsQuizzing(true);
    setNotesView("quiz");
    
    // Initialize with a loading message that matches the style of streaming notes
    setQuizContent(`
      <div class="streaming-quiz">
        <div class="flex items-center mb-4">
          <div class="spinner mr-3"></div>
          <h3 class="text-lg font-semibold">Generating quiz for ${activeSubSection}...</h3>
        </div>
        <p class="text-gray-600 mb-2">Creating questions to test your knowledge...</p>
        <div class="streaming-content"></div>
      </div>
    `);
    
    try {
      toast.loading('Generating quiz...', { id: 'generating-quiz' });
      
      // Call the API directly here for streaming
      const response = await fetch('/api/generateQuiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainTopic: topic?.title || topic?.name || "",
          parentTopic: activeSection,
          subsubtopic: activeSubSection,
          title: topic?.title || topic?.name || "",
          sectionTitle: activeSection,
          subtopic: activeSubSection
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      let accumulatedContent = '';
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      let streamingContainer = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Clean up any partial HTML tags that might cause rendering issues
        const cleanedChunk = chunk.replace(/-question'>/g, '-question">');
        
        // For the first meaningful chunk, replace the loading message
        if (isFirstChunk && cleanedChunk.trim().length > 10) {
          isFirstChunk = false;
          accumulatedContent = cleanedChunk;
          setQuizContent(accumulatedContent);
        } else {
          // For subsequent chunks, append to the content
          accumulatedContent += cleanedChunk;
          
          // Update the streaming content
          if (document.querySelector('.streaming-content') && isFirstChunk) {
            // If we're still showing the loading UI, update the streaming content
            const streamingContent = document.querySelector('.streaming-content');
            if (streamingContent) {
              streamingContent.innerHTML = accumulatedContent;
            }
          } else {
            // Otherwise, update the entire quiz content
            setQuizContent(accumulatedContent);
          }
        }
        
        // Add a small delay to make the streaming more visible
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      toast.success('Quiz generated!', { id: 'generating-quiz' });
      
      // After streaming is complete, add a class to enable interactivity
      setTimeout(() => {
        const quizContainer = document.querySelector('.quiz-container');
        if (quizContainer) {
          quizContainer.classList.add('quiz-ready');
        }
      }, 500);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz', { id: 'generating-quiz' });
      setQuizContent('<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate quiz. Please try again.</p></div>');
    } finally {
      setIsQuizzing(false);
    }
  }

  // Generate dive deeper content
  async function generateDiveDeeper() {
    if (!followUpQuestion.trim() || isDivingDeeper) return;
    
    setIsDivingDeeper(true);
    setNotesView("diveDeeper");
    
    try {
      toast.loading('Generating deeper insights...', { id: 'generating-dive-deeper' });
      
      const diveDeeper = await fetchDiveDeeperStream(
        followUpQuestion,
        topic?.title || topic?.name || "",
        activeSection,
        activeSubSection
      );
      
      setDiveDeeper(diveDeeper);
      toast.success('Deeper insights generated!', { id: 'generating-dive-deeper' });
    } catch (error) {
      console.error('Error generating dive deeper content:', error);
      toast.error('Failed to generate deeper insights', { id: 'generating-dive-deeper' });
      setDiveDeeper('<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate deeper insights. Please try again.</p></div>');
    } finally {
      setIsDivingDeeper(false);
    }
  }

  // Add event listeners for quiz interaction
  useEffect(() => {
    if (quizContent && !isQuizzing && notesView === "quiz") {
      // Use a small delay to ensure the DOM is fully updated
      setTimeout(() => {
        const quizOptions = document.querySelectorAll('.quiz-option');
        const checkButtons = document.querySelectorAll('.quiz-check-btn');
        
        // Remove any existing event listeners first to prevent duplicates
        quizOptions.forEach(option => {
          const newOption = option.cloneNode(true);
          option.parentNode?.replaceChild(newOption, option);
        });
        
        checkButtons.forEach(button => {
          const newButton = button.cloneNode(true);
          button.parentNode?.replaceChild(newButton, button);
        });
        
        // Add new event listeners
        document.querySelectorAll('.quiz-option').forEach(option => {
          option.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const parent = target.parentElement;
            
            // Remove selected class from all siblings
            if (parent) {
              Array.from(parent.children).forEach(child => {
                if (child.classList.contains('quiz-option')) {
                  child.classList.remove('quiz-option-selected');
                }
              });
            }
            
            // Add selected class to clicked option
            target.classList.add('quiz-option-selected');
          });
        });
        
        document.querySelectorAll('.quiz-check-btn').forEach(button => {
          button.addEventListener('click', async (e) => {
            const target = e.currentTarget as HTMLElement;
            const questionContainer = target.closest('.quiz-question');
            
            if (questionContainer) {
              const selectedOption = questionContainer.querySelector('.quiz-option-selected');
              const feedbackDiv = questionContainer.querySelector('.quiz-feedback');
              
              if (selectedOption && feedbackDiv) {
                const isCorrect = selectedOption.getAttribute('data-correct') === 'true';
                
                if (isCorrect) {
                  feedbackDiv.textContent = 'Correct! Well done!';
                  feedbackDiv.classList.add('quiz-feedback-correct');
                  feedbackDiv.classList.remove('quiz-feedback-incorrect');
                } else {
                  feedbackDiv.textContent = 'Incorrect. Try again!';
                  feedbackDiv.classList.add('quiz-feedback-incorrect');
                  feedbackDiv.classList.remove('quiz-feedback-correct');
                }
                
                // Show the feedback
                (feedbackDiv as HTMLElement).style.display = 'block';
                
                // Update the score
                await updateQuizScore();
              } else if (feedbackDiv) {
                feedbackDiv.textContent = 'Please select an answer first.';
                (feedbackDiv as HTMLElement).style.display = 'block';
              }
            }
          });
        });
        
        // Initialize the score display
        const scoreDiv = document.querySelector('.quiz-score');
        if (scoreDiv) {
          scoreDiv.textContent = 'Score: 0/5';
        }
      }, 500); // Small delay to ensure DOM is ready
    }
  }, [quizContent, isQuizzing, notesView]);

  // Make quiz interactive after it's loaded
  useEffect(() => {
    if (notesView === "quiz" && quizContent && !isQuizzing) {
      // Add a small delay to ensure the DOM is fully updated
      const timeoutId = setTimeout(() => {
        const quizContainer = document.querySelector('.quiz-container');
        if (!quizContainer) return;
        
        // Add click handlers to quiz options
        const options = quizContainer.querySelectorAll('.quiz-option');
        options.forEach(option => {
          option.addEventListener('click', () => {
            // Find the parent question
            const question = option.closest('.quiz-question');
            if (!question) return;
            
            // Deselect all options in this question
            const questionOptions = question.querySelectorAll('.quiz-option');
            questionOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Select this option
            option.classList.add('selected');
          });
        });
        
        // Add click handlers to check buttons
        const checkButtons = quizContainer.querySelectorAll('.quiz-check-btn');
        checkButtons.forEach(button => {
          button.addEventListener('click', () => {
            // Find the parent question
            const question = button.closest('.quiz-question');
            if (!question) return;
            
            // Find the selected option
            const selectedOption = question.querySelector('.quiz-option.selected');
            if (!selectedOption) {
              alert('Please select an answer first');
              return;
            }
            
            // Check if the answer is correct
            const isCorrect = selectedOption.getAttribute('data-correct') === 'true';
            
            // Mark options as correct/incorrect
            const options = question.querySelectorAll('.quiz-option');
            options.forEach(opt => {
              opt.classList.remove('selected');
              if (opt === selectedOption) {
                opt.classList.add(isCorrect ? 'correct' : 'incorrect');
              } else if (opt.getAttribute('data-correct') === 'true') {
                opt.classList.add('correct');
              }
            });
            
            // Show feedback
            const feedback = question.querySelector('.quiz-feedback');
            if (feedback) {
              feedback.textContent = isCorrect 
                ? 'Correct! Well done.' 
                : 'Incorrect. The correct answer is highlighted.';
              feedback.classList.add(isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-incorrect');
            }
            
            // Disable the button
            const buttonElement = button as HTMLButtonElement;
            buttonElement.disabled = true;
            buttonElement.textContent = 'Answered';
            buttonElement.style.backgroundColor = '#9ca3af';
            buttonElement.style.cursor = 'default';
            
            // Update the score
            updateQuizScore();
          });
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [notesView, quizContent, isQuizzing]);

  // Render main outline view
  const renderMainOutline = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-bg-secondary rounded-xl shadow-md p-6 border border-border-primary transition-colors duration-200"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200 mb-4 sm:mb-0">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
          Main Outline
        </h2>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center sm:justify-start w-full sm:w-auto"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
              </div>
      
      {topic?.main_outline && (
        <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg flex items-start">
          <Info className="w-6 h-6 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-800 text-sm font-medium">
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
      
      <div className="text-right">
        {topic && (
          <div className="flex items-center justify-end text-lg font-semibold text-indigo-600">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Total Study Time: {Math.floor((topic.total_study_time || 0) / 60)}h {(topic.total_study_time || 0) % 60}m
          </div>
        )}
          </div>
          
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
        <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg flex items-start">
          <Info className="w-6 h-6 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-800 text-sm font-medium">
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
  const renderNotes = () => {
    return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <div className="mb-4">
                        <button 
            onClick={handleBackToSubOutline}
            className="text-indigo-600 hover:text-indigo-700 flex items-center mb-2"
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
            Back to sub-outline
          </button>
          <h4 className="text-xl font-bold text-gray-900">
            {activeSubSection}
          </h4>
          <p className="text-indigo-600 text-sm font-medium mt-1">
            {activeSection}
                              </p>
                            </div>

        {notesView === "notes" && (
          <>
            <div 
              className="prose max-w-none notes-content"
              dangerouslySetInnerHTML={{ 
                __html: typeof notes === 'string' 
                  ? notes 
                  : activeSubSection && notes[activeSubSection] 
                    ? sanitizeHtml(notes[activeSubSection].content) 
                    : 'Loading notes...' 
              }}
            />

            {/* Dive Deeper Section */}
            <div className="mt-8 border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Dive Deeper</h4>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Ask a follow-up question about this topic..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={generateDiveDeeper}
                  disabled={isDivingDeeper || !followUpQuestion.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isDivingDeeper ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-1" />
                      Ask
                    </>
                  )}
                </button>
                          </div>
            </div>

            {/* Quiz Section */}
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Test Your Knowledge</h4>
                <button
                  onClick={generateQuiz}
                  disabled={isQuizzing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isQuizzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    quizContent ? 'Regenerate Quiz' : 'Generate Quiz'
                  )}
                        </button>
                      </div>
            </div>
          </>
        )}

        {notesView === "quiz" && (
          <div className="quiz-view">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-gray-900">Quiz: {activeSubSection}</h4>
                              <button
                onClick={() => setNotesView("notes")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
                              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to notes
                              </button>
            </div>
            
            <div className="quiz-score text-lg font-semibold text-indigo-700 mb-4">
              Score: 0/5
            </div>
            
            <div 
              className="quiz-container"
              dangerouslySetInnerHTML={{ __html: quizContent }}
            />
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setNotesView("notes")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to notes
              </button>
              
              <button
                onClick={generateQuiz}
                disabled={isQuizzing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                Regenerate Quiz
              </button>
                                </div>
                              </div>
                            )}

        {notesView === "diveDeeper" && (
          <div className="dive-deeper-view">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-gray-900">Dive Deeper: {activeSubSection}</h4>
              <button
                onClick={() => setNotesView("notes")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to notes
              </button>
                            </div>
            
            <div className="question bg-indigo-50 p-4 rounded-lg mb-6">
              <p className="font-medium text-indigo-800">{followUpQuestion}</p>
                        </div>
            
            {isDivingDeeper ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-600">Generating deeper insights...</p>
              </div>
            ) : (
              <div 
                className="prose max-w-none notes-content dive-deeper-content"
                dangerouslySetInnerHTML={{ __html: diveDeeper }}
              />
            )}
            
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Ask Another Question</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Ask another follow-up question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={generateDiveDeeper}
                  disabled={isDivingDeeper || !followUpQuestion.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isDivingDeeper ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-1" />
                      Ask
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex justify-start">
              <button
                onClick={() => setNotesView("notes")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to notes
              </button>
            </div>
            </div>
        )}

        {/* Action buttons for notes - moved to bottom */}
        {notesView === "notes" && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBackToSubOutline}
              className="flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium transition-colors"
              title="Back to sub-outline"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to sub-outline
            </button>
            
            <button
              onClick={exportToWord}
              className="flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
              title="Export to Word"
            >
              <FileText className="w-4 h-4 mr-1" />
              Word
            </button>
            
            <button
              onClick={exportToPDF}
              className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-sm font-medium transition-colors"
              title="Export to PDF"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            
            <button
              onClick={listenToNotes}
              className={`flex items-center px-3 py-2 ${isSpeaking ? 'bg-purple-100 text-purple-800' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'} rounded-md text-sm font-medium transition-colors`}
              title={isSpeaking ? "Stop listening" : "Listen to notes"}
            >
              <Volume2 className="w-4 h-4 mr-1" />
              {isSpeaking ? "Stop" : "Listen"}
            </button>
            
            <button
              onClick={generateQuiz}
              disabled={isQuizzing}
              className="flex items-center px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm font-medium transition-colors"
              title="Generate quiz"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              {isQuizzing ? "Generating..." : "Quiz"}
            </button>
            
            <button
              onClick={generateDiveDeeper}
              disabled={isDivingDeeper || !followUpQuestion.trim()}
              className="flex items-center px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-sm font-medium transition-colors"
              title="Dive deeper into this topic"
            >
              <Brain className="w-4 h-4 mr-1" />
              {isDivingDeeper ? "Generating..." : "Dive Deeper"}
            </button>
          </div>
        )}

        <style jsx global>{`
          .notes-content {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-size: 1.05rem;
            line-height: 1.8;
            color: #374151;
            padding: 2rem;
            background-color: white;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            max-width: 100%;
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
          }
          
          /* Fix heading sizes */
          .notes-content h1 {
            font-size: 1.75rem !important;
            margin-top: 2rem !important;
            margin-bottom: 1rem !important;
            font-weight: 700 !important;
          }
          
          .notes-content h2 {
            font-size: 1.5rem !important;
            margin-top: 1.75rem !important;
            margin-bottom: 0.75rem !important;
            font-weight: 600 !important;
          }
          
          .notes-content h3 {
            font-size: 1.25rem !important;
            margin-top: 1.5rem !important;
            margin-bottom: 0.5rem !important;
            font-weight: 600 !important;
          }
          
          .notes-content h4 {
            font-size: 1.125rem !important;
            margin-top: 1.25rem !important;
            margin-bottom: 0.5rem !important;
            font-weight: 600 !important;
          }
          
          .notes-content h5, .notes-content h6 {
            font-size: 1rem !important;
            margin-top: 1rem !important;
            margin-bottom: 0.5rem !important;
            font-weight: 600 !important;
          }
          
          /* Quiz styling */
          .quiz-question {
            background-color: white;
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          
          /* Streaming quiz animation */
          .streaming-quiz {
            position: relative;
            padding: 1.5rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border-left: 4px solid #6366f1;
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
            color: #4b5563;
            animation: fade-in 0.3s ease-in-out;
          }
          
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .streaming-quiz .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(99, 102, 241, 0.3);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          
          .streaming-content {
            min-height: 100px;
            position: relative;
            padding: 1rem;
            background-color: rgba(255, 255, 255, 0.7);
            border-radius: 0.375rem;
            overflow: hidden;
          }
          
          .streaming-content::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            width: 30%;
            background-color: #6366f1;
            animation: loading 1.5s infinite;
          }
          
          @keyframes loading {
            0% { width: 0; left: 0; }
            50% { width: 30%; left: 35%; }
            100% { width: 0; left: 100%; }
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
          
          .quiz-ready .quiz-option {
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .quiz-ready .quiz-option:hover {
            transform: translateX(4px);
            background-color: #f3f4f6;
          }
          
          .quiz-question h3 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1rem;
          }
          
          .quiz-option {
            display: block;
            padding: 0.75rem 1rem;
            margin: 0.5rem 0;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .quiz-option:hover {
            background-color: #f3f4f6;
            transform: translateX(4px);
          }
          
          .quiz-option-selected {
            background-color: #e0e7ff;
            border-color: #6366f1;
          }
          
          .quiz-feedback {
            margin-top: 1rem;
            padding: 0.75rem;
            border-radius: 0.375rem;
            display: none;
          }
          
          .quiz-feedback-correct {
            background-color: #d1fae5;
            color: #065f46;
          }
          
          .quiz-feedback-incorrect {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          
          .quiz-check-btn {
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.375rem;
            padding: 0.5rem 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-top: 1rem;
          }
          
          .quiz-check-btn:hover {
            background-color: #4338ca;
          }
          
          .quiz-score {
            background-color: #f3f4f6;
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          
          /* Additional styling for code blocks */
          .notes-content .code-block {
            background-color: #1f2937;
            color: #f9fafb;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
          
          /* Remove any markdown code block markers that might be visible */
          .notes-content pre:before,
          .notes-content pre:after,
          .notes-content code:before,
          .notes-content code:after {
            content: none !important;
          }
        `}</style>
          </motion.div>
    );
  };

  // Fetch quiz content via streaming API
  async function fetchQuizStream(
    mainTopic: string,
    parentTopic: string,
    subsubtopic: string | null
  ): Promise<string> {
    try {
      const response = await fetch('/api/generateQuiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainTopic,
          parentTopic,
          subsubtopic,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      let result = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      return result;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate quiz. Please try again.</p></div>';
    }
  }

  // Fetch dive deeper content via streaming API
  async function fetchDiveDeeperStream(
    question: string,
    mainTopic: string,
    parentTopic: string,
    subsubtopic: string | null
  ): Promise<string> {
    try {
      const response = await fetch('/api/generateDiveDeeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          mainTopic,
          parentTopic,
          subsubtopic,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      let result = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      return result;
    } catch (error) {
      console.error('Error fetching dive deeper content:', error);
      return '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate deeper insights. Please try again.</p></div>';
    }
  }

  // Function to update the quiz score
  const updateQuizScore = async () => {
    const questions = document.querySelectorAll('.quiz-question');
    let correctAnswers = 0;
    
    questions.forEach(question => {
      const feedback = question.querySelector('.quiz-feedback');
      if (feedback && feedback.classList.contains('quiz-feedback-correct')) {
        correctAnswers++;
      }
    });
    
    const scoreDiv = document.querySelector('.quiz-score');
    if (scoreDiv) {
      const score = Math.round((correctAnswers / questions.length) * 100);
      scoreDiv.textContent = `Score: ${correctAnswers}/${questions.length} (${score}%)`;
      
      // Save quiz score to database if user is logged in
      if (user && topic?.id) {
        try {
          // Update topic progress based on quiz score
          const progressIncrease = Math.round(score / 20); // 0-5 points based on score
          if (topic.progress !== undefined) {
            await updateTopicProgress(topic.id, Math.min(topic.progress + progressIncrease, 100), 5);
          }
        } catch (error) {
          console.error('Error saving quiz score:', error);
        }
      }
    }
  };

  // Update topic progress
  const updateTopicProgress = async (topicId: string, progress: number, studyTime: number) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({
          progress: progress,
          total_study_time: topic?.total_study_time ? topic.total_study_time + studyTime : studyTime,
          last_accessed: new Date().toISOString()
        })
        .eq('id', topicId);

      if (error) {
        console.error('Error updating topic progress:', error);
        return;
      }

      // Update local state
      if (topic) {
        setTopic({
          ...topic,
          progress: progress,
          total_study_time: topic.total_study_time ? topic.total_study_time + studyTime : studyTime,
          last_accessed: new Date().toISOString()
        });
      }

      // Record study session
      const { error: sessionError } = await supabase
        .from('study_sessions')
        .insert({
          topic_id: topicId,
          subtopic_id: activeSection ? subOutlines[activeSection]?.id : null,
          note_id: activeSubSection && notes[activeSubSection] ? notes[activeSubSection].id : null,
          duration: studyTime,
          created_at: new Date().toISOString()
        });

      if (sessionError) {
        console.error('Error recording study session:', sessionError);
      }
    } catch (error) {
      console.error('Error in updateTopicProgress:', error);
    }
  };

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