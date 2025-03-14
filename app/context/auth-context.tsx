"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthState, Profile, UserWithProfile, UserRole, UserStatus } from "@/types/user";

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isActive: false,
};

interface AuthContextType {
  authState: AuthState;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  authState: initialState,
  signOut: async () => {},
  hasRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          return null;
        }

        return data as Profile;
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        return null;
      }
    };

    const setupUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
            isActive: false,
          });
          return;
        }

        const profile = await fetchUserProfile(session.user.id);
        const isAdmin = profile?.role === "admin";
        const isActive = profile?.status === "active";

        // If user is deactivated, sign them out
        if (profile && !isActive) {
          await supabase.auth.signOut();
          router.push("/auth/sign-in?error=Account+deactivated");
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
            isActive: false,
          });
          return;
        }

        setAuthState({
          user: session.user as UserWithProfile,
          profile,
          isLoading: false,
          isAdmin,
          isActive,
        });
      } catch (error) {
        console.error("Error setting up user:", error);
        setAuthState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    setupUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const profile = await fetchUserProfile(session.user.id);
          const isAdmin = profile?.role === "admin";
          const isActive = profile?.status === "active";

          // If user is deactivated, sign them out
          if (profile && !isActive) {
            await supabase.auth.signOut();
            router.push("/auth/sign-in?error=Account+deactivated");
            setAuthState({
              user: null,
              profile: null,
              isLoading: false,
              isAdmin: false,
              isActive: false,
            });
            return;
          }

          setAuthState({
            user: session.user as UserWithProfile,
            profile,
            isLoading: false,
            isAdmin,
            isActive,
          });
        } else if (event === "SIGNED_OUT") {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAdmin: false,
            isActive: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  // Helper function to check if user has a specific role or any of the roles
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!authState.profile || !authState.isActive) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(authState.profile.role);
    }
    
    return authState.profile.role === roles;
  };

  return (
    <AuthContext.Provider value={{ authState, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}; 