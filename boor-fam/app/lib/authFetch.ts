/**
 * authFetch
 *
 * Drop-in replacement for the browser's `fetch` that automatically attaches
 * the logged-in user's email as the `x-user-email` header on every request.
 *
 * Why this exists: the backend logger (app/lib/logger.ts) records who
 * performed each action using this header. If a component calls plain
 * `fetch()` instead, the header is missing and the log falls back to
 * "anonymous". Using authFetch everywhere closes that gap — there's nothing
 * to remember per call site.
 *
 * Usage is identical to fetch():
 *   const res = await authFetch('/api/users', { method: 'POST', ... });
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;

  const headers = new Headers(options.headers || {});
  if (email && !headers.has('x-user-email')) {
    headers.set('x-user-email', email);
  }

  return fetch(url, { ...options, headers });
}