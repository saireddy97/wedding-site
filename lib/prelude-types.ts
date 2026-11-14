// Types and phone helpers for the pre-wedding page. Safe for server and client code.

export const AUDIENCES = ["everyone", "guests"] as const;
export type Audience = (typeof AUDIENCES)[number];

// "everyone" events are shown to all visitors (the main events).
// "guests" events are shown only to guests on the list who have signed in.
export type PreludeEvent = {
  id: string;
  title: string;
  date: string | null; // YYYY-MM-DD, null = to be announced
  time: string;
  venue: string;
  details: string;
  dressCode: string;
  locationUrl: string; // https link, e.g. a Google Maps link
  audience: Audience;
  sortOrder: number;
};

export type GuestRow = {
  phone: string;
  name: string | null;
  createdAt?: string;
};

export type GuestState = { error?: string; note?: string } | undefined;
export type AdminState = { error?: string } | undefined;

export type ActionResult = { ok: true } | { ok: false; error: string };

// Accepts 10 digits, or the same with +91 / 91 / 0 in front. Returns the 10 digits.
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

// Splits pasted numbers on new lines, commas or semicolons.
export function parsePhoneList(text: string): { phones: string[]; invalid: string[] } {
  const tokens = text
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const phones = new Set<string>();
  const invalid: string[] = [];
  for (const token of tokens) {
    const phone = normalizePhone(token);
    if (phone) phones.add(phone);
    else invalid.push(token);
  }
  return { phones: [...phones], invalid };
}
