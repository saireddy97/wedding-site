import { createHmac, timingSafeEqual } from "node:crypto";

// Signed login session for /expenses. No Next.js-specific imports here, so this file
// can also be used by middleware.
//
// The token holds the time of the user's last activity. Middleware refreshes it on
// every visit, so the session ends only after IDLE_MINUTES with no activity.

export const COOKIE_NAME = "expenses_session";
export const COOKIE_PATH = "/expenses";
export const IDLE_MINUTES = 30;

const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

function signingKey(): string {
  return process.env.EXPENSES_SESSION_SECRET || process.env.EXPENSES_PASSWORD || "";
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createToken(now: number = Date.now()): string {
  const payload = String(now);
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined | null, now: number = Date.now()): boolean {
  if (!token || !signingKey()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  const lastActive = Number(payload);
  if (!Number.isFinite(lastActive)) return false;
  if (lastActive > now + CLOCK_SKEW_MS) return false; // timestamp from the future
  return now - lastActive < IDLE_MS;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: COOKIE_PATH,
    // The browser drops the cookie after IDLE_MINUTES without a refresh.
    maxAge: IDLE_MINUTES * 60,
  };
}
