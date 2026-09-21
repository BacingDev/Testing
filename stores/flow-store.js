"use client";

import { create } from "zustand";

let commandSeq = 0;

const nextCommand = (type) => ({ seq: ++commandSeq, type });

export const useFlowStore = create((set) => ({
  showPorts: true,
  setShowPorts: (showPorts) => set({ showPorts }),

  /** Turunan dari tool: true saat tool === "edge". Dipakai canvas & sidebar. */
  connectMode: false,

  /**
   * Alat aktif di sidebar kiri. "node" = katalog unit (drag ke canvas),
   * "edge" = mode tarik untuk membuat edge, "port" = mode klik untuk membuat
   * port (jenisnya diatur lewat `portType`). Default: node.
   */
  tool: "node",
  setTool: (tool) => set(() => ({ tool, connectMode: tool === "edge" })),

  /**
   * Jenis port yang dibuat saat tool "port" aktif:
   * "port" (bulat), "virtual port"/VP (kotak), atau "exposed port"/EP (diamond).
   */
  portType: "port",
  setPortType: (portType) => set({ portType }),

  /**
   * Dinaikkan setiap drag/resize node selesai. Dipakai panel Properties untuk
   * me-refresh posisi/ukuran sekali di akhir interaksi, bukan tiap frame.
   */
  revision: 0,
  bumpRevision: () => set((state) => ({ revision: state.revision + 1 })),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),

  /**
   * Node yang minta difokuskan (pan ke tengah) oleh panel Properties saat
   * barisnya diklik. Dipakai FlowCanvas untuk memanggil setCenter lalu
   * mereset kembali ke null.
   */
  focusNodeId: null,
  setFocusNodeId: (focusNodeId) => set({ focusNodeId }),

  command: null,
  zoomIn: () => set({ command: nextCommand("zoomIn") }),
  zoomOut: () => set({ command: nextCommand("zoomOut") }),
  zoomReset: () => set({ command: nextCommand("zoomReset") }),
  fitView: () => set({ command: nextCommand("fitView") }),
  clearCommand: () => set({ command: null }),
}));