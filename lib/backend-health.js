const HEALTH_PATH =
  process.env.NEXT_PUBLIC_BACKEND_HEALTH_PATH ?? "/api/backend/health";

/**
 * Panggil health check backend lewat gateway nginx (path relatif, jadi ikut
 * domain yang sedang dipakai browser).
 */
export async function fetchBackendHealth() {
  const response = await fetch(HEALTH_PATH, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
}