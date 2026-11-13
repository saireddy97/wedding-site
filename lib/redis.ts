// Minimal Upstash Redis client over its REST API, so no extra npm package is needed.
// The Vercel Marketplace "Upstash Redis" integration sets these env vars for you.

function restUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function restToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

export function redisConfigured(): boolean {
  return Boolean(restUrl() && restToken());
}

export async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const url = restUrl();
  const token = restToken();
  if (!url || !token) throw new Error("Redis is not configured");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const data = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Redis request failed (${res.status})`);
  }
  return data.result as T;
}
