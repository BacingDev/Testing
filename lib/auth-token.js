/**
 * Helper token auth (client-side).
 * Dibaca lewat useSyncExternalStore supaya tidak perlu setState di effect
 * dan aman dari hydration mismatch (server selalu null).
 */

export function subscribeAuth() {
  return () => {};
}

export function getAuthToken() {
  return localStorage.getItem("access_token");
}

function payloadOf(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Token yang layak dipakai: ada, berbentuk JWT, dan belum kedaluwarsa.
 * Dipakai RequireAuth dan halaman auth supaya keduanya selalu sepakat —
 * token basi/rusak berarti "belum login", bukan setengah login.
 */
export function getValidAuthToken() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = payloadOf(token);
  if (!payload || typeof payload.exp !== "number") {
    clearAuth();
    return null;
  }
  if (payload.exp * 1000 < Date.now() - 30000) {
    clearAuth();
    return null;
  }
  return token;
}

export function getServerAuthToken() {
  return null;
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
