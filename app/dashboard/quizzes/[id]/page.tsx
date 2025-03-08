'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DashboardLayout from '@/app/components/DashboardLayout'
import { Loader2, ChevronLeft } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

interface Quiz {
  id: string
  note_id: string
  content: string
  created_at: string
  last_score: number
}

interface Note {
  id: string
  subtopic_id: string
  title: string
  content: string
  created_at: string
  subtopic?: {
    id: string
    topic_id: string
    title: string
  }
}

export default function QuizDetail() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
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
          toast.error('Please sign in to view quizzes')
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

  // Fetch quiz data when user is authenticated
  useEffect(() => {
    if (user && quizId) {
      fetchQuizData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, quizId])

  const fetchQuizData = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching quiz with ID:', quizId)
      
      // Fetch the quiz with its note and subtopic
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          note:notes(
            *,
            subtopic:subtopics(*)
          )
        `)
        .eq('id', quizId)
        .single()
      
      if (quizError) {
        console.error('Error fetching quiz:', quizError)
        toast.error('Failed to load quiz details')
        setLoading(false)
        return
      }
      
      if (!quizData) {
        console.error('Quiz not found with ID:', quizId)
        toast.error('Quiz not found')
        setLoading(false)
        return
      }
      
      console.log('Quiz data retrieved:', quizData)
      
      setQuiz(quizData)
      setNote(quizData.note[0])
      setLoading(false)
    } catch (error) {
      console.error('Error in fetchQuizData:', error)
      setLoading(false)
      toast.error('Error loading quiz data')
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

  if (!quiz || !note) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Quiz not found</h3>
              <p className="mt-2 text-sm text-gray-500">
                The quiz you're looking for doesn't exist or you don't have access to it.
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
              href={`/dashboard/notes/${note.id}`}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Notes
            </Link>
          </div>
          
          {/* Quiz Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quiz: {note.title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Test your knowledge on this topic
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: quiz.content }} />
              
              <div className="mt-8 text-center">
                <button
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => toast.success('Quiz completed! Your score has been saved.')}
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
} 