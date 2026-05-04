export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  avatar: string | null
  bio: string
  date_of_birth: string | null
  timezone: string
  is_professional: boolean
  is_verified: boolean
  is_online: boolean
  last_seen: string | null
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

export interface AuthResponse {
  access: string
  refresh: string
}

export interface Message {
  id: string
  conversation: string
  sender: string
  sender_name: string
  sender_avatar: string | null
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  attachment: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  participants: string[]
  is_group: boolean
  name: string
  last_message: Message | null
  unread_count: number
  last_message_at: string
  created_at: string
}

export interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  data: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface CommunityGroup {
  id: string
  name: string
  slug: string
  description: string
  group_type: string
  cover_image: string | null
  member_count: number
  is_member: boolean
  is_active: boolean
}

export interface Post {
  id: string
  group: string
  author: string
  author_name: string
  content: string
  image: string | null
  is_anonymous: boolean
  is_pinned: boolean
  comments_count: number
  reactions_summary: Record<string, number>
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post: string
  author: string
  author_name: string
  content: string
  is_anonymous: boolean
  parent: string | null
  replies: Comment[]
  created_at: string
}

export interface Professional {
  id: string
  user: string
  user_name: string
  user_avatar: string | null
  title: string
  bio: string
  credentials: string
  years_of_experience: number
  specializations: Specialization[]
  languages: string[]
  session_rate: number
  intro_video: string | null
  average_rating: number | null
  review_count: number
  status: string
  created_at: string
}

export interface Specialization {
  id: string
  name: string
  slug: string
}

export interface Booking {
  id: string
  user: string
  professional: string
  professional_name: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  description: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string
  created_at: string
}

export interface Video {
  id: string
  title: string
  description: string
  source_type: 'youtube' | 'local'
  youtube_id: string
  video_file: string | null
  thumbnail: string | null
  duration_seconds: number
  category: string
  category_name: string
  mood_tags: string[]
  is_featured: boolean
  view_count: number
  is_bookmarked: boolean
  created_at: string
}

export interface AISession {
  id: string
  title: string
  is_active: boolean
  messages: AIMessage[]
  message_count: number
  created_at: string
  updated_at: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  mood_score: number | null
  tags: string[]
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface UserMood {
  id: string
  mood_score: number
  note: string
  recorded_date: string
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  achievement_type: string
  icon: string | null
  points: number
  requirement_count: number
}

export interface UserAchievement {
  id: string
  achievement: Achievement
  earned_at: string
}

export interface UserStreak {
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
}
