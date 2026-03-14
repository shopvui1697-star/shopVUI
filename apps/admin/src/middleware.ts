import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Decode payload (note: this is NOT signature verification —
    // real auth happens on the backend via AdminGuard)
    const payload = JSON.parse(
      Buffer.from(parts[1]!, 'base64url').toString('utf-8'),
    );

    if (payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
};
