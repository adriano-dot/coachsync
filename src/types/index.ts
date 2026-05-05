// ─── Database Types ──────────────────────────────────────────────
export type UserRole = 'coach' | 'coachee'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type OnboardingStep = 'profile' | 'wheel_of_life' | 'assessment' | 'goals' | 'completed'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  cpf?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface CoachProfile extends Profile {
  role: 'coach'
  company?: string
  specialties?: string[]
  methodology_notes?: string
}

export interface CoacheeProfile extends Profile {
  role: 'coachee'
  coach_id: string
  objectives?: string
  onboarding_step: OnboardingStep
  wheel_of_life?: WheelOfLife
  behavioral_profile?: BehavioralProfile
  initial_assessment?: Record<string, string>
}

export interface WheelOfLife {
  career: number
  health: number
  relationships: number
  finances: number
  personal_growth: number
  leisure: number
  spirituality: number
  family: number
}

export interface BehavioralProfile {
  dominance: number
  influence: number
  steadiness: number
  conscientiousness: number
  notes?: string
}

export interface Session {
  id: string
  coach_id: string
  coachee_id: string
  title: string
  session_date: string
  duration_minutes?: number
  status: SessionStatus
  notes?: string
  audio_url?: string
  transcript_url?: string
  transcript_text?: string
  ai_summary?: AISummary
  created_at: string
  updated_at: string
  coachee?: CoacheeProfile
}

export interface AISummary {
  overview: string
  main_topics: string[]
  emotional_tone: string
  perceived_feelings: string[]
  breakthroughs: string[]
  commitments: string[]
  tasks: GeneratedTask[]
  next_steps: string[]
  suggested_tools: SuggestedTool[]
  next_session_focus: string
}

export interface GeneratedTask {
  title: string
  description: string
  due_date_suggestion?: string
  priority: 'high' | 'medium' | 'low'
}

export interface SuggestedTool {
  name: string
  rationale: string
  category: string
}

export interface Task {
  id: string
  session_id?: string
  coach_id: string
  coachee_id: string
  title: string
  description?: string
  status: TaskStatus
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  coach_id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  category: 'tool' | 'methodology' | 'exercise' | 'template' | 'reference'
  tags?: string[]
  created_at: string
}

export interface LibraryItem {
  id: string
  coach_id: string
  coachee_id?: string
  title: string
  author?: string
  type: 'book' | 'movie' | 'article' | 'exercise' | 'podcast' | 'other'
  description?: string
  url?: string
  thumbnail_url?: string
  tags?: string[]
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CoachingTool {
  id: string
  coach_id: string
  name: string
  category: string
  description: string
  instructions: string
  created_at: string
}

// ─── API Response Types ────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface DashboardStats {
  total_coachees: number
  active_sessions: number
  pending_tasks: number
  sessions_this_month: number
  completion_rate: number
}
