"use client";

import { memo, useMemo, useState } from "react";
import { useViewport } from "@xyflow/react";

const NodeBorder = memo(function NodeBorder({
  height,
  width,
  isSelected,
  styleBorderDotted = false,
  isNotShownNode = false,
}) {
  const { zoom } = useViewport();
  const [hovered, setHovered] = useState(false);
  const strokeWidth = 2 / zoom;
  const stroke = useMemo(
    () => (hovered ? "#7dd3fc" : isSelected ? "#0284c7" : "#94a3b8"),
    [hovered, isSelected],
  );
  const dash =
    isSelected || isNotShownNode
      ? "none"
      : hovered && styleBorderDotted
        ? `${4 / zoom} ${2 / zoom}`
        : "none";

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        pointerEvents: "auto",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={width - strokeWidth}
        height={height - strokeWidth}
        rx="4"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
      />
    </svg>
  );
});

export default NodeBorder;
