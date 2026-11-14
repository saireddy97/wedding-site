import type { Metadata } from "next";
import { isAuthed, isConfigured } from "../../lib/auth";
import { databaseConfigured } from "../../lib/supabase";
import { getBudget, listExpenses } from "../../lib/expense-store";
import type { Expense } from "../../lib/expense-types";
import ExpenseTracker from "./ExpenseTracker";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Expenses",
  robots: { index: false, follow: false },
};

// Depends on the cookie and live data, so never cache or pre-render it.
export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  if (!isConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-display text-2xl italic text-ink/70">
          This page isn&rsquo;t available yet.
        </p>
      </main>
    );
  }

  // The expense data is only ever fetched after the password check passes.
  if (!(await isAuthed())) return <LoginForm />;

  const databaseConnected = databaseConfigured();
  let expenses: Expense[] = [];
  let budget = 0;
  let loadError = false;

  if (databaseConnected) {
    try {
      [expenses, budget] = await Promise.all([listExpenses(), getBudget()]);
    } catch {
      loadError = true;
    }
  }

  return (
    <ExpenseTracker
      expenses={expenses}
      budget={budget}
      databaseConnected={databaseConnected}
      loadError={loadError}
    />
  );
}
