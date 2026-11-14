import { createHmac, timingSafeEqual } from "node:crypto";

// Small HMAC-signed token helper: "<payload>.<signature>".
// The payload may contain dots, so the signature is taken after the last dot.

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function makeToken(payload: string, key: string): string {
  return `${payload}.${sign(payload, key)}`;
}

// Returns the payload if the signature is valid, otherwise null.
export function readToken(token: string | undefined | null, key: string): string | null {
  if (!token || !key) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = Buffer.from(sign(payload, key));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return payload;
}
