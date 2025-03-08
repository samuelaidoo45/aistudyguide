"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import DashboardLayout from '@/app/components/DashboardLayout'

// Topic interface that handles both title and name fields
interface Topic {
  id: string
  title?: string
  name?: string
  category?: string
  created_at: string
  last_accessed?: string
  progress?: number
  user_id: string
}

export default function TopicsList() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          await fetchTopics(user.id)
        }
      } catch (error) {
        console.error("Error:", error)
        toast.error("An error occurred while loading topics")
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])
  
  const fetchTopics = async (userId: string) => {
    try {
      console.log('Fetching topics for user:', userId)
      
      // Fetch topics for this user
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false })
      
      if (topicsError) {
        console.error("Error fetching topics:", topicsError)
        toast.error("Failed to load topics")
        return
      }
      
      // Log the results for debugging
      console.log('Topics loaded:', {
        count: topicsData?.length || 0,
        firstTopic: topicsData && topicsData.length > 0 ? {
          id: topicsData[0].id,
          title: topicsData[0].title || topicsData[0].name
        } : null
      })
      
      setTopics(topicsData || [])
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An error occurred while loading topics")
    }
  }
  
  // Function to handle clicking on a topic
  const handleTopicClick = async (topicId: string) => {
    try {
      if (!user) {
        toast.error('Please sign in to view topics')
        router.push('/auth/login')
        return
      }

      // Update the last_accessed timestamp
      const { error } = await supabase
        .from('topics')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', topicId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating last_accessed:', error)
      }

      // Navigate to the topic detail page
      window.location.href = `/dashboard/topics/${topicId}`
    } catch (error) {
      console.error('Error handling topic click:', error)
      toast.error('An error occurred')
    }
  }
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <Toaster position="top-center" />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary transition-colors duration-200">My Topics</h1>
          <Link
            href="/dashboard/new-topic"
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
          >
            Create New Topic
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400 transition-colors duration-200"></div>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 bg-bg-secondary rounded-lg shadow border border-border-primary transition-colors duration-200">
            <h2 className="text-xl font-medium text-text-primary mb-4 transition-colors duration-200">No Topics Yet</h2>
            <p className="text-text-tertiary mb-6 transition-colors duration-200">Get started by creating your first study topic.</p>
            <Link
              href="/dashboard/new-topic"
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
            >
              Create Your First Topic
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map(topic => (
              <div 
                key={topic.id} 
                className="bg-bg-secondary p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-all border border-border-primary dark:hover:border-indigo-800/30"
                onClick={() => handleTopicClick(topic.id)}
              >
                <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2 transition-colors duration-200">
                  {topic.title || topic.name || 'Untitled Topic'}
                </h2>
                
                <div className="text-sm text-text-tertiary mt-2 space-y-1 transition-colors duration-200">
                  <p>Created: {formatDate(topic.created_at)}</p>
                  <p>Last studied: {formatDate(topic.last_accessed)}</p>
                  {topic.category && <p>Category: {topic.category}</p>}
                </div>
                
                {typeof topic.progress === 'number' && (
                  <div className="mt-4">
                    <div className="flex items-center">
                      <span className="text-sm text-text-secondary mr-2 transition-colors duration-200">Progress:</span>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 transition-colors duration-200">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-colors duration-200" 
                          style={{ width: `${topic.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-text-secondary ml-2 transition-colors duration-200">{topic.progress}%</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button 
                    className="text-indigo-600 dark:text-indigo-400 text-sm hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent onClick
                      handleTopicClick(topic.id);
                    }}
                  >
                    Continue Studying →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 