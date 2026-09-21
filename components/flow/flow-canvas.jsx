"use client";

import { Box } from "@chakra-ui/react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  useOnViewportChange,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TbSettings2, TbTrash } from "react-icons/tb";
import { CanvasContextMenu } from "@/components/flow/canvas-context-menu";
import { CanvasItemDialogs } from "@/components/flow/canvas-dialogs";
import { CanvasMiniMap } from "@/components/flow/canvas-minimap";
import { WaypointEdge } from "@/components/flow/edge/waypoint-edge";
import { FlowProvider } from "@/components/flow/flow-context";
import { UnitNode } from "@/components/flow/node/unit-node";
import {
  CONNECT_OVERLAY_SOURCE_ID,
  CONNECT_OVERLAY_TARGET_ID,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DRAG_MIME,
} from "@/components/flow/constants";
import { createUnitNode } from "@/data/dummy-flow";
import { UNIT_CATALOG_BY_ID } from "@/data/unit-catalog";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";
import { portKey } from "@/stores/selection-key";

const nodeTypes = { workflow: UnitNode };
const edgeTypes = { waypoint: WaypointEdge };

/** Sisi (domain) + posisi persen port: proyeksi titik kursor ke tepi node
 *  searah garis dari pusat node ke titik kursor. */
function sideAndPos(node, point) {
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  if (dx === 0 && dy === 0) return [1, 50];
  const sx = w / 2;
  const sy = h / 2;
  const tx = dx !== 0 ? Math.abs(sx / dx) : Infinity;
  const ty = dy !== 0 ? Math.abs(sy / dy) : Infinity;
  const t = Math.min(tx, ty);
  const bx = cx + dx * t;
  const by = cy + dy * t;
  const nx = w ? (bx - node.position.x) / w : 0.5;
  const ny = h ? (by - node.position.y) / h : 0.5;
  if (bx <= node.position.x) return [3, ny * 100];
  if (bx >= node.position.x + w) return [1, ny * 100];
  if (by <= node.position.y) return [2, nx * 100];
  return [0, nx * 100];
}

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

