import { promises as fs } from "fs";
import path from "path";

/** File "database" runtime — seed tetap di data/flow-payload.json. */
const FLOW_FILE = path.join(process.cwd(), "data", "flow-store.json");

/** Baca graph tersimpan; null bila belum pernah disimpan. */
export async function readFlow() {
  try {
    const raw = await fs.readFile(FLOW_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }
    return { nodes: parsed.nodes, edges: parsed.edges };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/** Tulis graph ke file (atomic: write temp lalu rename). */
export async function writeFlow({ nodes, edges }) {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    nodes,
    edges,
  };
  await fs.mkdir(path.dirname(FLOW_FILE), { recursive: true });
  const tmp = `${FLOW_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
  await fs.rename(tmp, FLOW_FILE);
  return payload;
}
