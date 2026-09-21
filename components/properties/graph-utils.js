import { splitPortKey } from "@/stores/selection-key";

export const SIDELOCATION_LABEL = {
  0: "Bawah",
  1: "Kanan",
  2: "Atas",
  3: "Kiri",
};

export const DIRECTION_LABEL = {
  inlet: "Inlet",
  outlet: "Outlet",
  neutral: "Netral",
};

export const DIRECTION_TONE = {
  inlet: "green",
  outlet: "orange",
  neutral: "gray",
};

export const PORT_TYPE_LABEL = {
  port: "Port",
  "exposed port": "Exposed",
  "virtual port": "Virtual",
};

export const PORT_TYPE_TONE = {
  port: "gray",
  "exposed port": "red",
  "virtual port": "purple",
};

export const STATUS_LABEL = {
  CONNECTED: "Terhubung",
  DISCONNECTED: "Belum",
  DROPPED: "Dropped",
};

export const STATUS_TONE = {
  CONNECTED: "green",
  DISCONNECTED: "gray",
  DROPPED: "red",
};

export const KIND_LABEL = { node: "Node", edge: "Edge", port: "Port" };

export const KIND_TONE = { node: "blue", edge: "teal", port: "purple" };

export function nodeName(node) {
  const label = node?.data?.label;
  return (typeof label === "string" && label.trim()) || node?.id || "-";
}

export function portLabel(node, handleId) {
  if (handleId === null || handleId === undefined) return "-";
  const port = (node?.data?.ports ?? []).find(
    (item) => String(item.idpfport) === String(handleId),
  );
  if (!port) return `#${handleId}`;
  return port.name?.trim() || `#${port.idpfport}`;
}

export function portCount(node) {
  return (node?.data?.ports ?? []).length;
}

export function edgeCount(edges, nodeId) {
  return edges.reduce(
    (total, edge) =>
      total + (edge.source === nodeId || edge.target === nodeId ? 1 : 0),
    0,
  );
}

/**
 * Signature daftar item: mengabaikan posisi/ukuran supaya tabel utama tidak
 * ikut render ulang saat node digeser (drag) atau di-resize.
 */
export function listSignature(nodes, edges) {
  const parts = [];
  for (const node of nodes) {
    parts.push(
      `n:${node.id}:${node.selected ? 1 : 0}:${node.data?.label ?? ""}:${
        node.data?.facilityType ?? ""
      }:${portCount(node)}:${edgeCount(edges, node.id)}`,
    );
  }
  for (const edge of edges) {
    parts.push(`e:${edge.id}:${edge.selected ? 1 : 0}:${edge.source}:${edge.target}`);
  }
  for (const node of nodes) {
    for (const port of node.data?.ports ?? []) {
      parts.push(`p:${node.id}:${port.idpfport}:${port.connectionStatus ?? ""}`);
    }
  }
  return parts.join("|");
}

/**
 * Signature isi item untuk tabel detail (tanpa posisi/ukuran).
 *
 * Posisi & ukuran sengaja tidak ikut supaya panel tidak render ulang tiap
 * frame saat node di-drag/resize — nilainya di-refresh lewat `revision` di
 * flow-store yang di-bump saat drag/resize selesai.
 */
export function detailSignature(nodes, edges) {
  const parts = [listSignature(nodes, edges)];
  for (const node of nodes) {
    const style = node.data?.style ?? {};
    parts.push(
      `s:${node.id}:${style.visual ?? ""}:${style.rotate ?? 0}:${
        style.horizontalFlip ? 1 : 0
      }:${style.verticalFlip ? 1 : 0}:${node.data?.image ?? ""}:${
        node.data?.remark ?? ""
      }`,
    );
  }
  for (const node of nodes) {
    for (const port of node.data?.ports ?? []) {
      parts.push(
        `q:${node.id}:${port.idpfport}:${port.name ?? ""}:${
          port.hasDirection ?? ""
        }:${port.sidelocation ?? ""}:${port.position ?? ""}:${
          port.type ?? ""
        }:${port.hasMetadata ? 1 : 0}:${port.remark ?? ""}`,
      );
    }
  }
  for (const edge of edges) {
    parts.push(
      `d:${edge.id}:${(edge.data?.points ?? []).length}:${
        edge.animated ? 1 : 0
      }:${edge.style?.strokeWidth ?? ""}:${edge.style?.stroke ?? ""}:${
        edge.data?.remark ?? ""
      }`,
    );
  }
  return parts.join("~");
}

