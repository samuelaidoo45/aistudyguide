-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  main_outline TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  category TEXT DEFAULT 'General',
  total_study_time INTEGER DEFAULT 0
);

-- Create subtopics table
CREATE TABLE IF NOT EXISTS subtopics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subtopic_id UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table to track user study history
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  concepts TEXT[] DEFAULT '{}'::TEXT[]
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  earned BOOLEAN DEFAULT FALSE,
  earned_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Topics policies
CREATE POLICY "Users can view their own topics" 
  ON topics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics" 
  ON topics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" 
  ON topics FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" 
  ON topics FOR DELETE 
  USING (auth.uid() = user_id);

-- Subtopics policies
CREATE POLICY "Users can view their own subtopics" 
  ON subtopics FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

CREATE POLICY "Users can insert their own subtopics" 
  ON subtopics FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

CREATE POLICY "Users can update their own subtopics" 
  ON subtopics FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

CREATE POLICY "Users can delete their own subtopics" 
  ON subtopics FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

-- Notes policies
CREATE POLICY "Users can view their own notes" 
  ON notes FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = (SELECT topic_id FROM subtopics WHERE id = subtopic_id)));

CREATE POLICY "Users can insert their own notes" 
  ON notes FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM topics WHERE id = (SELECT topic_id FROM subtopics WHERE id = subtopic_id)));

CREATE POLICY "Users can update their own notes" 
  ON notes FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = (SELECT topic_id FROM subtopics WHERE id = subtopic_id)));

CREATE POLICY "Users can delete their own notes" 
  ON notes FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = (SELECT topic_id FROM subtopics WHERE id = subtopic_id)));

-- Study sessions policies
CREATE POLICY "Users can view their own study sessions" 
  ON study_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" 
  ON study_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view their own achievements" 
  ON achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
  ON achievements FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
  ON achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id); 