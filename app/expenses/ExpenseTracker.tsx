"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CATEGORIES,
  type Expense,
  type ExpenseStatus,
} from "../../lib/expense-types";
import { removeExpense, saveExpense } from "./actions";

type Props = {
  expenses: Expense[];
  budget: number;
  databaseConnected: boolean;
  loadError: boolean;
};

type FormState = {
  date: string;
  description: string;
  category: string;
  amount: string;
  paidBy: string;
  status: ExpenseStatus;
  remarks: string;
  balance: string;
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const SUGGESTED_PAYERS = ["Sai", "Harshitha", "Groom's side", "Bride's side"];

const inputClass =
  "w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";
const primaryButton =
  "rounded-full bg-maroon px-5 py-2 text-sm font-medium text-cream transition hover:bg-maroon/90 disabled:opacity-60";
const ghostButton =
  "rounded-full border border-gold/50 px-4 py-2 text-sm text-ink transition hover:bg-gold/10 disabled:opacity-60";
const cardClass = "rounded-2xl border border-gold/30 bg-white/60 p-4 sm:p-5";

function today(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in the user's timezone
}

function formatDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emptyForm(): FormState {
  return {
    date: "",
    description: "",
    category: CATEGORIES[0],
    amount: "",
    paidBy: "",
    status: "paid",
    remarks: "",
    balance: "",
  };
}

// Spreadsheet apps run text that starts with = + - @ as a formula, so neutralise it.
function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: Expense[]) {
  const header = ["Date", "Description", "Category", "Amount (INR)", "Paid by", "Status", "Remarks"];
  const lines = rows.map((e) =>
    [e.date, e.description, e.category, e.amount, e.paidBy, e.status, e.remarks]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wedding-expenses-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExpenseTracker({
  expenses,
  budget,
  databaseConnected,
  loadError,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ExpenseStatus>("all");

  // Set the default date after mount so server and browser timezones can't disagree.
  useEffect(() => {
    setForm((f) => (f.date ? f : { ...f, date: today() }));
  }, []);

  const totals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    const byCategory = new Map<string, number>();
    const byPayer = new Map<string, number>();
    for (const e of expenses) {
      if (e.status === "paid") paid += e.amount;
      else pending += e.amount;
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
      const payer = e.paidBy || "Unspecified";
      byPayer.set(payer, (byPayer.get(payer) ?? 0) + e.amount);
    }
    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]);
    return {
      paid,
      pending,
      committed: paid + pending,
      categories: sortDesc(byCategory),
      payers: sortDesc(byPayer),
    };
  }, [expenses]);

  const payerOptions = useMemo(() => {
    const set = new Set(SUGGESTED_PAYERS);
    for (const e of expenses) if (e.paidBy) set.add(e.paidBy);
    return [...set];
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (
        q &&
        !`${e.description} ${e.paidBy} ${e.category} ${e.remarks}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [expenses, query, categoryFilter, statusFilter]);

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  const remaining = budget - totals.committed;
  const overBudget = budget > 0 && remaining < 0;
  const paidPct = budget > 0 ? Math.min(100, (totals.paid / budget) * 100) : 0;
  const pendingPct =
    budget > 0 ? Math.min(100 - paidPct, (totals.pending / budget) * 100) : 0;

  function resetForm() {
    setForm({ ...emptyForm(), date: today() });
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(e: Expense) {
    setEditingId(e.id);
    setFormError(null);
    setForm({
      date: e.date,
      description: e.description,
      category: e.category,
      amount: String(e.amount),
      paidBy: e.paidBy,
      status: e.status,
      remarks: e.remarks,
      balance: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const amount = Number(form.amount);
    // The balance only applies to a new paid expense; an empty field means no balance.
    const balance =
      !editingId && form.balance.trim() !== ""
        ? Number(form.balance)
        : null;
    startTransition(async () => {
      const result = await saveExpense({
        id: editingId ?? undefined,
        date: form.date,
        description: form.description,
        category: form.category,
        amount,
        paidBy: form.paidBy,
        status: form.status,
        remarks: form.remarks,
        balance,
      });
      if (result.ok) resetForm();
      else setFormError(result.error);
    });
  }

  function remove(e: Expense) {
    if (!window.confirm(`Delete "${e.description}"?`)) return;
    setListError(null);
    startTransition(async () => {
      const result = await removeExpense(e.id);
      if (!result.ok) setListError(result.error);
      else if (editingId === e.id) resetForm();
    });
  }

  function toggleStatus(e: Expense) {
    setListError(null);
    startTransition(async () => {
      const result = await saveExpense({
        ...e,
        status: e.status === "paid" ? "pending" : "paid",
      });
      if (!result.ok) setListError(result.error);
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Private</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-maroon sm:text-5xl">
            Wedding expenses
          </h1>
        </div>
      </header>

      {!databaseConnected ? (
        <p role="status" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The database isn&rsquo;t connected yet, so expenses can&rsquo;t be saved. Add the
          Supabase environment variables to this project in Vercel and redeploy.
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          Couldn&rsquo;t load your expenses. Refresh the page to try again.
        </p>
      ) : null}

      {/* Summary */}
      <section aria-label="Summary" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wider text-ink/60">Budget</p>
          <p className="mt-1 font-display text-2xl text-ink">{inr.format(budget)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wider text-ink/60">Paid</p>
          <p className="mt-1 font-display text-2xl text-emerald-800">{inr.format(totals.paid)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wider text-ink/60">Pending</p>
          <p className="mt-1 font-display text-2xl text-amber-800">{inr.format(totals.pending)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-wider text-ink/60">
            {overBudget ? "Over budget" : "Remaining"}
          </p>
          <p
            className={`mt-1 font-display text-2xl ${overBudget ? "text-red-700" : "text-ink"}`}
          >
            {inr.format(Math.abs(remaining))}
          </p>
        </div>
      </section>

      {budget > 0 ? (
        <div className="mt-4">
          <div
            className="flex h-3 overflow-hidden rounded-full bg-gold/15"
            role="img"
            aria-label={`${Math.round(paidPct)}% of budget paid, ${Math.round(pendingPct)}% pending`}
          >
            <div className="bg-emerald-600" style={{ width: `${paidPct}%` }} />
            <div className="bg-amber-400" style={{ width: `${pendingPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-ink/60">
            {Math.round((totals.committed / budget) * 100)}% of budget committed
            (paid + pending)
          </p>
        </div>
      ) : null}

      {/* Breakdown */}
      {totals.categories.length > 0 ? (
        <section aria-label="Breakdown" className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className={cardClass}>
            <h2 className="font-display text-2xl text-maroon">By category</h2>
            <ul className="mt-3 space-y-3">
              {totals.categories.map(([name, amount]) => (
                <li key={name}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{name}</span>
                    <span className="tabular-nums text-ink/80">{inr.format(amount)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gold/15">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${(amount / totals.committed) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className={cardClass}>
            <h2 className="font-display text-2xl text-maroon">Who paid</h2>
            <ul className="mt-3 divide-y divide-gold/20">
              {totals.payers.map(([name, amount]) => (
                <li key={name} className="flex justify-between gap-3 py-2 text-sm">
                  <span>{name}</span>
                  <span className="tabular-nums text-ink/80">{inr.format(amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Add / edit */}
      <section aria-label="Add expense" className={`${cardClass} mt-8`}>
        <h2 className="font-display text-2xl text-maroon">
          {editingId ? "Edit expense" : "Add an expense"}
        </h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="description" className="mb-1 block text-xs text-ink/60">
              Description
            </label>
            <input
              id="description"
              required
              maxLength={120}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Venue advance"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="category" className="mb-1 block text-xs text-ink/60">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="amount" className="mb-1 block text-xs text-ink/60">
              Amount (₹)
            </label>
            <input
              id="amount"
              required
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="date" className="mb-1 block text-xs text-ink/60">
              Date
            </label>
            <input
              id="date"
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="paidBy" className="mb-1 block text-xs text-ink/60">
              Paid by
            </label>
            <input
              id="paidBy"
              list="payers"
              maxLength={60}
              value={form.paidBy}
              onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
              placeholder="Optional"
              className={inputClass}
            />
            <datalist id="payers">
              {payerOptions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className={!editingId ? "sm:col-span-3" : "sm:col-span-6"}>
            <label htmlFor="remarks" className="mb-1 block text-xs text-ink/60">
              Remarks (optional)
            </label>
            <input
              id="remarks"
              maxLength={280}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. Paid by cheque, advance for 200 guests"
              className={inputClass}
            />
          </div>

          {!editingId ? (
            <div className="sm:col-span-3">
              <label htmlFor="balance" className="mb-1 block text-xs text-ink/60">
                Balance still to pay (₹, optional)
              </label>
              <input
                id="balance"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                placeholder="Adds a separate pending row"
                className={inputClass}
              />
            </div>
          ) : null}

          {formError ? (
            <p role="alert" className="text-sm text-maroon sm:col-span-6">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-2 sm:col-span-6">
            <button type="submit" disabled={isPending || !databaseConnected} className={primaryButton}>
              {isPending ? "Saving..." : editingId ? "Update expense" : "Add expense"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className={ghostButton}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {/* List */}
      <section aria-label="All expenses" className={`${cardClass} mt-8`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-maroon">All expenses</h2>
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
            className={ghostButton}
          >
            Download CSV
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <input
            type="search"
            aria-label="Search expenses"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className={inputClass}
          />
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ExpenseStatus)}
            className={inputClass}
          >
            <option value="all">Paid and pending</option>
            <option value="paid">Paid only</option>
            <option value="pending">Pending only</option>
          </select>
        </div>

        {listError ? (
          <p role="alert" className="mt-3 text-sm text-maroon">
            {listError}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/60">
            {expenses.length === 0
              ? "No expenses yet. Add your first one above."
              : "Nothing matches these filters."}
          </p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-gold/20">
              {filtered.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="break-words font-medium">{e.description}</p>
                    <p className="text-xs text-ink/60">
                      {formatDate(e.date)} · {e.category}
                      {e.paidBy ? ` · ${e.paidBy}` : ""}
                    </p>
                    {e.remarks ? (
                      <p className="mt-0.5 break-words text-xs italic text-ink/70">{e.remarks}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(e)}
                      disabled={isPending}
                      title="Tap to switch between paid and pending"
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        e.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {e.status === "paid" ? "Paid" : "Pending"}
                    </button>
                    <p className="min-w-[6.5rem] text-right font-medium tabular-nums">
                      {inr.format(e.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      className="text-sm text-maroon underline-offset-2 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e)}
                      disabled={isPending}
                      className="text-sm text-ink/60 underline-offset-2 hover:text-maroon hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-gold/20 pt-3 text-right text-sm text-ink/70">
              {filtered.length} {filtered.length === 1 ? "expense" : "expenses"} ·{" "}
              <span className="font-medium tabular-nums text-ink">{inr.format(filteredTotal)}</span>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
