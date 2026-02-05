-- Add discord_user_id column to agents table for @mentions in notifications
ALTER TABLE agents ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_agents_discord_user_id ON agents(discord_user_id);

-- Update known PM Discord IDs
UPDATE agents SET discord_user_id = '1465633971810336779' WHERE id = 'cheenu';
UPDATE agents SET discord_user_id = '719990816659210360' WHERE id = 'chhotu';

COMMENT ON COLUMN agents.discord_user_id IS 'Discord user ID for @mentions in notifications';
