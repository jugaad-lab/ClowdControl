-- Phase 4: Agent Intelligence & Cost Control
-- Run this in Supabase SQL Editor

-- 1. Add skill_level enum and column to agents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level') THEN
        CREATE TYPE skill_level AS ENUM ('junior', 'mid', 'senior', 'lead');
    END IF;
END $$;

-- Add skill_level column to agents if it doesn't exist
ALTER TABLE agents ADD COLUMN IF NOT EXISTS skill_level skill_level DEFAULT 'mid';

-- Add model column to agents if it doesn't exist
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'anthropic/claude-sonnet-4-5';

-- Update existing agents with their levels
UPDATE agents SET skill_level = 'lead', model = 'anthropic/claude-opus-4-5' WHERE mcu_codename = 'Chhotu';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-opus-4-5' WHERE mcu_codename = 'Cheenu';
UPDATE agents SET skill_level = 'lead', model = 'anthropic/claude-opus-4-5' WHERE mcu_codename = 'Vision';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-sonnet-4-5' WHERE mcu_codename = 'Friday';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-sonnet-4-5' WHERE mcu_codename = 'Shuri';
UPDATE agents SET skill_level = 'senior', model = 'anthropic/claude-opus-4-5' WHERE mcu_codename = 'Fury';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4-5' WHERE mcu_codename = 'Wong';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4-5' WHERE mcu_codename = 'Pepper';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4-5' WHERE mcu_codename = 'Wanda';
UPDATE agents SET skill_level = 'mid', model = 'anthropic/claude-sonnet-4-5' WHERE mcu_codename = 'Quill';
UPDATE agents SET skill_level = 'junior', model = 'anthropic/claude-haiku-3-5' WHERE mcu_codename = 'Loki';

-- 2. Add task_complexity enum and column to tasks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_complexity') THEN
        CREATE TYPE task_complexity AS ENUM ('simple', 'medium', 'complex', 'critical');
    END IF;
END $$;

-- Add complexity column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS complexity task_complexity DEFAULT 'medium';

-- Add tokens_consumed column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tokens_consumed INTEGER DEFAULT 0;

-- 3. Add budget columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS token_budget INTEGER DEFAULT 1000000;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;
