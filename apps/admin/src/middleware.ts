import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, decodeSession } from "@/lib/auth/session";

/**
 * Placeholder session guard: cookie presence only.
 * Replace with server-verified staff JWT / httpOnly session later.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = decodeSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const isLogin = pathname === "/login";

  if (!session && !isLogin) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|logo-mark.svg).*)"],
};
