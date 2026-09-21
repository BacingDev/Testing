"use client";

import { memo, useMemo, useState } from "react";
import { Box } from "@chakra-ui/react";
import { Handle, Position } from "@xyflow/react";
import { useFlowContext } from "@/components/flow/flow-context";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";
import { portKey } from "@/stores/selection-key";

const SELECT_COLOR = "#2563eb";

/**
 * Domain sidelocation: 0 = bawah, 1 = kanan, 2 = atas, 3 = kiri
 * (atas/bawah terbalik dari mapping React Flow Top=0 / Bottom=2)
 */
const sideToPosition = {
  0: Position.Bottom,
  1: Position.Right,
  2: Position.Top,
  3: Position.Left,
};

/** Offset along the node edge; works for any sidelocation + position %. */
function getHandleStyle(sidelocation, position) {
  const pct = `${position}%`;
  return {
    ...(sidelocation === 1 || sidelocation === 3
      ? { top: pct }
      : { left: pct }),
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
    overflow: "visible",
  };
}

/** Jarak label dari tip — ngaruh ke adanya panah di sisi port tersebut. */
function getLabelGap(portType, hasArrow) {
  if (portType === "exposed port" || portType === "virtual port") return 16;
  // Port tujuan edge punya panah → label diberi jarak agar tidak tertutup.
  // Port sumber/tanpa edge tidak ada panah → label didempetkan ke port.
  return hasArrow ? 12 : 5;
}

/**
 * Peran port di dalam grafik: apakah menjadi ujung source/target suatu edge.
 * Arah tampil port diturunkan dari sini — port tanpa edge tampil sebagai
 * default/neutral, terlepas dari nilai `hasDirection` yang tersimpan.
 */
function usePortRole(nodeId, portId) {
  const edges = useGraphStore((state) => state.edges);
  return useMemo(() => {
    const id = String(portId);
    let source = false;
    let target = false;
    for (const edge of edges) {
      if (edge.source === nodeId && String(edge.sourceHandle) === id)
        source = true;
      if (edge.target === nodeId && String(edge.targetHandle) === id)
        target = true;
      if (source && target) break;
    }
    return { source, target };
  }, [edges, nodeId, portId]);
}

