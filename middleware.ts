import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// These are the paths that do not require authentication or specific roles
const PUBLIC_PATHS = ['/', '/register'];

// Role-based access control mapping
const ROLE_BASED_PATHS: { [key: string]: string[] } = {
  '/player': ['player'],
  '/booster': ['booster'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('uplift_force_token_key')?.value; // Get token from cookie
  let userRole: string | undefined;

  // In a real application, you would decode the token to get the user's role.
  // For this example, we'll assume the role is also stored in a cookie or derivable from the token.
  // For demonstration, let's assume user role is in a cookie named 'user_role'.
  userRole = request.cookies.get('user_role')?.value; 

  // 1. If trying to access a protected path without a token, redirect to home
  if (!token && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. If token exists but no user role (e.g., token valid but user data not loaded yet, or malformed cookie)
  // This might be redundant if the token itself contains role and is decoded by the backend/auth service.
  // For simplicity, if a token is present but no role, we'll allow access to public paths or redirect if not public.
  if (token && !userRole && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. If accessing a role-based path, check if the user has the required role
  if (userRole && ROLE_BASED_PATHS[pathname]) {
    if (!ROLE_BASED_PATHS[pathname].includes(userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // If all checks pass, allow the request to proceed
  return NextResponse.next();
}

// Configuration for the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)1',
  ],
}; 