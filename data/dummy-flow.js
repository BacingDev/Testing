import { MarkerType, Position } from "@xyflow/react";
import flowPayload from "@/data/flow-payload.json";
import { UNIT_CATALOG } from "@/data/unit-catalog";
import { WIDGET_DEFAULTS } from "@/components/flow/widget-preview";

/** Image default jika path komponen belum tersedia. */
export const DEFAULT_NODE_IMAGE = "/default-unit.svg";

/** Gambar external (inlet/export) yang tidak ada di katalog. */
export const EXTERNAL_NODE_IMAGE = "/default-unit.svg";

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
      // Jenis komponen + isi defaultnya. Ikut ke-save ke BE apa adanya
      // (kolom JSONB) supaya preview bisa render hasil yang sama.
      unitId: unit.id,
      widget: { ...(WIDGET_DEFAULTS[unit.id] ?? {}) },
    },
  };
}

export { flowPayload };

/** Unit yang bisa menampung node lain (page / container). */
export function isContainerData(data) {
  const unitId = data?.unitId ?? data?.componentType ?? null;
  return unitId === "page" || unitId === "container";
}

/** Page tidak boleh masuk ke dalam wadah lain, container/widget boleh. */
export function canNestUnit(unitId) {
  return unitId !== "page";
}

function nodeSize(node) {
  return {
    width: node?.measured?.width ?? node?.width ?? 180,
    height: node?.measured?.height ?? node?.height ?? 100,
  };
}

/** Posisi absolut node (menjumlahkan offset semua parent). */
export function absolutePositionOf(nodes, nodeId) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let x = 0;
  let y = 0;
  let current = byId.get(nodeId);
  const guard = new Set();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    x += Number(current.position?.x ?? 0);
    y += Number(current.position?.y ?? 0);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return { x, y };
}

/**
 * Cari wadah (page/container) paling atas yang memuat titik flow.
 * Dipakai saat drop dari palette: menjatuhkan di dalam page/container
 * membuat node bersarang, bukan node lepas.
 */
export function findContainerAt(nodes, point, excludeId = null) {
  const hits = [];
  for (const node of nodes) {
    if (node.id === excludeId) continue;
    if (!isContainerData(node.data)) continue;
    const origin = absolutePositionOf(nodes, node.id);
    const { width, height } = nodeSize(node);
    if (
      point.x >= origin.x &&
      point.x <= origin.x + width &&
      point.y >= origin.y &&
      point.y <= origin.y + height
    ) {
      hits.push({ node, origin });
    }
  }
  // Paling dalam = origin terbesar (wadah di dalam wadah didahulukan).
  hits.sort(
    (a, b) =>
      b.origin.x + b.origin.y - (a.origin.x + a.origin.y),
  );
  return hits.length > 0 ? hits[0].node : null;
}
