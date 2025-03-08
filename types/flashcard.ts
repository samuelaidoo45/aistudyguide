export interface Flashcard {
  id: string
  topic_id: string
  front: string
  back: string
  created_at: string
  last_reviewed?: string
  next_review?: string
  difficulty_rating?: number
  user_id: string
} 