export function buildCanvasRows(nodes, edges) {
  const rows = [];

  for (const node of nodes) {
    rows.push({
      key: `node:${node.id}`,
      kind: "node",
      id: node.id,
      name: nodeName(node),
      info: `${node.data?.facilityType || "node"} · ${portCount(node)} port · ${edgeCount(
        edges,
        node.id,
      )} edge`,
      selected: !!node.selected,
    });
  }

  return rows;
}

/**
 * Ringkasan seleksi untuk panel Properties: jumlah per jenis, kunci baris yang
 * harus di-highlight, dan total item terpilih.
 */
export function summarizeSelection(nodes, edges, selectedPortKeys = []) {
  const selectedNodeIds = nodes
    .filter((node) => node.selected)
    .map((node) => String(node.id));
  const selectedEdgeIds = edges
    .filter((edge) => edge.selected)
    .map((edge) => String(edge.id));
  const keys = new Set(selectedNodeIds.map((id) => `node:${id}`));
  for (const key of selectedPortKeys) {
    keys.add(`node:${splitPortKey(key).nodeId}`);
  }
  return {
    selectedKeys: keys,
    nodeCount: selectedNodeIds.length,
    edgeCount: selectedEdgeIds.length,
    portCount: selectedPortKeys.length,
    count: selectedNodeIds.length + selectedEdgeIds.length + selectedPortKeys.length,
  };
}

/**
 * Fokus tunggal untuk panel detail. Saat seleksi lebih dari satu item
 * (multi-select), fungsi mengembalikan null supaya properti dinonaktifkan.
 */
export function deriveFocus(nodes, edges, selectedPortKeys = []) {
  const { count } = summarizeSelection(nodes, edges, selectedPortKeys);
  if (count !== 1) return null;

  const selectedNode = nodes.find((item) => item.selected);
  if (selectedNode) {
    return { kind: "node", id: selectedNode.id, node: selectedNode, portId: null };
  }

  const selectedEdge = edges.find((item) => item.selected);
  if (selectedEdge) {
    return { kind: "edge", id: selectedEdge.id, edge: selectedEdge };
  }

  const { nodeId, portId } = splitPortKey(selectedPortKeys[0]);
  const node = nodes.find((item) => String(item.id) === String(nodeId));
  if (!node) return null;
  return { kind: "node", id: node.id, node, portId };
}

function kvTable(entries) {
  return {
    columns: [
      { key: "field", label: "Field" },
      { key: "value", label: "Nilai" },
    ],
    rows: entries.map(([field, value], index) => ({
      key: `${field}-${index}`,
      cells: { field, value },
    })),
  };
}

function nameOf(nodes, id) {
  const node = nodes.find((item) => item.id === id);
  return node ? nodeName(node) : id ?? "-";
}

function portOf(nodes, id, handleId) {
  const node = nodes.find((item) => item.id === id);
  return portLabel(node, handleId);
}

function nodeTable(node) {
  const data = node.data ?? {};
  const style = data.style ?? {};
  const lifetime = (data.lifetimes ?? [])[0];
  const flip =
    [style.verticalFlip && "Vertikal", style.horizontalFlip && "Horizontal"]
      .filter(Boolean)
      .join(", ") || "-";

  return kvTable([
    ["ID", String(node.id)],
    ["Nama", nodeName(node)],
    ["Tipe fasilitas", data.facilityType || "-"],
    ["Parent", data.parentName || data.parentId || "-"],
    ["Punya child", data.hasChildren ? "Ya" : "Tidak"],
    ["Punya metadata", data.hasMetadata ? "Ya" : "Tidak"],
    ["Ditampilkan", data.shown === "T" ? "Ya" : "Tidak"],
    ["Remark", data.remark || "-"],
    ["Ukuran", `${Math.round(node.width ?? 0)} × ${Math.round(node.height ?? 0)}`],
    [
      "Posisi",
      `x ${Math.round(node.position?.x ?? 0)}, y ${Math.round(node.position?.y ?? 0)}`,
    ],
    ["Visual", style.visual || "-"],
    ["Rotasi", `${style.rotate ?? 0}°`],
    ["Flip", flip],
    [
      "Lifetime",
      lifetime ? `${lifetime.startDate} → ${lifetime.endDate || "sekarang"}` : "-",
    ],
    ["Jumlah port", String(portCount(node))],
  ]);
}

