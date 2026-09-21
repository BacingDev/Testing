import { MarkerType, Position } from "@xyflow/react";
import flowPayload from "@/data/flow-payload.json";
import { UNIT_CATALOG } from "@/data/unit-catalog";

/** Image default jika path /pfm/units belum tersedia. */
export const DEFAULT_NODE_IMAGE = "/default-unit.svg";

/** Gambar external (inlet/export) yang tidak ada di katalog. */
export const EXTERNAL_NODE_IMAGE = "/pfm/units/EXTERNAL.svg";

/** Peta nama unit → path gambar terbaru dari katalog. */
const UNIT_IMAGE_BY_NAME = UNIT_CATALOG.reduce((map, unit) => {
  map[unit.name.trim().toUpperCase()] = unit.image;
  return map;
}, {});

function imageName(source) {
  return String(source ?? "")
    .split("/")
    .pop()
    .replace(/\.svg$/i, "")
    .trim()
    .toUpperCase();
}

/**
 * Payload lama menyimpan nama file yang berbeda dari nama file terbaru
 * (mis. "ACID GAS REMOVAL.svg" vs ACIDGAS.svg). Resolve ke gambar baru.
 */
export function resolveUnitImage(source) {
  const name = imageName(source);
  if (!name) return DEFAULT_NODE_IMAGE;
  if (name.includes("EXTERNAL")) return EXTERNAL_NODE_IMAGE;
  return UNIT_IMAGE_BY_NAME[name] ?? DEFAULT_NODE_IMAGE;
}

const toReactFlowPosition = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

function mapNodeRecord(node) {
  return {
    id: node.id,
    type: "workflow",
    position: { ...node.position },
    width: node.width,
    height: node.height,
    // Di atas edge supaya label yang overflow tetap kebaca
    zIndex: 10,
    sourcePosition: toReactFlowPosition[node.sourcePosition],
    targetPosition: toReactFlowPosition[node.targetPosition],
    data: {
      ...node.data,
      image: resolveUnitImage(node.data.image),
      ports: (node.data.ports ?? []).map((p) => ({ ...p })),
    },
  };
}

function mapEdgeRecord(edge) {
  return {
    id: edge.id,
    type: "waypoint",
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: edge.animated,
    zIndex: 1,
    style: { ...edge.style },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.markerEnd.color,
      width: edge.markerEnd.width,
      height: edge.markerEnd.height,
    },
    data: {
      points: (edge.data?.points ?? []).map((point) => ({ ...point })),
      remark: edge.remark ?? null,
    },
  };
}

/**
 * Payload bentuk: { parent, nodes, edges }
 * Diagram menampilkan `nodes` (+ edges). `parent` tetap diekspos untuk konteks.
 */
export function createInitialNodes(payload = flowPayload) {
  return Object.values(payload.nodes ?? {}).map(mapNodeRecord);
}

export function createInitialEdges(payload = flowPayload) {
  return Object.values(payload.edges ?? {}).map(mapEdgeRecord);
}

export function getParentNodes(payload = flowPayload) {
  return Object.values(payload.parent ?? {}).map(mapNodeRecord);
}

const pointToFloat = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Buat node "workflow" baru dari unit katalog saat di-drop ke canvas.
 * Node baru sengaja tanpa port — port dibuat otomatis saat ada edge dibuat
 * (atau lewat menu sidebar).
 */
export function createUnitNode(unit, position) {
  const id = `unit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type: "workflow",
    position: { x: pointToFloat(position.x), y: pointToFloat(position.y) },
    width: unit.width ?? 180,
    height: unit.height ?? 100,
    zIndex: 10,
    data: {
      label: unit.label ?? unit.name,
      image: resolveUnitImage(unit.image),
      shown: "T",
      style: {},
      ports: [],
    },
  };
}

export { flowPayload };
