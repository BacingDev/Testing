const BASE_URL = "/api/apps/v1/apps";

function authHeaders() {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(path, { ...options, headers: { ...authHeaders(), ...(options.headers ?? {}) } });
  } catch {
    throw new Error("Server tidak terjangkau");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string" && detail ? detail : `Request gagal (HTTP ${res.status})`,
    );
  }
  return data;
}

export function fetchApp(appId) {
  return request(`${BASE_URL}/${appId}`);
}

export function listApps() {
  return request(BASE_URL);
}

export function createApp({ name }) {
  return request(BASE_URL, { method: "POST", body: JSON.stringify({ name }) });
}

export function deleteApp(appId) {
  return request(`${BASE_URL}/${appId}`, { method: "DELETE" });
}

export function saveAppDefinition(appId, definition) {
  return request(`${BASE_URL}/${appId}`, {
    method: "PATCH",
    body: JSON.stringify({ definition }),
  });
}

export function listTables(appId) {
  return request(`${BASE_URL}/${appId}/tables`);
}

export function createTable(appId, { name, schema }) {
  return request(`${BASE_URL}/${appId}/tables`, {
    method: "POST",
    body: JSON.stringify({ name, ...(schema ? { schema } : {}) }),
  });
}

export function listRows(appId, tableId) {
  return request(`${BASE_URL}/${appId}/tables/${tableId}/rows`);
}

export function createRow(appId, tableId, data) {
  return request(`${BASE_URL}/${appId}/tables/${tableId}/rows`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

export function publishApp(appId) {
  return request(`${BASE_URL}/${appId}/versions`, { method: "POST" });
}

export function listVersions(appId) {
  return request(`${BASE_URL}/${appId}/versions`);
}

export function fetchPublished(slug) {
  return request(`/api/apps/v1/published/${slug}`);
}