function portsTable(ports, highlightPortId) {
  return {
    highlightId: highlightPortId ?? null,
    columns: [
      { key: "name", label: "Nama" },
      { key: "id", label: "ID" },
      {
        key: "direction",
        label: "Arah",
        format: (value) => DIRECTION_LABEL[value] ?? value ?? "-",
        tone: (value) => DIRECTION_TONE[value],
      },
      {
        key: "side",
        label: "Sisi",
        format: (value) => SIDELOCATION_LABEL[value] ?? "-",
      },
      {
        key: "type",
        label: "Tipe",
        format: (value) => PORT_TYPE_LABEL[value] ?? value ?? "-",
        tone: (value) => PORT_TYPE_TONE[value],
      },
      {
        key: "status",
        label: "Status",
        format: (value) => STATUS_LABEL[value] ?? value ?? "-",
        tone: (value) => STATUS_TONE[value],
      },
    ],
    rows: ports.map((port, index) => ({
      key: `${port.idpfport ?? index}`,
      id: port.idpfport,
      cells: {
        name: port.name?.trim() || "-",
        id: String(port.idpfport ?? "-"),
        direction: port.hasDirection,
        side: port.sidelocation,
        type: port.type,
        status: port.connectionStatus,
      },
    })),
  };
}

function edgeRelationTable(edges, direction, nodes) {
  const incoming = direction === "in";
  return {
    columns: [
      { key: "id", label: "ID Edge" },
      { key: "other", label: incoming ? "Dari" : "Ke" },
      { key: "outPort", label: "Port Keluar" },
      { key: "inPort", label: "Port Masuk" },
      { key: "remark", label: "Remark" },
    ],
    rows: edges.map((edge) => ({
      key: edge.id,
      cells: {
        id: String(edge.id),
        other: nameOf(nodes, incoming ? edge.source : edge.target),
        outPort: portOf(nodes, edge.source, edge.sourceHandle),
        inPort: portOf(nodes, edge.target, edge.targetHandle),
        remark: edge.data?.remark || "-",
      },
    })),
  };
}

function edgeTable(edge, nodes) {
  return kvTable([
    ["ID", String(edge.id)],
    [
      "Dari",
      `${nameOf(nodes, edge.source)} · ${portOf(nodes, edge.source, edge.sourceHandle)}`,
    ],
    [
      "Ke",
      `${nameOf(nodes, edge.target)} · ${portOf(nodes, edge.target, edge.targetHandle)}`,
    ],
    ["Animasi", edge.animated ? "Ya" : "Tidak"],
    ["Ketebalan garis", String(edge.style?.strokeWidth ?? 1)],
    ["Warna garis", String(edge.style?.stroke ?? "-")],
    ["Titik waypoint", String((edge.data?.points ?? []).length)],
    ["Remark", edge.data?.remark || "-"],
  ]);
}

export function buildDetailTabs(focus, nodes, edges) {
  if (!focus) return [];

  if (focus.kind === "edge") {
    return [{ value: "edge", label: "Data Edge", table: edgeTable(focus.edge, nodes) }];
  }

  const node = focus.node;
  const tabs = [
    { value: "node", label: "Data Node", table: nodeTable(node) },
  ];

  const ports = node.data?.ports ?? [];
  if (ports.length) {
    tabs.push({
      value: "ports",
      label: "Ports",
      table: portsTable(ports, focus.portId),
    });
  }

  const incoming = edges.filter((edge) => edge.target === node.id);
  const outgoing = edges.filter((edge) => edge.source === node.id);
  if (incoming.length) {
    tabs.push({
      value: "incoming",
      label: "Edge Masuk",
      table: edgeRelationTable(incoming, "in", nodes),
    });
  }
  if (outgoing.length) {
    tabs.push({
      value: "outgoing",
      label: "Edge Keluar",
      table: edgeRelationTable(outgoing, "out", nodes),
    });
  }

  return tabs;
}