function getPortLabelStyle(sidelocation, portType, hasArrow) {
  const gap = getLabelGap(portType, hasArrow);
  switch (sidelocation) {
    case 2: // atas — label di luar (ke atas)
      return {
        left: "50%",
        bottom: `calc(100% + ${gap}px)`,
        transform: "translateX(-50%)",
      };
    case 1: // kanan
      return {
        left: `calc(100% + ${gap}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      };
    case 0: // bawah — label di luar (ke bawah)
      return {
        left: "50%",
        top: `calc(100% + ${gap}px)`,
        transform: "translateX(-50%)",
      };
    case 3: // kiri
      return {
        right: `calc(100% + ${gap}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      };
    default:
      return {};
  }
}

const PortShape = memo(function PortShape({ nodeId, port, active }) {
  const [hovered, setHovered] = useState(false);
  const showPorts = useFlowStore((state) => state.showPorts);
  const selectPort = useGraphStore((state) => state.selectPort);
  const { openPortMenu } = useFlowContext();
  const key = portKey(nodeId, port.idpfport);
  const isSelected = useGraphStore((state) =>
    state.selectedPortKeys.includes(key),
  );
  const { source, target } = usePortRole(nodeId, port.idpfport);
  // Arah visual: outlet bila jadi ujung source, inlet bila jadi ujung target,
  // selain itu tampil sebagai port default (neutral).
  const effectiveDirection = target ? "inlet" : source ? "outlet" : "neutral";
  const colors = useMemo(() => {
    const highlighted = hovered || isSelected || active;
    if (port.type === "exposed port")
      return {
        fill: port.hasMetadata ? "#fda4af" : "#ffe4e6",
        stroke: highlighted ? SELECT_COLOR : "#be123c",
      };
    if (port.type === "virtual port")
      return {
        fill: port.hasMetadata ? "#c4b5fd" : "#ede9fe",
        stroke: highlighted ? SELECT_COLOR : "#6d28d9",
      };
    if (effectiveDirection === "outlet")
      return {
        fill: port.hasMetadata ? "#fdba74" : "#ffedd5",
        stroke: highlighted ? SELECT_COLOR : "#c2410c",
      };
    if (effectiveDirection === "inlet")
      return {
        fill: port.hasMetadata ? "#86efac" : "#dcfce7",
        stroke: highlighted ? SELECT_COLOR : "#15803d",
      };
    return {
      fill: port.hasMetadata ? "#cbd5e1" : "#ffffff",
      stroke: highlighted ? SELECT_COLOR : "#111827",
    };
  }, [port.type, effectiveDirection, port.hasMetadata, hovered, isSelected, active]);
  const isExposed = port.type === "exposed port";
  const isVirtual = port.type === "virtual port";
  // Stroke seragam & proporsional ke ukuran badan (~8–10px)
  const strokeWidth = isSelected ? 2 : hovered || active ? 1.5 : 1;
  const common = {
    ...colors,
    strokeWidth,
  };

  // Proporsional ke port biasa (10×10, r≈4): badan ~8px, kaki pendek ~4.5px
  // Stem ke +y lokal; rotasi agar kaki mengarah ke node (nempel di edge)
  const rotation = { 0: 180, 1: 90, 2: 0, 3: -90 }[port.sidelocation];
  const size = isExposed || isVirtual ? { w: 10, h: 13, tipX: 5, tipY: 12.5 } : { w: 10, h: 10, tipX: 5, tipY: 5 };

  return (
    <>
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        width={size.w}
        height={size.h}
        style={{
          position: "absolute",
          left: -size.tipX,
          top: -size.tipY,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${size.tipX}px ${size.tipY}px`,
          pointerEvents: "all",
          opacity: showPorts ? 1 : 0,
          overflow: "visible",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(event) => {
          // Jangan biarkan klik port ikut menyeleksi node induk — kalau tidak,
          // seleksi port langsung tertimpa seleksi node.
          event.preventDefault();
          event.stopPropagation();
          selectPort(key, event.shiftKey || event.metaKey || event.ctrlKey);
        }}
        onContextMenu={(event) => {
          // stopPropagation supaya menu klik-kanan node tidak ikut terbuka.
          event.preventDefault();
          event.stopPropagation();
          openPortMenu(nodeId, port.idpfport, event);
        }}
      >
        {isSelected ? (
          port.type === "port" ? (
            <circle
              cx="5"
              cy="5"
              r="6.5"
              fill="none"
              stroke={SELECT_COLOR}
              strokeWidth="1.5"
            />
          ) : isExposed ? (
            <polygon
              points="5,-1.5 11.5,5 5,11.5 -1.5,5"
              fill="none"
              stroke={SELECT_COLOR}
              strokeWidth="1.5"
            />
          ) : (
            <rect
              x="-1.5"
              y="-2"
              width="13"
              height="13"
              rx="2"
              fill="none"
              stroke={SELECT_COLOR}
              strokeWidth="1.5"
            />
          )
        ) : null}
        {port.type === "port" ? (
          <circle cx="5" cy="5" r="4" {...common} />
        ) : null}
        {isExposed ? (
          <>
            {/* Diamond ~8px, setara diameter port biasa */}
            <polygon points="5,0.5 9.5,5 5,9.5 0.5,5" {...common} />
            <path d="M 5 9.5 L 5 12.5" {...common} />
          </>
        ) : null}
        {isVirtual ? (
          <>
            {/* Kotak ~8px + kaki pendek */}
            <rect x="1" y="0.5" width="8" height="8" {...common} />
            <path d="M 5 8.5 L 5 12.5" {...common} />
          </>
        ) : null}
      </svg>
      {showPorts && port.name ? (
        <Box
          pointerEvents="none"
          position="absolute"
          zIndex={20}
          whiteSpace="nowrap"
          rounded="sm"
          bg="white/90"
          px={1}
          fontSize="9px"
          fontWeight="medium"
          lineHeight="none"
          color="gray.700"
          boxShadow="sm"
          style={getPortLabelStyle(port.sidelocation, port.type, target)}
        >
          {port.name}
        </Box>
      ) : null}
    </>
  );
});

export const FlowPort = memo(function FlowPort({ nodeId, port, active }) {
  const position = sideToPosition[port.sidelocation];
  const handleStyle = getHandleStyle(port.sidelocation, port.position);
  const { source, target } = usePortRole(nodeId, port.idpfport);
  // Port yang jadi ujung source tidak punya handle target (dan sebaliknya).
  // Port tanpa edge adalah default/neutral → punya dua arah koneksi.
  const showTarget = !(source && !target);
  const showSource = !(target && !source);
  // Virtual (VP) & exposed (EP) adalah port non-koneksi — tidak boleh ada edge.
  const connectable =
    port.type !== "virtual port" && port.type !== "exposed port";

  return (
    <>
      {showTarget ? (
        <Handle
          id={port.idpfport}
          type="target"
          position={position}
          style={handleStyle}
          isConnectable={connectable}
        >
          <PortShape nodeId={nodeId} port={port} active={active} />
        </Handle>
      ) : null}
      {showSource ? (
        <Handle
          id={port.idpfport}
          type="source"
          position={position}
          style={handleStyle}
          isConnectable={connectable}
        >
          {!showTarget ? (
            <PortShape nodeId={nodeId} port={port} active={active} />
          ) : null}
        </Handle>
      ) : null}
    </>
  );
});
