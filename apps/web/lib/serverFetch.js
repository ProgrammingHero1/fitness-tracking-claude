import { cookies } from 'next/headers';

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:4000';

// Server Components/Actions only - same reasoning as lib/session.js: Next's rewrites()
// proxy only applies to incoming browser requests, not to fetches issued from server-side
// code, so this talks to apps/api directly and forwards the session cookie by hand.
export async function serverApiFetch(path, { method = 'GET', body } = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_PROXY_TARGET}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}
