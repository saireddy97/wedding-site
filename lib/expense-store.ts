import { redis } from "./redis";
import type { Expense } from "./expense-types";

const EXPENSES_KEY = "wedding:expenses";
const BUDGET_KEY = "wedding:expenses:budget";

// Each expense is one field in a Redis hash, so two people editing at once
// never overwrite each other's changes.
export async function listExpenses(): Promise<Expense[]> {
  const flat = (await redis<string[]>(["HGETALL", EXPENSES_KEY])) ?? [];
  const expenses: Expense[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    try {
      expenses.push(JSON.parse(flat[i]) as Expense);
    } catch {
      // Skip a corrupted entry rather than breaking the whole page.
    }
  }
  return expenses.sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
}

export async function putExpense(expense: Expense): Promise<void> {
  await redis(["HSET", EXPENSES_KEY, expense.id, JSON.stringify(expense)]);
}

export async function deleteExpense(id: string): Promise<void> {
  await redis(["HDEL", EXPENSES_KEY, id]);
}

export async function getBudget(): Promise<number> {
  const value = await redis<string | null>(["GET", BUDGET_KEY]);
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function setBudget(amount: number): Promise<void> {
  await redis(["SET", BUDGET_KEY, String(amount)]);
}
