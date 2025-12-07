"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
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
  Sun,
  FileText,
  Download,
  Volume2
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import StoryStoryBanner from '@/app/components/StoryStoryBanner';
import { exportToWord } from '@/app/utils/wordExport';

type ViewState = "input" | "mainOutline" | "subOutline" | "finalContent";

interface TopicData extends Record<string, unknown> {
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

interface SubtopicData extends Record<string, unknown> {
  id?: string;
  topic_id: string;
  title: string;
  content: string;
  created_at?: string;
  last_accessed?: string;
}

interface NoteData extends Record<string, unknown> {
  id?: string;
  subtopic_id: string;
  title: string;
  content: string;
  created_at?: string;
}

interface DiveDeeperData extends Record<string, unknown> {
  id?: string;
  note_id: string;
  question: string;
  content: string;
  created_at?: string;
}

interface QuizData extends Record<string, unknown> {
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

// Wrap the export with Suspense
export default function NewTopicPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      <span className="ml-2 text-text-primary">Loading...</span>
    </div>}>
      <NewTopic />
    </Suspense>
  );
}

function NewTopic() {
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
  const [mainOutlineStreamingDone, setMainOutlineStreamingDone] = useState<boolean>(false);
  const [subOutlineStreamingDone, setSubOutlineStreamingDone] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [reloadCallback, setReloadCallback] = useState<(() => void) | null>(null);
  
  // New state variables for export, listen, quiz, and dive deeper functionality
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [isGeneratingDiveDeeper, setIsGeneratingDiveDeeper] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isQuizzing, setIsQuizzing] = useState<boolean>(false);
  const [isDivingDeeper, setIsDivingDeeper] = useState<boolean>(false);
  const [diveDeeper, setDiveDeeper] = useState<string>("");
  const [quizContent, setQuizContent] = useState<string>("");
  const [followUpQuestion, setFollowUpQuestion] = useState<string>("");
  const [notesView, setNotesView] = useState<"notes" | "quiz" | "diveDeeper">("notes");
  const [generatingContent, setGeneratingContent] = useState<boolean>(false);
  
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
          
          if (existingTopic && existingTopic.id) {
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
              
              if (existingTopic && existingTopic.id) {
                const existingSubtopic = await getSubtopicByTitle(urlSubtopic, existingTopic.id);
                
                if (existingSubtopic && existingSubtopic.id) {
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
                  
                  if (existingTopic && existingTopic.id) {
                    const existingSubtopic = await getSubtopicByTitle(urlSubtopic, existingTopic.id);
                    
                    if (existingSubtopic && existingSubtopic.id) {
                      // Check for existing note
                      const { data: existingNote } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('subtopic_id', existingSubtopic.id)
                        .eq('title', urlSubsubtopic)
                        .maybeSingle();
                        
                      if (existingNote && typeof existingNote === 'object' && 'id' in existingNote) {
                        console.log('Found existing note:', existingNote);
                        const noteId = (existingNote as any).id;
                        
                        // Load dive deeper content
                        const { data: diveDeeperData } = await supabase
                          .from('dive_deeper')
                          .select('*')
                          .eq('note_id', noteId);
                          
                        if (diveDeeperData && diveDeeperData.length > 0) {
                          const firstDeeper = diveDeeperData[0] as DiveDeeperData;
                          setDiveDeeper(firstDeeper.content as string);
                          setFollowUpQuestion(firstDeeper.question as string);
                        }
                        
                        // Load quiz content
                        const { data: quizData } = await supabase
                          .from('quizzes')
                          .select('*')
                          .eq('note_id', noteId)
                          .maybeSingle();
                          
                        if (quizData && typeof quizData === 'object' && 'content' in quizData) {
                          setQuizContent((quizData as QuizData).content as string);
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
      
      // Add card styling
      item.classList.add('card-style');
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
      
      // Add card styling
      li.classList.add('card-style');
    });
    
    // Enhance section cards
    const sectionCards = tempDiv.querySelectorAll('.section-card');
    sectionCards.forEach(card => {
      card.classList.add('enhanced-section-card');
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
      
      // Add card styling
      li.classList.add('card-style');
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
      
      // Add card styling
      item.classList.add('card-style');
    });
    
    // Find all h3 elements and add the necessary classes and attributes
    const h3Elements = tempDiv.querySelectorAll('h3');
    h3Elements.forEach(h3 => {
      h3.classList.add('suboutline-item');
      h3.setAttribute('role', 'button');
      h3.setAttribute('tabindex', '0');
      
      // Store the original text for easier access
      const itemText = h3.textContent?.trim() || '';
      h3.setAttribute('data-subsubtopic', itemText);
      
      // Add card styling
      h3.classList.add('card-style');
    });
    
    // Enhance section cards
    const sectionCards = tempDiv.querySelectorAll('.section-card');
    sectionCards.forEach(card => {
      card.classList.add('enhanced-section-card');
    });
    
    return tempDiv.innerHTML;
  };

  // Fetch notes content via streaming API
  async function fetchNotesStream(
    subsubtopic: string,
    mainTopic: string,
    parentTopic: string
  ): Promise<string> {
    try {
      setLoading(true);
      
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
      
      // Create a container for the content
      const contentContainer = document.querySelector('.notes-content');
      
      // Set up a loading indicator
      if (contentContainer) {
        contentContainer.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Generating notes...</p></div>';
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        
        // Update the UI with each chunk
        setFinalContent(result);
        
        // Update the content as chunks arrive
        if (contentContainer) {
          contentContainer.innerHTML = result;
        }
      }

      setLoading(false);
      return result;
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
      return '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate notes. Please try again.</p></div>';
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
    setMainOutlineStreamingDone(false);
    setMainOutlineHTML(""); // Clear previous outline if any.
    setView("mainOutline");
    
    try {
      if (mainOutlineCache.current[topicToUse]) {
        setMainOutlineHTML(mainOutlineCache.current[topicToUse]);
        setStreamingDone(true);
        setMainOutlineStreamingDone(true);
        setLoading(false);
      } else {
        const html = await fetchMainOutlineHTMLStream(topicToUse);
        mainOutlineCache.current[topicToUse] = html;
        setMainOutlineHTML(html);
        setStreamingDone(true);
        setMainOutlineStreamingDone(true);
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
      // Check if the notes table exists
      const { error: checkError } = await supabase
        .from('notes')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking notes table:', checkError);
        throw new Error(`Table may not exist: ${checkError?.message || 'Unknown error'}`);
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
      return data?.[0] || null;
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast.error(`Failed to save note: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function saveDiveDeeper(diveDeeperData: DiveDeeperData) {
    try {
      // Check if the dive_deeper table exists
      const { error: checkError } = await supabase
        .from('dive_deeper')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking dive_deeper table:', checkError);
        throw new Error(`Table may not exist: ${checkError?.message || 'Unknown error'}`);
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
      return data?.[0] || null;
    } catch (error: any) {
      console.error('Error saving dive deeper content:', error);
      toast.error(`Failed to save dive deeper content: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function saveQuiz(quizData: QuizData) {
    try {
      // Check if the quizzes table exists
      const { error: checkError } = await supabase
        .from('quizzes')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking quizzes table:', checkError);
        throw new Error(`Table may not exist: ${checkError?.message || 'Unknown error'}`);
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
      return data?.[0] || null;
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast.error(`Failed to save quiz: ${error.message || 'Unknown error'}`);
      return null;
    }
  }

  async function getTopicByTitle(title: string): Promise<TopicData | null> {
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
        const sortedMatches = [...allMatches].sort((a: any, b: any) => {
          return new Date(b.last_accessed || b.created_at).getTime() - 
                 new Date(a.last_accessed || a.created_at).getTime();
        });
        
        return sortedMatches[0] as TopicData;
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
      return data as TopicData;
    } catch (error: any) {
      // Handle unexpected errors
      console.error('Unexpected error getting topic:', error?.message || 'Unknown error');
      return null;
    }
  }

  async function getSubtopicByTitle(title: string, topicId: string): Promise<SubtopicData | null> {
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
        const sortedMatches = [...allMatches].sort((a: any, b: any) => {
          return new Date(b.last_accessed || b.created_at).getTime() - 
                 new Date(a.last_accessed || a.created_at).getTime();
        });
        
        return sortedMatches[0] as SubtopicData;
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
      return data as SubtopicData;
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
        
        // Add active class to the clicked item with visual feedback
        const allItems = document.querySelectorAll('.outline-content .subtopic-item, .outline-content .outline-item, .outline-content li');
        allItems.forEach(item => {
          item.classList.remove('active');
          item.classList.remove('active-highlight');
        });
        
        // Add active class with animation
        clickedItem.classList.add('active');
        clickedItem.classList.add('active-highlight');
        
        // Add a temporary highlight effect
        const htmlClickedItem = clickedItem as HTMLElement;
        htmlClickedItem.style.transition = 'background-color 0.3s ease';
        const originalBackground = window.getComputedStyle(htmlClickedItem).backgroundColor;
        htmlClickedItem.style.backgroundColor = 'var(--primary-100)';
        
        setTimeout(() => {
          htmlClickedItem.style.backgroundColor = '';
        }, 300);
        
        // Remove the highlight class after animation completes
        setTimeout(() => {
          clickedItem.classList.remove('active-highlight');
        }, 1000);
        
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
    
    // Prevent section titles from being clickable
    const sectionTitle = target.closest('.section-title');
    if (sectionTitle) {
      return; // Exit early if clicking on a section title
    }
    
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
        
        // Add active class to the clicked item with visual feedback
        const allItems = document.querySelectorAll('.suboutline-content .subtopic-item, .suboutline-content .suboutline-item, .suboutline-content li');
        allItems.forEach(item => {
          item.classList.remove('active');
          item.classList.remove('active-highlight');
        });
        
        // Add active class with animation
        clickedItem.classList.add('active');
        clickedItem.classList.add('active-highlight');
        
        // Add a temporary highlight effect
        const htmlClickedItem = clickedItem as HTMLElement;
        htmlClickedItem.style.transition = 'background-color 0.3s ease';
        const originalBackground = window.getComputedStyle(htmlClickedItem).backgroundColor;
        htmlClickedItem.style.backgroundColor = 'var(--primary-100)';
        
        setTimeout(() => {
          htmlClickedItem.style.backgroundColor = '';
        }, 300);
        
        // Remove the highlight class after animation completes
        setTimeout(() => {
          clickedItem.classList.remove('active-highlight');
        }, 1000);
        
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
      
      if (existingAchievements && typeof existingAchievements === 'object' && 'id' in existingAchievements) {
        // Update existing achievements
        await supabase
          .from('achievements')
          .update({
            notes_created: notesCount || 0,
            study_sessions_completed: sessionsCount || 0,
            total_study_time: totalStudyTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', (existingAchievements as any).id);
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
      
      if (existingTopic && existingTopic.id) {
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
        
        topicId = (newTopic as any).id;
      }
      
      // Get or create subtopic
      let subtopicId: string | undefined;
      const existingSubtopic = await getSubtopicByTitle(selectedSubtopic, topicId as string);
      
      if (existingSubtopic && existingSubtopic.id) {
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
        
        subtopicId = (newSubtopic as any).id as string;
      }
      
      // Get or create note
      if (!subtopicId) {
        throw new Error("Subtopic ID is required to save note");
      }
      
      let noteId: string | undefined;
      const { data: existingNote, error: noteQueryError } = await supabase
        .from('notes')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .eq('title', selectedSubSubtopic)
        .maybeSingle();
        
      if (noteQueryError) {
        console.error("Error querying note:", noteQueryError);
      }
      
      if (existingNote && typeof existingNote === 'object' && 'id' in existingNote) {
        noteId = (existingNote as any).id as string;
        
        // Update existing note
        const { error: updateError } = await supabase
          .from('notes')
          .update({ 
            content: noteContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId as string);
          
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
        
        noteId = (newNote as any).id;
      }
      
      // Save dive deeper content if available
      if (diveDeeper && noteId) {
        const { data: existingDiveDeeper, error: diveDeeperQueryError } = await supabase
          .from('dive_deeper')
          .select('*')
          .eq('note_id', noteId)
          .maybeSingle();
          
        if (diveDeeperQueryError) {
          console.error("Error querying dive deeper:", diveDeeperQueryError);
        }
        
        if (existingDiveDeeper && typeof existingDiveDeeper === 'object' && 'id' in existingDiveDeeper) {
          // Update existing dive deeper
          const { error: updateError } = await supabase
            .from('dive_deeper')
            .update({ 
              content: diveDeeper,
              question: followUpQuestion || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', (existingDiveDeeper as any).id);
            
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
      if (quizContent && noteId) {
        const { data: existingQuiz, error: quizQueryError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('note_id', noteId)
          .maybeSingle();
          
        if (quizQueryError) {
          console.error("Error querying quiz:", quizQueryError);
        }
        
        if (existingQuiz && typeof existingQuiz === 'object' && 'id' in existingQuiz) {
          // Update existing quiz
          const { error: updateError } = await supabase
            .from('quizzes')
            .update({ 
              content: quizContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', (existingQuiz as any).id);
            
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
        
      if (studySession && typeof studySession === 'object' && 'id' in studySession && 'created_at' in studySession) {
        // Calculate duration (time since session started)
        const startTime = new Date((studySession as any).created_at).getTime();
        const endTime = new Date().getTime();
        const durationInMinutes = Math.round((endTime - startTime) / 60000);
        
        await supabase
          .from('study_sessions')
          .update({ 
            duration: durationInMinutes,
            completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', (studySession as any).id);
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
      
      // Get the dive deeper container if we're already showing the dive deeper view
      const diveContainer = document.querySelector('.dive-deeper-content');
      
      if (diveContainer) {
        diveContainer.innerHTML = '<div class="flex flex-col items-center justify-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Generating deeper insights...</p></div>';
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        
        // Update the state with each chunk
        setDiveDeeper(result);
        
        // Update the content as chunks arrive if we're showing the dive deeper view
        if (diveContainer) {
          diveContainer.innerHTML = result;
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching deeper insights:', error);
      setIsDivingDeeper(false);
      return '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate deeper insights. Please try again.</p></div>';
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
      
      // Get the quiz container if we're already showing the quiz view
      const quizContainer = document.querySelector('.quiz-container');
      
      if (quizContainer) {
        quizContainer.innerHTML = '<div class="flex flex-col items-center justify-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Generating quiz questions...</p></div>';
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        
        // Update the state with each chunk
        setQuizContent(result);
        
        // Update the content as chunks arrive if we're showing the quiz
        if (quizContainer) {
          quizContainer.innerHTML = result;
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setIsQuizzing(false);
      return '<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate quiz. Please try again.</p></div>';
    }
  }

  // Generate a quiz based on the notes
  async function handleGenerateQuiz() {
    if (isQuizzing) return;
    
    setIsGeneratingQuiz(true);
    setIsQuizzing(true);
    setNotesView("quiz");
    
    try {
      toast.loading('Generating quiz...', { id: 'generating-quiz' });
      
      // Clear existing quiz content before starting new generation
      setQuizContent('<div class="flex flex-col items-center justify-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Generating quiz questions...</p></div>');
      
      const quiz = await fetchQuizStream(
        topic,
        selectedSubtopic,
        selectedSubSubtopic
      );
      
      setQuizContent(quiz);
      toast.success('Quiz generated!', { id: 'generating-quiz' });
      
      // Initialize quiz interactivity after content is loaded
      setTimeout(() => {
        initializeQuizInteractivity();
      }, 500);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz', { id: 'generating-quiz' });
      setQuizContent('<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate quiz. Please try again.</p></div>');
    } finally {
      setIsGeneratingQuiz(false);
      setIsQuizzing(false);
    }
  }
  
  // Initialize quiz interactivity
  function initializeQuizInteractivity() {
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) return;
    
    // Add click event listeners to options
    const options = quizContainer.querySelectorAll('.option');
    options.forEach(option => {
      option.addEventListener('click', function(this: HTMLElement) {
        const questionEl = this.closest('.question') as HTMLElement;
        if (!questionEl) return;
        
        const optionsInQuestion = questionEl.querySelectorAll('.option');
        
        // Remove selected class from all options in this question
        optionsInQuestion.forEach((opt: Element) => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        this.classList.add('selected');
      });
    });

    // Add event listener for quiz submission
    document.addEventListener('submit-quiz', () => {
      updateQuizScore();
    });
  }

  const updateQuizScore = async () => {
    // Get all questions and selected options
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) return;
    
    const questions = quizContainer.querySelectorAll('.question');
    let correctAnswers = 0;
    const totalQuestions = questions.length;
    
    // Check each question
    questions.forEach(question => {
      const selectedOption = question.querySelector('.option.selected');
      const correctOption = question.querySelector('.option[data-correct="true"]');
      
      // Mark correct and incorrect answers
      if (selectedOption) {
        if (selectedOption.getAttribute('data-correct') === 'true') {
          selectedOption.classList.add('correct');
          correctAnswers++;
        } else {
          selectedOption.classList.add('incorrect');
        }
      }
      
      // Show the correct answer if not selected
      if (correctOption && correctOption !== selectedOption) {
        correctOption.classList.add('correct');
      }
    });
    
    // Calculate score
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Show the result
    const resultDiv = quizContainer.querySelector('.quiz-result') as HTMLElement;
    const scoreDiv = quizContainer.querySelector('.quiz-score');
    const feedbackDiv = quizContainer.querySelector('.quiz-feedback');
    
    if (resultDiv && scoreDiv && feedbackDiv) {
      // Update score text
      scoreDiv.textContent = `${correctAnswers}/${totalQuestions} (${score}%)`;
      
      // Add appropriate class based on score
      resultDiv.classList.remove('good', 'average', 'poor');
      let feedbackText = '';
      
      if (score >= 80) {
        resultDiv.classList.add('good');
        feedbackText = 'Excellent work! You have a strong understanding of this topic.';
      } else if (score >= 50) {
        resultDiv.classList.add('average');
        feedbackText = 'Good effort! Consider reviewing the material to strengthen your knowledge.';
      } else {
        resultDiv.classList.add('poor');
        feedbackText = 'You might need more study time with this topic. Try reviewing the notes again.';
      }
      
      feedbackDiv.textContent = feedbackText;
      resultDiv.style.display = 'block';
      
      // Disable the submit button
      const submitButton = quizContainer.querySelector('.submit-quiz') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = '0.5';
        submitButton.style.cursor = 'not-allowed';
      }
    }
    
    // Save quiz score to database if user is logged in and topic is saved
    const topicData = await getTopicByTitle(topic);
    if (user && topicData && typeof topicData.id === 'string' && typeof topicData.progress === 'number') {
      try {
        // Update topic progress based on quiz score
        const progressIncrease = Math.round(score / 20); // 0-5 points based on score
        await updateTopicProgress(
          topicData.id, 
          Math.min(topicData.progress + progressIncrease, 100), 
          5
        );
      } catch (error) {
        console.error('Error saving quiz score:', error);
      }
    }
  };

  // Generate dive deeper content
  async function handleDiveDeeper() {
    if (!followUpQuestion.trim() || isDivingDeeper) return;
    
    setIsGeneratingDiveDeeper(true);
    setIsDivingDeeper(true);
    setNotesView("diveDeeper");
    
    try {
      toast.loading('Generating deeper insights...', { id: 'generating-dive-deeper' });
      
      // Clear existing dive deeper content before starting new generation
      setDiveDeeper('<div class="flex flex-col items-center justify-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Generating deeper insights...</p></div>');
      
      const diveDeeper = await fetchDiveDeeperStream(
        followUpQuestion,
        topic,
        selectedSubtopic,
        selectedSubSubtopic
      );
      
      setDiveDeeper(diveDeeper);
      toast.success('Deeper insights generated!', { id: 'generating-dive-deeper' });
    } catch (error) {
      console.error('Error generating dive deeper content:', error);
      toast.error('Failed to generate deeper insights', { id: 'generating-dive-deeper' });
      setDiveDeeper('<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"><p>Failed to generate deeper insights. Please try again.</p></div>');
    } finally {
      setIsGeneratingDiveDeeper(false);
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

  // Text-to-speech functionality
  const listenToNotes = () => {
    if (!finalContent) return;
    
    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      toast.success('Stopped reading notes');
    } else {
      // Start speaking
      // Extract text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalContent;
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

  const renderFinalContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => {
              setView('input');
              setTopic('');
              setMainOutlineHTML('');
            }}
            className="text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to New Topic
          </button>
          <button
            onClick={handleBackToMainOutline}
            className="text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Main Outline
          </button>
          <button
            onClick={handleBackToSubOutline}
            className="text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Sub-outline
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xl font-bold text-gray-900">
              {selectedSubSubtopic}
            </h4>
            <p className="text-indigo-600 text-sm font-medium mt-1">
              {selectedSubtopic}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="flex items-center text-indigo-600">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Generating notes...</span>
              </div>
            )}
            {!loading && finalContent && notesView === "notes" && (
              <>
                <button
                  onClick={exportToWord}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                  title="Download as Word document"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Word</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                  title="Download as PDF"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={listenToNotes}
                  className={`flex items-center px-3 py-1.5 text-sm ${
                    isSpeaking 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  } rounded-md transition-colors`}
                  title={isSpeaking ? "Stop reading" : "Listen to notes"}
                >
                  <Volume2 className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">{isSpeaking ? "Stop" : "Listen"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {notesView === "notes" && (
        <>
          <div 
            className="prose max-w-none notes-content"
            dangerouslySetInnerHTML={{ __html: typeof finalContent === 'string' ? finalContent : 'Loading notes...' }}
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
          </div>
          
          {/* Bottom Navigation */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setNotesView("notes")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Notes
              </button>
              <button
                onClick={() => {
                  setView('input');
                  setTopic('');
                  setMainOutlineHTML('');
                }}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to New Topic
              </button>
              <button
                onClick={handleBackToMainOutline}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Main Outline
              </button>
              <button
                onClick={handleBackToSubOutline}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Sub-outline
              </button>
            </div>
          </div>
        </>
      )}

      {notesView === "quiz" && (
        <div className="quiz-view">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-gray-900">Quiz: {selectedSubSubtopic}</h4>
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
          
          {/* Quiz Content */}
          <div 
            className="quiz-container prose max-w-none"
            dangerouslySetInnerHTML={{ __html: quizContent || '<div class="flex flex-col items-center justify-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Generating quiz questions...</p></div>' }}
          />
          
          {/* Bottom Navigation for Quiz View */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setNotesView("notes")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Notes
              </button>
              <button
                onClick={() => {
                  setView('input');
                  setTopic('');
                  setMainOutlineHTML('');
                }}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to New Topic
              </button>
              <button
                onClick={handleBackToMainOutline}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Main Outline
              </button>
              <button
                onClick={handleBackToSubOutline}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Sub-outline
              </button>
            </div>
          </div>
        </div>
      )}

      {notesView === "diveDeeper" && (
        <div className="dive-deeper-view">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-gray-900">Deeper Insights: {followUpQuestion}</h4>
            <button
              onClick={() => setNotesView("notes")}
              className="text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to notes
            </button>
          </div>
          
          {/* Dive Deeper Content */}
          <div 
            className="dive-deeper-content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: diveDeeper || '<div class="flex flex-col items-center justify-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Generating deeper insights...</p></div>' }}
          />
          
          {/* Bottom Navigation for Dive Deeper View */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setNotesView("notes")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Notes
              </button>
              <button
                onClick={() => {
                  setView('input');
                  setTopic('');
                  setMainOutlineHTML('');
                }}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to New Topic
              </button>
              <button
                onClick={handleBackToMainOutline}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Main Outline
              </button>
              <button
                onClick={handleBackToSubOutline}
                className="text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Sub-outline
              </button>
            </div>
          </div>
        </div>
      )}
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
      <nav className="mb-4 overflow-x-auto py-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700" aria-label="Breadcrumb">
        <ol className="flex flex-nowrap items-center space-x-1">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.name} className="flex items-center whitespace-nowrap">
              {index > 0 && (
                <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-600 dark:text-gray-300 mx-1" aria-hidden="true" />
              )}
              {breadcrumb.onClick ? (
                <button
                  onClick={breadcrumb.onClick}
                  className={`text-sm font-medium px-2.5 py-1.5 rounded-md transition-colors flex items-center ${
                    breadcrumb.current
                      ? 'text-white bg-indigo-600 dark:bg-indigo-500 font-semibold shadow-sm'
                      : 'text-gray-800 dark:text-gray-100 hover:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600 bg-gray-100 dark:bg-gray-700'
                  } ${index === breadcrumbs.length - 1 ? 'max-w-[150px] sm:max-w-xs truncate' : ''}`}
                  title={breadcrumb.name}
                >
                  {index === 0 && <Home className="inline-block w-3.5 h-3.5 mr-1.5" aria-hidden="true" />}
                  <span className="truncate">{breadcrumb.name}</span>
                </button>
              ) : (
                <a
                  href={breadcrumb.href}
                  className={`text-sm font-medium px-2.5 py-1.5 rounded-md transition-colors flex items-center ${
                    breadcrumb.current
                      ? 'text-white bg-indigo-600 dark:bg-indigo-500 font-semibold shadow-sm'
                      : 'text-gray-800 dark:text-gray-100 hover:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600 bg-gray-100 dark:bg-gray-700'
                  } ${index === breadcrumbs.length - 1 ? 'max-w-[150px] sm:max-w-xs truncate' : ''}`}
                  title={breadcrumb.name}
                >
                  {index === 0 && <Home className="inline-block w-3.5 h-3.5 mr-1.5" aria-hidden="true" />}
                  <span className="truncate">{breadcrumb.name}</span>
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
      <div className="mb-6">
        <button
          onClick={() => {
            setView('input');
            setTopic('');
            setMainOutlineHTML('');
          }}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to New Topic
        </button>
        <div className="flex justify-between items-center mt-3">
          <h2 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {topic}
            </span>
          </h2>
          {loading && (
            <div className="flex items-center text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
        </div>
      </div>
      
      {!loading && mainOutlineStreamingDone && (
        <>
          <div className="mb-6 p-4 bg-indigo-600 dark:bg-indigo-700 rounded-lg flex items-start shadow-md">
            <Info className="w-6 h-6 text-white mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-white font-medium">
              Click on any topic below to generate a detailed sub-outline for that specific area.
            </p>
          </div>
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-2xl font-bold text-text-primary flex items-center transition-colors duration-200 mb-4 sm:mb-0">
              <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
              Main Outline
            </h2>
            <div className="flex items-center gap-2">
              {mainOutlineHTML && (
                <button
                  onClick={() => (exportToWord as unknown as (content: string, filename: string) => Promise<void>)(mainOutlineHTML, `${topic || 'topic'}-main-outline`)}
                  className="flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
                  title="Export to Word"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Word
                </button>
              )}
            </div>
          </div>
        </>
      )}
      
      <div 
        className="outline-content text-text-primary transition-colors duration-200"
        dangerouslySetInnerHTML={{ __html: mainOutlineHTML }}
        onClick={handleMainOutlineClick}
      />
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
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => {
              setView('input');
              setTopic('');
              setMainOutlineHTML('');
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to New Topic
          </button>
          <button
            onClick={handleBackToMainOutline}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Main Outline
          </button>
        </div>
        <div className="flex justify-between items-center">
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
          <div className="flex items-center gap-2">
            {subOutlineHTML && (
              <button
                onClick={() => (exportToWord as unknown as (content: string, filename: string) => Promise<void>)(subOutlineHTML, `${selectedSubtopic || 'subtopic'}-sub-outline`)}
                className="flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
                title="Export to Word"
              >
                <FileText className="w-4 h-4 mr-1" />
                Word
              </button>
            )}
            {generatingContent && (
              <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Generating...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {!loading && subOutlineStreamingDone && (
        <>
          <div className="mb-6 p-4 bg-indigo-600 dark:bg-indigo-700 rounded-lg flex items-start shadow-md">
            <Info className="w-6 h-6 text-white mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-white font-medium">
              Click on any subtopic below to generate detailed study notes for that specific area.
            </p>
          </div>
          <div className="mb-4">
            <button
              onClick={() => (exportToWord as unknown as (content: string, filename: string) => Promise<void>)(subOutlineHTML || '', `${selectedSubtopic || 'subtopic'}-sub-outline`)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sub-outline
            </button>
          </div>
        </>
      )}
      
      <div 
        className="suboutline-content text-text-primary transition-colors duration-200"
        dangerouslySetInnerHTML={{ __html: subOutlineHTML }}
        onClick={handleSubOutlineClick}
      />
      
      {!loading && subOutlineStreamingDone && (
        <div className="mt-6 pt-4 border-t border-border-primary flex flex-wrap gap-2">
          <button
            onClick={() => {
              setView('input');
              setTopic('');
              setMainOutlineHTML('');
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to New Topic
          </button>
          <button
            onClick={handleBackToMainOutline}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Main Outline
          </button>
        </div>
      )}
    </motion.div>
  );

  // Export notes to Word
  const exportToWord = () => {
    if (!finalContent) return;
    
    const fileName = `${selectedSubSubtopic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.doc`;
    
    // Create a blob with the content
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${selectedSubSubtopic} Notes</title>
      </head>
      <body>
        <h1>${selectedSubSubtopic}</h1>
        <p><em>From: ${selectedSubtopic}</em></p>
        ${finalContent}
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
    if (!finalContent) return;
    
    // Create a new window for the PDF
    const pdfWindow = window.open('', '_blank');
    
    if (!pdfWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }
    
    // Set the PDF content
    pdfWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${selectedSubSubtopic} Notes</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
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
          .question {
            background-color: #e0e7ff;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            font-weight: 500;
          }
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #4f46e5;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .content {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          .question-form {
            margin-top: 30px;
            display: flex;
            gap: 10px;
          }
          .question-input {
            flex: 1;
            padding: 10px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
          }
          .question-button {
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .question-button:hover {
            background-color: #4338ca;
          }
        </style>
      </head>
      <body>
        <h1>${selectedSubSubtopic}</h1>
        <div class="subtitle">From: ${selectedSubtopic}</div>
        
        <div class="question">
          Question: ${followUpQuestion}
        </div>
        
        <div class="loading">
          <div class="spinner"></div>
          <p>Generating notes...</p>
        </div>
        
        <div class="content">
          ${finalContent}
        </div>
        
        <div class="question-form">
          <input type="text" class="question-input" placeholder="Ask another follow-up question...">
          <button class="question-button">Ask</button>
        </div>
        
        <script>
          // Add interactivity to the question form
          document.querySelector('.question-button').addEventListener('click', function() {
            const question = document.querySelector('.question-input').value;
            if (question.trim()) {
              alert('Your question: ' + question + ' would be sent to the server in a real implementation.');
              document.querySelector('.question-input').value = '';
            } else {
              alert('Please enter a question first');
            }
          });
        </script>
      </body>
      </html>
    `);
    
    // Generate the PDF
    pdfWindow.print();
  };

  return (
    <>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                {/* StoryStory Promotion Banner */}
                <StoryStoryBanner />
              </motion.div>
            )}
            {view === "mainOutline" && renderMainOutline()}
            {view === "subOutline" && renderSubOutline()}
            {view === "finalContent" && renderFinalContent()}
          </AnimatePresence>
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
    </>
  );
}