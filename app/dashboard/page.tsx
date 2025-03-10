"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import DashboardLayout from '@/app/components/DashboardLayout'
import { 
  BookOpen, 
  Clock, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  BookMarked,
  Award,
  Mail,
  ChevronRight,
  LogIn
} from 'lucide-react'
import Link from 'next/link'

interface Topic {
  id: string
  title: string
  progress: number
  last_accessed: string
  total_study_time: number
  category: string
}

interface DashboardStats {
  totalTopics: number
  totalStudyTime: number
  totalAchievements: number
  recentTopics: Topic[]
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalTopics: 0,
    totalStudyTime: 0,
    totalAchievements: 0,
    recentTopics: []
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('Dashboard: Attempting to get user')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Dashboard: User data:', user ? `User ID: ${user.id}` : 'No user found')
        setUser(user)
        if (user) {
          await fetchDashboardData(user.id)
        } else {
          console.log('Dashboard: No user found, showing limited dashboard')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load user data')
      } finally {
        // Stop the loading animation whether the user is found or not
        setLoading(false)
      }
    }
  
    getUser()
  }, [supabase])
  

  const fetchDashboardData = async (userId: string) => {
    try {
      console.log('Fetching dashboard data for user:', userId)
      
      // Fetch topics, achievements, and study sessions in parallel
      const [topicsResult, achievementsResult] = await Promise.all([
        // Get all topics for this user
        supabase
          .from('topics')
          .select('*')
          .eq('user_id', userId)
          .order('last_accessed', { ascending: false }),
          
        // Get earned achievements for this user
        supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('earned', true)
      ])
      
      // Check for errors
      if (topicsResult.error) {
        console.error('Error fetching topics:', topicsResult.error)
        throw topicsResult.error
      }
      
      if (achievementsResult.error) {
        // If achievements table doesn't exist yet, use default values
        if (achievementsResult.error.message.includes('does not exist')) {
          console.log('Achievements table does not exist yet')
        } else {
          console.error('Error fetching achievements:', achievementsResult.error)
          throw achievementsResult.error
        }
      }
      
      const topics: Topic[] = (topicsResult.data as any[]).map(item => ({
        id: item.id,
        title: item.title,
        progress: item.progress,
        last_accessed: item.last_accessed,
        total_study_time: item.total_study_time,
        category: item.category
      })) || []
      const achievements = achievementsResult.data || []
      
      // Calculate total study time
      const totalStudyTime = topics.reduce((acc: number, topic: any) => acc + (topic.total_study_time || 0), 0) || 0
      
      // Log the results for debugging
      console.log('Dashboard data loaded:', {
        topicsCount: topics.length,
        achievementsCount: achievements.length,
        totalStudyTime
      })
      
      // Update state with the fetched data
      setStats({
        totalTopics: topics.length,
        totalStudyTime: totalStudyTime,
        totalAchievements: achievements.length,
        recentTopics: topics.slice(0, 3)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    }
  }

  // Function to verify if a topic exists and belongs to the user
  const verifyTopicExists = async (topicId: string) => {
    try {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('topics')
        .select('id')
        .eq('id', topicId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error verifying topic existence:', error);
        return false;
      }
      
      // Check if we got any results
      return data && data.length > 0;
    } catch (error) {
      console.error('Error verifying topic existence:', error);
      return false;
    }
  };

  // Function to clean up recent topics by removing any that no longer exist
  const cleanupRecentTopics = async () => {
    if (!user || stats.recentTopics.length === 0) return;
    
    const updatedRecentTopics = [];
    let needsRefresh = false;
    
    for (const topic of stats.recentTopics) {
      const exists = await verifyTopicExists(topic.id);
      if (exists) {
        updatedRecentTopics.push(topic);
      } else {
        console.log(`Topic ${topic.id} no longer exists, removing from recent topics`);
        needsRefresh = true;
      }
    }
    
    if (needsRefresh) {
      setStats({
        ...stats,
        recentTopics: updatedRecentTopics
      });
    }
  };

  // Call cleanupRecentTopics when the component mounts and user is loaded
  useEffect(() => {
    if (user && !loading && stats.recentTopics.length > 0) {
      cleanupRecentTopics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, stats.recentTopics.length]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}.${Math.floor((remainingMinutes / 60) * 10)} hours`
  }

  const handleTopicClick = async (topicId: string) => {
    try {
      if (!user) {
        toast.error('Please sign in to view topics');
        router.push('/auth/login');
        return;
      }
      
      // Validate the topic ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(topicId)) {
        console.error('Invalid topic ID format:', topicId);
        toast.error('Invalid topic ID format');
        return;
      }
      
      // First verify the topic belongs to the user
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('id, user_id, title')
        .eq('id', topicId);
        
      // Check if we got any results
      if (topicError) {
        console.error('Error verifying topic ownership:', topicError);
        toast.error('Failed to verify topic access');
        return;
      }
      
      // Check if the topic exists
      if (!topicData || topicData.length === 0) {
        console.error('Topic not found with ID:', topicId);
        toast.error('Topic not found. It may have been deleted.');
        // Refresh the dashboard data to update the recent topics list
        if (user) {
          await fetchDashboardData(user.id);
        }
        return;
      }
      
      // Check if the topic belongs to the user
      const topic = topicData[0];
      if (topic.user_id !== user.id) {
        console.error('Unauthorized access attempt to topic:', topicId);
        toast.error('You do not have access to this topic');
        return;
      }
      
      // Update the last_accessed timestamp
      const { error } = await supabase
        .from('topics')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', topicId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error updating last_accessed:', error);
        toast.error('Failed to update topic access time');
      }
      
      // Create a study session with proper error handling
      try {
        const { error: sessionError } = await supabase
          .from('study_sessions')
          .insert([
            {
              user_id: user.id,
              topic_id: topicId,
              duration: 0, // Will be updated when the session ends
              created_at: new Date().toISOString()
            }
          ]);
          
        if (sessionError) {
          console.error('Error creating study session:', sessionError);
          // Don't show error to user, just log it - we'll still navigate to the topic
        } else {
          console.log('Study session created for topic:', topicId);
        }
      } catch (sessionCreateError) {
        console.error('Exception creating study session:', sessionCreateError);
        // Don't block navigation due to study session creation failure
      }
      
      // Show a loading toast while navigating
      toast.loading(`Loading topic: ${topic.title}...`, { id: 'topic-loading' });
      
      // Navigate to the topic detail page
      // Use window.location.href instead of router.push to ensure a full page reload
      // This ensures the topic detail page will properly fetch the topic data
      window.location.href = `/dashboard/topics/${topicId}`;
    } catch (error) {
      console.error('Error handling topic click:', error);
      toast.error('An error occurred');
      // Don't navigate if there was an error in the verification process
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Render different content for authenticated vs unauthenticated users
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
            {user ? `Welcome back, ${user.email?.split('@')[0] || 'User'}!` : 'Welcome to TopicSimplify!'}
          </motion.h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {user ? (
            // Authenticated user content
            <div className="py-4">
              {/* Dashboard content */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Quick Stats */}
                <motion.div 
                  className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-text-tertiary transition-colors duration-200">Topics Studied</dt>
                          <dd>
                            <div className="text-lg font-medium text-text-primary transition-colors duration-200">{stats.totalTopics}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-bg-tertiary px-5 py-3 transition-colors duration-200">
                    <div className="text-sm">
                      <Link href="/dashboard/topics" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                        View all topics
                      </Link>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-text-tertiary transition-colors duration-200">Study Time</dt>
                          <dd>
                            <div className="text-lg font-medium text-text-primary transition-colors duration-200">
                              {formatStudyTime(stats.totalStudyTime)}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-bg-tertiary px-5 py-3 transition-colors duration-200">
                    <div className="text-sm">
                      <Link href="/dashboard/achievements" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                        View achievements
                      </Link>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-text-tertiary transition-colors duration-200">Achievements</dt>
                          <dd>
                            <div className="text-lg font-medium text-text-primary transition-colors duration-200">
                              {stats.totalAchievements} badges
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-bg-tertiary px-5 py-3 transition-colors duration-200">
                    <div className="text-sm">
                      <Link href="/dashboard/achievements" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                        View achievements
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <motion.div 
                className="mt-8 bg-bg-secondary shadow overflow-hidden sm:rounded-md border border-border-primary transition-colors duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="px-4 py-5 border-b border-border-primary sm:px-6 transition-colors duration-200">
                  <h3 className="text-lg leading-6 font-medium text-text-primary transition-colors duration-200">Recent Topics</h3>
                  <p className="mt-1 text-sm text-text-tertiary transition-colors duration-200">Continue where you left off</p>
                </div>
                <ul className="divide-y divide-border-primary transition-colors duration-200">
                  {stats.recentTopics.length > 0 ? (
                    stats.recentTopics.map((topic) => (
                      <li key={topic.id}>
                        <div 
                          onClick={() => handleTopicClick(topic.id)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleTopicClick(topic.id);
                            }
                          }}
                          className="block hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                          tabIndex={0}
                          role="button"
                          aria-label={`Continue studying ${topic.title}`}
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <BookMarked className="h-5 w-5 text-indigo-500 mr-3 transition-colors duration-200" aria-hidden="true" />
                                <p className="text-sm font-medium text-indigo-600 truncate transition-colors duration-200">{topic.title}</p>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <ChevronRight className="h-5 w-5 text-gray-400 transition-colors duration-200" aria-hidden="true" />
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-text-tertiary transition-colors duration-200">
                                  <History className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 transition-colors duration-200" aria-hidden="true" />
                                  <span>Last accessed on {formatDate(topic.last_accessed)}</span>
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-text-tertiary sm:mt-0 transition-colors duration-200">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 transition-colors duration-200" role="progressbar" aria-valuenow={topic.progress} aria-valuemin={0} aria-valuemax={100}>
                                  <div 
                                    className="bg-indigo-600 h-2.5 rounded-full transition-colors duration-200" 
                                    style={{ width: `${topic.progress}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2">{topic.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-text-tertiary transition-colors duration-200">
                      No topics yet. Start your learning journey by creating a new topic!
                    </li>
                  )}
                </ul>
              </motion.div>

              {/* Start New Topic Button */}
              <motion.div 
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <button
                  onClick={() => router.push('/dashboard/new-topic')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Start New Topic
                </button>
              </motion.div>
            </div>
          ) : (
            // Unauthenticated user content
            <div className="py-4">
              <motion.div
                className="bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-text-primary mb-4">
                    Experience the power of AI-assisted learning
                  </h2>
                  <p className="text-text-tertiary max-w-2xl mx-auto">
                    You're currently using AI Study Guide in guest mode. You can explore and create new topics, 
                    but to save your progress and access all features, please sign in.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="ml-3 text-lg font-medium">Create Topics</h3>
                    </div>
                    <p className="text-gray-600">
                      Break down any subject into structured, easy-to-understand outlines and notes.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <BookMarked className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="ml-3 text-lg font-medium">Generate Notes</h3>
                    </div>
                    <p className="text-gray-600">
                      Get comprehensive notes on any topic with just a few clicks.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="ml-3 text-lg font-medium">Test Knowledge</h3>
                    </div>
                    <p className="text-gray-600">
                      Generate quizzes and dive deeper into topics to reinforce your learning.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    href="/dashboard/new-topic"
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start New Topic
                  </Link>
                  
                  <Link 
                    href="/auth/login"
                    className="inline-flex justify-center items-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In to Save Progress
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 