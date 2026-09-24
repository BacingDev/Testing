/**
 * Proyeksi titik ke tepi node: sisi (sidelocation) + posisi persen.
 * Digunakan tool port (klik) dan pembuatan edge (drop) supaya port
 * selalu muncul di sisi/posisi yang ditunjuk kursor.
 *
 * sidelocation: 0 = bawah, 1 = kanan, 2 = atas, 3 = kiri.
 */
export function sideAndPos(node, point) {
  const { x: ox, y: oy } = nodeOrigin(node);
  const w = nodeSize(node).width;
  const h = nodeSize(node).height;
  const cx = ox + w / 2;
  const cy = oy + h / 2;
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
  const nx = w ? (bx - ox) / w : 0.5;
  const ny = h ? (by - oy) / h : 0.5;
  if (bx <= ox) return [3, ny * 100];
  if (bx >= ox + w) return [1, ny * 100];
  if (by <= oy) return [2, nx * 100];
  return [0, nx * 100];
}

function nodeOrigin(node) {
  const abs = node.internals?.positionAbsolute ?? node.positionAbsolute;
  return {
    x: abs?.x ?? node.position?.x ?? 0,
    y: abs?.y ?? node.position?.y ?? 0,
  };
}

function nodeSize(node) {
  const width = node.measured?.width ?? node.width ?? 0;
  const height = node.measured?.height ?? node.height ?? 0;
  return { width, height };
}

/** Titik pusat node (dukung InternalNode React Flow). */
export function centerOfNode(node) {
  const { x, y } = nodeOrigin(node);
  const { width, height } = nodeSize(node);
  return { x: x + width / 2, y: y + height / 2 };
}

/** Titik absolut di tepi node untuk sidelocation + posisi persen. */
export function portEdgePoint(node, sidelocation, position) {
  const { x, y } = nodeOrigin(node);
  const { width, height } = nodeSize(node);
  const pct = Math.max(0, Math.min(100, position ?? 50)) / 100;
  if (sidelocation === 1) return { x: x + width, y: y + height * pct };
  if (sidelocation === 3) return { x, y: y + height * pct };
  if (sidelocation === 2) return { x: x + width * pct, y };
  return { x: x + width * pct, y: y + height };
}
