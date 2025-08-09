-- Migration to add question sets tables for managing reusable question collections
-- This allows admins to manage question sets that can be used across multiple games

-- Question Sets table - stores metadata about question collections
CREATE TABLE question_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    category VARCHAR(50),
    version VARCHAR(20) DEFAULT '1.0',
    question_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique names for question sets
    UNIQUE(name)
);

-- Questions table - stores all questions belonging to sets
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique question numbers within a set
    UNIQUE(question_set_id, question_number)
);

-- Add a column to games table to track which question set was used
ALTER TABLE games ADD COLUMN IF NOT EXISTS question_set_id UUID REFERENCES question_sets(id);

-- Create indexes for better performance
CREATE INDEX idx_questions_set ON questions(question_set_id);
CREATE INDEX idx_questions_set_number ON questions(question_set_id, question_number);
CREATE INDEX idx_question_sets_active ON question_sets(is_active);

-- Enable Row Level Security
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read question sets and questions
CREATE POLICY "Allow read access to question_sets" ON question_sets
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to questions" ON questions
    FOR SELECT USING (true);

-- Only authenticated users (admins) can modify
CREATE POLICY "Allow admin operations on question_sets" ON question_sets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin operations on questions" ON questions
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to update question count when questions are added/removed
CREATE OR REPLACE FUNCTION update_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE question_sets
        SET question_count = (
            SELECT COUNT(*)
            FROM questions
            WHERE question_set_id = COALESCE(NEW.question_set_id, OLD.question_set_id)
        ),
        updated_at = NOW()
        WHERE id = COALESCE(NEW.question_set_id, OLD.question_set_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update question count
CREATE TRIGGER update_question_set_count
AFTER INSERT OR DELETE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_question_count();

-- Insert default question set from our YAML files
-- This will be populated by the application
