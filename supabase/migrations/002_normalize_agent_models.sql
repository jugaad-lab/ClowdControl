-- ============================================
-- MIGRATION: Normalize Agent Model References
-- Run in Supabase SQL Editor
-- ============================================

-- Update specialist agents with proper model IDs
-- Model tiers:
--   - Opus 4.5 (anthropic/claude-opus-4-5): PM agents only
--   - Sonnet 4 (anthropic/claude-sonnet-4-20250514): Developers, complex reasoning
--   - Sonnet 3.5 (anthropic/claude-3-5-sonnet-latest): General specialists
--   - Haiku 3.5 (anthropic/claude-haiku-3-5-latest): Docs, UI, simple tasks

-- Shuri: Product Analyst → Sonnet 4 (complex analysis)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-sonnet-4-20250514", "thinking": "low"}'::jsonb
WHERE id = 'shuri';

-- Fury: Customer Researcher → Sonnet 4 (complex research)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-sonnet-4-20250514", "thinking": "low"}'::jsonb
WHERE id = 'fury';

-- Vision: SEO Analyst → Sonnet 3.5 (general analysis)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb
WHERE id = 'vision';

-- Loki: Content Writer → Sonnet 3.5 (writing)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb
WHERE id = 'loki';

-- Quill: Social Media → Sonnet 3.5 (writing)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb
WHERE id = 'quill';

-- Wanda: UI/UX Designer → Haiku 3.5 (UI tasks are often simpler)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-haiku-3-5-latest"}'::jsonb
WHERE id = 'wanda';

-- Pepper: Email Marketing → Sonnet 3.5 (writing)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-3-5-sonnet-latest"}'::jsonb
WHERE id = 'pepper';

-- Friday-dev: Developer → Sonnet 4.5 (best coding model)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-sonnet-4-5-20250514", "allowedTools": ["Bash(*)", "Edit(*)", "Write(*)", "Read(*)", "Fetch(*)"]}'::jsonb
WHERE id = 'friday-dev';

-- Wong: Documentation → Haiku 3.5 (docs are straightforward)
UPDATE agents 
SET invocation_config = '{"model": "anthropic/claude-haiku-3-5-latest"}'::jsonb
WHERE id = 'wong';

-- Verify the update
SELECT id, display_name, role, invocation_config->>'model' as model 
FROM agents 
WHERE agent_type = 'specialist'
ORDER BY id;
