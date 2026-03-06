import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type UserRole = 'admin' | 'sales' | 'support' | 'seller';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
