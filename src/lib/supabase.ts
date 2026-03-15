import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pqawrvxlxofanzokoynr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ojOyJVurVor2ErJiLT7D7A_WwzjWKvf';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using fallback values.');
}

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
