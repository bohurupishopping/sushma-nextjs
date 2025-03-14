import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware will run on the edge runtime
export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    // Handle auth routes
    if (req.nextUrl.pathname.startsWith('/auth')) {
      if (session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
      return res;
    }

    // Handle dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/auth/sign-in';
        return NextResponse.redirect(redirectUrl);
      }
      return res;
    }

    return res;
  } catch (e) {
    // Fallback - return the response as is
    return res;
  }
};

// Update matcher to only run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};