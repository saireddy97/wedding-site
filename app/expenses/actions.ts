"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  clearFailures,
  isAuthed,
  isConfigured,
  passwordMatches,
  recordFailure,
  setSession,
  tooManyAttempts,
} from "../../lib/auth";
import { databaseConfigured } from "../../lib/supabase";
import { deleteExpense, putExpenses } from "../../lib/expense-store";
import {
  validateExpense,
  type ActionResult,
  type Expense,
  type ExpenseInput,
  type LoginState,
} from "../../lib/expense-types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ID_RE = /^[A-Za-z0-9-]{8,64}$/;

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

// Every write checks the session again on the server, so the page being hidden
// in the browser is never the only protection.
async function guard(): Promise<string | null> {
  if (!(await isAuthed())) return "Your session expired. Please sign in again.";
  if (!databaseConfigured()) return "The database isn't connected yet.";
  return null;
}

export async function saveExpense(input: ExpenseInput): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };

  const parsed = validateExpense(input);
  if (!parsed.ok) return parsed;

  const editing = typeof input.id === "string" && ID_RE.test(input.id);
  if (editing && parsed.balance !== null) {
    return { ok: false, error: "Add the balance when you create the expense, not when editing it." };
  }

  const id = editing ? (input.id as string) : randomUUID();
  const rows: Expense[] = [];

  if (!editing && parsed.balance !== null && parsed.value.amount === 0) {
    // Nothing paid yet: save only the pending row, not a ₹0 paid row.
    rows.push({
      ...parsed.value,
      id: randomUUID(),
      status: "pending",
      amount: parsed.balance,
    });
  } else {
    rows.push({ id, ...parsed.value });

    // A paid expense with a balance also creates a pending row for the rest.
    if (!editing && parsed.balance !== null) {
      const base =
        parsed.value.description.length > 100
          ? parsed.value.description.slice(0, 100)
          : parsed.value.description;
      rows.push({
        id: randomUUID(),
        date: parsed.value.date,
        description: `${base} (balance)`,
        category: parsed.value.category,
        amount: parsed.balance,
        paidBy: "",
        status: "pending",
        remarks: "",
      });
    }
  }

  try {
    await putExpenses(rows);
  } catch {
    return { ok: false, error: "Couldn't save. Please try again." };
  }
  revalidatePath("/expenses");
  return { ok: true };
}

export async function removeExpense(id: string): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return { ok: false, error: blocked };
  if (typeof id !== "string" || !ID_RE.test(id)) {
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
