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

export function getServerAuthToken() {
  return null;
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
