"use client";

/**
 * Preview koneksi — style garis (dashed) untuk SEMUA drag (body & port).
 *
 * - Body→body: path yang sama dengan edge yang akan dibuat.
 * - Port→port: path handle→handle (tanpa ghost endpoint).
 * - Port→body: path handle→cursor / ghost inlet bila muncul.
 * - Ghost port sendiri dirender UnitNode (lapisan port), bukan di sini.
 */

import {
  Position,
  getSmoothStepPath,
  useEdges,
  useReactFlow,
} from "@xyflow/react";
import { portEdgePoint } from "@/lib/geometry";
import {
  alignToPortEdge,
  getWaypointOffset,
  getWaypointPath,
} from "@/components/flow/edge";
import { CONNECT_OVERLAY_SOURCE_ID } from "@/components/flow/constants";
import { sideToPosition } from "@/components/flow/port";
import { useFlowStore } from "@/stores/flow-store";

function isOverlayFrom(handle) {
  if (!handle?.id) return true;
  return handle.id === CONNECT_OVERLAY_SOURCE_ID;
}

function ghostEdgePoint(node, preview) {
  if (!node || !preview || preview.side == null || preview.position == null) {
    return null;
  }
  if (preview.nodeId !== node.id) return null;
  return {
    point: portEdgePoint(node, preview.side, preview.position),
    position: sideToPosition[preview.side] ?? null,
  };
}

function alignGhostPoint(node, ghost) {
  if (!node || !ghost) return null;
  return alignToPortEdge(
    { ...ghost.point, position: ghost.position },
    node,
    null,
  );
}

export function GhostConnectionLine({
  connectionLineStyle,
  fromNode,
  fromHandle,
  fromX,
  fromY,
  fromPosition,
  toNode,
  toHandle,
  toX,
  toY,
  toPosition,
  connectionStatus,
}) {
  const outletPreview = useFlowStore((state) => state.connectGhost);
  const inletPreview = useFlowStore((state) => state.connectGhostInlet);
  const connectBlocked = useFlowStore((state) => state.connectBlocked);
  const edges = useEdges();
  const { getNode } = useReactFlow();

  const showOutlet =
    fromNode &&
    isOverlayFrom(fromHandle) &&
    outletPreview &&
    outletPreview.nodeId === fromNode.id;
  const outlet = showOutlet ? ghostEdgePoint(fromNode, outletPreview) : null;
  // Inlet ghost: path berakhir di ghost hanya bila drag dari badan
  // (port→port / port→body tanpa outlet ghost → pakai toX/toY handle/cursor).
  const inletNode =
    toNode ??
    (showOutlet && inletPreview?.nodeId
      ? getNode(inletPreview.nodeId)
      : null);
  const inlet = showOutlet ? ghostEdgePoint(inletNode, inletPreview) : null;

  const [smoothPath] = getSmoothStepPath({
    sourceX: outlet ? outlet.point.x : fromX,
    sourceY: outlet ? outlet.point.y : fromY,
    sourcePosition: outlet?.position ?? fromPosition ?? Position.Right,
    targetX: inlet ? inlet.point.x : toX,
    targetY: inlet ? inlet.point.y : toY,
    targetPosition: inlet?.position ?? toPosition,
    borderRadius: 12,
    offset: 28,
  });
  const [path] =
    outlet && inlet
      ? getWaypointPath(
          alignGhostPoint(fromNode, outlet),
          alignGhostPoint(inletNode, inlet),
          { offset: getWaypointOffset(edges.length) },
        )
      : [smoothPath];

  // Merah bila: (1) isValidConnection false, (2) pointermove menandai blocked
  // (target tanpa port neutral), (3) drag dari port existing menimpa badan
  // node tujuan (toHandle null) — konsisten dengan toast "Butuh port".
  const fromIsRealPort = Boolean(fromHandle) && !isOverlayFrom(fromHandle);
  const blocked =
    connectBlocked ||
    connectionStatus === "invalid" ||
    (fromIsRealPort && Boolean(toNode) && !toHandle);

  const stroke = blocked
    ? "#dc2626"
    : connectionStatus === "valid"
      ? "#16a34a"
      : "#2563eb";

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray="6 4"
        style={connectionLineStyle}
      />
    </g>
  );
}
