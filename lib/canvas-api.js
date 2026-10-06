import { clearAuth } from "@/lib/auth-token";

// Gateway nginx memangkas prefix /api/<service>, jadi path lengkapnya:
// /api/canvas/ -> http://127.0.0.1:8003/ (service canvas, butuh Bearer token)
const BASE_URL = "/api/canvas/v1/canvases";

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

export function listCanvases() {
  return request(BASE_URL);
}

export function createCanvas({ name, description }) {
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify({
      name,
      ...(description ? { description } : {}),
    }),
  });
}

export function deleteCanvas(canvasId) {
  return request(`${BASE_URL}/${canvasId}`, { method: "DELETE" });
}

export function getCanvasGraph(canvasId) {
  return request(`${BASE_URL}/${canvasId}/graph`);
}

/**
 * Ubah node editor (React Flow) menjadi NodePayload milik BE.
 * width/height ikut dilipat ke dalam `position` ({x, y, w, h}) supaya
 * ukuran tersimpan tanpa menambah kolom — BE menganggap position opaque.
 */
export function toNodePayload(node) {
  const position = { ...(node.position ?? {}) };
  if (typeof node.width === "number") position.w = node.width;
  if (typeof node.height === "number") position.h = node.height;
  return {
    key: String(node.id),
    type: node.type ?? null,
    position,
    data: node.data ?? null,
  };
}

export function toEdgePayload(edge) {
  return {
    key: String(edge.id),
    source: String(edge.source),
    target: String(edge.target),
    source_handle: edge.sourceHandle ?? null,
    target_handle: edge.targetHandle ?? null,
    data: edge.data ?? null,
  };
}

export function saveCanvasGraph(canvasId, { nodes, edges }) {
  return request(`${BASE_URL}/${canvasId}/graph`, {
    method: "PUT",
    body: JSON.stringify({
      nodes: (nodes ?? []).map(toNodePayload),
      edges: (edges ?? []).map(toEdgePayload),
    }),
  });
}

/**
 * Ubah GraphRead milik BE menjadi bentuk node/edge editor.
 * Ukuran (w/h) dikeluarkan lagi dari position ke width/height.
 * Relasi bersarang (data.parentKey) dikembalikan jadi parentId React Flow
 * supaya page > container > widget tetap bersarang setelah dimuat.
 */
export function toEditorGraph(graph) {
  const nodes = (graph?.nodes ?? []).map((node) => {
    const { w, h, ...position } = node.position ?? {};
    const editor = {
      id: node.key,
      type: node.type ?? "workflow",
      position,
      data: node.data ?? {},
    };
    if (typeof w === "number") editor.width = w;
    if (typeof h === "number") editor.height = h;
    return editor;
  });
  // Parent harus ada sebelum anaknya: yang tanpa parent dulu.
  const knownIds = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    const parentKey =
      node.data?.parentKey != null ? String(node.data.parentKey) : null;
    if (parentKey && parentKey !== node.id && knownIds.has(parentKey)) {
      node.parentId = parentKey;
      node.extent = "parent";
    } else if (parentKey) {
      node.data = { ...node.data, parentKey: null };
    }
  }
  nodes.sort((a, b) => {
    const aChild = a.parentId ? 1 : 0;
    const bChild = b.parentId ? 1 : 0;
    return aChild - bChild;
  });
  const edges = (graph?.edges ?? []).map((edge) => ({
    ...(edge.data ?? {}),
    id: edge.key,
    source: edge.source,
    target: edge.target,
    ...(edge.source_handle ? { sourceHandle: edge.source_handle } : {}),
    ...(edge.target_handle ? { targetHandle: edge.target_handle } : {}),
  }));
  return { nodes, edges };
}
