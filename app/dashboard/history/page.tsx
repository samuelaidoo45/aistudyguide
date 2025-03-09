"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase'
import { motion } from 'framer-motion'
import DashboardLayout from '@/app/components/DashboardLayout'
import { BookOpen, Clock, History, BookMarked, ArrowUpRight, Calendar, Plus } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface StudySession {
  id: string
  topic_id: string
  subtopic_id?: string
  note_id?: string
  duration: number
  created_at: string
  topic: {
    title: string
    progress: number
    category: string
    id: string
    subtopics: any[]
  }
  concepts?: string[]
}

interface Topic {
  id: string
  title: string
  progress: number
  category: string
  total_study_time: number
  last_accessed: string
}

export default function StudyHistory() {
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        try {
          // Fetch study sessions
          const { data: sessions, error: sessionsError } = await supabase
            .from('study_sessions')
            .select(`
              *,
              topic:topics(id, title, progress, category)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (sessionsError) {
            throw sessionsError
          }
          
          // Fetch topics
          const { data: topicsData, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .eq('user_id', user.id)
            .order('last_accessed', { ascending: false })
          
          if (topicsError) {
            throw topicsError
          }
          
          // Process and set the data
          const processedSessions = sessions.map((session: any) => ({
            ...session,
            topic: session.topic || { title: 'Unknown Topic', progress: 0, category: 'Uncategorized' }
          }))
          
          setStudySessions(processedSessions)
          setTopics(topicsData || [])
          setLoading(false)
        } catch (error) {
          console.error('Error fetching study data:', error)
          toast.error('Failed to load study history')
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    
    getUser()
  }, [])

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Calculate metrics from the data instead of using state
  const calculateMetrics = () => {
    // Calculate total study time
    const totalStudyTime = studySessions.reduce((total: number, session: any) => total + session.duration, 0);
    
    // Get the last study date
    const lastStudyDate = studySessions.length > 0 ? studySessions[0].created_at : null;
    
    // Calculate average progress
    const averageProgress = topics.length > 0 
      ? Math.round(topics.reduce((total: number, topic: any) => total + topic.progress, 0) / topics.length) 
      : 0;
      
    return { totalStudyTime, lastStudyDate, averageProgress };
  };

  // Get metrics for display
  const { totalStudyTime, lastStudyDate, averageProgress } = calculateMetrics();

  // Function to continue studying from a previous session
  const continueFromSession = async (session: StudySession) => {
    if (!user) {
      toast.error("Please sign in to continue studying");
      return;
    }
    
    try {
      // Get the topic details
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', session.topic_id)
        .single();
        
      if (topicError) {
        console.error("Error fetching topic:", topicError);
        toast.error("Failed to load topic details");
        return;
      }
      
      // Create a new study session
      const { error: sessionError } = await supabase
        .from('study_sessions')
        .insert([{
          user_id: user.id,
          topic_id: session.topic_id,
          duration: 0, // Initial duration, will be updated when they finish
          created_at: new Date().toISOString(),
        }]);
        
      if (sessionError) {
        console.error("Error creating study session:", sessionError);
        toast.error("Failed to create study session");
        return;
      }
      
      // Update the last_accessed timestamp for the topic
      await supabase
        .from('topics')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', session.topic_id);
      
      // Check if there's a subtopic associated with this session
      if (session.subtopic_id) {
        // Get the subtopic details
        const { data: subtopic, error: subtopicError } = await supabase
          .from('subtopics')
          .select('*')
          .eq('id', session.subtopic_id)
          .single();
          
        if (subtopicError) {
          console.error("Error fetching subtopic:", subtopicError);
          // Continue anyway, just without the subtopic
          router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topic.title)}`);
          return;
        }
        
        // Update the last_accessed timestamp for the subtopic
        await supabase
          .from('subtopics')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', session.subtopic_id);
        
        // Check if there's a note associated with this session
        if (session.note_id) {
          // Get the note details
          const { data: note, error: noteError } = await supabase
            .from('notes')
            .select('*')
            .eq('id', session.note_id)
            .single();
            
          if (noteError) {
            console.error("Error fetching note:", noteError);
            // Continue anyway, just without the note
            router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topic.title)}&subtopic=${encodeURIComponent(subtopic.title)}`);
            return;
          }
          
          // Navigate to the specific note
          router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topic.title)}&subtopic=${encodeURIComponent(subtopic.title)}&subsubtopic=${encodeURIComponent(note.title)}`);
        } else {
          // Navigate to the subtopic
          router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topic.title)}&subtopic=${encodeURIComponent(subtopic.title)}`);
        }
      } else {
        // Navigate to the topic
        router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topic.title)}`);
      }
      
      toast.success("Continuing your study session");
    } catch (error) {
      console.error("Error continuing session:", error);
      toast.error("Failed to continue study session");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 transition-colors duration-200"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Toaster position="top-center" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.h1 
            className="text-2xl font-semibold text-text-primary transition-colors duration-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Study History
          </motion.h1>
          <p className="mt-1 text-sm text-text-tertiary transition-colors duration-200">
            Track your learning progress over time
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Study Stats */}
            <motion.div 
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary truncate transition-colors duration-200">Total Topics</dt>
                        <dd>
                          <div className="text-lg font-medium text-text-primary transition-colors duration-200">{topics.length}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary truncate transition-colors duration-200">Total Study Time</dt>
                        <dd>
                          <div className="text-lg font-medium text-text-primary transition-colors duration-200">
                            {totalStudyTime} minutes
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary truncate transition-colors duration-200">Last Study Session</dt>
                        <dd>
                          <div className="text-lg font-medium text-text-primary transition-colors duration-200">
                            {lastStudyDate ? formatDate(lastStudyDate) : 'N/A'}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary truncate transition-colors duration-200">Average Progress</dt>
                        <dd>
                          <div className="text-lg font-medium text-text-primary transition-colors duration-200">
                            {averageProgress}%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Study History Table */}
            <motion.div 
              className="mt-8 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border border-border-primary rounded-lg transition-colors duration-200">
                    <table className="min-w-full divide-y divide-border-primary transition-colors duration-200">
                      <thead className="bg-bg-tertiary transition-colors duration-200">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider transition-colors duration-200">
                            Topic
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider transition-colors duration-200">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider transition-colors duration-200">
                            Duration
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider transition-colors duration-200">
                            Progress
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider transition-colors duration-200">
                            Concepts Covered
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">View</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-bg-secondary divide-y divide-border-primary transition-colors duration-200">
                        {studySessions.length > 0 ? (
                          studySessions.map((session) => (
                            <tr key={session.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-text-primary transition-colors duration-200">{session.topic.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-text-tertiary transition-colors duration-200">{formatDate(session.created_at)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-text-tertiary transition-colors duration-200">{session.duration} minutes</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 w-24 transition-colors duration-200">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-colors duration-200" style={{ width: `${session.topic.progress}%` }}></div>
                                  </div>
                                  <span className="text-sm text-text-tertiary transition-colors duration-200">{session.topic.progress}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {session.concepts && session.concepts.length > 0 ? (
                                    session.concepts.map((concept, index) => (
                                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 transition-colors duration-200">
                                        {concept}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-text-tertiary transition-colors duration-200">No concepts recorded</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                  onClick={() => continueFromSession(session)}
                                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center transition-colors duration-200"
                                >
                                  Continue <ArrowUpRight className="ml-1 h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-text-tertiary transition-colors duration-200">
                              No study sessions found. Start learning a topic to track your progress!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Start New Topic Button */}
            {studySessions.length === 0 && (
              <motion.div 
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link
                  href="/dashboard/new-topic"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start New Topic
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 