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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: buildHeaders(data ? { "Content-Type": "application/json" } : {}),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
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
