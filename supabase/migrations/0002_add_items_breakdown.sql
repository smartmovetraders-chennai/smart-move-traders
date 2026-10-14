-- ============================================================================
-- Migration 0002: Add model breakdown items column
-- Allows recording item quantities grouped by smartphone model name
-- while keeping overall lot pricing intact.
-- ============================================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
