import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;

  // Allow public access to menu pages
  if (request.nextUrl.pathname.startsWith("/menu/")) {
    return NextResponse.next();
  }

  // Allow public access to auth pages
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Allow public access to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect to login if no session and trying to access protected routes
  if (!sessionToken && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

