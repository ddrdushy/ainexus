-- Create AI ideas table for Supabase
CREATE TABLE IF NOT EXISTS ai_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT DEFAULT '[]'::jsonb,
  author_name TEXT,
  is_approved BOOLEAN DEFAULT true,
  is_nsfw BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_ideas_created_at ON ai_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_ideas_is_approved ON ai_ideas(is_approved);
CREATE INDEX IF NOT EXISTS idx_ai_ideas_is_nsfw ON ai_ideas(is_nsfw);
CREATE INDEX IF NOT EXISTS idx_ai_ideas_category ON ai_ideas(category);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
-- Allow anyone to read approved and non-NSFW ideas
CREATE POLICY "Public can view approved ideas" ON ai_ideas
  FOR SELECT USING (is_approved = true AND is_nsfw = false);

-- Allow anyone to insert new ideas (they will be auto-approved after moderation)
CREATE POLICY "Public can insert ideas" ON ai_ideas
  FOR INSERT WITH CHECK (true);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ai_ideas_updated_at 
  BEFORE UPDATE ON ai_ideas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();