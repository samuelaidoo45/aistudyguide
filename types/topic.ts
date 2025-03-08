export interface Topic {
  id: string
  name?: string      // For topics that use name
  title?: string     // For topics that use title
  description?: string
  main_outline?: string
  created_at: string
  last_accessed?: string
  progress?: number
  category?: string
  total_study_time?: number
  user_id: string
} 