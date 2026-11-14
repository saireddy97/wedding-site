"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearFailures, recordFailure, tooManyAttempts } from "../../lib/auth";
import { databaseConfigured } from "../../lib/supabase";
import { findGuest, tagGuestName } from "../../lib/prelude-store";
import { normalizePhone, type GuestState } from "../../lib/prelude-types";
import { preludeConfigured, setGuestSession } from "../../lib/prelude-auth";

async function clientKey(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return `prelude:${ip}`;
}

export async function loginGuest(_prev: GuestState, formData: FormData): Promise<GuestState> {
  if (!preludeConfigured() || !databaseConfigured()) {
    return { error: "This page isn't set up yet." };
  }

  const key = await clientKey();
  if (await tooManyAttempts(key)) {
    return { error: "Too many tries. Please wait 15 minutes and try again." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { error: "Enter your name." };

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: "Enter a valid 10-digit mobile number." };

  let guest;
  try {
    guest = await findGuest(phone);
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  if (!guest) {
    await recordFailure(key);
    return {
      note: "That number isn't on the guest list. Here are the main events.",
    };
  }

  await clearFailures(key);
  if (!guest.name) {
    try {
      await tagGuestName(phone, name);
    } catch {
      // Not critical: the guest can still see their events.
    }
  }
  await setGuestSession(phone);
  redirect("/prelude");
}
