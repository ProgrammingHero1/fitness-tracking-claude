export async function apiClient(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }

  return data;
}
