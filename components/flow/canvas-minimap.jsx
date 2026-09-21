"use client";

import { MiniMap } from "@xyflow/react";
import { useGraphStore } from "@/stores/graph-store";

const NODE_STROKE = "#cbd5e1";
const NODE_SELECTED_STROKE = "#2563eb";

// React Flow tidak mengirim data node ke `nodeComponent`, jadi gambarnya
// diambil langsung dari store. Selector ini hanya memicu render ulang node
// minimap yang gambarnya berubah.
function MiniMapUnit({ id, x, y, width, height, borderRadius, selected }) {
  const image = useGraphStore(
    (state) => state.nodes.find((node) => node.id === id)?.data?.image,
  );

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={borderRadius}
        fill="#ffffff"
        stroke={selected ? NODE_SELECTED_STROKE : NODE_STROKE}
        strokeWidth={selected ? 2 : 1}
      />
      {image ? (
        <image
          href={image}
          x={x}
          y={y}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
    </g>
  );
}

export function CanvasMiniMap() {
  return (
    <MiniMap
      position="bottom-right"
      nodeComponent={MiniMapUnit}
      nodeBorderRadius={4}
      pannable
      zoomable
      bgColor="#f8fafc"
      maskColor="rgba(15, 23, 42, 0.08)"
      maskStrokeColor="rgba(15, 23, 42, 0.2)"
      ariaLabel="Peta mini diagram"
      style={{
        width: 200,
        height: 120,
        borderRadius: 4,
        border: "1px solid #e2e8f0",
      }}
    />
  );
}
