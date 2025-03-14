// This file is needed for Next.js to recognize the middleware configuration
// but we're not using actual middleware functionality since we're using static export
// Authentication is handled client-side in the app

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // For static export, we simply pass through all requests
  return NextResponse.next();
}

// Update matcher to exclude static assets
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