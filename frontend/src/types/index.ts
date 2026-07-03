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
  is_staff: boolean
  last_seen: string | null
  created_at: string
  // Privacy settings
  anonymous_mode: boolean
  profile_visibility: 'public' | 'friends' | 'private'
  allow_messages_from: 'everyone' | 'friends' | 'nobody'
  // Appearance settings
  theme: 'light' | 'dark' | 'system'
  text_size: 'small' | 'medium' | 'large'
  // Notification settings
  daily_notification_time: string
  email_notifications_enabled: boolean
  push_notifications_enabled: boolean
}

export interface AdminStats {
  total_users: number
  new_users_today: number
  total_professionals: number
  pending_professionals: number
  active_sessions_today: number
  total_messages: number
  unresolved_reports: number
}

export interface AdminUser {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  avatar: string | null
  is_staff: boolean
  is_professional: boolean
  is_verified: boolean
  is_active: boolean
  role: 'admin' | 'professional' | 'user'
  date_joined: string
  created_at: string
}

export interface PendingProfessional {
  id: string
  user_email: string
  user_name: string
  bio: string
  license_number: string
  years_of_experience: number
  specializations: string[]
  credential_url: string | null
  status: string
  rejection_reason: string
  created_at: string
}

export interface ProfessionalApplicationStatus {
  exists: boolean
  status?: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at?: string
}

export interface PendingGroup {
  id: string
  name: string
  slug: string
  description: string
  group_type: string
  custom_type: string
  visibility: string
  cover_image_url: string | null
  creation_reason: string
  created_by_username: string
  created_by_email: string
  ai_total_score: number | null
  ai_review_summary: string
  ai_review_scores: { model: string; score: number; reasoning: string }[]
  approval_status: string
  rejection_reason: string
  review_step: string
  created_at: string
}

export interface ModerationReport {
  id: string
  reporter_name: string
  reason: string
  details: string
  is_resolved: boolean
  post: string | null
  comment: string | null
  post_content: string | null
  comment_content: string | null
  content_author: string | null
  content_author_id: string | null
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
  role?: 'user' | 'professional'
  license_number?: string
  professional_bio?: string
  years_of_experience?: number
  specializations_text?: string
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
  sender_name: string | null
  sender_avatar: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface CommunityGroup {
  id: string
  name: string
  slug: string
  description: string
  group_type: string | null
  custom_type?: string
  cover_image: string | null
  member_count: number
  is_member: boolean
  is_moderator: boolean
  is_active: boolean
  is_user_created: boolean
  created_by: string | null
  created_by_username?: string
  visibility: 'public' | 'private'
  invite_code: string
  invite_url?: string
  is_approved: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
  rejection_reason?: string
}

export interface Post {
  id: string
  group: string
  group_name: string
  group_slug: string
  author: string
  author_name: string
  author_avatar: string | null
  content: string
  image: string | null
  mood_tag: string | null
  is_anonymous: boolean
  is_pinned: boolean
  comments_count: number
  reactions_summary: Record<string, number>
  user_reactions: string[]
  is_saved: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post: string
  author: string
  author_name: string
  author_avatar: string | null
  content: string
  is_anonymous: boolean
  parent: string | null
  replies: Comment[]
  user_can_delete: boolean
  is_saved: boolean
  expires_at: string | null
  created_at: string
}

export interface Professional {
  id: string
  user: string
  user_name: string
  user_avatar: string | null
  is_online: boolean
  title: string
  bio: string
  credentials: string
  years_of_experience: number
  specializations: Specialization[]
  gender: string
  languages: string[]
  session_rate: number
  intro_video: string | null
  average_rating: number | null
  review_count: number
  is_favourite: boolean
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
  has_review: boolean
  created_at: string
}

export interface Review {
  id: string
  rating: number
  comment: string
  reviewer_name: string
  created_at: string
}

export interface Availability {
  id: string
  weekday: number
  weekday_name: string
  start_time: string
  end_time: string
  is_available: boolean
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
  is_completed: boolean
  user_rating: 'helpful' | 'not_helpful' | null
  helpful_count: number
  not_helpful_count: number
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

export interface SessionNote {
  id: string
  patient: string
  patient_name: string
  patient_avatar: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface PatientEntry {
  user_id: string
  user_name: string
  user_avatar: string | null
  last_session_date: string | null
  mood_trend: number[]
}

export interface EarningsSummary {
  sessions_this_month: number
  total_earnings: number
  pending_payout: number
  payout_requested: boolean
  monthly: { month: string; sessions: number; earnings: number }[]
}

export interface ProBooking extends Booking {
  patient_name: string
  patient_avatar: string | null
  patient_id: string
}

export interface UserGoal {
  id: string
  title: string
  description: string
  category: 'wellness' | 'social' | 'professional' | 'personal'
  target_date: string
  is_completed: boolean
  progress: number
  created_at: string
  updated_at: string
}

export interface MoodCalendarDay {
  date: string
  mood_score: number | null
  has_entry: boolean
}