/** VP & EP adalah port non-koneksi — tidak boleh jadi ujung edge. */
function isNonConnectablePort(port) {
  return (
    !!port &&
    (port.type === "virtual port" || port.type === "exposed port")
  );
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
   * Buat edge baru antara dua node. Bila ujung belum punya port koneksible,
   * port dibuat otomatis (outlet di sumber, inlet di tujuan). Port yang sudah
   * ada & bebas dipakai ulang; label/id port dijamin unik.
   */
  const buildEdge = useCallback(
    (source, target, sourceHandle, targetHandle) => {
      const { nodes, edges } = useGraphStore.getState();

      const findFreePort = (nodeId, side) => {
        const node = nodes.find((item) => item.id === nodeId);
        if (!node) return null;
        const used = new Set();
        for (const edge of edges) {
          if (edge.source === nodeId && edge.sourceHandle != null)
            used.add(String(edge.sourceHandle));
          if (edge.target === nodeId && edge.targetHandle != null)
            used.add(String(edge.targetHandle));
        }
        const ports = node.data?.ports ?? [];
        const preferred = side === "source" ? 1 : 3;
        return (
          ports.find(
            (port) =>
              !isNonConnectablePort(port) &&
              !used.has(String(port.idpfport)) &&
              port.sidelocation === preferred,
          ) ??
          ports.find(
            (port) =>
              !isNonConnectablePort(port) &&
              !used.has(String(port.idpfport)),
          )
        );
      };

      const ensureEndpoint = (nodeId, handle, side) => {
        if (handle != null) {
          const port = findPort(nodes, nodeId, handle);
          if (port && !isNonConnectablePort(port)) return handle;
        } else {
          const free = findFreePort(nodeId, side);
          if (free) return free.idpfport;
        }
        const created = useGraphStore
          .getState()
          .addConnectionPort(nodeId, side);
        return created?.idpfport ?? handle ?? null;
      };

      const srcHandle = ensureEndpoint(source, sourceHandle, "source");
      const tgtHandle = ensureEndpoint(target, targetHandle, "target");

      useGraphStore.getState().addEdgeRecord({
        source,
        target,
        sourceHandle: srcHandle,
        targetHandle: tgtHandle,
        type: "waypoint",
        animated: false,
        style: { strokeWidth: 1, stroke: "#111827" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#111827",
          width: 16,
          height: 16,
        },
        data: { points: [], remark: null },
      });
    },
    [],
  );

  const isValidConnection = useCallback((connection) => {
    const { nodes } = useGraphStore.getState();
    const sourcePort = findPort(
      nodes,
      connection.source,
      connection.sourceHandle,
    );
    const targetPort = findPort(
      nodes,
      connection.target,
      connection.targetHandle,
    );
    return !isNonConnectablePort(sourcePort) && !isNonConnectablePort(targetPort);
  }, []);

  const onConnect = useCallback(
    (connection) => {
      if (!isValidConnection(connection)) return;
      // Edge body→body (via overlay handle) tidak untuk node yang sama.
      if (
        connection.source === connection.target &&
        connection.sourceHandle === CONNECT_OVERLAY_SOURCE_ID &&
        connection.targetHandle === CONNECT_OVERLAY_TARGET_ID
      ) {
        return;
      }
      const srcHandle =
        connection.sourceHandle === CONNECT_OVERLAY_SOURCE_ID
          ? null
          : connection.sourceHandle;
      const tgtHandle =
        connection.targetHandle === CONNECT_OVERLAY_TARGET_ID
          ? null
          : connection.targetHandle;
      buildEdge(connection.source, connection.target, srcHandle, tgtHandle);
    },
    [isValidConnection, buildEdge],
  );

  // Ingat darimana drag koneksi dimulai (tahan beda versi React Flow).
  const connectStartRef = useRef(null);
  const onConnectStart = useCallback((_, params) => {
    connectStartRef.current = params ?? null;
  }, []);

  // Drop ke BADAN node (bukan ke handle/port) saat mode edge: cari node di
  // bawah kursor lalu buat edge body→body (port dibuat otomatis di buildEdge).
  const onConnectEnd = useCallback(
    (event, connectionState) => {
      const started = connectStartRef.current;
      connectStartRef.current = null;
      if (!connectMode) return;
      // Drop tepat di handle/port → biarkan onConnect yang urus (anti dobel).
      const targetEl = event?.target;
      if (
        targetEl?.closest?.(".react-flow__handle") ||
        connectionState?.toHandle
      ) {
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
      const dropTarget = currentNodes.find((node) => {
        if (node.id === fromNodeId) return false;
        const w = node.width ?? node.measured?.width ?? DEFAULT_NODE_WIDTH;
        const h = node.height ?? node.measured?.height ?? DEFAULT_NODE_HEIGHT;
        return (
          point.x >= node.position.x &&
          point.x <= node.position.x + w &&
          point.y >= node.position.y &&
          point.y <= node.position.y + h
        );
      });
      if (!dropTarget) return;
      const srcHandle =
        fromHandleId === CONNECT_OVERLAY_SOURCE_ID ? null : fromHandleId;
      buildEdge(fromNodeId, dropTarget.id, srcHandle ?? null, null);
    },
    [connectMode, buildEdge, screenToFlowPosition],
  );

  // Mode "tambah edge": satu handle source transparan menutupi badan node
  // (UnitNode) untuk MEMULAI drag. Drop ke badan node tujuan dideteksi via
  // onConnectEnd (hit-test posisi) di bawah — bukan via target overlay,
  // karena dua overlay yang menumpuk membuat drag tidak pernah mulai
  // (target menutupi source, padahal koneksi hanya bisa dimulai dari source).
  // Handle→handle (port→port, body→port) tetap lewat onConnect.

  // Mode "tambah port": kursor berubah sesuai bentuk port terpilih; klik node
  // membuat port tepat pada proyeksi titik kursor.
  const onNodeClick = useCallback(
    (event, node) => {
      if (tool !== "port") return;
      const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const [sidelocation, position] = sideAndPos(node, point);
      useGraphStore.getState().addPortAt(node.id, portType, sidelocation, position);
    },
    [tool, portType, screenToFlowPosition],
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

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      selectNode(node.id);
      setMenu({ kind: "node", id: node.id, x: event.clientX, y: event.clientY });
    },
    [selectNode],
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
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
        label: "Properties",
        icon: TbSettings2,
        onSelect: () => setEditing(target),
      },
      {
        key: "delete",
        label: "Delete",
        icon: TbTrash,
        colorPalette: "red",
        onSelect: () => setDeleting(target),
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
          onNodeDragStop={bumpRevision}
          onSelectionDragStop={bumpRevision}
          onPaneClick={handlePaneClick}
          onMoveStart={closeMenu}
          nodesDraggable={!connectMode}
          connectOnClick={false}
          multiSelectionKeyCode={["Shift", "Meta", "Control"]}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          defaultEdgeOptions={{ type: "waypoint" }}
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
        onCloseEditing={() => setEditing(null)}
        onCloseDeleting={() => setDeleting(null)}
      />

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
