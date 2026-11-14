"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearFailures, recordFailure, tooManyAttempts } from "../../../lib/auth";
import { databaseConfigured } from "../../../lib/supabase";
import {
  addGuests,
  deleteEvent,
  deleteGuest,
  putEvent,
} from "../../../lib/prelude-store";
import {
  parsePhoneList,
  validateEvent,
  type ActionResult,
  type AdminState,
} from "../../../lib/prelude-types";
import {
  adminConfigured,
  adminPasswordMatches,
  isAdmin,
  setAdminSession,
} from "../../../lib/prelude-auth";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ID_RE = /^[0-9a-f-]{36}$/i;
const MAX_PASTE = 20000;

async function clientKey(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return `prelude-admin:${ip}`;
}

export async function adminLogin(_prev: AdminState, formData: FormData): Promise<AdminState> {
  if (!adminConfigured()) return { error: "Admin isn't set up yet." };

  const key = await clientKey();
  if (await tooManyAttempts(key)) {
    return { error: "Too many wrong attempts. Please try again in 15 minutes." };
  }

  const password = String(formData.get("password") ?? "");
  if (!adminPasswordMatches(password)) {
    await recordFailure(key);
    await sleep(700);
    return { error: "Incorrect password." };
  }

  await clearFailures(key);
  await setAdminSession();
  redirect("/prelude/admin");
}

// Every admin action checks the session again on the server.
async function guard(): Promise<string | null> {
  if (!(await isAdmin())) return "Your session expired. Please sign in again.";
  if (!databaseConfigured()) return "The database isn't connected yet.";
  return null;
}

export async function addGuestsAction(
  text: string,
): Promise<{ ok: true; saved: number; invalid: string[] } | { ok: false; error: string }> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };
  if (typeof text !== "string" || text.length > MAX_PASTE) {
    return { ok: false, error: "That list is too long. Paste it in smaller batches." };
  }

  const { phones, invalid } = parsePhoneList(text);
  if (phones.length === 0) {
    return { ok: false, error: "No valid 10-digit numbers found." };
  }

  try {
    await addGuests(phones);
  } catch {
    return { ok: false, error: "Couldn't save the numbers. Please try again." };
  }
  revalidatePath("/prelude");
  revalidatePath("/prelude/admin");
  return { ok: true, saved: phones.length, invalid };
}

export async function removeGuestAction(phone: string): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };
  if (typeof phone !== "string" || !/^[0-9]{10}$/.test(phone)) {
    return { ok: false, error: "Invalid number." };
  }
  try {
    await deleteGuest(phone);
  } catch {
    return { ok: false, error: "Couldn't remove that guest. Please try again." };
  }
  revalidatePath("/prelude/admin");
  revalidatePath("/prelude");
  return { ok: true };
}

export async function saveEventAction(input: unknown): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };

  const parsed = validateEvent(input);
  if (!parsed.ok) return parsed;

  const rawId = typeof (input as { id?: unknown })?.id === "string" ? (input as { id: string }).id : "";
  const id = ID_RE.test(rawId) ? rawId : randomUUID();

  try {
    await putEvent({ id, ...parsed.value });
  } catch {
    return { ok: false, error: "Couldn't save the event. Please try again." };
  }
  revalidatePath("/prelude");
  revalidatePath("/prelude/admin");
  return { ok: true };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };
  if (typeof id !== "string" || !ID_RE.test(id)) return { ok: false, error: "Invalid event." };
  try {
    await deleteEvent(id);
  } catch {
    return { ok: false, error: "Couldn't delete the event. Please try again." };
  }
  revalidatePath("/prelude");
  revalidatePath("/prelude/admin");
  return { ok: true };
}
