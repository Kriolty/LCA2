import { create } from 'zustand';
import { supabase, UserProfile, UserRole } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isSigningOut: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  isSigningOut: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ user: session.user, session });
        await get().fetchProfile();
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        const { isSigningOut } = get();

        if (isSigningOut || event === 'SIGNED_OUT') {
          console.log('Signing out or signed out event, clearing state');
          set({
            user: null,
            profile: null,
            session: null,
            isSigningOut: false
          });
          return;
        }

        set({ user: session?.user ?? null, session });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });

      set({ initialized: true, loading: false });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },

  fetchProfile: async () => {
    const { user, isSigningOut } = get();
    if (!user || isSigningOut) {
      console.log('No user found or signing out, cannot fetch profile');
      return;
    }

    try {
      console.log('Fetching profile for user:', user.id);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });

      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase error fetching profile:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      if (!data) {
        console.warn('No profile found for user:', user.id);
        return;
      }

      console.log('Profile fetched successfully:', data);
      set({ profile: data });
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      console.log('Starting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Sign in successful, setting user and session');
      set({ user: data.user, session: data.session });

      console.log('Fetching profile...');
      try {
        const profileTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout during sign in')), 5000);
        });

        await Promise.race([get().fetchProfile(), profileTimeout]);
        console.log('Profile fetch completed');
      } catch (profileError) {
        console.error('Profile fetch failed during sign in:', profileError);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      console.log('Sign in process complete, setting loading to false');
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            role,
            first_name: firstName,
            last_name: lastName,
          });

        if (profileError) throw profileError;
      }

      set({ user: data.user, session: data.session });
      await get().fetchProfile();
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      console.log('Auth store: Starting sign out...');
      set({ isSigningOut: true, loading: false });

      await supabase.auth.signOut();

      console.log('Auth store: Sign out complete, clearing state...');
      set({
        user: null,
        profile: null,
        session: null,
        loading: false,
        isSigningOut: false,
        initialized: true
      });
    } catch (error) {
      console.error('Error signing out:', error);
      set({
        user: null,
        profile: null,
        session: null,
        loading: false,
        isSigningOut: false,
        initialized: true
      });
    }
  },
}));
