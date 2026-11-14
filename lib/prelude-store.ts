import { supabase } from "./supabase";
import type { GuestRow } from "./prelude-types";

// Only the guest list is stored in the database. Events are in lib/prelude-events.ts.
type GuestDb = { phone: string; name: string | null; created_at?: string };

const toGuest = (r: GuestDb): GuestRow => ({
  phone: r.phone,
  name: r.name,
  createdAt: r.created_at,
});

export async function findGuest(phone: string): Promise<GuestRow | null> {
  const rows = await supabase<GuestDb[]>(
    `prelude_guests?phone=eq.${phone}&select=phone,name,created_at`,
  );
  return rows?.[0] ? toGuest(rows[0]) : null;
}

// Saves the name the guest typed, but only the first time (so a later visit can't rename them).
export async function tagGuestName(phone: string, name: string): Promise<void> {
  await supabase(`prelude_guests?phone=eq.${phone}&name=is.null`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { name },
  });
}

export async function listGuests(): Promise<GuestRow[]> {
  const rows =
    (await supabase<GuestDb[]>(
      "prelude_guests?select=phone,name,created_at&order=created_at.desc&limit=2000",
    )) ?? [];
  return rows.map(toGuest);
}

// Adds new numbers. Numbers already on the list are left as they are.
export async function addGuests(phones: string[]): Promise<void> {
  if (phones.length === 0) return;
  await supabase("prelude_guests?on_conflict=phone", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: phones.map((phone) => ({ phone })),
  });
}

export async function deleteGuest(phone: string): Promise<void> {
  await supabase(`prelude_guests?phone=eq.${phone}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}
