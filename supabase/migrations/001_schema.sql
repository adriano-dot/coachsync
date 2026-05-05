-- ═══════════════════════════════════════════════════════
-- CoachSync Database Schema
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'coachee')),
  avatar_url TEXT,
  phone TEXT,
  cpf TEXT,
  bio TEXT,
  company TEXT,
  specialties TEXT[],
  methodology_notes TEXT,
  -- Coachee-specific
  coach_id UUID REFERENCES profiles(id),
  objectives TEXT,
  onboarding_step TEXT DEFAULT 'profile' CHECK (
    onboarding_step IN ('profile', 'wheel_of_life', 'assessment', 'goals', 'completed')
  ),
  wheel_of_life JSONB,
  behavioral_profile JSONB,
  initial_assessment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coachee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  audio_url TEXT,
  transcript_url TEXT,
  transcript_text TEXT,
  ai_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TASKS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coachee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MATERIALS (Coach uploads) ────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT DEFAULT 'reference' CHECK (
    category IN ('tool', 'methodology', 'exercise', 'template', 'reference')
  ),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LIBRARY ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coachee_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  author TEXT,
  type TEXT DEFAULT 'book' CHECK (
    type IN ('book', 'movie', 'article', 'exercise', 'podcast', 'other')
  ),
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COACHING TOOLS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COACHEE CHAT MESSAGES ────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coachee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_coach ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_coachee ON sessions(coachee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_coachee ON tasks(coachee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_profiles_coach ON profiles(coach_id);
CREATE INDEX IF NOT EXISTS idx_chat_coachee ON chat_messages(coachee_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own profile; coaches see their coachees
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "coaches_see_coachees" ON profiles FOR SELECT
  USING (coach_id = auth.uid() OR auth.uid() = id);

-- Sessions: coach sees all their sessions; coachee sees own sessions
CREATE POLICY "sessions_coach" ON sessions FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "sessions_coachee" ON sessions FOR SELECT USING (coachee_id = auth.uid());

-- Tasks: coach manages; coachee sees and updates own
CREATE POLICY "tasks_coach" ON tasks FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "tasks_coachee_select" ON tasks FOR SELECT USING (coachee_id = auth.uid());
CREATE POLICY "tasks_coachee_update" ON tasks FOR UPDATE USING (coachee_id = auth.uid());

-- Materials: coach manages own
CREATE POLICY "materials_coach" ON materials FOR ALL USING (coach_id = auth.uid());

-- Library: coach manages; coachee sees items assigned to them or general
CREATE POLICY "library_coach" ON library_items FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "library_coachee" ON library_items FOR SELECT
  USING (coachee_id = auth.uid() OR coachee_id IS NULL);

-- Coaching tools: coach manages own
CREATE POLICY "tools_coach" ON coaching_tools FOR ALL USING (coach_id = auth.uid());

-- Chat: coachee owns their messages
CREATE POLICY "chat_coachee" ON chat_messages FOR ALL USING (coachee_id = auth.uid());

-- ─── AUTO-UPDATE TRIGGER ──────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'coachee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── DEFAULT COACHING TOOLS ───────────────────────────
-- (Will be inserted by coach during onboarding)
-- Seeded here as examples the coach can import:
INSERT INTO coaching_tools (id, coach_id, name, category, description, instructions) VALUES
-- These need a real coach_id — insert after creating your coach account
-- ('...', 'COACH_UUID', 'Roda da Vida', 'Autoconhecimento', 'Ferramenta de avaliação das 8 áreas da vida', 'Peça ao coachee para avaliar de 0-10...')
;
