"use client";

import { memo, useState } from "react";
import { Box } from "@chakra-ui/react";
import { Handle, NodeResizer, Position } from "@xyflow/react";
import NodeBorder from "@/components/flow/node-border";
import { FlowPort } from "@/components/flow/port";
import { useFlowContext } from "@/components/flow/flow-context";
import { CONNECT_OVERLAY_SOURCE_ID } from "@/components/flow/constants";
import { UnitNodeLabel } from "@/components/flow/node/unit-node-label";
import { UnitNodePreview } from "@/components/flow/node/unit-node-preview";
import { useMultiResize } from "@/components/flow/node/use-multi-resize";
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  RESIZE_COLOR,
} from "@/components/flow/constants";

// Handle tak terlihat yang menutupi badan node agar tarik edge body→body
// bisa dimulai dari mana saja di badan node. Sengaja HANYA source: kalau
// source + target overlay ditumpuk menutupi area yang sama, target (yang
// dirender belakangan) menutupi source sehingga drag tidak pernah mulai
// (handle target tidak bisa menginisiasi koneksi). Drop ke badan node tujuan
// ditangani via onConnectEnd (hit-test posisi) di FlowCanvas, jadi target
// overlay tidak diperlukan.
const CONNECT_OVERLAY_STYLE = {
  opacity: 0,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  minWidth: "100%",
  minHeight: "100%",
  transform: "none",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  zIndex: 0,
};

function UnitNodeComponent({ id, data, selected, width, height }) {
  const nodeWidth = width ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = height ?? DEFAULT_NODE_HEIGHT;
  const [hovered, setHovered] = useState(false);
  const { onResizeStart, onResize, onResizeEnd } = useMultiResize(id);
  const { connectMode } = useFlowContext();

  const ports = data.ports ?? [];
  // sidelocation 0 = bawah — dorong nama node agar tidak menutupi port/label port
  const bottomPorts = ports.filter((port) => port.sidelocation === 0);
  const hasTallBottom = bottomPorts.some(
    (port) => port.type === "virtual port" || port.type === "exposed port",
  );
  const labelTopOffset = hasTallBottom ? 28 : bottomPorts.length > 0 ? 22 : 5;

  return (
    <Box
      position="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: nodeWidth,
        height: nodeHeight,
        opacity: data.shown === "T" ? 1 : 0.35,
      }}
    >
      <UnitNodePreview
        image={data.image}
        label={data.label}
        style={data.style}
        width={nodeWidth}
        height={nodeHeight}
      />
      <NodeBorder
        height={nodeHeight}
        width={nodeWidth}
        isSelected={selected}
        styleBorderDotted={data.style?.visual === "fit"}
        isNotShownNode={data.shown === "F"}
      />
      {/* Overlay dirender SEBELUM port supaya port tetap bisa diklik/drag
          di mode edge (overlay di belakang, port di depan). */}
      {connectMode ? (
        <Handle
          id={CONNECT_OVERLAY_SOURCE_ID}
          type="source"
          position={Position.Right}
          className="react-flow__node-connect-overlay"
          style={CONNECT_OVERLAY_STYLE}
          isConnectable
        />
      ) : null}
      {ports.map((port) => (
        <FlowPort
          key={port.idpfport}
          nodeId={id}
          port={port}
          active={selected}
        />
      ))}
      <UnitNodeLabel label={data.label} topOffset={labelTopOffset} />
      <NodeResizer
        nodeId={id}
        isVisible={selected || hovered}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color={RESIZE_COLOR}
        lineStyle={{ display: "none" }}
        handleStyle={{
          width: 9,
          height: 9,
          borderRadius: 3,
          border: "1.5px solid #ffffff",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.35)",
          zIndex: 30,
        }}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />
    </Box>
  );
}

export const UnitNode = memo(UnitNodeComponent);
