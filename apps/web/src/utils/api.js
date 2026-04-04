export function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://localhost:5000';
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export async function apiRequest(path, { body, headers = {}, method = 'GET', query, token } = {}) {
  const apiBaseUrl = resolveApiBaseUrl();
  const url = new URL(path, apiBaseUrl || window.location.origin);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed.');
  }

  return payload;
}
