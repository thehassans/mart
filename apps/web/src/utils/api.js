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
