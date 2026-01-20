-- Add warranty column to sales table
-- Run this in your Supabase SQL Editor

ALTER TABLE sales ADD COLUMN IF NOT EXISTS warranty TEXT;
