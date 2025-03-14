import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Client-side authentication check for protected routes
export const useAuthCheck = (redirectTo: string = '/auth/sign-in') => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace(redirectTo);
      }
    };

    checkAuth();
  }, [router, redirectTo, supabase.auth]);
};

// Client-side authentication check for auth routes (redirect if already logged in)
export const useAuthRedirect = (redirectTo: string = '/dashboard') => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace(redirectTo);
      }
    };

    checkAuth();
  }, [router, redirectTo, supabase.auth]);
}; 