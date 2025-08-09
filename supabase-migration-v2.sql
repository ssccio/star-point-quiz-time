-- Migration v2: Add player activity tracking
-- Run this in your Supabase SQL Editor to upgrade existing databases

-- Add is_active and last_active_at columns to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing players to be active
UPDATE players SET is_active = TRUE WHERE is_active IS NULL;
UPDATE players SET last_active_at = NOW() WHERE last_active_at IS NULL;

-- Add index for better performance on active player queries
CREATE INDEX IF NOT EXISTS idx_players_active ON players(game_id, is_active);

-- Add game status 'paused' to support phone lock scenarios
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check
CHECK (status IN ('waiting', 'active', 'paused', 'finished'));

-- Function to update last_active_at when players interact
CREATE OR REPLACE FUNCTION update_player_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update last_active_at
CREATE TRIGGER update_players_activity BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_player_activity();

COMMENT ON COLUMN players.is_active IS 'Whether player is currently connected and participating';
COMMENT ON COLUMN players.last_active_at IS 'Last time player performed any action (for phone lock recovery)';
