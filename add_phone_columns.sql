-- Run this in your Supabase SQL Editor to add the missing columns
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS phone2 TEXT,
ADD COLUMN IF NOT EXISTS phone3 TEXT;
