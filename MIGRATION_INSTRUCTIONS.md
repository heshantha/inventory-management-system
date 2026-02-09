# Database Migration Instructions

## Running the Subscription Dates Migration

Before you can use the new subscription date features, you need to run the database migration to add the new columns to your Supabase database.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (fcapcibgcwfehvvwjfre)

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run the Migration**
   - Open the file `subscription_dates_migration.sql` in your project root
   - Copy all the SQL code from that file
   - Paste it into the Supabase SQL Editor
   - Click the "Run" button

4. **Verify Migration**
   - After running, you should see a success message
   - To verify the columns were added, run this query:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'shops' 
   AND column_name IN ('subscription_start_date', 'subscription_end_date');
   ```
   - You should see both columns listed

### What This Migration Does:

- Adds `subscription_start_date` column (DATE type) to the `shops` table
- Adds `subscription_end_date` column (DATE type) to the `shops` table
- Both columns are optional (can be NULL)
- Adds documentation comments for future reference

### After Migration:

Once the migration is complete, you can:
- Create new shops with subscription dates
- Edit existing shops to add subscription dates
- View subscription end dates in shop headers (for shop users)

The application is already updated to use these new fields - no code changes needed!
