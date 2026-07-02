import { cookies } from 'next/headers';

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:4000';

// Server Components only. Next's rewrites() proxy applies to incoming browser
// requests, not to fetches issued from server-side code, so this talks to
// apps/api directly and forwards the session cookie by hand.
export async function getServerSession() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_PROXY_TARGET}/api/auth/get-session`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}
