import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { makeToken, readToken } from "./signed-token";

// Sessions for the pre-wedding page.
// - Guest session: remembers which invited phone number signed in (90 days).
// - Admin session: for the admin page, signed with PRELUDE_ADMIN_PASSWORD (12 hours).
// Both cookies are httpOnly, so the browser's scripts can't read them.

const GUEST_COOKIE = "prelude_guest";
const ADMIN_COOKIE = "prelude_admin";
const COOKIE_PATH = "/prelude";
const GUEST_MAX_AGE = 60 * 60 * 24 * 90;
const ADMIN_MAX_AGE = 60 * 60 * 12;

function guestKey(): string {
  return process.env.PRELUDE_SESSION_SECRET ?? "";
}

function adminKey(): string {
  return process.env.PRELUDE_ADMIN_PASSWORD ?? "";
}

export function preludeConfigured(): boolean {
  return Boolean(guestKey());
}

export function adminConfigured(): boolean {
  return Boolean(adminKey());
}

export function adminPasswordMatches(input: string): boolean {
  const expected = adminKey();
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function readPayload(token: string | undefined, key: string, kind: "g" | "a") {
  const payload = readToken(token, key);
  if (!payload) return null;
  const [k, value, expiry] = payload.split(":");
  if (k !== kind || !value) return null;
  if (kind === "a") return Date.now() < Number(value) ? value : null;
  return Date.now() < Number(expiry) ? value : null;
}

// ---- guest

export async function currentGuestPhone(): Promise<string | null> {
  const jar = await cookies();
  return readPayload(jar.get(GUEST_COOKIE)?.value, guestKey(), "g");
}

export async function setGuestSession(phone: string): Promise<void> {
  const jar = await cookies();
  const expires = Date.now() + GUEST_MAX_AGE * 1000;
  jar.set(GUEST_COOKIE, makeToken(`g:${phone}:${expires}`, guestKey()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: GUEST_MAX_AGE,
  });
}

// ---- admin

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const payload = readToken(token, adminKey());
  if (!payload) return false;
  const [k, expiry] = payload.split(":");
  return k === "a" && Date.now() < Number(expiry);
}

export async function setAdminSession(): Promise<void> {
  const jar = await cookies();
  const expires = Date.now() + ADMIN_MAX_AGE * 1000;
  jar.set(ADMIN_COOKIE, makeToken(`a:${expires}`, adminKey()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: ADMIN_MAX_AGE,
  });
}
