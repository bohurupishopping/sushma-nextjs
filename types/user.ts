import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'dealer' | 'worker' | 'salesman';
export type UserStatus = 'active' | 'deactivated';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile?: Profile;
}

export interface UserWithProfile extends User {
  profile?: Profile;
}

export interface AuthState {
  user: UserWithProfile | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isActive: boolean;
} 