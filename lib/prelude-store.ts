import { supabase } from "./supabase";
import type { GuestRow, PreludeEvent } from "./prelude-types";

type GuestDb = { phone: string; name: string | null; created_at?: string };
type EventDb = {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string;
  venue: string;
  details: string;
  audience: string;
  sort_order: number;
  dress_code: string | null;
  location_url: string | null;
};

const toGuest = (r: GuestDb): GuestRow => ({
  phone: r.phone,
  name: r.name,
  createdAt: r.created_at,
});

const toEvent = (r: EventDb): PreludeEvent => ({
  id: r.id,
  title: r.title,
  date: r.event_date,
  time: r.event_time,
  venue: r.venue,
  details: r.details,
  audience: r.audience === "everyone" ? "everyone" : "guests",
  sortOrder: r.sort_order,
  dressCode: r.dress_code ?? "",
  locationUrl: r.location_url ?? "",
});

// ---- guests

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

// ---- events

export async function listEvents(): Promise<PreludeEvent[]> {
  const rows =
    (await supabase<EventDb[]>(
      "prelude_events?select=id,title,event_date,event_time,venue,details,audience,sort_order,dress_code,location_url&order=sort_order.asc,title.asc",
    )) ?? [];
  return rows.map(toEvent);
}

export async function putEvent(event: PreludeEvent): Promise<void> {
  await supabase("prelude_events?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      id: event.id,
      title: event.title,
      event_date: event.date,
      event_time: event.time,
      venue: event.venue,
      details: event.details,
      audience: event.audience,
      sort_order: event.sortOrder,
      dress_code: event.dressCode,
      location_url: event.locationUrl,
    },
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await supabase(`prelude_events?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}
