import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|sw\\.js|swe-worker.*\\.js|manifest\\.json|.*\\..*).*)', '/'],
};
