"use client";

import { MiniMap } from "@xyflow/react";
import { useGraphStore } from "@/stores/graph-store";

const NODE_FILL = "#2b2b30";
const NODE_STROKE = "#52525b";
const NODE_SELECTED_STROKE = "#3b82f6";

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
        fill={NODE_FILL}
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
      bgColor="#17171a"
      maskColor="rgba(255, 255, 255, 0.06)"
      maskStrokeColor="rgba(255, 255, 255, 0.15)"
      ariaLabel="Peta mini diagram"
      style={{
        width: 200,
        height: 120,
        borderRadius: 4,
        border: "1px solid #3f3f46",
      }}
    />
  );
}
