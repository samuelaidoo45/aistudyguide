"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from '@/app/lib/supabase';
import DashboardLayout from '@/app/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Brain, 
  Code, 
  Calculator, 
  FlaskConical, 
  Dna, 
  GraduationCap, 
  Globe,
  TrendingUp,
  Palette,
  Sparkles,
  ChevronRight,
  Loader2,
  Home,
  ChevronLeft,
  Info,
  Moon,
  Sun
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type ViewState = "input" | "mainOutline" | "subOutline" | "finalContent";

interface TopicData {
  id?: string;
  user_id: string;
  title: string;
  main_outline: string;
  created_at?: string;
  last_accessed?: string;
  progress: number;
  category?: string;
  total_study_time?: number;
}

interface SubtopicData {
  id?: string;
  topic_id: string;
  title: string;
  content: string;
  created_at?: string;
  last_accessed?: string;
}

interface NoteData {
  id?: string;
  subtopic_id: string;
  title: string;
  content: string;
  created_at?: string;
}

interface DiveDeeperData {
  id?: string;
  note_id: string;
  question: string;
  content: string;
  created_at?: string;
}

interface QuizData {
  id?: string;
  note_id: string;
  content: string;
  created_at?: string;
  last_score?: number;
}

interface NavigationStep {
  name: string;
  state: 'current' | 'complete' | 'upcoming';
  isClickable: boolean;
  targetView: ViewState;
}

const popularTopics = [
  {
    category: 'Computer Science',
    topics: [
      'JavaScript Fundamentals',
      'React.js for Frontend Development',
      'Data Structures and Algorithms',
      'Machine Learning with Python',
      'Cybersecurity Fundamentals',
      'Cloud Computing with AWS'
    ],
    icon: Code
  },
  {
    category: 'Business & Finance',
    topics: [
      'Financial Literacy Basics',
      'Investment Strategies for Beginners',
      'Digital Marketing Fundamentals',
      'Project Management Methodologies',
      'Entrepreneurship Essentials',
      'Business Communication Skills'
    ],
    icon: TrendingUp
  },
  {
    category: 'Health & Wellness',
    topics: [
      'Nutrition Fundamentals',
      'Stress Management Techniques',
      'Effective Exercise Routines',
      'Mental Health Awareness',
      'Sleep Science and Optimization',
      'Mindfulness and Meditation'
    ],
    icon: Brain
  },
  {
    category: 'Personal Development',
    topics: [
      'Time Management Strategies',
      'Effective Communication Skills',
      'Public Speaking Fundamentals',
      'Building Healthy Habits',
      'Goal Setting and Achievement',
      'Critical Thinking Skills'
    ],
    icon: Sparkles
  },
  {
    category: 'Science & Technology',
    topics: [
      'Climate Change and Sustainability',
      'Artificial Intelligence Ethics',
      'Renewable Energy Technologies',
      'Quantum Computing Basics',
      'Biotechnology Advancements',
      'Space Exploration and Astronomy'
    ],
    icon: FlaskConical
  },
  {
    category: 'Arts & Humanities',
    topics: [
      'Creative Writing Techniques',
      'Art History Fundamentals',
      'Philosophy for Everyday Life',
      'Music Theory Basics',
      'Film Analysis and Criticism',
      'World Religions and Cultures'
    ],
    icon: Palette
  },
  {
    category: 'Languages',
    topics: [
      'Spanish for Travelers',
      'Mandarin Chinese Basics',
      'Professional English Communication',
      'French for Beginners',
      'Japanese Language and Culture',
      'Arabic Language Fundamentals'
    ],
    icon: Globe
  },
  {
    category: 'Mathematics',
    topics: [
      'Practical Statistics for Data Analysis',
      'Applied Calculus in Real Life',
      'Financial Mathematics',
      'Probability Theory Basics',
      'Linear Algebra Applications',
      'Mathematical Problem Solving'
    ],
    icon: Calculator
  },
  {
    category: 'Education & Learning',
    topics: [
      'Effective Study Techniques',
      'Memory Improvement Methods',
      'Speed Reading Strategies',
      'Learning How to Learn',
      'Teaching Methodologies',
      'Educational Psychology'
    ],
    icon: GraduationCap
  }
]

const steps = ['input', 'mainOutline', 'subOutline', 'finalContent'] as ViewState[];

// URL Parameter Handler Component
interface UrlParamHandlerProps {
  urlTopic: string | null;
  urlSubtopic: string | null;
  urlSubsubtopic: string | null;
  handleBreakdown: (topic?: string) => Promise<void>;
  handleSelectSubtopic: (subtopic: string) => Promise<void>;
  handleSelectSubSubtopic: (subsubtopic: string) => Promise<void>;
}

const UrlParamHandler: React.FC<UrlParamHandlerProps> = ({ 
  urlTopic, 
  urlSubtopic, 
  urlSubsubtopic, 
  handleBreakdown, 
  handleSelectSubtopic, 
  handleSelectSubSubtopic 
}) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (urlTopic && !initialized) {
      setInitialized(true);
      
      // Set up a sequence of actions with delays
      const sequence = async () => {
        // First, handle the main topic
        await handleBreakdown(urlTopic);
        
        // If we have a subtopic, handle it after a delay
        if (urlSubtopic) {
          setTimeout(async () => {
            await handleSelectSubtopic(urlSubtopic);
            
            // If we have a subsubtopic, handle it after another delay
            if (urlSubsubtopic) {
              setTimeout(async () => {
                await handleSelectSubSubtopic(urlSubsubtopic);
              }, 1000);
            }
          }, 1000);
        }
      };
      
      sequence();
    }
  }, [urlTopic, urlSubtopic, urlSubsubtopic, initialized, handleBreakdown, handleSelectSubtopic, handleSelectSubSubtopic]);
  
  return null; // This component doesn't render anything
};

