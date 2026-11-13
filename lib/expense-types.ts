// Pure types and validation. Safe to import from both server and client code.

export const CATEGORIES = [
  "Venue",
  "Catering",
  "Decor & Flowers",
  "Photography & Video",
  "Attire & Beauty",
  "Jewellery",
  "Invitations & Gifts",
  "Travel & Stay",
  "Music & Entertainment",
  "Rituals & Priest",
  "Miscellaneous",
] as const;

export type ExpenseStatus = "paid" | "pending";

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  paidBy: string;
  status: ExpenseStatus;
};

export type ExpenseInput = {
  id?: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paidBy: string;
  status: ExpenseStatus;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
export type LoginState = { error?: string } | undefined;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 1_000_000_000;

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

export function validateExpense(
  input: unknown,
): { ok: true; value: Omit<Expense, "id"> } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid expense." };
  }
  const raw = input as Record<string, unknown>;

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (!description) return { ok: false, error: "Add a description." };
  if (description.length > 120) {
    return { ok: false, error: "Description is too long (120 characters max)." };
  }

  const amount = typeof raw.amount === "number" ? raw.amount : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter an amount greater than 0." };
  }
  if (amount > MAX_AMOUNT) return { ok: false, error: "That amount is too large." };

  const date = typeof raw.date === "string" ? raw.date : "";
  if (!isRealDate(date)) return { ok: false, error: "Pick a valid date." };

  const category = typeof raw.category === "string" ? raw.category : "";
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: "Pick a category." };
  }

  const paidBy = typeof raw.paidBy === "string" ? raw.paidBy.trim() : "";
  if (paidBy.length > 60) return { ok: false, error: "'Paid by' is too long." };

  const status = raw.status === "pending" ? "pending" : raw.status === "paid" ? "paid" : null;
  if (!status) return { ok: false, error: "Pick paid or pending." };

  return {
    ok: true,
    value: {
      date,
      description,
      category,
      // Keep to 2 decimal places.
      amount: Math.round(amount * 100) / 100,
      paidBy,
      status,
    },
  };
}

export function validateBudget(
  value: unknown,
): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Enter a budget of 0 or more." };
  }
  if (value > MAX_AMOUNT * 10) return { ok: false, error: "That budget is too large." };
  return { ok: true, value: Math.round(value * 100) / 100 };
}
