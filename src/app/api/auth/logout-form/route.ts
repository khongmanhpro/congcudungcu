import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { getSiteUrl } from "@/lib/seo";

// Xử lý form submit từ sidebar (method=post)
export async function POST() {
  const res = NextResponse.redirect(new URL("/login", getSiteUrl()), 303);
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
