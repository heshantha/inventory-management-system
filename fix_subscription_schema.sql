-- FIX: Add subscription columns and reload schema cache

-- 1. Add columns if they don't exist
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS subscription_start_date DATE;

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS subscription_end_date DATE;

-- 2. Grant permissions (sometimes needed for new columns)
GRANT ALL ON shops TO authenticated;
GRANT ALL ON shops TO service_role;

-- 3. Reload the schema cache to ensure API sees the new columns
NOTIFY pgrst, 'reload config';
