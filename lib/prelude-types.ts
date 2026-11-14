// Pure types and validation for the pre-wedding page. Safe for server and client code.

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

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

export type EventInput = Omit<PreludeEvent, "id"> & { id?: string };

export function validateEvent(
  input: unknown,
): { ok: true; value: Omit<PreludeEvent, "id"> } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Invalid event." };
  const raw = input as Record<string, unknown>;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return { ok: false, error: "Add a title." };
  if (title.length > 80) return { ok: false, error: "Title is too long (80 characters max)." };

  const rawDate = typeof raw.date === "string" ? raw.date : "";
  let date: string | null = null;
  if (rawDate !== "") {
    if (!isRealDate(rawDate)) return { ok: false, error: "Pick a valid date, or leave it empty." };
    date = rawDate;
  }

  const time = typeof raw.time === "string" ? raw.time.trim() : "";
  if (time.length > 40) return { ok: false, error: "Time is too long." };

  const venue = typeof raw.venue === "string" ? raw.venue.trim() : "";
  if (venue.length > 120) return { ok: false, error: "Venue is too long." };

  const details = typeof raw.details === "string" ? raw.details.trim() : "";
  if (details.length > 500) return { ok: false, error: "Details are too long (500 characters max)." };

  const dressCode = typeof raw.dressCode === "string" ? raw.dressCode.trim() : "";
  if (dressCode.length > 120) return { ok: false, error: "Dress code is too long." };

  const locationUrl = typeof raw.locationUrl === "string" ? raw.locationUrl.trim() : "";
  if (locationUrl.length > 300) return { ok: false, error: "Location link is too long." };
  if (locationUrl !== "" && !/^https:\/\//i.test(locationUrl)) {
    return { ok: false, error: "The location link must start with https://" };
  }

  if (raw.audience !== "everyone" && raw.audience !== "guests") {
    return { ok: false, error: "Pick who can see this event." };
  }

  const sortOrder =
    typeof raw.sortOrder === "number" && Number.isInteger(raw.sortOrder) ? raw.sortOrder : 0;
  if (sortOrder < 0 || sortOrder > 999) return { ok: false, error: "Order must be between 0 and 999." };

  return {
    ok: true,
    value: {
      title,
      date,
      time,
      venue,
      details,
      dressCode,
      locationUrl,
      audience: raw.audience,
      sortOrder,
    },
  };
}
