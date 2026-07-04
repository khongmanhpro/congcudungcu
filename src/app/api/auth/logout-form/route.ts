import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

// Xử lý form submit từ sidebar (method=post)
export async function POST() {
  const res = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), 303);
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