const NewTopic: React.FC = () => {
  // Topic and view states.
  const [topic, setTopic] = useState<string>("");
  const [view, setView] = useState<ViewState>("input");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState('Computer Science');
  
  // Caches for already streamed HTML.
  const mainOutlineCache = useRef<{ [key: string]: string }>({});
  const subOutlineCache = useRef<{ [key: string]: string }>({});
  const finalContentCache = useRef<{ [key: string]: string }>({});

  // State for streamed HTML.
  const [mainOutlineHTML, setMainOutlineHTML] = useState("");
  const [subOutlineHTML, setSubOutlineHTML] = useState("");
  const [finalContent, setFinalContent] = useState<string | null>(null);

  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [selectedSubSubtopic, setSelectedSubSubtopic] = useState<string>("");
  const [selectedNote, setSelectedNote] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Streaming completion states.
  const [streamingDone, setStreamingDone] = useState<boolean>(false);
  const [subOutlineStreamingDone, setSubOutlineStreamingDone] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [reloadCallback, setReloadCallback] = useState<(() => void) | null>(null);
  
  const supabase = createClient();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get('topic');
  const urlSubtopic = searchParams.get('subtopic');
  const urlSubsubtopic = searchParams.get('subsubtopic');

  // Initialize from URL parameters
  useEffect(() => {
    let isMounted = true;
    
    const loadFromUrl = async () => {
      if (urlTopic && view === "input") {
        // Set the topic
        setTopic(urlTopic);
        
        // Check if this topic already exists in Supabase
        if (user) {
          const existingTopic = await getTopicByTitle(urlTopic);
          
          if (existingTopic) {
            console.log('Found existing topic:', existingTopic);
            
            // Update the last_accessed timestamp
            await supabase
              .from('topics')
              .update({ last_accessed: new Date().toISOString() })
              .eq('id', existingTopic.id);
              
            // Create a study session
            await supabase
              .from('study_sessions')
              .insert([{
                user_id: user.id,
                topic_id: existingTopic.id,
                duration: 0, // Initial duration, will be updated when they finish
              }]);
          }
        }
        
        // Load the main outline
        await handleBreakdown(urlTopic);
        
        if (!isMounted) return;
        
        // If we have a subtopic, load it after a delay
        if (urlSubtopic) {
          setTimeout(async () => {
            if (!isMounted) return;
            
            // Check if this subtopic already exists in Supabase
            if (user) {
              const existingTopic = await getTopicByTitle(urlTopic);
              
              if (existingTopic) {
                const existingSubtopic = await getSubtopicByTitle(urlSubtopic, existingTopic.id!);
                
                if (existingSubtopic) {
                  console.log('Found existing subtopic:', existingSubtopic);
                  
                  // Update the last_accessed timestamp
                  await supabase
                    .from('subtopics')
                    .update({ last_accessed: new Date().toISOString() })
                    .eq('id', existingSubtopic.id);
                }
              }
            }
            
            await handleSelectSubtopic(urlSubtopic);
            
            if (!isMounted) return;
            
            // If we have a subsubtopic, load it after another delay
            if (urlSubsubtopic) {
              setTimeout(async () => {
                if (!isMounted) return;
                
                // Check if this note already exists in Supabase
                if (user) {
                  const existingTopic = await getTopicByTitle(urlTopic);
                  
                  if (existingTopic) {
                    const existingSubtopic = await getSubtopicByTitle(urlSubtopic, existingTopic.id!);
                    
                    if (existingSubtopic) {
                      // Check for existing note
                      const { data: existingNote } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('subtopic_id', existingSubtopic.id!)
                        .eq('title', urlSubsubtopic)
                        .maybeSingle();
                        
                      if (existingNote) {
                        console.log('Found existing note:', existingNote);
                        
                        // Load dive deeper content
                        const { data: diveDeeperData } = await supabase
                          .from('dive_deeper')
                          .select('*')
                          .eq('note_id', existingNote.id);
                          
                        if (diveDeeperData && diveDeeperData.length > 0) {
                          setDiveDeeper(diveDeeperData[0].content);
                          setFollowUpQuestion(diveDeeperData[0].question);
                        }
                        
                        // Load quiz content
                        const { data: quizData } = await supabase
                          .from('quizzes')
                          .select('*')
                          .eq('note_id', existingNote.id)
                          .maybeSingle();
                          
                        if (quizData) {
                          setQuizContent(quizData.content);
                        }
                      }
                    }
                  }
                }
                
                await handleSelectSubSubtopic(urlSubsubtopic);
              }, 1000);
            }
          }, 1000);
        }
      }
    };
    
    loadFromUrl();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Get user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, [supabase]);

  // --- Callback Handlers ---
  const handleSelectSubtopic = useCallback(async (subtopic: string) => {
    if (!topic) return;
    setLoading(true);
    setError(null);
    setSelectedSubtopic(subtopic);
    setSubOutlineStreamingDone(false);
    setSubOutlineHTML(""); // Clear previous sub‑outline if any.
    setView("subOutline");
    try {
      if (subOutlineCache.current[subtopic]) {
        setSubOutlineHTML(subOutlineCache.current[subtopic]);
        setSubOutlineStreamingDone(true);
        setLoading(false);
      } else {
        const html = await fetchSubOutlineHTMLStream(subtopic, topic);
        subOutlineCache.current[subtopic] = html;
        setSubOutlineHTML(html);
        setSubOutlineStreamingDone(true);
        setLoading(false);
        
        // Save subtopic to Supabase if user is logged in
        if (user) {
          const topicData = await getTopicByTitle(topic);
          if (topicData) {
            saveSubtopic({
              topic_id: topicData.id!,
              title: subtopic,
              content: html
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate sub-outline");
      setLoading(false);
    }
  }, [topic, user]);

  const handleSelectSubSubtopic = useCallback(async (subsubtopic: string) => {
    if (!topic || !selectedSubtopic) return;
    setLoading(true);
    setError(null);
    setSelectedSubSubtopic(subsubtopic);
    setFinalContent(null); // Clear previous content if any.
    setView("finalContent");
    try {
      if (finalContentCache.current[subsubtopic]) {
        setFinalContent(finalContentCache.current[subsubtopic]);
        setLoading(false);
      } else {
        const content = await fetchNotesStream(subsubtopic, topic, selectedSubtopic);
        finalContentCache.current[subsubtopic] = content;
        setFinalContent(content);
        setLoading(false);
        
        // Save note to Supabase if user is logged in
        if (user) {
          const topicData = await getTopicByTitle(topic);
          if (topicData) {
            const subtopicData = await getSubtopicByTitle(selectedSubtopic, topicData.id!);
            if (subtopicData) {
              saveNote({
                subtopic_id: subtopicData.id!,
                title: subsubtopic,
                content: content
              });
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate notes");
      setLoading(false);
    }
  }, [topic, selectedSubtopic, user]);

  async function fetchMainOutlineHTMLStream(topic: string): Promise<string> {
    try {
      const response = await fetch('/api/generateOutline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateOutlineHTML', topic })
      });

      if (!response.ok) throw new Error('Failed to fetch outline');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let result = '';
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process the buffer to ensure we have complete HTML elements
        // This helps prevent malformed HTML during streaming
        const lastCloseTagIndex = buffer.lastIndexOf('</');
        if (lastCloseTagIndex !== -1) {
          const nextOpenTagIndex = buffer.indexOf('<', lastCloseTagIndex);
          const completeHtml = nextOpenTagIndex !== -1 
            ? buffer.substring(0, nextOpenTagIndex) 
            : buffer;
            
          // Update the UI with the complete HTML
          setMainOutlineHTML(prev => prev + completeHtml);
          result += completeHtml;
          
          // Keep the remainder for the next iteration
          buffer = nextOpenTagIndex !== -1 ? buffer.substring(nextOpenTagIndex) : '';
        }
      }
      
      // Add any remaining buffer content
      if (buffer) {
        setMainOutlineHTML(prev => prev + buffer);
        result += buffer;
      }

      // Process the HTML to ensure all list items are properly clickable
      const processedHtml = makeOutlineItemsClickable(result);
      setMainOutlineHTML(processedHtml);
      
      return processedHtml;
    } catch (error) {
      console.error('Error fetching outline:', error);
      throw error;
    }
  }

  async function fetchSubOutlineHTMLStream(subtopic: string, mainTopic: string): Promise<string> {
    try {
      const response = await fetch('/api/generateSubOutline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generateOutlineHTML', 
          subtopic,
          mainTopic 
        })
      });

      if (!response.ok) throw new Error('Failed to fetch sub-outline');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let result = '';
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process the buffer to ensure we have complete HTML elements
        const lastCloseTagIndex = buffer.lastIndexOf('</');
        if (lastCloseTagIndex !== -1) {
          const nextOpenTagIndex = buffer.indexOf('<', lastCloseTagIndex);
          const completeHtml = nextOpenTagIndex !== -1 
            ? buffer.substring(0, nextOpenTagIndex) 
            : buffer;
            
          // Update the UI with the complete HTML
          setSubOutlineHTML(prev => prev + completeHtml);
          result += completeHtml;
          
          // Keep the remainder for the next iteration
          buffer = nextOpenTagIndex !== -1 ? buffer.substring(nextOpenTagIndex) : '';
        }
      }
      
      // Add any remaining buffer content
      if (buffer) {
        setSubOutlineHTML(prev => prev + buffer);
        result += buffer;
      }

      // Process the HTML to ensure all list items are properly clickable
      const processedHtml = makeSubOutlineItemsClickable(result);
      setSubOutlineHTML(processedHtml);
      
      return processedHtml;
    } catch (error) {
      console.error('Error fetching sub-outline:', error);
      throw error;
    }
  }

  // Helper function to make outline items clickable
  const makeOutlineItemsClickable = (html: string): string => {
    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all section titles and enhance them with chapter names
    const sectionTitles = tempDiv.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
      const titleText = title.textContent?.trim() || '';
      // Check if it's a chapter title (e.g., "Chapter 1")
      if (titleText.match(/Chapter \d+/i)) {
        // Extract the chapter number
        const chapterMatch = titleText.match(/Chapter (\d+)/i);
        if (chapterMatch && chapterMatch[1]) {
          const chapterNum = chapterMatch[1];
          // Generate a descriptive name based on the content of the subtopics
          const subtopics = Array.from(
            title.closest('.section-card')?.querySelectorAll('.subtopic-item span') || []
          ).map(span => span.textContent?.trim() || '');
          
          // Create a descriptive name based on the first subtopic or a generic name
          const chapterName = subtopics.length > 0 && subtopics[0] 
            ? subtopics[0] 
            : `Section ${chapterNum}`;
          
          // Update the title to include the chapter name
          title.innerHTML = title.innerHTML.replace(
            /Chapter \d+/i, 
            `Chapter ${chapterNum}: ${chapterName}`
          );
          
          // Add a data attribute to store the chapter name for reference
          title.setAttribute('data-chapter-name', chapterName);
        }
      }
    });
    
    // Find all subtopic items and add the necessary classes and attributes
    const subtopicItems = tempDiv.querySelectorAll('.subtopic-item');
    subtopicItems.forEach(item => {
      item.classList.add('outline-item');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      
      // Store the parent chapter information
      const sectionCard = item.closest('.section-card');
      const sectionTitle = sectionCard?.querySelector('.section-title');
      if (sectionTitle) {
        const chapterInfo = sectionTitle.textContent?.trim() || '';
        item.setAttribute('data-parent-chapter', chapterInfo);
      }
      
      // Store the subtopic text for easier access
      const spanElement = item.querySelector('span');
      if (spanElement) {
        const subtopicText = spanElement.textContent?.trim() || '';
        item.setAttribute('data-subtopic', subtopicText);
      }
    });
    
    // Find all list items and add the necessary classes and attributes
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
      li.classList.add('outline-item');
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      
      // Try to determine the parent chapter if possible
      const closestSection = li.closest('section, div[class*="section"]');
      if (closestSection) {
        const sectionHeading = closestSection.querySelector('h1, h2, h3, h4, h5, h6');
        if (sectionHeading) {
          li.setAttribute('data-parent-section', sectionHeading.textContent?.trim() || '');
        }
      }
    });
    
    return tempDiv.innerHTML;
  };
  
  // Helper function to make suboutline items clickable
  const makeSubOutlineItemsClickable = (html: string): string => {
    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all list items and add the necessary classes and attributes
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
      li.classList.add('suboutline-item');
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      
      // Store the original text for easier access
      const itemText = li.textContent?.trim() || '';
      li.setAttribute('data-subsubtopic', itemText);
    });
    
    // Find all subtopic items and add the necessary classes and attributes
    const subtopicItems = tempDiv.querySelectorAll('.subtopic-item');
    subtopicItems.forEach(item => {
      item.classList.add('suboutline-item');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      
      // Store the subtopic text for easier access
      const spanElement = item.querySelector('span');
      if (spanElement) {
        const subtopicText = spanElement.textContent?.trim() || '';
        item.setAttribute('data-subsubtopic', subtopicText);
      }
    });
    
    return tempDiv.innerHTML;
  };

  async function fetchNotesStream(
    subsubtopic: string,
    mainTopic: string,
    parentTopic: string
  ): Promise<string> {
    try {
      const response = await fetch('/api/generateNotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: mainTopic,
          sectionTitle: parentTopic,
          subtopic: subsubtopic
        })
      });

      if (!response.ok) throw new Error('Failed to fetch notes');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let result = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        // Update the UI with each chunk
        setFinalContent(prev => (prev || '') + chunk);
      }

      return result;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  // Add event listeners for subtopic and subsubtopic links
  useEffect(() => {
    if (view === "mainOutline" && streamingDone) {
      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("subtopic-link")) {
          e.preventDefault();
          const subtopic = target.textContent || "";
          handleSelectSubtopic(subtopic);
        }
      };

      document.addEventListener("click", clickHandler);
      return () => document.removeEventListener("click", clickHandler);
    }
  }, [view, streamingDone, handleSelectSubtopic]);

  useEffect(() => {
    if (view === "subOutline" && subOutlineStreamingDone) {
      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("subsubtopic-link")) {
          e.preventDefault();
          const subsubtopic = target.textContent || "";
          handleSelectSubSubtopic(subsubtopic);
        }
      };

      document.addEventListener("click", clickHandler);
      return () => document.removeEventListener("click", clickHandler);
    }
  }, [view, subOutlineStreamingDone, handleSelectSubSubtopic]);

  async function handleBreakdown(newTopic?: string) {
    const topicToUse = newTopic || topic;
    if (!topicToUse) return;
    
    setTopic(topicToUse);
    setLoading(true);
    setError(null);
    setStreamingDone(false);
    setMainOutlineHTML(""); // Clear previous outline if any.
    setView("mainOutline");
    
    try {
      if (mainOutlineCache.current[topicToUse]) {
        setMainOutlineHTML(mainOutlineCache.current[topicToUse]);
        setStreamingDone(true);
        setLoading(false);
      } else {
        const html = await fetchMainOutlineHTMLStream(topicToUse);
        mainOutlineCache.current[topicToUse] = html;
        setMainOutlineHTML(html);
        setStreamingDone(true);
        setLoading(false);
        
        // Save topic to Supabase if user is logged in
        if (user) {
          saveTopic({
            user_id: user.id,
            title: topicToUse,
            main_outline: html,
            progress: 0,
            category: 'General'
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate outline");
      setLoading(false);
    }
  }

  function handleBackToMainOutline() {
    setView("mainOutline");
    setSelectedSubtopic("");
    setSelectedSubSubtopic("");
  }

  function handleBackToSubOutline() {
    setView("subOutline");
    setSelectedSubSubtopic("");
  }

  // Supabase functions for storing data
  async function saveTopic(topicData: TopicData) {
    try {
      console.log('Saving topic:', topicData);
      
      // Check if user is authenticated
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      
      // Ensure user_id is set correctly
      topicData.user_id = user.id;
      
      // Check if the topics table exists by making a small query first
      const { error: checkError } = await supabase
        .from('topics')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking topics table:', checkError);
        throw new Error(`Table may not exist: ${checkError.message}`);
      }
      
      // Insert the topic
      const { data, error } = await supabase
        .from('topics')
        .insert([topicData])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      toast.success('Topic saved successfully');
      console.log('Topic saved:', data);
      return data[0];
    } catch (error: any) {
      toast.error(`Failed to save topic: ${error.message || 'Unknown error'}`);
      console.error('Error saving topic:', error);
      
      // Check if the error is related to missing tables
      if (error.message?.includes('relation "topics" does not exist')) {
        toast.error('Database tables not set up. Please run the SQL setup script.');
      }
      
      return null;
    }
  }

  async function saveSubtopic(subtopicData: SubtopicData) {
    try {
      console.log('Saving subtopic:', subtopicData);
      
      // Check if the subtopics table exists
      const { error: checkError } = await supabase
        .from('subtopics')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking subtopics table:', checkError);
        throw new Error(`Table may not exist: ${checkError.message}`);
      }
      
      const { data, error } = await supabase
        .from('subtopics')
        .insert([subtopicData])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Subtopic saved:', data);
      return data[0];
    } catch (error: any) {
      console.error('Error saving subtopic:', error);
      toast.error(`Failed to save subtopic: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function saveNote(noteData: NoteData) {
    try {
      console.log('Saving note:', noteData);
      
      // Check if the notes table exists
      const { error: checkError } = await supabase
        .from('notes')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking notes table:', checkError);
        throw new Error(`Table may not exist: ${checkError.message}`);
      }
      
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Note saved:', data);
      return data[0];
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast.error(`Failed to save note: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function saveDiveDeeper(diveDeeperData: DiveDeeperData) {
    try {
      console.log('Saving dive deeper content:', diveDeeperData);
      
      // Check if the dive_deeper table exists
      const { error: checkError } = await supabase
        .from('dive_deeper')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking dive_deeper table:', checkError);
        throw new Error(`Table may not exist: ${checkError.message}`);
      }
      
      const { data, error } = await supabase
        .from('dive_deeper')
        .insert([diveDeeperData])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Dive deeper content saved:', data);
      return data[0];
    } catch (error: any) {
      console.error('Error saving dive deeper content:', error);
      toast.error(`Failed to save dive deeper content: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function saveQuiz(quizData: QuizData) {
    try {
      console.log('Saving quiz:', quizData);
      
      // Check if the quizzes table exists
      const { error: checkError } = await supabase
        .from('quizzes')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking quizzes table:', checkError);
        throw new Error(`Table may not exist: ${checkError.message}`);
      }
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert([quizData])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Quiz saved:', data);
      return data[0];
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast.error(`Failed to save quiz: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function getTopicByTitle(title: string) {
    try {
      if (!user || !user.id) {
        console.log('User not authenticated, cannot fetch topic');
        return null;
      }
      
      console.log('Getting topic by title:', title, 'for user:', user.id);
      
      // First try to get all matching topics to check if there are duplicates
      const { data: allMatches, error: listError } = await supabase
        .from('topics')
        .select('*')
        .eq('title', title)
        .eq('user_id', user.id);
      
      if (listError) {
        console.error('Supabase query error when listing topics:', listError.message);
        return null;
      }
      
      // If there are multiple matches, use the most recently accessed one
      if (allMatches && allMatches.length > 1) {
        console.log(`Found ${allMatches.length} topics with the same title. Using the most recent one.`);
        // Sort by last_accessed in descending order (most recent first)
        const sortedMatches = [...allMatches].sort((a, b) => {
          return new Date(b.last_accessed || b.created_at).getTime() - 
                 new Date(a.last_accessed || a.created_at).getTime();
        });
        
        return sortedMatches[0];
      }
      
      // If there's exactly one match or no matches, use maybeSingle
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('title', title)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Supabase query error:', error.message);
        // Don't throw the error, just log it and return null
        return null;
      }
      
      if (!data) {
        console.log('No topic found with title:', title);
        return null;
      }
      
      console.log('Topic found:', data);
      return data;
    } catch (error: any) {
      // Handle unexpected errors
      console.error('Unexpected error getting topic:', error?.message || 'Unknown error');
      return null;
    }
  }

  async function getSubtopicByTitle(title: string, topicId: string) {
    try {
      console.log('Getting subtopic by title:', title, 'for topic:', topicId);
      
      // First try to get all matching subtopics to check if there are duplicates
      const { data: allMatches, error: listError } = await supabase
        .from('subtopics')
        .select('*')
        .eq('title', title)
        .eq('topic_id', topicId);
      
      if (listError) {
        console.error('Supabase query error when listing subtopics:', listError.message);
        return null;
      }
      
      // If there are multiple matches, use the most recently accessed one
      if (allMatches && allMatches.length > 1) {
        console.log(`Found ${allMatches.length} subtopics with the same title. Using the most recent one.`);
        // Sort by last_accessed in descending order (most recent first)
        const sortedMatches = [...allMatches].sort((a, b) => {
          return new Date(b.last_accessed || b.created_at).getTime() - 
                 new Date(a.last_accessed || a.created_at).getTime();
        });
        
        return sortedMatches[0];
      }
      
      // If there's exactly one match or no matches, use maybeSingle
      const { data, error } = await supabase
        .from('subtopics')
        .select('*')
        .eq('title', title)
        .eq('topic_id', topicId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no results are found
      
      if (error) {
        console.error('Supabase query error:', error.message);
        // Don't throw the error, just log it and return null
        return null;
      }
      
      if (!data) {
        console.log('No subtopic found with title:', title);
        return null;
      }
      
      console.log('Subtopic found:', data);
      return data;
    } catch (error: any) {
      console.error('Unexpected error getting subtopic:', error?.message || 'Unknown error');
      return null;
    }
  }

  // Update study time and progress
  async function updateTopicProgress(topicId: string, progress: number, studyTime: number) {
    try {
      console.log('Updating topic progress:', { topicId, progress, studyTime });
      
      const { error } = await supabase
        .from('topics')
        .update({ 
          progress: progress,
          total_study_time: studyTime,
          last_accessed: new Date().toISOString()
        })
        .eq('id', topicId);
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Progress updated successfully');
    } catch (error: any) {
      console.error('Error updating topic progress:', error);
      toast.error(`Failed to update progress: ${error.message || 'Unknown error'}`);
    }
  }

  // Enhanced click handlers with proper event delegation
  const handleMainOutlineClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    
    // Find the closest clickable element
    const clickedItem = target.closest('.subtopic-item') || 
                        target.closest('.outline-item') || 
                        target.closest('li');
                    
    if (clickedItem) {
      // Extract the text content, prioritizing data attributes and specific elements
      let subtopic = '';
      let parentChapter = '';
      
      // Check for data attributes first (most reliable)
      if (clickedItem.hasAttribute('data-subtopic')) {
        const dataSubtopic = clickedItem.getAttribute('data-subtopic');
        if (dataSubtopic) {
          subtopic = dataSubtopic;
        }
      } else if (clickedItem.hasAttribute('data-parent-section')) {
        const dataParentSection = clickedItem.getAttribute('data-parent-section');
        if (dataParentSection) {
          parentChapter = dataParentSection;
        }
      }
      
      // If no data attribute, try to find specific elements
      if (!subtopic) {
        const spanElement = clickedItem.querySelector('span');
        if (spanElement) {
          subtopic = spanElement.textContent?.trim() || '';
        } else {
          // Fallback to the item's text content
          subtopic = clickedItem.textContent?.trim() || '';
        }
      }
      
      // Get parent chapter information if not already found
      if (!parentChapter) {
        const sectionCard = clickedItem.closest('.section-card');
        const sectionTitle = sectionCard?.querySelector('.section-title');
        if (sectionTitle) {
          parentChapter = sectionTitle.textContent?.trim() || '';
        }
      }
      
      // Clean up the subtopic text
      subtopic = subtopic.replace(/[\n\r]+/g, ' ').trim();
      
      if (subtopic) {
        console.log('Selected subtopic:', subtopic);
        console.log('Parent chapter:', parentChapter);
        
        // Add active class to the clicked item
        const allItems = document.querySelectorAll('.outline-content .subtopic-item, .outline-content .outline-item, .outline-content li');
        allItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
        
        // Set the selected subtopic with context
        const contextualSubtopic = parentChapter 
          ? `${parentChapter} - ${subtopic}`
          : subtopic;
          
        setSelectedSubtopic(contextualSubtopic);
        
        // Generate sub-outline for the specific subtopic
        handleSelectSubtopic(subtopic || '');
        
        // Show visual feedback
        toast.success(`Generating sub-outline for "${subtopic}"`);
      }
    }
  };

  const handleSubOutlineClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    
    // Find the closest clickable element
    const clickedItem = target.closest('.subtopic-item') || 
                        target.closest('.suboutline-item') || 
                        target.closest('li');
                    
    if (clickedItem) {
      // Extract the text content, prioritizing data attributes and specific elements
      let subsubtopic = '';
      
      // Check for data attributes first (most reliable)
      if (clickedItem.hasAttribute('data-subsubtopic')) {
        const dataSubsubtopic = clickedItem.getAttribute('data-subsubtopic');
        if (dataSubsubtopic) {
          subsubtopic = dataSubsubtopic;
        }
      }
      
      // If no data attribute, try to find specific elements
      if (!subsubtopic) {
        const spanElement = clickedItem.querySelector('span');
        if (spanElement) {
          subsubtopic = spanElement.textContent?.trim() || '';
        } else {
          // Fallback to the item's text content
          subsubtopic = clickedItem.textContent?.trim() || '';
        }
      }
      
      // Clean up the subsubtopic text
      subsubtopic = subsubtopic.replace(/[\n\r]+/g, ' ').trim();
      
      if (subsubtopic) {
        console.log('Selected subsubtopic:', subsubtopic);
        
        // Add active class to the clicked item
        const allItems = document.querySelectorAll('.suboutline-content .subtopic-item, .suboutline-content .suboutline-item, .suboutline-content li');
        allItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
        
        // Set the selected sub-subtopic and generate notes
        setSelectedSubSubtopic(subsubtopic);
        handleSelectSubSubtopic(subsubtopic);
        
        // Show visual feedback
        toast.success(`Generating notes for "${subsubtopic}"`);
      }
    }
  };

  const handleSelectTopic = (selectedTopic: string) => {
    setTopic(selectedTopic);
    handleBreakdown(selectedTopic);
  };

  const handleSaveMainOutline = async () => {
    try {
      // API call to save main outline would go here
      setView('subOutline');
      toast.success('Main outline saved');
    } catch (error) {
      toast.error('Failed to save outline');
    }
  };

  const handleSaveSubOutline = async () => {
    try {
      // API call to save sub outline would go here
      setView('finalContent');
      toast.success('Sub outline saved');
    } catch (error) {
      toast.error('Failed to save outline');
    }
  };

  // Function to update user achievements
  const updateAchievements = async (userId: string) => {
    try {
      // Count total notes created by user
      const { count: notesCount, error: notesError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('subtopic_id', 'subtopics.id')
        .eq('subtopics.topic_id', 'topics.id')
        .eq('topics.user_id', userId);
        
      if (notesError) {
        console.error("Error counting notes:", notesError);
        return;
      }
      
      // Count total study sessions
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (sessionsError) {
        console.error("Error counting sessions:", sessionsError);
        return;
      }
      
      // Get existing achievements or create new ones
      const { data: existingAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
        return;
      }
      
      // Calculate total study time
      const { data: studySessions } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', userId);
        
      const totalStudyTime = studySessions?.reduce((total: number, session: any) => 
        total + (session.duration || 0), 0) || 0;
      
      if (existingAchievements) {
        // Update existing achievements
        await supabase
          .from('achievements')
          .update({
            notes_created: notesCount || 0,
            study_sessions_completed: sessionsCount || 0,
            total_study_time: totalStudyTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAchievements.id);
      } else {
        // Create new achievements record
        await supabase
          .from('achievements')
          .insert([{
            user_id: userId,
            notes_created: notesCount || 0,
            study_sessions_completed: sessionsCount || 0,
            total_study_time: totalStudyTime,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      console.error("Error updating achievements:", error);
    }
  };

  const handleSaveNote = async () => {
    if (!user) {
      toast.error("Authentication required. Please sign in to save notes");
      return;
    }

    setIsSaving(true);

    try {
      // Get or create topic
      let topicId;
      const existingTopic = await getTopicByTitle(topic);
      
      if (existingTopic) {
        topicId = existingTopic.id;
        
        // Update last_accessed
        await supabase
          .from('topics')
          .update({ 
            last_accessed: new Date().toISOString(),
            progress: 100 // Mark as complete when saving notes
          })
          .eq('id', topicId);
      } else {
        // Create new topic
        const { data: newTopic, error: topicError } = await supabase
          .from('topics')
          .insert([{
            user_id: user.id,
            title: topic,
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
            progress: 100, // Mark as complete when saving notes
          }])
          .select()
          .single();
          
        if (topicError) {
          console.error("Error saving topic:", topicError);
          throw new Error("Failed to save topic");
        }
        
        topicId = newTopic.id;
      }
      
      // Get or create subtopic
      let subtopicId;
      const existingSubtopic = await getSubtopicByTitle(selectedSubtopic, topicId);
      
      if (existingSubtopic) {
        subtopicId = existingSubtopic.id;
        
        // Update last_accessed
        await supabase
          .from('subtopics')
          .update({ 
            last_accessed: new Date().toISOString(),
            progress: 100 // Mark as complete when saving notes
          })
          .eq('id', subtopicId);
      } else {
        // Create new subtopic
        const { data: newSubtopic, error: subtopicError } = await supabase
          .from('subtopics')
          .insert([{
            topic_id: topicId,
            title: selectedSubtopic,
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
            progress: 100, // Mark as complete when saving notes
          }])
          .select()
          .single();
          
        if (subtopicError) {
          console.error("Error saving subtopic:", subtopicError);
          throw new Error("Failed to save subtopic");
        }
        
        subtopicId = newSubtopic.id;
      }
      
      // Get or create note
      let noteId;
      const { data: existingNote, error: noteQueryError } = await supabase
        .from('notes')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('title', selectedSubSubtopic)
        .maybeSingle();
        
      if (noteQueryError) {
        console.error("Error querying note:", noteQueryError);
      }
      
      if (existingNote) {
        noteId = existingNote.id;
        
        // Update existing note
        const { error: updateError } = await supabase
          .from('notes')
          .update({ 
            content: noteContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId);
          
        if (updateError) {
          console.error("Error updating note:", updateError);
          throw new Error("Failed to update note");
        }
      } else {
        // Create new note
        const { data: newNote, error: insertError } = await supabase
          .from('notes')
          .insert([{
            subtopic_id: subtopicId,
            title: selectedSubSubtopic,
            content: noteContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating note:", insertError);
          throw new Error("Failed to create note");
        }
        
        noteId = newNote.id;
      }
      
      // Save dive deeper content if available
      if (diveDeeper) {
        const { data: existingDiveDeeper, error: diveDeeperQueryError } = await supabase
          .from('dive_deeper')
          .select('*')
          .eq('note_id', noteId)
          .maybeSingle();
          
        if (diveDeeperQueryError) {
          console.error("Error querying dive deeper:", diveDeeperQueryError);
        }
        
        if (existingDiveDeeper) {
          // Update existing dive deeper
          const { error: updateError } = await supabase
            .from('dive_deeper')
            .update({ 
              content: diveDeeper,
              question: followUpQuestion || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDiveDeeper.id);
            
          if (updateError) {
            console.error("Error updating dive deeper:", updateError);
          }
        } else {
          // Create new dive deeper
          const { error: insertError } = await supabase
            .from('dive_deeper')
            .insert([{
              note_id: noteId,
              content: diveDeeper,
              question: followUpQuestion || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);
            
          if (insertError) {
            console.error("Error creating dive deeper:", insertError);
          }
        }
      }
      
      // Save quiz content if available
      if (quizContent) {
        const { data: existingQuiz, error: quizQueryError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('note_id', noteId)
          .maybeSingle();
          
        if (quizQueryError) {
          console.error("Error querying quiz:", quizQueryError);
        }
        
        if (existingQuiz) {
          // Update existing quiz
          const { error: updateError } = await supabase
            .from('quizzes')
            .update({ 
              content: quizContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingQuiz.id);
            
          if (updateError) {
            console.error("Error updating quiz:", updateError);
          }
        } else {
          // Create new quiz
          const { error: insertError } = await supabase
            .from('quizzes')
            .insert([{
              note_id: noteId,
              content: quizContent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);
            
          if (insertError) {
            console.error("Error creating quiz:", insertError);
          }
        }
      }
      
      // Update study session if it exists
      const { data: studySession } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (studySession) {
        // Calculate duration (time since session started)
        const startTime = new Date(studySession.created_at).getTime();
        const endTime = new Date().getTime();
        const durationInMinutes = Math.round((endTime - startTime) / 60000);
        
        await supabase
          .from('study_sessions')
          .update({ 
            duration: durationInMinutes,
            completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', studySession.id);
      }

      toast.success("Your note has been saved");
      
      // Update achievements
      if (user) {
        await updateAchievements(user.id);
      }
      
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const [diveDeeper, setDiveDeeper] = useState<string>("");
  const [quizContent, setQuizContent] = useState<string>("");
  const [isDivingDeeper, setIsDivingDeeper] = useState<boolean>(false);
  const [isQuizzing, setIsQuizzing] = useState<boolean>(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  async function fetchDiveDeeperStream(
    question: string,
    mainTopic: string,
    parentTopic: string,
    subsubtopic: string
  ): Promise<string> {
    try {
      setIsDivingDeeper(true);
      const response = await fetch('/api/diveDeeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topicChain: `Main Topic: '${mainTopic}', Section: '${parentTopic}', Subtopic: '${subsubtopic}'`,
          followUpQuestion: question
        })
      });

      if (!response.ok) throw new Error('Failed to fetch deeper insights');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let result = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        // Update the UI with each chunk
        setDiveDeeper(prev => (prev || '') + chunk);
      }

      setIsDivingDeeper(false);
      return result;
    } catch (error) {
      console.error('Error fetching deeper insights:', error);
      setIsDivingDeeper(false);
      throw error;
    }
  }

  async function fetchQuizStream(
    mainTopic: string,
    parentTopic: string,
    subsubtopic: string
  ): Promise<string> {
    try {
      setIsQuizzing(true);
      const response = await fetch('/api/generateQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: mainTopic,
          sectionTitle: parentTopic,
          subtopic: subsubtopic
        })
      });

      if (!response.ok) throw new Error('Failed to fetch quiz');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let result = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        // Update the UI with each chunk
        setQuizContent(prev => (prev || '') + chunk);
      }

      setIsQuizzing(false);
      return result;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setIsQuizzing(false);
      throw error;
    }
  }

  const handleDiveDeeper = async () => {
    if (!followUpQuestion.trim()) return;
    
    setDiveDeeper("");
    const content = await fetchDiveDeeperStream(
      followUpQuestion,
      selectedSubtopic,
      selectedSubtopic,
      selectedSubSubtopic
    );

    // Save dive deeper content to Supabase if user is logged in
    if (user && content) {
      try {
        // Get the topic data
        const topicData = await getTopicByTitle(selectedSubtopic);
        if (topicData) {
          // Get the subtopic data
          const subtopicData = await getSubtopicByTitle(selectedSubtopic, topicData.id!);
          if (subtopicData) {
            // Get the note data
            const { data: noteData, error: noteError } = await supabase
              .from('notes')
              .select('*')
              .eq('subtopic_id', subtopicData.id!)
              .eq('title', selectedSubSubtopic)
              .maybeSingle();
            
            if (noteError) {
              console.error('Error fetching note:', noteError);
            } else if (noteData) {
              // Save the dive deeper content
              await saveDiveDeeper({
                note_id: noteData.id!,
                question: followUpQuestion,
                content: content
              });
              
              // Update topic progress
              await updateTopicProgress(topicData.id!, Math.min(topicData.progress + 2, 100), 5);
            }
          }
        }
      } catch (error) {
        console.error('Error saving dive deeper content:', error);
      }
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizContent("");
    const content = await fetchQuizStream(
      selectedSubtopic,
      selectedSubtopic,
      selectedSubSubtopic
    );

    // Save quiz to Supabase if user is logged in
    if (user && content) {
      try {
        // Get the topic data
        const topicData = await getTopicByTitle(selectedSubtopic);
        if (topicData) {
          // Get the subtopic data
          const subtopicData = await getSubtopicByTitle(selectedSubtopic, topicData.id!);
          if (subtopicData) {
            // Get the note data
            const { data: noteData, error: noteError } = await supabase
              .from('notes')
              .select('*')
              .eq('subtopic_id', subtopicData.id!)
              .eq('title', selectedSubSubtopic)
              .maybeSingle();
            
            if (noteError) {
              console.error('Error fetching note:', noteError);
            } else if (noteData) {
              // Save the quiz
              await saveQuiz({
                note_id: noteData.id!,
                content: content,
                last_score: 0
              });
              
              // Update topic progress
              await updateTopicProgress(topicData.id!, Math.min(topicData.progress + 3, 100), 5);
            }
          }
        }
      } catch (error) {
        console.error('Error saving quiz:', error);
      }
    }
  };

  // Add event listeners for quiz interaction
  useEffect(() => {
    if (quizContent && !isQuizzing) {
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
  }, [quizContent, isQuizzing]);
  
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
      
      // Save quiz score to Supabase if user is logged in
      if (user && quizContent) {
        try {
          // Get the topic data
          const topicData = await getTopicByTitle(selectedSubtopic);
          if (topicData) {
            // Get the subtopic data
            const subtopicData = await getSubtopicByTitle(selectedSubtopic, topicData.id!);
            if (subtopicData) {
              // Get the note data
              const { data: noteData, error: noteError } = await supabase
                .from('notes')
                .select('*')
                .eq('subtopic_id', subtopicData.id!)
                .eq('title', selectedSubSubtopic)
                .maybeSingle();
              
              if (noteError) {
                console.error('Error fetching note:', noteError);
              } else if (noteData) {
                // Get the quiz data
                const { data: quizData, error: quizError } = await supabase
                  .from('quizzes')
                  .select('*')
                  .eq('note_id', noteData.id!)
                  .maybeSingle();
                
                if (quizError) {
                  console.error('Error fetching quiz:', quizError);
                } else if (quizData) {
                  // Update the quiz score
                  const { error: updateError } = await supabase
                    .from('quizzes')
                    .update({ last_score: score })
                    .eq('id', quizData.id!);
                  
                  if (updateError) {
                    console.error('Error updating quiz score:', updateError);
                  } else {
                    console.log('Quiz score updated:', score);
                    
                    // Update topic progress based on quiz score
                    const progressIncrease = Math.round(score / 20); // 0-5 points based on score
                    await updateTopicProgress(topicData.id!, Math.min(topicData.progress + progressIncrease, 100), 5);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error saving quiz score:', error);
        }
      }
    }
  };

  const renderFinalContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="mb-4 flex justify-between items-center">
        <div>
          <button
            onClick={handleBackToSubOutline}
            className="text-indigo-600 hover:text-indigo-700 flex items-center mb-2"
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
            Back to sub-outline
          </button>
          <h4 className="text-xl font-bold text-gray-900">
            {selectedSubSubtopic}
          </h4>
        </div>
        {loading && (
          <div className="flex items-center text-indigo-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Generating notes...</span>
          </div>
        )}
      </div>
      
      <div 
        className="prose max-w-none notes-content"
        dangerouslySetInnerHTML={{ __html: finalContent || '' }}
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
            onClick={handleDiveDeeper}
            disabled={isDivingDeeper || !followUpQuestion.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
          >
            {isDivingDeeper ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Ask'
            )}
          </button>
        </div>
        
        {diveDeeper && (
          <div 
            className="prose max-w-none notes-content dive-deeper-content mt-4"
            dangerouslySetInnerHTML={{ __html: diveDeeper }}
          />
        )}
      </div>

      {/* Quiz Section */}
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Test Your Knowledge</h4>
          <button
            onClick={handleGenerateQuiz}
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
        
        {quizContent && (
          <div 
            className="quiz-container mt-4"
            dangerouslySetInnerHTML={{ __html: quizContent }}
          />
        )}
      </div>

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
        
        .notes-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.3;
          letter-spacing: -0.025em;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.75rem;
        }
        
        .notes-content h2 {
          font-size: 1.65rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 2.25rem;
          margin-bottom: 1rem;
          line-height: 1.4;
          letter-spacing: -0.015em;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }
        
        .notes-content h3 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #374151;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        
        .notes-content h4 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #4b5563;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        
        .notes-content p {
          margin-bottom: 1.5rem;
          color: #4b5563;
          line-height: 1.8;
        }
        
        .notes-content strong {
          font-weight: 600;
          color: #111827;
        }
        
        .notes-content em {
          font-style: italic;
          color: #4b5563;
        }
        
        .notes-content ul,
        .notes-content ol {
          margin: 1.5rem 0;
          padding-left: 1.75rem;
        }
        
        .notes-content li {
          margin-bottom: 0.75rem;
          color: #4b5563;
          position: relative;
          line-height: 1.7;
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
        
        .notes-content blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          color: #6b7280;
          font-style: italic;
          background-color: #f9fafb;
          padding: 1.25rem 1.5rem;
          border-radius: 0.5rem;
        }
        
        .notes-content blockquote p {
          margin-bottom: 0;
        }
        
        .notes-content a {
          color: #4f46e5;
          text-decoration: none;
          border-bottom: 1px dotted #4f46e5;
          transition: all 0.2s ease;
        }
        
        .notes-content a:hover {
          color: #4338ca;
          border-bottom: 1px solid #4338ca;
        }
        
        .notes-content pre,
        .notes-content code {
          font-family: 'Fira Code', 'Roboto Mono', 'Courier New', monospace;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.2em 0.4em;
          font-size: 0.9em;
          color: #334155;
        }
        
        .notes-content pre {
          padding: 1.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          line-height: 1.6;
        }
        
        .notes-content pre code {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 0.9rem;
        }
        
        .notes-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          overflow-x: auto;
          display: block;
        }
        
        .notes-content table thead {
          background-color: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .notes-content table th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
        }
        
        .notes-content table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }
        
        .notes-content table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .notes-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .notes-content hr {
          border: 0;
          height: 1px;
          background-color: #e5e7eb;
          margin: 2rem 0;
        }
        
        .notes-content .highlight {
          background-color: #fef3c7;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          color: #92400e;
        }
        
        .notes-content .note {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }
        
        .notes-content .warning {
          background-color: #fff7ed;
          border-left: 4px solid #f97316;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }
        
        .notes-content .tip {
          background-color: #ecfdf5;
          border-left: 4px solid #10b981;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .notes-content {
            padding: 1.5rem;
            font-size: 1rem;
          }
          
          .notes-content h1 {
            font-size: 1.75rem;
          }
          
          .notes-content h2 {
            font-size: 1.5rem;
          }
          
          .notes-content h3 {
            font-size: 1.25rem;
          }
          
          .notes-content h4 {
            font-size: 1.1rem;
          }
        }
        
        /* Quiz Styling */
        .quiz-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
        }
        
        .quiz-container > div, 
        .quiz-container > p, 
        .quiz-container > h1, 
        .quiz-container > h2, 
        .quiz-container > h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          padding: 0;
        }
        
        .quiz-question {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        
        .quiz-option {
          padding: 1rem;
          margin: 0.5rem 0;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
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
        
        .quiz-check-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: #6366f1;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .quiz-check-btn:hover {
          background-color: #4f46e5;
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
        
        .quiz-score {
          margin-top: 2rem;
          padding: 1rem;
          text-align: center;
          font-weight: 600;
          font-size: 1.25rem;
        }
        
        /* Dive Deeper Styling */
        .dive-deeper-content {
          margin: 0;
          padding: 0;
        }
        
        .dive-deeper-content > div, 
        .dive-deeper-content > p, 
        .dive-deeper-content > h1, 
        .dive-deeper-content > h2, 
        .dive-deeper-content > h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          padding: 0;
        }
      `}</style>
    </motion.div>
  );

  // Breadcrumb navigation
  const renderBreadcrumbs = () => {
    const breadcrumbs = [];
    
    // Always show Home
    breadcrumbs.push({
      name: 'Dashboard',
      href: '/dashboard',
      current: false
    });
    
    // Add New Topic
    breadcrumbs.push({
      name: 'New Topic',
      href: '#',
      current: view === 'input',
      onClick: () => {
        if (view !== 'input') {
          setView('input');
          setTopic('');
          setMainOutlineHTML('');
          setSubOutlineHTML('');
          setFinalContent(null);
          setSelectedSubtopic('');
          setSelectedSubSubtopic('');
        }
      }
    });
    
    // Add Main Outline if we're past input
    if (view !== 'input') {
      breadcrumbs.push({
        name: topic || 'Main Outline',
        href: '#',
        current: view === 'mainOutline',
        onClick: () => view !== 'mainOutline' && handleBackToMainOutline()
      });
    }
    
    // Add Subtopic if we're at subOutline or finalContent
    if (view === 'subOutline' || view === 'finalContent') {
      breadcrumbs.push({
        name: selectedSubtopic || 'Subtopic',
        href: '#',
        current: view === 'subOutline',
        onClick: () => view !== 'subOutline' && handleBackToSubOutline()
      });
    }
    
    // Add Notes if we're at finalContent
    if (view === 'finalContent') {
      breadcrumbs.push({
        name: selectedSubSubtopic || 'Notes',
        href: '#',
        current: true
      });
    }
    
    return (
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.name} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400 mx-1" />
              )}
              {breadcrumb.onClick ? (
                <button
                  onClick={breadcrumb.onClick}
                  className={`text-sm font-medium ${
                    breadcrumb.current
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  {breadcrumb.name}
                </button>
              ) : (
                <a
                  href={breadcrumb.href}
                  className={`text-sm font-medium ${
                    breadcrumb.current
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-indigo-600'
                  }`}
                >
                  {breadcrumb.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  // Main outline rendering
  const renderMainOutline = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-bg-secondary rounded-xl shadow-md p-6 border border-border-primary transition-colors duration-200"
    >
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          {topic}
        </h2>
        {loading && (
          <div className="flex items-center text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Generating outline...</span>
          </div>
        )}
      </div>
      
      {!loading && streamingDone && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg flex items-start transition-colors duration-200">
          <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-700 dark:text-indigo-300 text-sm">
            Click on any topic below to generate a detailed sub-outline. Each section can be explored further to generate comprehensive study notes.
          </p>
        </div>
      )}
      
      <div 
        className="outline-content text-text-primary transition-colors duration-200"
        dangerouslySetInnerHTML={{ __html: mainOutlineHTML }}
        onClick={handleMainOutlineClick}
      />
      
      <style jsx global>{`
        .outline-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }
        
        .outline-content h2.outline-item:hover {
          color: var(--primary-600);
        }
        
        .dark .outline-content h2.outline-item:hover {
          color: var(--primary-400);
        }
        
        .outline-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }
        
        .outline-content li {
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }
        
        .outline-content .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-primary);
          transition: color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </motion.div>
  );

  // Sub outline rendering
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
            onClick={handleBackToMainOutline}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to main outline
          </button>
          <h3 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200">
            {selectedSubtopic}
          </h3>
        </div>
        {loading && (
          <div className="flex items-center text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span>Generating...</span>
          </div>
        )}
      </div>
      
      {!loading && subOutlineStreamingDone && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg flex items-start transition-colors duration-200">
          <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-700 dark:text-indigo-300 text-sm">
            Click on any subtopic below to generate detailed study notes for that specific area.
          </p>
        </div>
      )}
      
      <div 
        className="suboutline-content text-text-primary transition-colors duration-200"
        dangerouslySetInnerHTML={{ __html: subOutlineHTML }}
        onClick={handleSubOutlineClick}
      />
      
      <style jsx global>{`
        .suboutline-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }
        
        .suboutline-content h3:hover {
          color: var(--primary-600);
        }
        
        .dark .suboutline-content h3:hover {
          color: var(--primary-400);
        }
        
        .suboutline-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }
        
        .suboutline-content li {
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }
        
        .suboutline-content .section-card {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }
        
        .suboutline-content .section-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .dark .suboutline-content .section-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .suboutline-content .section-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
      `}</style>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-bg-primary transition-colors duration-200">
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {renderBreadcrumbs()}
            <AnimatePresence mode="wait">
              {view === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Topic Input Section */}
                  <div className="bg-bg-secondary rounded-xl shadow-sm border border-border-primary overflow-hidden transition-colors duration-200">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-text-primary mb-4 transition-colors duration-200">
                        What would you like to learn about?
                      </h2>
                      <p className="text-text-secondary mb-6 transition-colors duration-200">
                        Enter a topic and we'll create a comprehensive study guide with outlines, notes, and quizzes.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="topic" className="block text-sm font-medium text-text-secondary mb-1 transition-colors duration-200">
                            Topic
                          </label>
                          <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Machine Learning, World War II, Quantum Physics"
                            className="w-full px-4 py-3 rounded-lg border border-border-primary bg-bg-secondary text-text-primary focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          />
                        </div>
                        
                        <div className="pt-4">
                          <button
                            onClick={() => handleBreakdown()}
                            disabled={!topic.trim() || loading}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                              !topic.trim() || loading
                                ? 'bg-indigo-300 dark:bg-indigo-800/50 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
                            }`}
                          >
                            {loading ? (
                              <span className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                              </span>
                            ) : (
                              'Generate Study Guide'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Popular Topics Section */}
                    <div className="border-t border-border-primary bg-bg-tertiary p-6 transition-colors duration-200">
                      <h3 className="text-lg font-medium text-text-primary mb-4 transition-colors duration-200">
                        Popular Topics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularTopics.map((category) => (
                          <div key={category.category} className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden hover:shadow-md transition-all">
                            <div className="p-4">
                              <div className="flex items-center mb-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3">
                                  {React.createElement(category.icon)}
                                </span>
                                <h4 className="font-medium text-text-primary transition-colors duration-200">{category.category}</h4>
                              </div>
                              <ul className="space-y-2">
                                {category.topics.map((topicItem) => (
                                  <li key={topicItem}>
                                    <button
                                      onClick={() => handleSelectTopic(topicItem)}
                                      className="text-sm text-text-secondary hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors flex items-center"
                                    >
                                      <ChevronRight className="w-3 h-3 mr-1" />
                                      {topicItem}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {view === "mainOutline" && renderMainOutline()}
              {view === "subOutline" && renderSubOutline()}
              {view === "finalContent" && renderFinalContent()}
            </AnimatePresence>
          </div>
        </div>
      </DashboardLayout>
      
      {/* Add the URL parameter handler */}
      {urlTopic && (
        <UrlParamHandler
          urlTopic={urlTopic}
          urlSubtopic={urlSubtopic}
          urlSubsubtopic={urlSubsubtopic}
          handleBreakdown={handleBreakdown}
          handleSelectSubtopic={handleSelectSubtopic}
          handleSelectSubSubtopic={handleSelectSubSubtopic}
        />
      )}
    </div>
  );
};

export default NewTopic;