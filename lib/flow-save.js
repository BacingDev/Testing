"use client";

import { serializeGraph, useGraphStore } from "@/stores/graph-store";

const STORAGE_KEY = "flow-studio:graph:v1";

function isGraphPayload(value) {
  return (
    !!value &&
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges) &&
    value.nodes.every(
      (node) =>
        node &&
        typeof node.id === "string" &&
        node.position &&
        typeof node.data === "object" &&
        node.data !== null,
    ) &&
    value.edges.every(
      (edge) =>
        edge &&
        typeof edge.id === "string" &&
        typeof edge.source === "string" &&
        typeof edge.target === "string",
    )
  );
}

export function loadSavedGraph() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isGraphPayload(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { nodes: parsed.nodes, edges: parsed.edges };
  } catch {
    return null;
  }
}

/** Konten graph (tanpa flag runtime) sebagai kunci baseline/dirty. */
export function graphContentKey() {
  const { nodes, edges } = useGraphStore.getState();
  return JSON.stringify(serializeGraph(nodes, edges));
}

let lastSavedKey = null;
let saving = false;

/** Tandai konten saat ini sebagai baseline (sudah tersimpan / initial load). */
export function setGraphBaseline(key = graphContentKey()) {
  lastSavedKey = key;
  useGraphStore.getState().markClean();
}

/** Sinkronkan flag `dirty` dengan selisih konten vs baseline terakhir. */
export function refreshGraphDirty() {
  const dirty = lastSavedKey !== null && graphContentKey() !== lastSavedKey;
  const store = useGraphStore.getState();
  if (dirty) store.markDirty();
  else store.markClean();
  return dirty;
}

export async function saveGraph() {
  if (saving || typeof window === "undefined") return false;
  saving = true;
  try {
    const { nodes, edges } = useGraphStore.getState();
    const graph = serializeGraph(nodes, edges);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
    setGraphBaseline();
    return true;
  } finally {
    saving = false;
  }
}
