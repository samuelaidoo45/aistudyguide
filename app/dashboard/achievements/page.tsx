"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase'
import { motion } from 'framer-motion'
import DashboardLayout from '@/app/components/DashboardLayout'
import { Award, Star, Clock, BookOpen, Zap, Target, Trophy, CheckCircle, Calendar } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import React from 'react'

interface Achievement {
  id: number
  title: string
  description: string
  icon: any
  earned: boolean
  earnedDate: string | null
  progress: number
  total: number
  points: number
}

export default function Achievements() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [studyStats, setStudyStats] = useState({
    totalTopics: 0,
    totalStudyTime: 0,
    consecutiveDays: 0,
    completedTopics: 0,
    longestTopicTime: 0
  })
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          await Promise.all([
            fetchStudyStats(user.id),
            fetchAchievements(user.id)
          ])
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])

  const fetchStudyStats = async (userId: string) => {
    try {
      // Fetch total topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, progress, total_study_time')
        .eq('user_id', userId)
      
      if (topicsError) throw topicsError
      
      // Fetch study sessions to calculate study time and consecutive days
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('duration, created_at, topic_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (sessionsError) {
        // If table doesn't exist yet, use default values
        if (sessionsError.message.includes('does not exist')) {
          updateAchievementsWithStats({
            totalTopics: topicsData?.length || 0,
            totalStudyTime: 0,
            consecutiveDays: 0,
            completedTopics: 0,
            longestTopicTime: 0
          })
          return
        }
        throw sessionsError
      }
      
      // Calculate total study time (in hours)
      const totalStudyTime = sessionsData?.reduce((total: number, session: any) => total + (session.duration || 0), 0) / 60 || 0
      
      // Calculate consecutive days (simplified version)
      const consecutiveDays = calculateConsecutiveDays(sessionsData || [])
      
      // Count completed topics (100% progress)
      const completedTopics = topicsData?.filter((topic: { progress: number }) => topic.progress === 100).length || 0
      
      // Find longest topic study time
      const topicTimes = new Map<string, number>()
      sessionsData?.forEach((session: { topic_id: string, duration?: number }) => {
        const topicId = session.topic_id
        const currentTime = topicTimes.get(topicId) || 0
        topicTimes.set(topicId, currentTime + (session.duration || 0))
      })
      
      const longestTopicTime = Math.max(...Array.from(topicTimes.values()), 0) / 60 // Convert to hours
      
      const stats = {
        totalTopics: topicsData?.length || 0,
        totalStudyTime,
        consecutiveDays,
        completedTopics,
        longestTopicTime
      }
      
      setStudyStats(stats)
      updateAchievementsWithStats(stats)
      
    } catch (error) {
      console.error('Error fetching study stats:', error)
      // Use default achievements if there's an error
      createDefaultAchievements()
      setLoading(false)
    }
  }

  const calculateConsecutiveDays = (sessions: any[]) => {
    if (!sessions.length) return 0
    
    // Get unique days
    const uniqueDays = new Set<string>()
    sessions.forEach(session => {
      const date = new Date(session.created_at).toISOString().split('T')[0]
      uniqueDays.add(date)
    })
    
    // Sort dates
    const sortedDates = Array.from(uniqueDays).sort()
    
    // Find longest streak
    let currentStreak = 1
    let maxStreak = 1
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i-1])
      const currDate = new Date(sortedDates[i])
      
      // Check if dates are consecutive
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }
    
    return maxStreak
  }

  const fetchAchievements = async (userId: string) => {
    try {
      // Check if achievements table exists
      const { error: checkError } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
      
      if (checkError) {
        // If table doesn't exist, use default achievements
        createDefaultAchievements()
        return
      }
      
      // Fetch user achievements
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Map database achievements to our format
        const mappedAchievements = data.map((item: { 
          id: string | number, 
          title: string, 
          description: string, 
          icon_name: string, 
          earned: boolean, 
          earned_date: string, 
          progress: number, 
          total: number, 
          points: number 
        }) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: getIconForAchievement(item.icon_name),
          earned: item.earned,
          earnedDate: item.earned_date,
          progress: item.progress,
          total: item.total,
          points: item.points
        }))
        
        setAchievements(mappedAchievements)
      } else {
        // No achievements found, create default ones
        createDefaultAchievements()
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
      // Use default achievements if there's an error
      createDefaultAchievements()
    } finally {
      setLoading(false)
    }
  }

  const getIconForAchievement = (iconName: string) => {
    const icons: Record<string, any> = {
      'BookOpen': BookOpen,
      'Clock': Clock,
      'Calendar': Calendar,
      'Trophy': Trophy,
      'Star': Star,
      'Target': Target,
      'Award': Award,
      'Zap': Zap
    }
    
    return icons[iconName] || Award
  }

  const createDefaultAchievements = () => {
    const defaultAchievements: Achievement[] = [
      { 
        id: 1, 
        title: 'First Steps', 
        description: 'Complete your first study session',
        icon: BookOpen,
        earned: false,
        earnedDate: null,
        progress: 0,
        total: 1,
        points: 10
      },
      { 
        id: 2, 
        title: 'Knowledge Seeker', 
        description: 'Study 5 different topics',
        icon: Target,
        earned: false,
        earnedDate: null,
        progress: 0,
        total: 5,
        points: 50
      },
      { 
        id: 3, 
        title: 'Dedicated Learner', 
        description: 'Accumulate 10 hours of study time',
        icon: Clock,
        earned: false,
        earnedDate: null,
        progress: 0,
        total: 10,
        points: 100
      },
      { 
        id: 4, 
        title: 'Consistency King', 
        description: 'Study for 7 consecutive days',
        icon: Zap,
        earned: false,
        earnedDate: null,
        progress: 0,
        total: 7,
        points: 75
      },
      { 
        id: 5, 
        title: 'Master of Knowledge', 
        description: 'Complete 10 topics with 100% progress',
        icon: Trophy,
        earned: false,
        earnedDate: null,
        progress: 0,
        total: 10,
        points: 200
      },
      { 
        id: 6, 
        title: 'Topic Expert', 
        description: 'Spend at least 5 hours on a single topic',
        icon: Star,
        earned: false,
        earnedDate: null,
        progress: 0,
        total: 5,
        points: 100
      },
    ]
    
    setAchievements(defaultAchievements.map(item => ({
      ...item,
      icon: getIconForAchievement(item.icon)
    })))
  }

  const updateAchievementsWithStats = (stats: typeof studyStats) => {
    // Create base achievements
    createDefaultAchievements()
    
    // Update achievements with actual stats
    setAchievements(prev => prev.map(achievement => {
      let updatedAchievement = { ...achievement }
      
      switch (achievement.id) {
        case 1: // First Steps
          const hasStudySessions = stats.totalStudyTime > 0
          updatedAchievement.progress = hasStudySessions ? 1 : 0
          updatedAchievement.earned = hasStudySessions
          if (hasStudySessions && !updatedAchievement.earnedDate) {
            updatedAchievement.earnedDate = new Date().toISOString()
          }
          break
          
        case 2: // Knowledge Seeker
          updatedAchievement.progress = Math.min(stats.totalTopics, achievement.total)
          updatedAchievement.earned = stats.totalTopics >= achievement.total
          if (updatedAchievement.earned && !updatedAchievement.earnedDate) {
            updatedAchievement.earnedDate = new Date().toISOString()
          }
          break
          
        case 3: // Dedicated Learner
          updatedAchievement.progress = Math.min(stats.totalStudyTime, achievement.total)
          updatedAchievement.earned = stats.totalStudyTime >= achievement.total
          if (updatedAchievement.earned && !updatedAchievement.earnedDate) {
            updatedAchievement.earnedDate = new Date().toISOString()
          }
          break
          
        case 4: // Consistency King
          updatedAchievement.progress = Math.min(stats.consecutiveDays, achievement.total)
          updatedAchievement.earned = stats.consecutiveDays >= achievement.total
          if (updatedAchievement.earned && !updatedAchievement.earnedDate) {
            updatedAchievement.earnedDate = new Date().toISOString()
          }
          break
          
        case 5: // Master of Knowledge
          updatedAchievement.progress = Math.min(stats.completedTopics, achievement.total)
          updatedAchievement.earned = stats.completedTopics >= achievement.total
          if (updatedAchievement.earned && !updatedAchievement.earnedDate) {
            updatedAchievement.earnedDate = new Date().toISOString()
          }
          break
          
        case 6: // Topic Expert
          updatedAchievement.progress = Math.min(stats.longestTopicTime, achievement.total)
          updatedAchievement.earned = stats.longestTopicTime >= achievement.total
          if (updatedAchievement.earned && !updatedAchievement.earnedDate) {
            updatedAchievement.earnedDate = new Date().toISOString()
          }
          break
      }
      
      return updatedAchievement
    }))
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not earned yet'
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const totalPoints = achievements.reduce((total: number, achievement: any) => {
    return total + (achievement.earned ? achievement.points : 0)
  }, 0)

  const earnedAchievements = achievements.filter(a => a.earned).length
  const totalAchievements = achievements.length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
            Achievements
          </motion.h1>
          <p className="mt-1 text-sm text-text-tertiary transition-colors duration-200">
            Track your learning milestones and earn rewards
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Achievement Stats */}
            <motion.div 
              className="bg-bg-secondary overflow-hidden shadow rounded-lg mb-6 border border-border-primary transition-colors duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary transition-colors duration-200">Achievements Earned</dt>
                        <dd className="mt-1 text-3xl font-semibold text-text-primary transition-colors duration-200">{earnedAchievements} / {totalAchievements}</dd>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary transition-colors duration-200">Total Points</dt>
                        <dd className="mt-1 text-3xl font-semibold text-text-primary transition-colors duration-200">{totalPoints}</dd>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 transition-colors duration-200">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-text-tertiary transition-colors duration-200">Current Level</dt>
                        <dd className="mt-1 text-3xl font-semibold text-text-primary transition-colors duration-200">
                          {Math.floor(totalPoints / 100) + 1}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement, index) => (
                <motion.div 
                  key={achievement.id}
                  className={`bg-bg-secondary overflow-hidden shadow rounded-lg border transition-colors duration-200 ${achievement.earned ? 'border-indigo-200' : 'border-border-primary'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                        {React.createElement(achievement.icon, {
                          className: `h-6 w-6 ${achievement.earned ? 'text-white' : 'text-gray-500'}`
                        })}
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-text-primary transition-colors duration-200">{achievement.title}</h3>
                        <div className="mt-1 flex items-center">
                          {achievement.earned && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 transition-colors duration-200">
                              Earned
                            </span>
                          )}
                          <span className="ml-2 text-sm text-text-tertiary transition-colors duration-200">{achievement.points} points</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-text-tertiary transition-colors duration-200">{achievement.description}</p>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-sm text-text-tertiary mb-1 transition-colors duration-200">
                        <span>Progress</span>
                        <span>{achievement.progress} / {achievement.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 transition-colors duration-200">
                        <div 
                          className={`h-2.5 rounded-full transition-colors duration-200 ${achievement.earned ? 'bg-green-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-text-tertiary transition-colors duration-200">
                      {achievement.earned ? (
                        <div className="flex items-center text-green-600 transition-colors duration-200">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Earned on {formatDate(achievement.earnedDate)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400 transition-colors duration-200" />
                          <span>Not yet earned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Level Progress */}
            <motion.div 
              className="mt-8 bg-bg-secondary overflow-hidden shadow rounded-lg border border-border-primary transition-colors duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-text-primary mb-4 transition-colors duration-200">Level Progress</h3>
                
                <div className="flex justify-between items-center text-sm text-text-tertiary mb-2 transition-colors duration-200">
                  <span>Level {Math.floor(totalPoints / 100) + 1}</span>
                  <span>{totalPoints % 100}/100 points to next level</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 transition-colors duration-200">
                  <div 
                    className="bg-indigo-500 h-2.5 rounded-full transition-colors duration-200" 
                    style={{ width: `${(totalPoints % 100)}%` }}
                  ></div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-md font-medium text-text-primary mb-2 transition-colors duration-200">Level Benefits</h4>
                  <ul className="list-disc pl-5 text-sm text-text-tertiary space-y-1 transition-colors duration-200">
                    <li>Level 1: Access to basic study tools</li>
                    <li>Level 2: Unlock advanced note-taking features</li>
                    <li>Level 3: Unlock custom study schedules</li>
                    <li>Level 4: Unlock AI-powered study recommendations</li>
                    <li>Level 5: Unlock premium themes and customization</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 