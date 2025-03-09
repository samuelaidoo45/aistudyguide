-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  responded_at TIMESTAMP WITH TIME ZONE,
  response TEXT
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting messages (authenticated users only)
CREATE POLICY "Users can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own messages
CREATE POLICY "Users can view their own contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for admins to view all messages
CREATE POLICY "Admins can view all contact messages"
  ON public.contact_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx ON public.contact_messages(user_id); 