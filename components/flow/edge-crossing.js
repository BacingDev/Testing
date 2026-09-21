import { Position, getSmoothStepPath } from "@xyflow/react";
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "@/components/flow/constants";

/** Seberapa jauh sisi luar port dari pusat handle (arah keluar node). */
const PORT_REACH = {
  port: 5,
  "exposed port": 13,
  "virtual port": 13,
};

/** Vektor keluar node per posisi handle (React Flow). */
const OUTWARD_BY_POSITION = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
};

/**
 * Geser titik handle ke tepi luar port (arah keluar node) sehingga ujung edge
 * (termasuk panah markerEnd) berhenti sejajar dengan port biasa dan tidak
 * tersembunyi di belakang body port / handle.
 */
export function alignToPortEdge(point, node, handleId) {
  const dir = OUTWARD_BY_POSITION[point.position] ?? { x: 0, y: 0 };
  const port = node?.data?.ports?.find((p) => p.idpfport === handleId);
  const reach = PORT_REACH[port?.type] ?? 5;
  return {
    x: point.x + dir.x * reach,
    y: point.y + dir.y * reach,
    position: point.position,
  };
}

/** Domain sidelocation → sisi node (0 bawah, 1 kanan, 2 atas, 3 kiri). */
function getHandlePose(node, handleId) {
  const w = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
  const h = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
  // Dukung user node maupun internal node (useInternalNode / nodeLookup)
  const absolute = node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;
  const x = absolute?.x ?? 0;
  const y = absolute?.y ?? 0;
  const port = node.data?.ports?.find((p) => p.idpfport === handleId);
  const pct = (port?.position ?? 50) / 100;
  const side = port?.sidelocation ?? 1;

  if (side === 2) {
    return { x: x + w * pct, y, position: Position.Top };
  }
  if (side === 0) {
    return { x: x + w * pct, y: y + h, position: Position.Bottom };
  }
  if (side === 1) {
    return { x: x + w, y: y + h * pct, position: Position.Right };
  }
  return { x, y: y + h * pct, position: Position.Left };
}

export function getEdgeSmoothPath(edge, nodeById, pathOptions = {}) {
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  const source = alignToPortEdge(
    getHandlePose(sourceNode, edge.sourceHandle),
    sourceNode,
    edge.sourceHandle,
  );
  const target = alignToPortEdge(
    getHandlePose(targetNode, edge.targetHandle),
    targetNode,
    edge.targetHandle,
  );

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: source.x,
    sourceY: source.y,
    sourcePosition: source.position,
    targetX: target.x,
    targetY: target.y,
    targetPosition: target.position,
    borderRadius: pathOptions.borderRadius ?? 12,
    offset: pathOptions.offset ?? 28,
  });

  return { path, labelX, labelY };
}

function samplePath(d, step = 5) {
  if (typeof document === "undefined" || !d) return [];
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", d);
  const len = el.getTotalLength();
  if (!len) return [];
  const pts = [];
  for (let i = 0; i <= len; i += step) {
    const p = el.getPointAtLength(i);
    pts.push({ x: p.x, y: p.y, len: i });
  }
  const end = el.getPointAtLength(len);
  if (!pts.length || pts[pts.length - 1].len < len) {
    pts.push({ x: end.x, y: end.y, len });
  }
  return pts;
}

function segmentIntersection(a1, a2, b1, b2) {
  const den =
    (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);
  if (Math.abs(den) < 1e-8) return null;
  const t =
    ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / den;
  const u =
    -((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / den;
  if (t <= 0.03 || t >= 0.97 || u <= 0.03 || u >= 0.97) return null;
  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
    len: a1.len + t * (a2.len - a1.len),
  };
}

function findCrossings(pathPts, otherPts) {
  const hits = [];
  for (let i = 0; i < pathPts.length - 1; i += 1) {
    for (let j = 0; j < otherPts.length - 1; j += 1) {
      const hit = segmentIntersection(
        pathPts[i],
        pathPts[i + 1],
        otherPts[j],
        otherPts[j + 1],
      );
      if (hit) hits.push(hit);
    }
  }
  return hits;
}

/**
 * Sisipkan lengkungan (hop) di titik persilangan dengan edge lain.
 * Path dasar tetap smooth-step; data points tidak dipakai.
 *
 * `spanRadius` mengatur seberapa jauh hop melebar di sepanjang path;
 * tinggi lengkungan selalu di-proporsikan lebih kecil (radius*0.6) agar
 * hop tidak terlihat terlalu besar/bulky.
 */
export function applyCrossingHops(pathD, otherPathDs, spanRadius = 6) {
  if (typeof document === "undefined" || !pathD || !otherPathDs?.length) {
    return pathD;
  }

  const radius = spanRadius;
  const hopHeight = radius * 0.6;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", pathD);
  const totalLen = el.getTotalLength();
  if (totalLen < radius * 4) return pathD;

  const selfPts = samplePath(pathD, 4);
  const crossings = [];
  for (const other of otherPathDs) {
    const otherPts = samplePath(other, 4);
    crossings.push(...findCrossings(selfPts, otherPts));
  }

  crossings.sort((a, b) => a.len - b.len);
  const unique = [];
  for (const c of crossings) {
    const prev = unique[unique.length - 1];
    if (!prev || Math.hypot(c.x - prev.x, c.y - prev.y) > radius * 2.2) {
      if (c.len > radius * 1.5 && c.len < totalLen - radius * 1.5) {
        unique.push(c);
      }
    }
  }
  if (!unique.length) return pathD;

  let d = "";
  let cursor = 0;
  const start = el.getPointAtLength(0);
  d = `M ${start.x} ${start.y}`;

  for (const cross of unique) {
    const lenBefore = Math.max(cursor, cross.len - radius);
    const lenAfter = Math.min(totalLen, cross.len + radius);
    if (lenAfter <= lenBefore) continue;

    // trace sisa path sampai sebelum hop (ikut kurva asli)
    for (let L = cursor + 4; L < lenBefore; L += 4) {
      const p = el.getPointAtLength(L);
      d += ` L ${p.x} ${p.y}`;
    }
    const before = el.getPointAtLength(lenBefore);
    const after = el.getPointAtLength(lenAfter);
    d += ` L ${before.x} ${before.y}`;

    const a = el.getPointAtLength(Math.max(0, cross.len - 1));
    const b = el.getPointAtLength(Math.min(totalLen, cross.len + 1));
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dl = Math.hypot(dx, dy) || 1;
    const nx = -dy / dl;
    const ny = dx / dl;
    const ctrl = {
      x: cross.x + nx * hopHeight,
      y: cross.y + ny * hopHeight,
    };
    d += ` Q ${ctrl.x} ${ctrl.y} ${after.x} ${after.y}`;
    cursor = lenAfter;
  }

  for (let L = cursor + 4; L < totalLen; L += 4) {
    const p = el.getPointAtLength(L);
    d += ` L ${p.x} ${p.y}`;
  }
  const end = el.getPointAtLength(totalLen);
  d += ` L ${end.x} ${end.y}`;
  return d;
}
