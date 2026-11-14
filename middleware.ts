import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_NAME,
  createToken,
  sessionCookieOptions,
  verifyToken,
} from "./lib/session";

// Runs on every visit to /expenses (page loads and actions). If the user is still
// signed in, it refreshes the idle timer. Expired or missing sessions are left alone,
// so the page shows the password form.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (verifyToken(token)) {
    response.cookies.set(COOKIE_NAME, createToken(), sessionCookieOptions());
  }
  return response;
}

export const config = {
  matcher: ["/expenses"],
  runtime: "nodejs",
};
