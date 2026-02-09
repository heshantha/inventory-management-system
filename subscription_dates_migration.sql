-- Migration: Add subscription date fields to shops table
-- Execute this in Supabase SQL Editor

-- Add subscription start date column
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS subscription_start_date DATE;

-- Add subscription end date column
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS subscription_end_date DATE;

-- Add a comment for documentation
COMMENT ON COLUMN shops.subscription_start_date IS 'Subscription start date for the shop account';
COMMENT ON COLUMN shops.subscription_end_date IS 'Subscription end date for the shop account (displayed in header)';
