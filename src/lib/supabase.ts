import { createClient } from '@supabase/supabase-js';

// Read environmental variables from Vite
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Export a flag to check if Supabase is fully configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create the Supabase client instance
// If variables are missing, we pass placeholders to prevent the createClient function
// from crashing the bundle on startup, allowing us to show a setup guide instead.
const urlToUse = supabaseUrl || 'https://placeholder-project.supabase.co';
const keyToUse = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(urlToUse, keyToUse);
