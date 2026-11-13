import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redis, redisConfigured } from "./redis";

// Password protection for /expenses.
// - The password lives only in the EXPENSES_PASSWORD env var (never in the code).
// - After a correct password we set a signed, httpOnly cookie that expires in 30 days.
// - Every page load and every action re-checks that cookie on the server.

export const COOKIE_NAME = "expenses_session";
export const COOKIE_PATH = "/expenses";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

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

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: COOKIE_PATH, maxAge: 0 });
}

// Brute-force protection: after 5 wrong passwords from one IP, lock that IP out for
// 15 minutes. Needs Redis; if Redis is down we fail open so you can still get in.
function failKey(ip: string): string {
  return `wedding:expenses:fail:${ip}`;
}

export async function tooManyAttempts(ip: string): Promise<boolean> {
  if (!redisConfigured()) return false;
  try {
    const count = await redis<string | number | null>(["GET", failKey(ip)]);
    return Number(count ?? 0) >= MAX_FAILED_ATTEMPTS;
  } catch {
    return false;
  }
}

export async function recordFailure(ip: string): Promise<void> {
  if (!redisConfigured()) return;
  try {
    const count = await redis<number>(["INCR", failKey(ip)]);
    if (count === 1) await redis(["EXPIRE", failKey(ip), LOCKOUT_SECONDS]);
  } catch {
    // ignore
  }
}

export async function clearFailures(ip: string): Promise<void> {
  if (!redisConfigured()) return;
  try {
    await redis(["DEL", failKey(ip)]);
  } catch {
    // ignore
  }
}
