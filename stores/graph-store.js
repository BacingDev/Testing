"use client";

import { create } from "zustand";
import { MarkerType } from "@xyflow/react";
import { createInitialEdges, createInitialNodes } from "@/data/dummy-flow";
import { sideAndPos } from "@/lib/geometry";
import { portKey } from "@/stores/selection-key";

function applySelection(list, id) {
  let changed = false;
  const next = list.map((item) => {
    const selected = item.id === id;
    if (!!item.selected === selected) return item;
    changed = true;
    return { ...item, selected };
  });
  return changed ? next : list;
}

function deselectAll(list) {
  return list.some((item) => item.selected)
    ? list.map((item) => (item.selected ? { ...item, selected: false } : item))
    : list;
}

const PORT_TYPE_LABEL = {
  port: "Port",
  "virtual port": "Virtual Port",
  "exposed port": "Exposed Port",
};

/** Hanya port tipe "port" yang boleh jadi ujung edge (bukan VP/EP). */
function isRegularPort(port) {
  return !!port && port.type === "port";
}

/** Nama port unik dalam satu node: "Port", "Port 2", "Port 3", dst. */
function uniquePortName(existingNames, base) {
  if (!existingNames.includes(base)) return base;
  let index = 2;
  while (existingNames.includes(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

/** id port unik dalam satu node: `${base}-1`, `${base}-2`, dst. */
function uniquePortId(existingPorts, base) {
  const taken = new Set(existingPorts.map((port) => String(port.idpfport)));
  let index = existingPorts.length + 1;
  let candidate = `${base}-${index}`;
  while (taken.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

function buildPort(nodeId, ports, options) {
  const belongsTo =
    options.type === "exposed port"
      ? "ep"
      : options.type === "virtual port"
        ? "vp"
        : "port";
  return {
    name: uniquePortName(
      ports.map((port) => port.name),
      options.name,
    ),
    idpfport: uniquePortId(ports, `${nodeId}-${belongsTo}`),
    hasDirection: options.hasDirection,
    sidelocation: options.sidelocation,
    position: options.position,
    type: options.type,
    hasMetadata: false,
    remark: null,
    connectionStatus: options.connectionStatus ?? "DISCONNECTED",
  };
}

/**
 * Sinkronkan `hasDirection` + `connectionStatus` port dari edge aktual:
 * - tanpa edge  → neutral + DISCONNECTED
 * - hanya source → outlet + CONNECTED
 * - hanya target → inlet  + CONNECTED
 * - keduanya      → neutral (keduanya) + CONNECTED
 * VP/EP tidak diubah (bukan ujung edge).
 */
function syncPortMeta(nodes, edges) {
  const usage = new Map();
  const keyOf = (nodeId, handle) => `${nodeId}:${String(handle)}`;
  for (const edge of edges) {
    if (edge.sourceHandle != null) {
      const k = keyOf(edge.source, edge.sourceHandle);
      const rec = usage.get(k) ?? { source: false, target: false };
      rec.source = true;
      usage.set(k, rec);
    }
    if (edge.targetHandle != null) {
      const k = keyOf(edge.target, edge.targetHandle);
      const rec = usage.get(k) ?? { source: false, target: false };
      rec.target = true;
      usage.set(k, rec);
    }
  }

  let nodesChanged = false;
  const nextNodes = nodes.map((node) => {
    const ports = node.data?.ports;
    if (!ports?.length) return node;
    let portsChanged = false;
    const nextPorts = ports.map((port) => {
      if (!isRegularPort(port)) return port;
      const rec = usage.get(keyOf(node.id, port.idpfport));
      const hasSource = !!rec?.source;
      const hasTarget = !!rec?.target;
      const hasDirection =
        hasSource && hasTarget
          ? "neutral"
          : hasSource
            ? "outlet"
            : hasTarget
              ? "inlet"
              : "neutral";
      const connectionStatus =
        hasSource || hasTarget ? "CONNECTED" : "DISCONNECTED";
      if (
        port.hasDirection === hasDirection &&
        port.connectionStatus === connectionStatus
      ) {
        return port;
      }
      portsChanged = true;
      return { ...port, hasDirection, connectionStatus };
    });
    if (!portsChanged) return node;
    nodesChanged = true;
    return { ...node, data: { ...node.data, ports: nextPorts } };
  });
  return nodesChanged ? nextNodes : nodes;
}

/**
 * Sumber data tunggal untuk nodes/edges/ports supaya panel Properties (di luar
 * ReactFlowProvider) bisa membaca & mengubah selection di canvas.
 *
 * Selection node/edge memakai flag `selected` bawaan React Flow (single klik,
 * shift+klik, dan box-select sudah ditangani React Flow). Port memakai daftar
 * `selectedPortKeys` sendiri. Node/edge dan port saling eksklusif supaya
 * properti tetap jelas: memilih port menghapus pilihan node/edge, sebaliknya
 * pilihan node/edge menghapus pilihan port.
 */
export const useGraphStore = create((set) => ({
  nodes: createInitialNodes(),
  edges: createInitialEdges(),
  selectedPortKeys: [],
  /** true bila konten graph berbeda dari baseline tersimpan terakhir. */
  dirty: false,
  markDirty: () => set((state) => (state.dirty ? state : { dirty: true })),
  markClean: () => set((state) => (!state.dirty ? state : { dirty: false })),

  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === "function" ? updater(state.nodes) : updater,
    })),

  setEdges: (updater) =>
    set((state) => {
      const edges =
        typeof updater === "function" ? updater(state.edges) : updater;
      return { edges, nodes: syncPortMeta(state.nodes, edges) };
    }),

  /**
   * Tambah port baru ke node (dari menu sidebar). Label/id dibuat unik supaya
   * tidak duplikat dengan port yang sudah ada di node tersebut.
   */
  addPort: (nodeId, type) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const ports = node.data.ports ?? [];
        const sameSide = ports.filter((port) => port.sidelocation === 1).length;
        return {
          ...node,
          data: {
            ...node.data,
            ports: [
              ...ports,
              buildPort(nodeId, ports, {
                name: PORT_TYPE_LABEL[type] ?? "Port",
                type,
                hasDirection: "neutral",
                sidelocation: 1,
                position: Math.max(10, Math.min(90, 35 + sameSide * 16)),
              }),
            ],
          },
        };
      }),
    })),

  /**
   * Tambah port baru ke node pada posisi (sisi + persen) yang ditentukan
   * dari titik kursor di canvas. Label/id unik; posisi diklamp 5–95%.
   * Mengembalikan port yang baru dibuat, atau null bila node tidak ditemukan.
   */
  addPortAt: (nodeId, type, sidelocation, position) => {
    let createdPort = null;
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const ports = node.data.ports ?? [];
        createdPort = buildPort(nodeId, ports, {
          name: PORT_TYPE_LABEL[type] ?? "Port",
          type,
          hasDirection: "neutral",
          sidelocation,
          position: Math.max(5, Math.min(95, position ?? 50)),
          connectionStatus: "DISCONNECTED",
        });
        return {
          ...node,
          data: { ...node.data, ports: [...ports, createdPort] },
        };
      });
      return { nodes };
    });
    return createdPort;
  },

  /**
   * Buat port koneksi untuk ujung edge (source → sisi kanan, target → sisi
   * kiri). Port dibuat sebagai port default (neutral, DISCONNECTED); arah
   * inlet/outlet + status CONNECTED disinkronkan oleh syncPortMeta saat edge
   * benar-benar masuk. Mengembalikan port baru, atau null bila node hilang.
   */
  addConnectionPort: (nodeId, side) => {
    let createdPort = null;
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const ports = node.data.ports ?? [];
        const isSource = side === "source";
        const sidelocation = isSource ? 1 : 3;
        const sameSide = ports.filter(
          (port) => port.sidelocation === sidelocation,
        ).length;
        createdPort = buildPort(nodeId, ports, {
          name: "Port",
          type: "port",
          hasDirection: "neutral",
          sidelocation,
          position: Math.max(10, Math.min(90, 35 + sameSide * 16)),
          connectionStatus: "DISCONNECTED",
        });
        return {
          ...node,
          data: { ...node.data, ports: [...ports, createdPort] },
        };
      });
      return { nodes };
    });
    return createdPort;
  },

  /**
   * API buat edge + (opsional) port endpoint — fase 1 (nodes saja).
   *
   * Endpoint tanpa handle existing dibuat MENGHADAP node lawan (sideAndPos
   * terhadap pusat node tujuan/sumber) supaya garis edge lurus ke arah
   * koneksi — bukan ikut kursor yang bisa bikin ujung "ngacak".
   *
   * return { ok, reason?, sourceHandle, targetHandle, createdNodeIds, createdPorts }
   *   createdNodeIds → butuh updateNodeInternals sebelum addEdgeRecord (RF 008)
   *   createdPorts   → [{ nodeId, portId, name }] untuk toast sukses
   */
  ensureEdgeEndpoints: ({
    source,
    target,
    sourceHandle,
    targetHandle,
    sourcePoint = null,
    targetPoint = null,
  }) => {
    let outcome = { ok: false, reason: "missing" };
    set((state) => {
      let nodes = state.nodes;
      const edges = state.edges;
      const createdNodeIds = [];
      const createdPorts = [];

      const findPortOn = (nodeId, handleId) => {
        const node = nodes.find((item) => item.id === nodeId);
        return (node?.data?.ports ?? []).find(
          (port) => String(port.idpfport) === String(handleId),
        );
      };

      const appendPort = (nodeId, options) => {
        const node = nodes.find((item) => item.id === nodeId);
        if (!node) return null;
        const ports = node.data?.ports ?? [];
        const created = buildPort(nodeId, ports, options);
        nodes = nodes.map((item) =>
          item.id === nodeId
            ? { ...item, data: { ...item.data, ports: [...ports, created] } }
            : item,
        );
        if (!createdNodeIds.includes(nodeId)) createdNodeIds.push(nodeId);
        createdPorts.push({
          nodeId,
          portId: String(created.idpfport),
          name: created.name,
        });
        return String(created.idpfport);
      };

      const ensureEndpoint = (nodeId, handle, side, point) => {
        if (handle != null) {
          const port = findPortOn(nodeId, handle);
          if (isRegularPort(port)) {
            // Outlet / inlet (sudah terpakai) → tolak di kedua sisi.
            if (
              port.hasDirection === "inlet" ||
              port.hasDirection === "outlet"
            ) {
              outcome = { ok: false, reason: "locked-port", side, port };
              return null;
            }
            return String(handle);
          }
        }

        const node = nodes.find((item) => item.id === nodeId);
        if (!node) return null;

        // Endpoint tanpa handle existing → WAJIB ada titik ghost/kursor.
        // Port existing → badan node tidak boleh auto-create (ditolak di
        // flow-canvas dengan "Butuh port") — fallback ke pusat juga dilarang.
        if (!point) {
          outcome = { ok: false, reason: "no-ghost", side };
          return null;
        }
        const [sidelocation, position] = sideAndPos(node, point);
        return appendPort(nodeId, {
          name: "Port",
          type: "port",
          hasDirection: "neutral",
          sidelocation,
          position: Math.max(5, Math.min(95, position)),
          connectionStatus: "DISCONNECTED",
        });
      };

      // Endpoint tanpa handle → HANYA pakai titik eksplisit (ghost/kursor).
      // Tidak ada fallback centerOf — ghost tidak muncul = tidak create.
      const srcPoint = sourceHandle == null ? sourcePoint : null;
      const tgtPoint = targetHandle == null ? targetPoint : null;

      const srcHandle = ensureEndpoint(source, sourceHandle, "source", srcPoint);
      const tgtHandle = ensureEndpoint(target, targetHandle, "target", tgtPoint);
      if (srcHandle == null || tgtHandle == null) {
        // Pertahankan reason spesifik (locked-port / no-ghost) dari ensureEndpoint.
        if (
          outcome.reason !== "locked-port" &&
          outcome.reason !== "no-ghost"
        ) {
          outcome = { ok: false, reason: "missing" };
        }
        return state;
      }

      outcome = {
        ok: true,
        sourceHandle: srcHandle,
        targetHandle: tgtHandle,
        createdNodeIds,
        createdPorts,
      };
      if (createdNodeIds.length === 0) {
        return state;
      }
      return { nodes };
    });
    return outcome;
  },

  /**
   * Menambahkan edge ke daftar (tanpa auto-port — pakai ensureEdgeEndpoints
   * dulu untuk edge interaktif). Tolak bila ujung sudah terhubung edge serupa.
   * Mengembalikan true bila edge benar-benar ditambahkan.
   */
  addEdgeRecord: (edge) => {
    let added = false;
    set((state) => {
      const id =
        edge.id || `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const next = {
        type: "waypoint",
        animated: false,
        zIndex: 1,
        style: { strokeWidth: 1, stroke: "#111827" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#111827",
          width: 16,
          height: 16,
        },
        data: { points: [], remark: null },
        ...edge,
        id: edge.id || id,
      };
      const duplicate = state.edges.some(
        (item) =>
          item.source === next.source &&
          item.target === next.target &&
          String(item.sourceHandle ?? "") === String(next.sourceHandle ?? "") &&
          String(item.targetHandle ?? "") === String(next.targetHandle ?? ""),
      );
      if (duplicate) return state;
      added = true;
      const edges = [...state.edges, next];
      return { edges, nodes: syncPortMeta(state.nodes, edges) };
    });
    return added;
  },

  selectNode: (id) =>
    set((state) => ({
      nodes: applySelection(state.nodes, id),
      edges: deselectAll(state.edges),
      selectedPortKeys: [],
    })),

  selectEdge: (id) =>
    set((state) => ({
      nodes: deselectAll(state.nodes),
      edges: applySelection(state.edges, id),
      selectedPortKeys: [],
    })),

  selectPort: (key, additive = false) =>
    set((state) => {
      let keys;
      if (!additive) {
        keys = [key];
      } else if (state.selectedPortKeys.includes(key)) {
        keys = state.selectedPortKeys.filter((item) => item !== key);
      } else {
        keys = [...state.selectedPortKeys, key];
      }
      return {
        nodes: deselectAll(state.nodes),
        edges: deselectAll(state.edges),
        selectedPortKeys: keys,
      };
    }),

  clearPorts: () =>
    set((state) =>
      state.selectedPortKeys.length ? { selectedPortKeys: [] } : state,
    ),

  updateNodeData: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      ),
    })),

  updateNodeStyle: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                style: { ...node.data.style, ...patch },
              },
            }
          : node,
      ),
    })),

  updateEdge: (id, patch) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, ...patch } : edge,
      ),
    })),

  updateEdgeData: (id, patch) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, ...patch } }
          : edge,
      ),
    })),

  updateEdgeStyle: (id, patch) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id
          ? { ...edge, style: { ...edge.style, ...patch } }
          : edge,
      ),
    })),

  removeEdge: (id) =>
    set((state) => {
      const edges = state.edges.filter((edge) => edge.id !== id);
      return { edges, nodes: syncPortMeta(state.nodes, edges) };
    }),

  updatePort: (nodeId, portId, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ports: (node.data.ports ?? []).map((port) =>
                  String(port.idpfport) === String(portId)
                    ? { ...port, ...patch }
                    : port,
                ),
              },
            }
          : node,
      ),
    })),

  removePort: (nodeId, portId) =>
    set((state) => {
      const key = portKey(nodeId, portId);
      const hitsPort = (endpointId, handle) =>
        endpointId === nodeId && String(handle) === String(portId);
      const edges = state.edges.filter(
        (edge) =>
          !hitsPort(edge.source, edge.sourceHandle) &&
          !hitsPort(edge.target, edge.targetHandle),
      );
      const nodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ports: (node.data.ports ?? []).filter(
                  (port) => String(port.idpfport) !== String(portId),
                ),
              },
            }
          : node,
      );
      return {
        nodes: syncPortMeta(nodes, edges),
        edges,
        selectedPortKeys: state.selectedPortKeys.filter(
          (item) => item !== key,
        ),
      };
    }),

  removeNode: (id) =>
    set((state) => {
      const prefix = `${id}:`;
      const edges = state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      );
      const nodes = state.nodes.filter((node) => node.id !== id);
      return {
        nodes: syncPortMeta(nodes, edges),
        edges,
        selectedPortKeys: state.selectedPortKeys.filter(
          (key) => !String(key).startsWith(prefix),
        ),
      };
    }),

  clearSelection: () =>
    set((state) => ({
      nodes: deselectAll(state.nodes),
      edges: deselectAll(state.edges),
      selectedPortKeys: [],
    })),

  /**
   * Ganti seluruh graph dengan hasil load dari API. Seleksi dibersihkan
   * supaya state runtime (selected) tidak ikut persist dari file.
   */
  hydrate: ({ nodes, edges }) =>
    set(() => {
      const nextNodes = (nodes ?? []).map((node) => ({
        ...node,
        selected: false,
      }));
      const nextEdges = (edges ?? []).map((edge) => ({
        ...edge,
        selected: false,
      }));
      return {
        nodes: syncPortMeta(nextNodes, nextEdges),
        edges: nextEdges,
        selectedPortKeys: [],
      };
    }),
}));

/**
 * Bentuk payload untuk disimpan ke API: buang flag runtime React Flow
 * (selected/dragging) supaya file JSON bersih.
 */
export function serializeGraph(nodes, edges) {
  return {
    nodes: nodes.map(({ selected, dragging, ...rest }) => rest),
    edges: edges.map(({ selected, ...rest }) => rest),
  };
}
