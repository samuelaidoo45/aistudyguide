-- Create sub_outlines table
CREATE TABLE IF NOT EXISTS sub_outlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE sub_outlines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sub_outlines" 
  ON sub_outlines FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

CREATE POLICY "Users can insert their own sub_outlines" 
  ON sub_outlines FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

CREATE POLICY "Users can update their own sub_outlines" 
  ON sub_outlines FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id));

CREATE POLICY "Users can delete their own sub_outlines" 
  ON sub_outlines FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM topics WHERE id = topic_id)); 