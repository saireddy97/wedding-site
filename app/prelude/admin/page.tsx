import type { Metadata } from "next";
import { databaseConfigured } from "../../../lib/supabase";
import { listGuests } from "../../../lib/prelude-store";
import type { GuestRow } from "../../../lib/prelude-types";
import { adminConfigured, isAdmin } from "../../../lib/prelude-auth";
import AdminPanel, { AdminLogin } from "./AdminPanel";

export const metadata: Metadata = {
  title: "Pre-wedding admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PreludeAdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-display text-2xl italic text-ink/70">Admin isn&rsquo;t set up yet.</p>
      </main>
    );
  }

  if (!(await isAdmin())) return <AdminLogin />;

  const databaseConnected = databaseConfigured();
  let guests: GuestRow[] = [];
  // Shown to the admin only, so the real reason (for example a missing table) is visible.
  let loadError: string | null = null;

  if (databaseConnected) {
    try {
      guests = await listGuests();
    } catch (err) {
      console.error("Guest list failed to load:", err);
      loadError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  return <AdminPanel guests={guests} databaseConnected={databaseConnected} loadError={loadError} />;
}
