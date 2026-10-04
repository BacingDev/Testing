import { clearAuth } from "@/lib/auth-token";

// Gateway nginx memangkas prefix /api/<service>, jadi path lengkapnya:
// /api/list-item/ -> http://127.0.0.1:8002/ (resource server, butuh Bearer token)
const BASE_URL = "/api/list-item/v1/items";

function readError(data, fallback) {
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg ?? JSON.stringify(d)).join(", ");
  }
  if (typeof detail === "string" && detail) return detail;
  return fallback;
}

async function request(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // Token kedaluwarsa / tidak valid -> buang sesi, kembali ke login.
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/auth/login";
    throw new Error("Sesi berakhir, silakan masuk kembali");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readError(data, `Request gagal (HTTP ${res.status})`));
  }
  return data;
}

export function listItems() {
  return request(BASE_URL);
}

export function getItem(itemId) {
  return request(`${BASE_URL}/${itemId}`);
}

export function createItem({ title, description }) {
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify({
      title,
      ...(description ? { description } : {}),
    }),
  });
}

export function updateItem(itemId, patch) {
  return request(`${BASE_URL}/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteItem(itemId) {
  return request(`${BASE_URL}/${itemId}`, { method: "DELETE" });
}
