// Supabase configuration and initialization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fcapcibgcwfehvvwjfre.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXBjaWJnY3dmZWh2dndqZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDM2MDAsImV4cCI6MjA4NDM3OTYwMH0.B5P4vHDvUxosvasSbMCQrOnf03I8Axfoq_eKXssrljs';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYXBjaWJnY3dmZWh2dndqZnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgwMzYwMCwiZXhwIjoyMDg0Mzc5NjAwfQ.KC90ngTsudcbSQfSniv57lD6875Ykd5rLKhQBO5zGWY';

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for privileged operations (user creation, etc.)
// IMPORTANT: Only use this for server-side/admin operations, never expose in client code
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default supabase;
