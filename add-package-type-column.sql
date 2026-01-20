-- Add package_type column to shops table
-- Run this in your Supabase SQL Editor

-- Add package_type column with default 'basic'
ALTER TABLE shops ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'basic';

-- Add check constraint for valid package types
ALTER TABLE shops DROP CONSTRAINT IF EXISTS valid_package_type;
ALTER TABLE shops ADD CONSTRAINT valid_package_type 
  CHECK (package_type IN ('basic', 'standard', 'premium'));

-- Update existing shops to have 'basic' package if null
UPDATE shops SET package_type = 'basic' WHERE package_type IS NULL;
