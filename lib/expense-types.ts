// Pure types and validation. Safe to import from both server and client code.

// Fixed total wedding budget: ₹25,00,000 (25 lakh). Not editable in the app.
export const WEDDING_BUDGET = 2500000;

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
  // YYYY-MM-DD. Required when paid (the date it was paid). Null while pending.
  date: string | null;
  description: string;
  category: string;
  amount: number;
  paidBy: string;
  status: ExpenseStatus;
  remarks: string;
};

export type ExpenseInput = {
  id?: string;
  date: string | null;
  description: string;
  category: string;
  amount: number;
  paidBy: string;
  status: ExpenseStatus;
  remarks?: string;
  // Only for a NEW paid expense: the amount still to pay. It is saved as its own pending row.
  balance?: number | null;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
export type LoginState = { error?: string } | undefined;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 1_000_000_000;
const MAX_REMARKS = 280;

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

type Validated =
  | { ok: true; value: Omit<Expense, "id">; balance: number | null }
  | { ok: false; error: string };

export function validateExpense(input: unknown): Validated {
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
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Enter an amount of 0 or more." };
  }
  if (amount > MAX_AMOUNT) return { ok: false, error: "That amount is too large." };

  const category = typeof raw.category === "string" ? raw.category : "";
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: "Pick a category." };
  }

  const paidBy = typeof raw.paidBy === "string" ? raw.paidBy.trim() : "";
  if (paidBy.length > 60) return { ok: false, error: "'Paid by' is too long." };

  const status = raw.status === "pending" ? "pending" : raw.status === "paid" ? "paid" : null;
  if (!status) return { ok: false, error: "Pick paid or pending." };

  const remarks = typeof raw.remarks === "string" ? raw.remarks.trim() : "";
  if (remarks.length > MAX_REMARKS) {
    return { ok: false, error: `Remarks can be up to ${MAX_REMARKS} characters.` };
  }

  let balance: number | null = null;
  if (raw.balance !== undefined && raw.balance !== null) {
    const b = raw.balance;
    if (typeof b !== "number" || !Number.isFinite(b) || b <= 0) {
      return { ok: false, error: "Enter a balance greater than 0, or leave it empty." };
    }
    if (b > MAX_AMOUNT) return { ok: false, error: "That balance is too large." };
    if (status !== "paid") {
      return { ok: false, error: "A balance can only be added to a paid expense." };
    }
    balance = Math.round(b * 100) / 100;
  }

  // Zero paid is only valid when a balance is entered: then only the pending row is saved.
  if (amount === 0 && balance === null) {
    return { ok: false, error: "Enter the amount paid, or add a balance still to pay." };
  }

  // Nothing paid yet (amount 0 with a balance): only the pending row is saved, so no date.
  const nothingPaid = amount === 0 && balance !== null;

  // Paid needs the date it was paid. Pending has no date yet, so it stays empty.
  const rawDate = typeof raw.date === "string" ? raw.date : "";
  let date: string | null;
  if (status === "paid" && !nothingPaid) {
    if (!isRealDate(rawDate)) return { ok: false, error: "Enter the date it was paid." };
    date = rawDate;
  } else if (rawDate === "") {
    date = null;
  } else if (isRealDate(rawDate)) {
    date = rawDate;
  } else {
    return { ok: false, error: "Pick a valid date, or leave it empty." };
  }


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
      remarks,
    },
    balance,
  };
}
