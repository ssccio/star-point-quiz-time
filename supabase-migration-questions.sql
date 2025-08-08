-- Migration to add questions table for synchronizing questions across players
-- This ensures all players see the same questions in the same order

-- Questions table - stores the questions for each game
CREATE TABLE game_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each game has unique question numbers
    UNIQUE(game_id, question_number)
);

-- Create index for better performance
CREATE INDEX idx_game_questions_game ON game_questions(game_id);
CREATE INDEX idx_game_questions_number ON game_questions(game_id, question_number);

-- Enable Row Level Security
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all operations on game_questions" ON game_questions FOR ALL USING (true);