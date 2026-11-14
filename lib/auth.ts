import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { databaseConfigured, supabase } from "./supabase";

// Password protection for /expenses.
// - The password lives only in the EXPENSES_PASSWORD env var (never in the code).
// - After a correct password we set a signed, httpOnly cookie that expires in 30 days.
// - Every page load and every action re-checks that cookie on the server.

export const COOKIE_NAME = "expenses_session";
export const COOKIE_PATH = "/expenses";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function isConfigured(): boolean {
  return Boolean(process.env.EXPENSES_PASSWORD);
}

function signingKey(): string {
  return process.env.EXPENSES_SESSION_SECRET || process.env.EXPENSES_PASSWORD || "";
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createToken(now: number = Date.now()): string {
  const payload = String(now + MAX_AGE_SECONDS * 1000);
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined | null, now: number = Date.now()): boolean {
  if (!token || !signingKey()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  return Number(payload) > now;
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.EXPENSES_PASSWORD ?? "";
  if (!expected) return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE_NAME)?.value);
}

export async function setSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: MAX_AGE_SECONDS,
  });
}

// Brute-force protection: after 5 wrong passwords from one IP, lock that IP out for
// 15 minutes (counted from the first wrong attempt). Stored in the login_attempts
// table. If the database is down we fail open so you can still get in.
type Attempts = { attempts: number; windowStart: number };

async function readAttempts(ip: string): Promise<Attempts | null> {
  const rows = await supabase<{ attempts: number; window_start: string }[]>(
    `login_attempts?ip=eq.${encodeURIComponent(ip)}&select=attempts,window_start`,
  );
  const row = rows?.[0];
  if (!row) return null;
  return { attempts: row.attempts, windowStart: Date.parse(row.window_start) };
}

export async function tooManyAttempts(ip: string): Promise<boolean> {
  if (!databaseConfigured()) return false;
  try {
    const current = await readAttempts(ip);
    if (!current) return false;
    const stillInWindow = Date.now() - current.windowStart < LOCKOUT_MS;
    return stillInWindow && current.attempts >= MAX_FAILED_ATTEMPTS;
  } catch {
    return false;
  }
}

export async function recordFailure(ip: string): Promise<void> {
  if (!databaseConfigured()) return;
  try {
    const current = await readAttempts(ip);
    const expired = !current || Date.now() - current.windowStart >= LOCKOUT_MS;
    const attempts = expired || !current ? 1 : current.attempts + 1;
    const windowStart = expired || !current ? Date.now() : current.windowStart;
    await supabase("login_attempts?on_conflict=ip", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: { ip, attempts, window_start: new Date(windowStart).toISOString() },
    });
  } catch {
    // ignore
  }
}

export async function clearFailures(ip: string): Promise<void> {
  if (!databaseConfigured()) return;
  try {
    await supabase(`login_attempts?ip=eq.${encodeURIComponent(ip)}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  } catch {
    // ignore
  }
}
