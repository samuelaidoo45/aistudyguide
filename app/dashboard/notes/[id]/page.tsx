'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DashboardLayout from '@/app/components/DashboardLayout'
import { Loader2, ChevronLeft, BookOpen, Clock, ArrowRight, MessageSquare, HelpCircle } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

interface Note {
  id: string
  subtopic_id: string
  title: string
  content: string
  created_at: string
  updated_at?: string
}

interface Subtopic {
  id: string
  topic_id: string
  title: string
  content: string
  created_at: string
  last_accessed?: string
  topic?: {
    id: string
    title: string
    user_id: string
  }
}

interface DiveDeeper {
  id: string
  note_id: string
  question: string
  content: string
  created_at: string
}

interface Quiz {
  id: string
  note_id: string
  content: string
  created_at: string
  last_score: number
}

export default function NoteDetail() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string
  const [note, setNote] = useState<Note | null>(null)
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null)
  const [diveDeeper, setDiveDeeper] = useState<DiveDeeper[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [diveDeeperQuestion, setDiveDeeperQuestion] = useState('')
  const [generatingDiveDeeper, setGeneratingDiveDeeper] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const supabase = createClientComponentClient()

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      if (session) {
        console.log('Session found:', session.user.id)
        setUser(session.user)
      } else {
        console.log('No session found in auth state change')
        setUser(null)
      }
    })

    // Initial auth check
    const checkAuth = async () => {
      try {
        setLoading(true)
        
        // Get session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Initial session found:', session.user.id)
          setUser(session.user)
        } else {
          console.log('No initial session found')
          toast.error('Please sign in to view notes')
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        toast.error('Authentication error')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // Fetch note data when user is authenticated
  useEffect(() => {
    if (user && noteId) {
      fetchNoteData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, noteId])

  const fetchNoteData = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching note with ID:', noteId)
      
      // Fetch the note with its subtopic and topic
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select(`
          *,
          subtopic:subtopics(
            *,
            topic:topics(*)
          )
        `)
        .eq('id', noteId)
        .single()
      
      if (noteError) {
        console.error('Error fetching note:', noteError)
        toast.error('Failed to load note details')
        setLoading(false)
        return
      }
      
      if (!noteData) {
        console.error('Note not found with ID:', noteId)
        toast.error('Note not found')
        setLoading(false)
        return
      }
      
      console.log('Note data retrieved:', noteData)
      
      // Check if the note belongs to the user
      const subtopicData = noteData.subtopic[0]
      const topicData = subtopicData?.topic[0]
      
      if (!topicData || topicData.user_id !== user.id) {
        console.log('Note does not belong to current user')
        toast.error('You do not have access to this note')
        setLoading(false)
        router.push('/dashboard')
        return
      }
      
      setNote(noteData)
      setSubtopic(subtopicData)
      
      // Fetch dive deeper questions
      const { data: diveDeeperData } = await supabase
        .from('dive_deeper')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false })
      
      setDiveDeeper(diveDeeperData || [])
      
      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false })
      
      setQuizzes(quizzesData || [])
      
      // Update last_accessed for the subtopic
      await supabase
        .from('subtopics')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', subtopicData.id)
      
      setLoading(false)
    } catch (error) {
      console.error('Error in fetchNoteData:', error)
      setLoading(false)
      toast.error('Error loading note data')
    }
  }

  const handleDiveDeeperSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!diveDeeperQuestion.trim()) {
      toast.error('Please enter a question')
      return
    }
    
    try {
      setGeneratingDiveDeeper(true)
      
      // First create a placeholder entry
      const { data: newDiveDeeper, error } = await supabase
        .from('dive_deeper')
        .insert([{
          note_id: noteId,
          question: diveDeeperQuestion,
          content: '<p>Generating answer...</p>',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating dive deeper:', error)
        toast.error('Failed to create dive deeper question')
        setGeneratingDiveDeeper(false)
        return
      }
      
      // Add to state
      setDiveDeeper([newDiveDeeper, ...diveDeeper])
      
      // TODO: Call API to generate content
      // This would typically call an API endpoint
      
      toast.success('Dive deeper question created')
      setDiveDeeperQuestion('')
      setGeneratingDiveDeeper(false)
    } catch (error) {
      console.error('Error in handleDiveDeeperSubmit:', error)
      toast.error('Failed to process dive deeper question')
      setGeneratingDiveDeeper(false)
    }
  }

  const handleGenerateQuiz = async () => {
    try {
      setGeneratingQuiz(true)
      
      // First create a placeholder entry
      const { data: newQuiz, error } = await supabase
        .from('quizzes')
        .insert([{
          note_id: noteId,
          content: '<p>Generating quiz...</p>',
          created_at: new Date().toISOString(),
          last_score: 0
        }])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating quiz:', error)
        toast.error('Failed to create quiz')
        setGeneratingQuiz(false)
        return
      }
      
      // Add to state
      setQuizzes([newQuiz, ...quizzes])
      
      // TODO: Call API to generate quiz
      // This would typically call an API endpoint
      
      toast.success('Quiz created')
      setGeneratingQuiz(false)
    } catch (error) {
      console.error('Error in handleGenerateQuiz:', error)
      toast.error('Failed to generate quiz')
      setGeneratingQuiz(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!note || !subtopic) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Note not found</h3>
              <p className="mt-2 text-sm text-gray-500">
                The note you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link 
                href="/dashboard" 
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Toaster />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <Link 
              href={`/dashboard/topics/${subtopic.topic_id}`}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Topic
            </Link>
          </div>
          
          {/* Add styling for the content */}
          <style jsx global>{`
            .note-content {
              font-size: 1.1rem;
              line-height: 1.6;
            }
            
            .note-content ul {
              padding-left: 1.5rem;
              margin-bottom: 1rem;
            }
            
            .note-content li {
              margin-bottom: 0.5rem;
              padding: 0.25rem 0;
            }
            
            .note-content h1, 
            .note-content h2, 
            .note-content h3, 
            .note-content h4 {
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              font-weight: 600;
              color: #4f46e5;
            }
            
            .note-content h1 {
              font-size: 1.5rem;
            }
            
            .note-content h2 {
              font-size: 1.25rem;
            }
            
            .note-content h3 {
              font-size: 1.125rem;
            }
            
            .note-content p {
              margin-bottom: 1rem;
            }
            
            .note-content strong {
              font-weight: 600;
              color: #111827;
            }
          `}</style>
          
          {/* Note Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{note.title}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtopic.title}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="prose max-w-none note-content" dangerouslySetInnerHTML={{ __html: note.content }} />
            </div>
          </motion.div>
          
          {/* Dive Deeper Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <HelpCircle className="h-5 w-5 text-indigo-500 mr-2" />
                Dive Deeper
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Ask questions to explore this topic in more depth
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <form onSubmit={handleDiveDeeperSubmit} className="mb-6">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={diveDeeperQuestion}
                    onChange={(e) => setDiveDeeperQuestion(e.target.value)}
                    placeholder="Ask a question about this topic..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={generatingDiveDeeper}
                  />
                  <button
                    type="submit"
                    disabled={generatingDiveDeeper || !diveDeeperQuestion.trim()}
                    className={`px-4 py-2 rounded-r-md text-white ${
                      generatingDiveDeeper || !diveDeeperQuestion.trim()
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {generatingDiveDeeper ? (
                      <span className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Ask'
                    )}
                  </button>
                </div>
              </form>
              
              {diveDeeper.length > 0 ? (
                <div className="space-y-6">
                  {diveDeeper.map((dd) => (
                    <div key={dd.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{dd.question}</h4>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: dd.content }} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No questions asked yet. Ask something to dive deeper!</p>
              )}
            </div>
          </motion.div>
          
          {/* Quiz Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
                  Quizzes
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Test your knowledge with quizzes
                </p>
              </div>
              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
                className={`px-4 py-2 rounded-md text-white ${
                  generatingQuiz
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {generatingQuiz ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  'Generate Quiz'
                )}
              </button>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {quizzes.length > 0 ? (
                <div className="space-y-6">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Quiz</h4>
                        <div className="text-sm text-gray-500">
                          Last Score: <span className="font-medium">{quiz.last_score}%</span>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: quiz.content }} />
                      <div className="mt-4">
                        <Link
                          href={`/dashboard/quizzes/${quiz.id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Take Quiz
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No quizzes available yet. Generate one to test your knowledge!</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
} 