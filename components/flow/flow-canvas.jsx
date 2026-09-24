"use client";

import { Box } from "@chakra-ui/react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ReactFlow,
  useOnViewportChange,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TbSettings2, TbTrash } from "react-icons/tb";
import { CanvasContextMenu } from "@/components/flow/canvas-context-menu";
import { CanvasItemDialogs } from "@/components/flow/canvas-dialogs";
import { CanvasMiniMap } from "@/components/flow/canvas-minimap";
import { GhostConnectionLine } from "@/components/flow/connection-line";
import { WaypointEdge } from "@/components/flow/edge";
import { FlowProvider } from "@/components/flow/flow-context";
import { UnitNode } from "@/components/flow/node";
import {
  CONNECT_OVERLAY_SOURCE_ID,
  CONNECT_OVERLAY_TARGET_ID,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DRAG_MIME,
} from "@/components/flow/constants";
import { createUnitNode } from "@/data/dummy-flow";
import { UNIT_CATALOG_BY_ID } from "@/data/unit-catalog";
import { sideAndPos } from "@/lib/geometry";
import { notify } from "@/lib/toast";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";
import { portKey } from "@/stores/selection-key";

const nodeTypes = { workflow: UnitNode };
const edgeTypes = { waypoint: WaypointEdge };

function cursorForPortType(type) {
  let body;
  if (type === "virtual port") {
    body = `<rect x='2.5' y='2.5' width='11' height='11' rx='1' fill='rgba(37,99,235,0.15)' stroke='rgba(37,99,235,0.9)' stroke-width='1.4' stroke-dasharray='2.5 1.5'/>`;
  } else if (type === "exposed port") {
    body = `<rect x='2.5' y='2.5' width='11' height='11' rx='1' transform='rotate(45 8 8)' fill='rgba(37,99,235,0.15)' stroke='rgba(37,99,235,0.9)' stroke-width='1.4' stroke-dasharray='2.5 1.5'/>`;
  } else {
    body = `<circle cx='8' cy='8' r='5.5' fill='rgba(37,99,235,0.15)' stroke='rgba(37,99,235,0.9)' stroke-width='1.4' stroke-dasharray='2.5 1.5'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 8 8, crosshair`;
}

function targetOf(menu) {
  if (!menu) return null;
  return {
    kind: menu.kind,
    id: menu.id,
    nodeId: menu.nodeId,
    portId: menu.portId,
  };
}

function findPort(nodes, nodeId, handleId) {
  const node = nodes.find((item) => item.id === nodeId);
  return (node?.data?.ports ?? []).find(
    (port) => String(port.idpfport) === String(handleId),
  );
}

/** VP & EP (dan port yang bukan tipe "port") bukan ujung edge. */
function isNonConnectablePort(port) {
  return !!port && port.type !== "port";
}

/**
 * Port inlet/outlet (sudah terpakai, visual "merah"/terkunci) tidak boleh
 * jadi ujung edge baru — di source ATAU target. Hanya port neutral.
 */
function isLockedPort(port) {
  if (!port || port.type !== "port") return false;
  return port.hasDirection === "inlet" || port.hasDirection === "outlet";
}

export function FlowCanvas() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const clearPorts = useGraphStore((state) => state.clearPorts);
  const selectNode = useGraphStore((state) => state.selectNode);
  const selectEdge = useGraphStore((state) => state.selectEdge);
  const selectPort = useGraphStore((state) => state.selectPort);
  const { zoomIn, zoomOut, zoomTo, fitView, setCenter, screenToFlowPosition } =
    useReactFlow();
  const command = useFlowStore((state) => state.command);
  const clearCommand = useFlowStore((state) => state.clearCommand);
  const connectMode = useFlowStore((state) => state.connectMode);
  const tool = useFlowStore((state) => state.tool);
  const portType = useFlowStore((state) => state.portType);
  const setZoom = useFlowStore((state) => state.setZoom);
  const bumpRevision = useFlowStore((state) => state.bumpRevision);
  const focusNodeId = useFlowStore((state) => state.focusNodeId);
  const setFocusNodeId = useFlowStore((state) => state.setFocusNodeId);
  const [menu, setMenu] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  // Badge "Menuju ke node ini" — hanya mode edge saat sedang drag koneksi.
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectHint, setConnectHint] = useState(null);
  // Banner status teks di canvas (success/error) — bukan cuma toast+ikon.
  const [flash, setFlash] = useState(null);
  const flashTimerRef = useRef(null);
  // Ingat darimana drag koneksi dimulai (tahan beda versi React Flow).
  const connectStartRef = useRef(null);
  /** Satu gesture → satu create (onConnect + onConnectEnd bisa overlap). */
  const edgeBuiltRef = useRef(false);

  const showStatus = useCallback((opts) => {
    if (opts.type === "success" || opts.type === "error" || opts.type === "warning") {
      setFlash({
        type: opts.type,
        title: opts.title,
        description: opts.description ?? "",
        id: Date.now(),
      });
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlash(null), 5000);
    } else {
      notify(opts);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  useOnViewportChange({
    onChange: ({ zoom }) => setZoom(zoom),
  });

  useEffect(() => {
    if (!command) return;
    if (command.type === "zoomIn") zoomIn({ duration: 200 });
    else if (command.type === "zoomOut") zoomOut({ duration: 200 });
    else if (command.type === "zoomReset") zoomTo(1, { duration: 200 });
    else if (command.type === "fitView")
      fitView({ padding: 0.25, duration: 300 });
    clearCommand();
  }, [command, zoomIn, zoomOut, zoomTo, fitView, clearCommand]);

  // Pan kanvas ke node yang dipilih lewat tabel Properties (zoom dipertahankan).
  useEffect(() => {
    if (!focusNodeId) return;
    const { nodes } = useGraphStore.getState();
    const node = nodes.find((item) => item.id === focusNodeId);
    if (node) {
      const x = node.position.x + Math.round(node.width ?? 0) / 2;
      const y = node.position.y + Math.round(node.height ?? 0) / 2;
      setCenter(x, y, { duration: 300 });
    }
    setFocusNodeId(null);
  }, [focusNodeId, setCenter, setFocusNodeId]);

  const onNodesChange = useCallback(
    (changes) => setNodes((current) => applyNodeChanges(changes, current)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((current) => applyEdgeChanges(changes, current)),
    [setEdges],
  );

  // Pilih node/edge (klik, shift+klik, atau box-select) → pilihan port dibuang
  // supaya kelompok seleksi tetap tunggal.
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      if (selectedNodes.length || selectedEdges.length) clearPorts();
    },
    [clearPorts],
  );

  /**
   * API create edge + port: (1) ensureEdgeEndpoints — port auto menghadap
   * node lawan (bukan kursor acak); (2) bila port baru → 2× rAF +
   * updateNodeInternals (hindari RF error 008 / handle belum terukur);
   * (3) addEdgeRecord + toast sukses. Guard edgeBuiltRef: satu gesture = satu create.
   */
  const updateNodeInternals = useUpdateNodeInternals();
  const buildEdge = useCallback(
    (source, target, sourceHandle, targetHandle, anchors = {}) => {
      if (edgeBuiltRef.current) return;
      const store = useGraphStore.getState();
      const ensured = store.ensureEdgeEndpoints({
        source,
        target,
        sourceHandle,
        targetHandle,
        sourcePoint: anchors.sourcePoint ?? null,
        targetPoint: anchors.targetPoint ?? null,
        targetLocation: anchors.targetLocation ?? null,
      });
      if (!ensured.ok) {
        if (ensured.reason === "locked-port") {
          const dir = ensured.port?.hasDirection ?? "inlet/outlet";
          const name = ensured.port?.name ?? "Port";
          showStatus({
            type: "error",
            title: "Port terkunci",
            description: `Port "${name}" sudah ${dir} — hanya port neutral yang bisa dipakai membuat edge baru.`,
          });
        } else if (ensured.reason === "no-ghost") {
          showStatus({
            type: "warning",
            title: "Edge tidak dibuat",
            description:
              "Port bayangan tidak muncul di node tujuan — tarik hingga ghost inlet terlihat, lalu lepas.",
          });
        } else {
          showStatus({
            type: "error",
            title: "Gagal membuat edge",
            description: "Ujung koneksi tidak ditemukan pada node.",
          });
        }
        return;
      }

      const commitEdge = () => {
        if (edgeBuiltRef.current) return;
        const added = useGraphStore.getState().addEdgeRecord({
          source,
          target,
          sourceHandle: ensured.sourceHandle,
          targetHandle: ensured.targetHandle,
        });
        if (!added) {
          showStatus({
            type: "warning",
            title: "Edge sudah ada",
            description:
              "Koneksi antar port tersebut sudah dibuat sebelumnya.",
          });
          return;
        }
        edgeBuiltRef.current = true;
        const portCount = ensured.createdPorts?.length ?? 0;
        showStatus({
          type: "success",
          title: "Edge berhasil dibuat",
          description:
            portCount > 0
              ? `1 edge + ${portCount} port baru menghadap node tujuan.`
              : "1 edge baru tersambung antar port.",
        });
        updateNodeInternals([source, target]);
      };

      if (ensured.createdNodeIds.length > 0) {
        // Zustand set() tidak ikut flushSync React — tunggu paint Handle
        // port baru, ukur handleBounds, baru addEdge (hindari RF 008 +
        // path NaN yang bikin edge "hilang" padahal sudah di store).
        requestAnimationFrame(() => {
          updateNodeInternals(ensured.createdNodeIds);
          requestAnimationFrame(() => {
            commitEdge();
          });
        });
        return;
      }

      commitEdge();
    },
    [updateNodeInternals, showStatus],
  );

  const isValidConnection = useCallback((connection) => {
    // Hanya mode edge yang boleh membuat koneksi.
    if (!useFlowStore.getState().connectMode) return false;
    const { nodes } = useGraphStore.getState();
    // handle null / overlay (body→body) diizinkan — port dibuat otomatis
    // asalkan ghost muncul (dicek lagi saat create).
    const isOverlay = (handleId) =>
      handleId === CONNECT_OVERLAY_SOURCE_ID ||
      handleId === CONNECT_OVERLAY_TARGET_ID;
    const checkEnd = (nodeId, handleId) => {
      if (handleId == null || isOverlay(handleId)) return true;
      const port = findPort(nodes, nodeId, handleId);
      // Port belum ada (stale id) → allow; ensureEdgeEndpoints yang urus.
      if (!port) return true;
      if (port.type !== "port") return false;
      // Hanya port NEUTRAL — inlet/outlet terkunci di kedua sisi.
      if (isLockedPort(port)) return false;
      return true;
    };
    return (
      checkEnd(connection.source, connection.sourceHandle) &&
      checkEnd(connection.target, connection.targetHandle)
    );
  }, []);

  const onConnect = useCallback(
    (connection) => {
      if (!useFlowStore.getState().connectMode) {
        showStatus({
          type: "warning",
          title: "Mode edge nonaktif",
          description: "Pilih tool Edge dulu untuk membuat koneksi.",
        });
        return;
      }
      // RF membalik source↔target bila drag dimulai dari handle target
      // (PortShape menempel di handle target). Arahkan ulang ke node asal
      // drag: node1 (mulai) = source/outlet, node2 (tujuan) = target/inlet.
      const started = connectStartRef.current;
      let { source, target, sourceHandle, targetHandle } = connection;
      if (started?.nodeId && source !== started.nodeId) {
        [source, target] = [target, source];
        [sourceHandle, targetHandle] = [targetHandle, sourceHandle];
      }

      const normalized = { source, target, sourceHandle, targetHandle };
      if (!isValidConnection(normalized)) {
        const { nodes: allNodes } = useGraphStore.getState();
        const tgtPort = findPort(allNodes, target, targetHandle);
        const srcPort = findPort(allNodes, source, sourceHandle);
        const locked = isLockedPort(tgtPort)
          ? tgtPort
          : isLockedPort(srcPort)
            ? srcPort
            : null;
        if (locked) {
          showStatus({
            type: "error",
            title: "Port terkunci",
            description: `Port "${locked.name}" sudah ${locked.hasDirection} — hanya port neutral yang bisa membuat edge baru.`,
          });
        } else {
          showStatus({
            type: "warning",
            title: "Koneksi ditolak",
            description:
              "Hanya di mode Edge + port neutral (Port) yang bisa dijadikan ujung edge — bukan Virtual/Exposed.",
          });
        }
        return;
      }
      // Self-loop (node → node yang sama) tidak diizinkan — konsisten dengan
      // hit-test drop ke badan node di onConnectEnd.
      if (source === target) {
        showStatus({
          type: "warning",
          title: "Self-loop tidak diizinkan",
          description: "Tarik ke node lain untuk membuat edge.",
        });
        return;
      }
      const srcHandle =
        sourceHandle === CONNECT_OVERLAY_SOURCE_ID ? null : sourceHandle;
      const tgtHandle =
        targetHandle === CONNECT_OVERLAY_TARGET_ID ? null : targetHandle;
      const outletGhost = useFlowStore.getState().connectGhost;
      const inletGhost = useFlowStore.getState().connectGhostInlet;
      // Port existing → badan node tujuan: TIDAK auto-create port.
      // Wajib drop tepat di port neutral node tujuan.
      if (srcHandle != null && tgtHandle == null) {
        showStatus({
          type: "error",
          title: "Butuh port",
          description:
            "Node tujuan tidak menerima koneksi dari badan — tarik ke port neutral di node tujuan.",
        });
        return;
      }
      // Ujung tanpa handle existing → wajib ghost muncul (jangan fallback
      // ke tengah node / port free yang tidak terlihat).
      if (srcHandle == null && !outletGhost?.aim) {
        showStatus({
          type: "warning",
          title: "Edge tidak dibuat",
          description:
            "Port bayangan outlet belum muncul — mulai drag dari badan node.",
        });
        return;
      }
      if (tgtHandle == null && !inletGhost?.aim) {
        showStatus({
          type: "warning",
          title: "Edge tidak dibuat",
          description:
            "Port bayangan inlet tidak muncul — arahkan kursor ke node tujuan hingga ghost hijau terlihat.",
        });
        return;
      }
      buildEdge(source, target, srcHandle, tgtHandle, {
        sourcePoint: srcHandle == null ? outletGhost.aim : null,
        targetPoint: tgtHandle == null ? inletGhost.aim : null,
        targetLocation:
          tgtHandle == null
            ? { sidelocation: inletGhost.side, position: inletGhost.position }
            : null,
      });
    },
    [isValidConnection, buildEdge, showStatus],
  );

  const onConnectStart = useCallback(
    (event, params) => {
      if (!useFlowStore.getState().connectMode) return;
      connectStartRef.current = {
        ...(params ?? null),
        clientX: event?.clientX ?? null,
        clientY: event?.clientY ?? null,
      };
      edgeBuiltRef.current = false;
      useFlowStore.getState().setConnectGhost(null);
      useFlowStore.getState().setConnectGhostInlet(null);
      useFlowStore.getState().setConnectBlocked(false);
      // Ghost outlet HANYA untuk drag dari badan node (overlay) —
      // drag dari port existing (port→port) tidak boleh menampilkan ghost.
      const handleId = params?.handleId ?? null;
      const startedFromBody =
        handleId == null || handleId === CONNECT_OVERLAY_SOURCE_ID;
      const startId = params?.nodeId ?? null;
      const startX = event?.clientX;
      const startY = event?.clientY;
      if (startedFromBody && startId != null && startX != null && startY != null) {
        const node = useGraphStore
          .getState()
          .nodes.find((item) => item.id === startId);
        if (node) {
          const point = screenToFlowPosition({ x: startX, y: startY });
          const [side, pos] = sideAndPos(node, point);
          useFlowStore.getState().setConnectGhost({
            nodeId: startId,
            side,
            position: Math.max(5, Math.min(95, pos)),
            aim: point,
            frozen: false,
            wasInside: true,
          });
        }
      }
      setIsConnecting(true);
      setConnectHint(null);
    },
    [screenToFlowPosition],
  );

  // Drop ke BADAN node (bukan ke handle/port): cari node di bawah kursor
  // lalu buat edge — port endpoint menghadap node lawan (store).
  // Drop tidak valid / meleset → toast feedback (bukan silent return).
  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (!useFlowStore.getState().connectMode) return;
      const started = connectStartRef.current;
      connectStartRef.current = null;
      const outletGhost = useFlowStore.getState().connectGhost;
      const inletGhost = useFlowStore.getState().connectGhostInlet;
      useFlowStore.getState().setConnectGhost(null);
      useFlowStore.getState().setConnectGhostInlet(null);
      useFlowStore.getState().setConnectBlocked(false);
      setIsConnecting(false);
      setConnectHint(null);

      // Drop tepat di handle/port → onConnect yang urus bila valid.
      // Bila isValid false, onConnect tidak dipanggil React Flow → toast di sini.
      const targetEl = event?.target;
      const droppedOnHandle =
        targetEl?.closest?.(".react-flow__handle") || connectionState?.toHandle;
      if (droppedOnHandle) {
        if (connectionState?.isValid === false) {
          const { nodes: allNodes } = useGraphStore.getState();
          const fromId = connectionState.fromNode?.id ?? null;
          const toId = connectionState.toNode?.id ?? null;
          if (fromId && toId && fromId === toId) {
            showStatus({
              type: "warning",
              title: "Self-loop tidak diizinkan",
              description: "Tarik ke node lain untuk membuat edge.",
            });
          } else {
            const toPort =
              toId && connectionState.toHandle
                ? findPort(allNodes, toId, connectionState.toHandle.id)
                : null;
            const fromPort =
              fromId && connectionState.fromHandle
                ? findPort(allNodes, fromId, connectionState.fromHandle.id)
                : null;
            const lockedPort = isLockedPort(toPort)
              ? toPort
              : isLockedPort(fromPort)
                ? fromPort
                : null;
            if (lockedPort) {
              showStatus({
                type: "error",
                title: "Port terkunci",
                description: `Port "${lockedPort.name}" sudah ${lockedPort.hasDirection} — hanya port neutral yang bisa membuat edge baru.`,
              });
            } else if (
              isNonConnectablePort(toPort) ||
              isNonConnectablePort(fromPort)
            ) {
              showStatus({
                type: "warning",
                title: "Koneksi ditolak",
                description:
                  "Hanya port biasa (Port) yang bisa dijadikan ujung edge — bukan Virtual/Exposed.",
              });
            } else {
              showStatus({
                type: "warning",
                title: "Koneksi ditolak",
                description: "Pastikan ujung source dan target valid.",
              });
            }
          }
        }
        return;
      }

      const fromNodeId =
        started?.nodeId ??
        connectionState?.fromNode?.id ??
        connectionState?.from?.id ??
        null;
      if (!fromNodeId) return;
      const fromHandleId =
        started?.handleId ?? connectionState?.fromHandle?.id ?? null;
      const clientX = event?.clientX ?? event?.touches?.[0]?.clientX;
      const clientY = event?.clientY ?? event?.touches?.[0]?.clientY;
      if (clientX == null || clientY == null) return;
      const point = screenToFlowPosition({ x: clientX, y: clientY });
      const { nodes: currentNodes } = useGraphStore.getState();
      const isInside = (node) => {
        const w = node.width ?? node.measured?.width ?? DEFAULT_NODE_WIDTH;
        const h = node.height ?? node.measured?.height ?? DEFAULT_NODE_HEIGHT;
        return (
          point.x >= node.position.x &&
          point.x <= node.position.x + w &&
          point.y >= node.position.y &&
          point.y <= node.position.y + h
        );
      };

      const overSelf = currentNodes.find(
        (node) => node.id === fromNodeId && isInside(node),
      );
      if (overSelf) {
        showStatus({
          type: "warning",
          title: "Self-loop tidak diizinkan",
          description: "Lepaskan di atas node lain untuk membuat edge.",
        });
        return;
      }

      const dropTarget = currentNodes.find(
        (node) => node.id !== fromNodeId && isInside(node),
      );
      if (!dropTarget) {
        showStatus({
          type: "warning",
          title: "Edge tidak dibuat",
          description: "Lepaskan pointer di atas node tujuan.",
        });
        return;
      }

      const srcHandle =
        fromHandleId === CONNECT_OVERLAY_SOURCE_ID ? null : fromHandleId;
      // Port existing → badan node: tolak (merah "Butuh port") — tidak
      // auto-create inlet. Body→body tetap wajib ghost outlet + inlet.
      if (srcHandle != null) {
        showStatus({
          type: "error",
          title: "Butuh port",
          description:
            "Node tujuan tidak menerima koneksi dari badan — tarik ke port neutral di node tujuan.",
        });
        return;
      }
      if (!outletGhost?.aim) {
        showStatus({
          type: "warning",
          title: "Edge tidak dibuat",
          description:
            "Port bayangan outlet belum muncul — mulai drag dari badan node.",
        });
        return;
      }
      if (!inletGhost?.aim) {
        showStatus({
          type: "warning",
          title: "Edge tidak dibuat",
          description:
            "Port bayangan inlet tidak muncul — arahkan ke node tujuan hingga ghost hijau terlihat, lalu lepas.",
        });
        return;
      }
      buildEdge(fromNodeId, dropTarget.id, null, null, {
        sourcePoint: outletGhost.aim,
        targetPoint: point,
        targetLocation: (() => {
          const [sidelocation, position] = sideAndPos(dropTarget, point);
          return {
            sidelocation,
            position: Math.max(5, Math.min(95, position)),
          };
        })(),
      });
    },
    [buildEdge, screenToFlowPosition, showStatus],
  );

  // Mode edge: handle overlay (badan node) baru mount → paksa React Flow
  // ukur ulang handleBounds. Tanpa ini, tarik edge hanya jalan setelah resize.
  useEffect(() => {
    if (!connectMode) return undefined;
    const raf = requestAnimationFrame(() => {
      const ids = useGraphStore.getState().nodes.map((node) => node.id);
      if (ids.length) updateNodeInternals(ids);
    });
    return () => cancelAnimationFrame(raf);
  }, [connectMode, updateNodeInternals, nodes.length]);

  // Mode edge: saat drag — badge tujuan + ghost OUTLET (node asal) +
  // ghost INLET (node tujuan, warna hijau, ukuran sama outlet).
  // Outlet: di dalam node asal ikut kursor; keluar → freeze.
  // Inlet: mengikuti kursor sampai pointer dilepas; node lain → pindah.
  useEffect(() => {
    if (!connectMode || !isConnecting) return undefined;
    const handleMove = (event) => {
      const { nodes: currentNodes } = useGraphStore.getState();
      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const fromId = connectStartRef.current?.nodeId ?? null;
      const fromHandleId = connectStartRef.current?.handleId ?? null;
      // Ghost hanya untuk body→body; port→port tetap tanpa ghost port.
      const startedFromBody =
        fromHandleId == null || fromHandleId === CONNECT_OVERLAY_SOURCE_ID;
      const fromNode = fromId
        ? currentNodes.find((node) => node.id === fromId)
        : null;
      const isInside = (node) => {
        const w = node.width ?? node.measured?.width ?? DEFAULT_NODE_WIDTH;
        const h = node.height ?? node.measured?.height ?? DEFAULT_NODE_HEIGHT;
        return (
          point.x >= node.position.x &&
          point.x <= node.position.x + w &&
          point.y >= node.position.y &&
          point.y <= node.position.y + h
        );
      };
      const insideFrom = fromNode ? isInside(fromNode) : false;
      const flowStore = useFlowStore.getState();
      const preview = flowStore.connectGhost;
      const inletPreview = flowStore.connectGhostInlet;

      if (startedFromBody && fromNode && !preview?.frozen) {
        if (insideFrom) {
          const [side, pos] = sideAndPos(fromNode, point);
          flowStore.setConnectGhost({
            nodeId: fromId,
            side,
            position: Math.max(5, Math.min(95, pos)),
            aim: point,
            frozen: false,
            wasInside: true,
          });
        } else if (preview?.wasInside) {
          // Baru keluar dari node asal → kunci posisi di titik keluar.
          const [side, pos] = sideAndPos(fromNode, point);
          flowStore.setConnectGhost({
            nodeId: fromId,
            side,
            position: Math.max(5, Math.min(95, pos)),
            aim: point,
            frozen: true,
            wasInside: false,
          });
        }
      }

      const target =
        currentNodes.find((node) => node.id !== fromId && isInside(node)) ??
        null;

      // Ghost merah saat target tidak bisa menerima koneksi dari asal:
      // - port existing → target tanpa port neutral
      // (port→badan juga merah via GhostConnectionLine: toHandle null)
      let nextBlocked = false;
      if (target && !startedFromBody) {
        const hasNeutral = (target.data?.ports ?? []).some(
          (port) =>
            port.type === "port" &&
            port.hasDirection !== "inlet" &&
            port.hasDirection !== "outlet",
        );
        nextBlocked = !hasNeutral;
      }
      if (flowStore.connectBlocked !== nextBlocked) {
        flowStore.setConnectBlocked(nextBlocked);
      }

      // Ghost INLET: hanya body→body. Node tujuan terakhir tetap mengikuti
      // kursor sampai pointer dilepas, termasuk saat kursor keluar dari node.
      if (startedFromBody && (target || inletPreview)) {
        const inletNode =
          target ??
          currentNodes.find((node) => node.id === inletPreview?.nodeId) ??
          null;
        if (inletNode) {
          const [side, pos] = sideAndPos(inletNode, point);
          const next = {
            nodeId: inletNode.id,
            side,
            position: Math.max(5, Math.min(95, pos)),
            aim: point,
            frozen: false,
            wasInside: inletNode === target,
          };
          const unchanged =
            inletPreview &&
            inletPreview.nodeId === next.nodeId &&
            inletPreview.side === next.side &&
            inletPreview.position === next.position &&
            inletPreview.aim?.x === next.aim.x &&
            inletPreview.aim?.y === next.aim.y &&
            inletPreview.wasInside === next.wasInside;
          if (!unchanged) flowStore.setConnectGhostInlet(next);
        } else if (inletPreview) {
          flowStore.setConnectGhostInlet(null);
        }
      } else if (!startedFromBody && (preview || inletPreview)) {
        // Drag dari port existing: tidak ada ghost outlet/inlet.
        if (preview) flowStore.setConnectGhost(null);
        if (inletPreview) flowStore.setConnectGhostInlet(null);
      }

      if (!target) {
        setConnectHint(null);
        return;
      }
      setConnectHint((prev) =>
        prev?.nodeId === target.id &&
        prev.clientX === event.clientX &&
        prev.clientY === event.clientY
          ? prev
          : {
              nodeId: target.id,
              label: target.data?.label ?? target.id,
              clientX: event.clientX,
              clientY: event.clientY,
            },
      );
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [connectMode, isConnecting, screenToFlowPosition]);

  // Mode "tambah edge": satu handle source transparan menutupi badan node
  // (UnitNode) untuk MEMULAI drag. Drop ke badan node tujuan dideteksi via
  // onConnectEnd (hit-test posisi) di bawah — bukan via target overlay,
  // karena dua overlay yang menumpuk membuat drag tidak pernah mulai
  // (target menutupi source, padahal koneksi hanya bisa dimulai dari source).
  // Handle→handle (port→port, body→port) tetap lewat onConnect.

  // Mode "tambah port": kursor berubah sesuai bentuk port terpilih; klik node
  // membuat port tepat pada proyeksi titik kursor + toast sukses.
  const onNodeClick = useCallback(
    (event, node) => {
      if (tool !== "port") return;
      const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const [sidelocation, position] = sideAndPos(node, point);
      const created = useGraphStore
        .getState()
        .addPortAt(node.id, portType, sidelocation, position);
        if (created) {
          const label =
            portType === "virtual port"
              ? "Virtual Port"
              : portType === "exposed port"
                ? "Exposed Port"
                : "Port";
          showStatus({
            type: "success",
            title: "Port berhasil dibuat",
            description: `${created.name} (${label}) di sisi node ${
              node.data?.label ?? node.id
            }.`,
          });
        }
      },
      [tool, portType, screenToFlowPosition, showStatus],
    );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const unitId = event.dataTransfer.getData(DRAG_MIME);
      const unit = UNIT_CATALOG_BY_ID[unitId];
      if (!unit) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setNodes((current) => [...current, createUnitNode(unit, position)]);
    },
    [screenToFlowPosition, setNodes],
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const handlePaneClick = useCallback(() => {
    setMenu(null);
    clearPorts();
  }, [clearPorts]);

  const closeEditing = useCallback(() => {
    setEditing(null);
    setMenu(null);
  }, []);

  const closeDeleting = useCallback(() => {
    setDeleting(null);
    setMenu(null);
  }, []);

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      handlePaneClick();
    },
    [handlePaneClick],
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      selectNode(node.id);
      setMenu({ kind: "node", id: node.id, x: event.clientX, y: event.clientY });
    },
    [selectNode],
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      event.stopPropagation();
      selectEdge(edge.id);
      setMenu({ kind: "edge", id: edge.id, x: event.clientX, y: event.clientY });
    },
    [selectEdge],
  );

  // Dipakai PortShape (dirender React Flow di luar pohon ini).
  const openPortMenu = useCallback(
    (nodeId, portId, event) => {
      selectPort(portKey(nodeId, portId));
      setMenu({
        kind: "port",
        nodeId,
        portId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [selectPort],
  );

  const flowActions = useMemo(
    () => ({ setNodes, openPortMenu, connectMode }),
    [setNodes, openPortMenu, connectMode],
  );

  const menuItems = useMemo(() => {
    if (!menu) return [];
    const target = targetOf(menu);
    return [
      {
        key: "properties",
        label: "Properti",
        icon: TbSettings2,
        onSelect: () => {
          setMenu(null);
          setDeleting(null);
          setEditing(target);
        },
      },
      {
        key: "delete",
        label: "Hapus",
        icon: TbTrash,
        colorPalette: "red",
        onSelect: () => {
          setMenu(null);
          setEditing(null);
          setDeleting(target);
        },
      },
    ];
  }, [menu]);

  const portTypeLabel =
    portType === "virtual port"
      ? "Virtual"
      : portType === "exposed port"
        ? "Exposed"
        : "Port";
  const toolChip = connectMode
    ? "Mode tambah edge — tarik dari node ke node"
    : tool === "port"
      ? `Mode tambah port (${portTypeLabel}) — klik di dalam node`
      : null;

  return (
    <Box
      position="relative"
      height="100%"
      minHeight="600px"
      width="100%"
      overflow="hidden"
      bg="bg.subtle"
      className={tool === "port" ? "port-cursor" : undefined}
      style={tool === "port" ? { cursor: cursorForPortType(portType) } : undefined}
    >
      <FlowProvider value={flowActions}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onNodeDragStop={bumpRevision}
          onSelectionDragStop={bumpRevision}
          onPaneClick={handlePaneClick}
          onMoveStart={closeMenu}
          nodesDraggable={!connectMode}
          connectOnClick={false}
          deleteKeyCode={null}
          multiSelectionKeyCode={["Shift", "Meta", "Control"]}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          defaultEdgeOptions={{ type: "waypoint" }}
          connectionLineComponent={GhostConnectionLine}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#cbd5e1"
          />
          <CanvasMiniMap />
        </ReactFlow>
      </FlowProvider>

      {menu ? (
        <CanvasContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={closeMenu}
        />
      ) : null}

      <CanvasItemDialogs
        editing={editing}
        deleting={deleting}
        onCloseEditing={closeEditing}
        onCloseDeleting={closeDeleting}
      />

      {/* Mode edge: indikator tujuan saat sedang menarik koneksi. */}
      {connectMode && connectHint ? (
        <Box
          position="fixed"
          left={`${connectHint.clientX + 16}px`}
          top={`${connectHint.clientY + 16}px`}
          zIndex={60}
          pointerEvents="none"
          rounded="md"
          bg="blue.solid"
          color="white"
          px={3}
          py={1.5}
          fontSize="xs"
          fontWeight="medium"
          boxShadow="md"
          maxW="240px"
        >
          Menuju ke node ini — {connectHint.label}
        </Box>
      ) : null}

      {/* Status teks sukses/error di canvas (bukan cuma toast+ikon). */}
      {flash ? (
        <Box
          position="absolute"
          left="50%"
          top="16px"
          zIndex={70}
          transform="translateX(-50%)"
          pointerEvents="none"
          rounded="md"
          px={4}
          py={2}
          fontSize="sm"
          fontWeight="medium"
          boxShadow="lg"
          maxW="min(480px, 90%)"
          bg={
            flash.type === "success"
              ? "green.solid"
              : flash.type === "error"
                ? "red.solid"
                : "orange.solid"
          }
          color="white"
        >
          <Box fontWeight="bold">{flash.title}</Box>
          {flash.description ? (
            <Box fontWeight="normal" opacity={0.95}>
              {flash.description}
            </Box>
          ) : null}
        </Box>
      ) : null}

      {toolChip ? (
        <Box
          position="absolute"
          left="50%"
          bottom="20px"
          zIndex={50}
          transform="translateX(-50%)"
          pointerEvents="none"
        >
          <Box
            rounded="full"
            bg="blue.solid"
            color="white"
            px={4}
            py={1.5}
            fontSize="xs"
            fontWeight="medium"
            boxShadow="md"
          >
            {toolChip}
          </Box>
</Box>
    ) : null}
    </Box>
  );
}
