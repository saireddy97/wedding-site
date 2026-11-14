import { supabase } from "./supabase";
import type { Expense } from "./expense-types";

type Row = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number | string;
  paid_by: string | null;
  status: string;
};

const BUDGET_KEY = "expenses_budget";

function toExpense(row: Row): Expense {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    paidBy: row.paid_by ?? "",
    status: row.status === "pending" ? "pending" : "paid",
  };
}

export async function listExpenses(): Promise<Expense[]> {
  const rows =
    (await supabase<Row[]>(
      "expenses?select=id,date,description,category,amount,paid_by,status&order=date.desc,created_at.desc&limit=5000",
    )) ?? [];
  return rows.map(toExpense);
}

// Insert, or update if the id already exists.
export async function putExpense(expense: Expense): Promise<void> {
  await supabase("expenses?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      id: expense.id,
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      paid_by: expense.paidBy,
      status: expense.status,
    },
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await supabase(`expenses?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

export async function getBudget(): Promise<number> {
  const rows = await supabase<{ value: string }[]>(
    `settings?key=eq.${BUDGET_KEY}&select=value`,
  );
  const n = Number(rows?.[0]?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function setBudget(amount: number): Promise<void> {
  await supabase("settings?on_conflict=key", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: { key: BUDGET_KEY, value: String(amount) },
  });
}
