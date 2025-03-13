import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'worker' | 'dealer' | 'salesman';

export interface UserProfile {
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile extends SupabaseUser {
  profile?: UserProfile;
}

export interface AuthState {
  user: UserWithProfile | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
} 