-- Create dive_deeper table to store additional insights
CREATE TABLE IF NOT EXISTS dive_deeper (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table to store generated quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_score INTEGER DEFAULT 0
);

-- Enable Row Level Security (RLS)
ALTER TABLE dive_deeper ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dive_deeper
CREATE POLICY "Users can view their own dive deeper content" 
  ON dive_deeper FOR SELECT 
  USING (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

CREATE POLICY "Users can insert their own dive deeper content" 
  ON dive_deeper FOR INSERT 
  WITH CHECK (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

CREATE POLICY "Users can update their own dive deeper content" 
  ON dive_deeper FOR UPDATE 
  USING (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

CREATE POLICY "Users can delete their own dive deeper content" 
  ON dive_deeper FOR DELETE 
  USING (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

-- Create RLS policies for quizzes
CREATE POLICY "Users can view their own quizzes" 
  ON quizzes FOR SELECT 
  USING (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

CREATE POLICY "Users can insert their own quizzes" 
  ON quizzes FOR INSERT 
  WITH CHECK (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

CREATE POLICY "Users can update their own quizzes" 
  ON quizzes FOR UPDATE 
  USING (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  ));

CREATE POLICY "Users can delete their own quizzes" 
  ON quizzes FOR DELETE 
  USING (auth.uid() = (
    SELECT user_id FROM topics 
    WHERE id = (
      SELECT topic_id FROM subtopics 
      WHERE id = (
        SELECT subtopic_id FROM notes 
        WHERE id = note_id
      )
    )
  )); 