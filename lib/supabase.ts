// Minimal Supabase client over its REST API (PostgREST), so no extra npm package is needed.
// SERVER ONLY. It uses the secret / service-role key, which bypasses Row Level Security,
// so it must never be imported from a client component or exposed with a NEXT_PUBLIC_ name.

function baseUrl(): string | undefined {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? url.replace(/\/+$/, "") : undefined;
}

function secretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function databaseConfigured(): boolean {
  return Boolean(baseUrl() && secretKey());
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  prefer?: string;
};

export async function supabase<T = unknown>(
  path: string,
  { method = "GET", body, prefer }: RequestOptions = {},
): Promise<T> {
  const url = baseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error("Supabase is not configured");

  // New-style keys (sb_secret_...) go in the apikey header only. Legacy service_role
  // keys are JWTs and are also sent as a bearer token.
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = (await res.json()) as { message?: string };
      detail = err.message ?? "";
    } catch {
      // body wasn't JSON
    }
    throw new Error(`Supabase ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
