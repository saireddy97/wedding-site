"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  clearFailures,
  clearSession,
  isAuthed,
  isConfigured,
  passwordMatches,
  recordFailure,
  setSession,
  tooManyAttempts,
} from "../../lib/auth";
import { redisConfigured } from "../../lib/redis";
import {
  deleteExpense,
  putExpense,
  setBudget,
} from "../../lib/expense-store";
import {
  validateBudget,
  validateExpense,
  type ActionResult,
  type ExpenseInput,
  type LoginState,
} from "../../lib/expense-types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isConfigured()) return { error: "This page isn't set up yet." };

  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";

  if (await tooManyAttempts(ip)) {
    return { error: "Too many wrong attempts. Please try again in 15 minutes." };
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await recordFailure(ip);
    await sleep(700); // slow down guessing
    return { error: "Incorrect password." };
  }

  await clearFailures(ip);
  await setSession();
  redirect("/expenses");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/expenses");
}

// Every write checks the session again on the server, so the page being hidden
// in the browser is never the only protection.
async function guard(): Promise<string | null> {
  if (!(await isAuthed())) return "Your session expired. Please sign in again.";
  if (!redisConfigured()) return "The database isn't connected yet.";
  return null;
}

export async function saveExpense(input: ExpenseInput): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };

  const parsed = validateExpense(input);
  if (!parsed.ok) return parsed;

  const id =
    typeof input.id === "string" && /^[A-Za-z0-9-]{8,64}$/.test(input.id)
      ? input.id
      : randomUUID();

  try {
    await putExpense({ id, ...parsed.value });
  } catch {
    return { ok: false, error: "Couldn't save. Please try again." };
  }
  revalidatePath("/expenses");
  return { ok: true };
}

export async function removeExpense(id: string): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };
  if (typeof id !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    return { ok: false, error: "Invalid expense." };
  }

  try {
    await deleteExpense(id);
  } catch {
    return { ok: false, error: "Couldn't delete. Please try again." };
  }
  revalidatePath("/expenses");
  return { ok: true };
}

export async function saveBudget(amount: number): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };

  const parsed = validateBudget(amount);
  if (!parsed.ok) return parsed;

  try {
    await setBudget(parsed.value);
  } catch {
    return { ok: false, error: "Couldn't save the budget. Please try again." };
  }
  revalidatePath("/expenses");
  return { ok: true };
}
