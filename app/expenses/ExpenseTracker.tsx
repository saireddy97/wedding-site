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

type AddForm = {
  date: string;
  description: string;
  category: string;
  amount: string;
  paidBy: string;
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

function formatDate(value: string | null): string {
  if (!value) return "No date yet";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emptyAddForm(): AddForm {
  return {
    date: today(),
    description: "",
    category: CATEGORIES[0],
    amount: "",
    paidBy: "",
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
    [e.date ?? "", e.description, e.category, e.amount, e.paidBy, e.status, e.remarks]
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

// Edits one expense in place, in its row. Status is changed from the badge, not here.
function InlineEditor({
  expense,
  onDone,
  payerOptions,
}: {
  expense: Expense;
  onDone: () => void;
  payerOptions: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState(expense.date ?? "");
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [remarks, setRemarks] = useState(expense.remarks);

  // A paid expense needs who paid and the date. A pending one has neither yet.
  const detailsRequired = expense.status === "paid" && Number(amount) > 0;

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveExpense({
        id: expense.id,
        date: date || null,
        description,
        category,
        amount: Number(amount),
        paidBy,
        status: expense.status,
        remarks,
      });
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  const listId = `payers-edit-${expense.id}`;

  return (
    <form onSubmit={save} className="grid gap-3 rounded-xl bg-gold/10 p-3 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <label className="mb-1 block text-xs text-ink/60">Description</label>
        <input
          required
          maxLength={120}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-3">
        <label className="mb-1 block text-xs text-ink/60">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-ink/60">Amount (₹)</label>
        <input
          required
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-ink/60">Date paid</label>
        <input
          type="date"
          required={detailsRequired}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-ink/60">Paid by</label>
        <input
          list={listId}
          maxLength={60}
          required={detailsRequired}
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          placeholder={detailsRequired ? "Required" : "Optional"}
          className={inputClass}
        />
        <datalist id={listId}>
          {payerOptions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <div className="sm:col-span-6">
        <label className="mb-1 block text-xs text-ink/60">Remarks (optional)</label>
        <input
          maxLength={280}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className={inputClass}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-maroon sm:col-span-6">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 sm:col-span-6">
        <button type="submit" disabled={isPending} className={primaryButton}>
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onDone} disabled={isPending} className={ghostButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ExpenseTracker({
  expenses,
  budget,
  databaseConnected,
  loadError,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AddForm>(emptyAddForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Which row is open for editing.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Marking a pending expense as paid asks for who paid and the date first.
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState("");
  const [payBy, setPayBy] = useState("");

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

  // New expenses are always saved as paid. A balance adds a pending row with no date.
  const addDetailsRequired = Number(form.amount) > 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const balance = form.balance.trim() !== "" ? Number(form.balance) : null;
    startTransition(async () => {
      const result = await saveExpense({
        date: form.date || null,
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        paidBy: form.paidBy,
        status: "paid",
        remarks: form.remarks,
        balance,
      });
      if (result.ok) setForm(emptyAddForm());
      else setFormError(result.error);
    });
  }

  function remove(e: Expense) {
    if (!window.confirm(`Delete "${e.description}"?`)) return;
    setListError(null);
    startTransition(async () => {
      const result = await removeExpense(e.id);
      if (!result.ok) setListError(result.error);
    });
  }

  // Paid -> pending clears the date and who paid, since nothing has been paid yet.
  function markPending(e: Expense) {
    setListError(null);
    startTransition(async () => {
      const result = await saveExpense({ ...e, status: "pending", date: null, paidBy: "" });
      if (!result.ok) setListError(result.error);
    });
  }

  // Pending -> paid needs who paid and the date, so it is saved only after you enter both.
  function confirmPaid(e: Expense) {
    const who = payBy.trim();
    if (!who) {
      setListError("Enter who paid.");
      return;
    }
    if (!payDate) {
      setListError("Enter the date it was paid.");
      return;
    }
    setListError(null);
    startTransition(async () => {
      const result = await saveExpense({ ...e, status: "paid", date: payDate, paidBy: who });
      if (!result.ok) {
        setListError(result.error);
      } else {
        setPayingId(null);
        setPayDate("");
        setPayBy("");
      }
    });
  }

  function togglePaying(e: Expense) {
    setListError(null);
    if (payingId === e.id) {
      setPayingId(null);
      setPayDate("");
      setPayBy("");
    } else {
      setPayingId(e.id);
      setPayDate(today());
      setPayBy("");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Private</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-maroon sm:text-5xl">
          Wedding expenses
        </h1>
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

      {/* Add */}
      <section aria-label="Add expense" className={`${cardClass} mt-8`}>
        <h2 className="font-display text-2xl text-maroon">Add an expense</h2>
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
              Amount paid (₹)
            </label>
            <input
              id="amount"
              required
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0 if nothing paid yet"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="date" className="mb-1 block text-xs text-ink/60">
              Date paid
            </label>
            <input
              id="date"
              required={addDetailsRequired}
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
              required={addDetailsRequired}
              value={form.paidBy}
              onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
              placeholder="Who paid"
              className={inputClass}
            />
            <datalist id="payers">
              {payerOptions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-3">
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
              placeholder="Adds a pending row with no date"
              className={inputClass}
            />
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-maroon sm:col-span-6">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-2 sm:col-span-6">
            <button type="submit" disabled={isPending || !databaseConnected} className={primaryButton}>
              {isPending ? "Saving..." : "Add expense"}
            </button>
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
                <li key={e.id} className="py-3">
                  {editingId === e.id ? (
                    <InlineEditor
                      expense={e}
                      payerOptions={payerOptions}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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
                            onClick={() => (e.status === "paid" ? markPending(e) : togglePaying(e))}
                            disabled={isPending}
                            title={
                              e.status === "paid"
                                ? "Tap to mark as pending"
                                : "Tap to mark as paid (asks for who paid and the date)"
                            }
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
                            onClick={() => {
                              setPayingId(null);
                              setEditingId(e.id);
                            }}
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
                      </div>

                      {payingId === e.id ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-gold/10 p-3 text-sm">
                          <label htmlFor={`pay-${e.id}`}>Date paid</label>
                          <input
                            id={`pay-${e.id}`}
                            type="date"
                            required
                            value={payDate}
                            onChange={(ev) => setPayDate(ev.target.value)}
                            className={`${inputClass} max-w-[11rem]`}
                          />
                          <label htmlFor={`payby-${e.id}`}>Who paid</label>
                          <input
                            id={`payby-${e.id}`}
                            list="payers"
                            maxLength={60}
                            value={payBy}
                            onChange={(ev) => setPayBy(ev.target.value)}
                            placeholder="Required"
                            className={`${inputClass} max-w-[11rem]`}
                          />
                          <button
                            type="button"
                            onClick={() => confirmPaid(e)}
                            disabled={isPending || !payDate || !payBy.trim()}
                            className={primaryButton}
                          >
                            Mark as paid
                          </button>
                          <button type="button" onClick={() => togglePaying(e)} className={ghostButton}>
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
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
