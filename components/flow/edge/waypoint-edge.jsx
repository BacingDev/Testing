"use client";

import { memo, useMemo } from "react";
import { Box } from "@chakra-ui/react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useEdges,
  useInternalNode,
  useStore,
  useStoreApi,
} from "@xyflow/react";
import {
  alignToPortEdge,
  applyCrossingHops,
  getEdgeSmoothPath,
} from "@/components/flow/edge-crossing";

const BASE_OFFSET = 28;
const BORDER_RADIUS = 14;
const HOP_RADIUS = 6;

function WaypointEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  data,
  markerEnd,
  style,
  selected,
}) {
  // Hanya subscribe 2 node ujung → edge lain tidak ikut render saat drag.
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const edges = useEdges();
  const store = useStoreApi();
  // Saat ada node di-drag/resize, hop persilangan di-skip supaya drag mulus.
  const interacting = useStore((state) =>
    state.nodes.some((node) => node.dragging || node.resizing),
  );

  const edgeIndex = edges.findIndex((edge) => edge.id === id);
  const offset = BASE_OFFSET + (edgeIndex > -1 ? (edgeIndex % 4) * 10 : 0);

  // Geser ujung edge ke tepi luar port supaya panah tidak tertutup handle
  const sourceAligned = alignToPortEdge(
    { x: sourceX, y: sourceY, position: sourcePosition },
    sourceNode,
    sourceHandleId,
  );
  const targetAligned = alignToPortEdge(
    { x: targetX, y: targetY, position: targetPosition },
    targetNode,
    targetHandleId,
  );

  const [basePath, labelX, labelY] = getSmoothStepPath({
    sourceX: sourceAligned.x,
    sourceY: sourceAligned.y,
    sourcePosition: sourceAligned.position,
    targetX: targetAligned.x,
    targetY: targetAligned.y,
    targetPosition: targetAligned.position,
    borderRadius: BORDER_RADIUS,
    offset,
  });

  // Edge dengan id lebih besar mendapat lengkungan saat bertabrakan
  const otherPaths = useMemo(() => {
    if (interacting || !sourceNode || !targetNode) return [];
    const nodeLookup = store.getState().nodeLookup;
    return edges
      .filter((edge) => edge.id !== id && Number(edge.id) < Number(id))
      .map(
        (edge) =>
          getEdgeSmoothPath(edge, nodeLookup, {
            offset: BASE_OFFSET,
            borderRadius: BORDER_RADIUS,
          })?.path,
      )
      .filter(Boolean);
  }, [edges, id, interacting, sourceNode, targetNode, store]);

  const path = useMemo(
    () =>
      interacting ? basePath : applyCrossingHops(basePath, otherPaths, HOP_RADIUS),
    [basePath, otherPaths, interacting],
  );

  // Panah mengikuti warna garis (properti bisa diubah dari dialog edge).
  const strokeColor = selected ? "#2563eb" : style?.stroke || markerEnd?.color;
  const edgeMarker =
    markerEnd && typeof markerEnd === "object" && strokeColor
      ? { ...markerEnd, color: strokeColor }
      : markerEnd;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={edgeMarker}
        interactionWidth={24}
        style={{
          ...style,
          stroke: selected ? "#2563eb" : style?.stroke,
          strokeWidth: (style?.strokeWidth ?? 1) + (selected ? 1.5 : 0),
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      {data?.remark ? (
        <EdgeLabelRenderer>
          <Box
            className="nodrag nopan"
            position="absolute"
            rounded="full"
            borderWidth="1px"
            borderColor="border"
            bg="white"
            px={2}
            py={1}
            fontSize="xs"
            color="fg.muted"
            boxShadow="sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.remark}
          </Box>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const WaypointEdge = memo(WaypointEdgeComponent);
