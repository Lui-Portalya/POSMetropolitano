import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate only: real session validation happens in requireUser() on the server.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("pos_session");
  const isLogin = req.nextUrl.pathname === "/login";
  if (!hasSession && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
