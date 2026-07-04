import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

// Routes cần đăng nhập admin
const ADMIN_PATTERN = /^\/admin(\/|$)/;
// Routes cần đăng nhập customer
const ACCOUNT_PATTERN = /^\/tai-khoan(\/|$)/;
// Routes public không cần check
const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_FILE.test(pathname)) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Bảo vệ /admin
  if (ADMIN_PATTERN.test(pathname)) {
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Bảo vệ /tai-khoan
  if (ACCOUNT_PATTERN.test(pathname)) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tai-khoan/:path*"],
};
