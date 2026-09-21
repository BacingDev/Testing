"use client";

import { create } from "zustand";
import { createInitialEdges, createInitialNodes } from "@/data/dummy-flow";
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

  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === "function" ? updater(state.nodes) : updater,
    })),

  setEdges: (updater) =>
    set((state) => ({
      edges: typeof updater === "function" ? updater(state.edges) : updater,
    })),

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
          connectionStatus: "CONNECTED",
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
   * kiri). Port dibuat sebagai port default (neutral, label "Port"); arah
   * inlet/outlet hanya tampil saat port benar-benar terhubung edge.
   * Mengembalikan port yang baru dibuat, atau null bila node tidak ditemukan.
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
          connectionStatus: "CONNECTED",
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

  /** Menambahkan edge ke daftar (dengan id unik bila belum ada). */
  addEdgeRecord: (edge) =>
    set((state) => {
      const id = edge.id || `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return { edges: [...state.edges, { ...edge, id }] };
    }),

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
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    })),

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
      return {
        nodes: state.nodes.map((node) =>
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
        ),
        edges: state.edges.filter(
          (edge) =>
            !hitsPort(edge.source, edge.sourceHandle) &&
            !hitsPort(edge.target, edge.targetHandle),
        ),
        selectedPortKeys: state.selectedPortKeys.filter(
          (item) => item !== key,
        ),
      };
    }),

  removeNode: (id) =>
    set((state) => {
      const prefix = `${id}:`;
      return {
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter(
          (edge) => edge.source !== id && edge.target !== id,
        ),
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
}));
