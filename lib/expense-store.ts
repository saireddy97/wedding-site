import { supabase } from "./supabase";
import type { Expense } from "./expense-types";

type Row = {
  id: string;
  date: string | null;
  description: string;
  category: string;
  amount: number | string;
  paid_by: string | null;
  status: string;
  remarks: string | null;
};

function toExpense(row: Row): Expense {
  return {
    id: row.id,
    date: row.date ?? null,
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    paidBy: row.paid_by ?? "",
    status: row.status === "pending" ? "pending" : "paid",
    remarks: row.remarks ?? "",
  };
}

function toRow(e: Expense) {
  return {
    id: e.id,
    date: e.date,
    description: e.description,
    category: e.category,
    amount: e.amount,
    paid_by: e.paidBy,
    status: e.status,
    remarks: e.remarks,
  };
}

export async function listExpenses(): Promise<Expense[]> {
  const rows =
    (await supabase<Row[]>(
      "expenses?select=id,date,description,category,amount,paid_by,status,remarks&order=date.desc,created_at.desc&limit=5000",
    )) ?? [];
  return rows.map(toExpense);
}

// Inserts or updates one or more rows in a single request, so a paid expense and
// its balance row are saved together or not at all.
export async function putExpenses(expenses: Expense[]): Promise<void> {
  await supabase("expenses?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: expenses.map(toRow),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await supabase(`expenses?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}
