import { QueryClient, QueryFunction } from "@tanstack/react-query";

// On pplx.app the backend runs on port 5000 — API calls must be prefixed with /port/5000
// In dev (Vite proxy) or when server and client share the same origin, use empty string.
export const API_BASE = (typeof window !== 'undefined' && window.location.hostname.endsWith('.pplx.app'))
  ? "/port/5000"
  : "";

// Internal API key — baked into the bundle at build time via VITE_APP_KEY.
// Guards all /api/* routes from bots and scrapers.
const APP_KEY = import.meta.env.VITE_APP_KEY as string | undefined;

/** Build standard headers for every API request, including the app key guard. */
function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (APP_KEY) headers["X-App-Key"] = APP_KEY;
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/** Sleep for ms milliseconds */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * apiRequest with automatic 503 retry (cold-start wake-up).
 * The pplx.app sandbox pauses when idle and returns 503 while waking.
 * We retry up to 8 times with increasing delays (2s, 4s, 6s, 8s, 8s, 8s, 8s, 8s).
 * maxRetries can be overridden for long-running AI calls.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  maxRetries = 8,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${API_BASE}${url}`, {
      method,
      headers: buildHeaders(data ? { "Content-Type": "application/json" } : {}),
      body: data ? JSON.stringify(data) : undefined,
    });
    // 503 = sandbox cold-starting — wait and retry
    if (res.status === 503 && attempt < maxRetries) {
      // Check if it's our own 503 (API key not configured) vs cold-start
      // Clone response to read body without consuming it
      const clone = res.clone();
      try {
        const body = await clone.json() as { error?: string };
        // Our own 503s have a specific error message — don't retry those
        if (body?.error && body.error.includes("API key not configured")) {
          await throwIfResNotOk(res);
          return res;
        }
      } catch { /* not JSON — must be cold-start HTML, keep retrying */ }
      await sleep(Math.min((attempt + 1) * 2000, 8000));
      continue;
    }
    await throwIfResNotOk(res);
    return res;
  }
  // Should never reach here, but satisfies TypeScript
  throw new Error("Max retries exceeded — server may still be starting up. Please try again.");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      headers: buildHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
