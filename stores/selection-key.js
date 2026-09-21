/**
 * Kunci seleksi port: satu port unik per kombinasi node + id port
 * (id port bisa berulang di node berbeda).
 */
export function portKey(nodeId, portId) {
  return `${nodeId}:${portId}`;
}

export function splitPortKey(key) {
  const index = String(key).indexOf(":");
  if (index < 0) return { nodeId: String(key), portId: null };
  return {
    nodeId: String(key).slice(0, index),
    portId: String(key).slice(index + 1),
  };
}
