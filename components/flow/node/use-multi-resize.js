"use client";

import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useFlowContext } from "@/components/flow/flow-context";
import { MIN_NODE_HEIGHT, MIN_NODE_WIDTH } from "@/components/flow/constants";
import { useFlowStore } from "@/stores/flow-store";

function dimensionsOf(node) {
  return {
    width: node?.measured?.width ?? node?.width ?? MIN_NODE_WIDTH,
    height: node?.measured?.height ?? node?.height ?? MIN_NODE_HEIGHT,
  };
}

/**
 * Resize satu node sekaligus mengikuti node lain yang sedang ter-select.
 * Selama drag, NodeResizer sudah mengurus node utama; hook ini hanya
 * menerapkan delta ukuran yang sama ke node ter-select lainnya.
 */
export function useMultiResize(nodeId) {
  const { getNodes } = useReactFlow();
  const { setNodes } = useFlowContext();
  const snapshotRef = useRef(null);

  const onResizeStart = useCallback(
    (event, params) => {
      const selected = getNodes().filter((node) => node.selected);
      const primarySelected = selected.some((node) => node.id === nodeId);

      snapshotRef.current = {
        width: params.width,
        height: params.height,
        others: primarySelected
          ? selected
              .filter((node) => node.id !== nodeId)
              .map((node) => ({ id: node.id, ...dimensionsOf(node) }))
          : [],
      };
    },
    [getNodes, nodeId],
  );

  const onResize = useCallback(
    (event, params) => {
      const snapshot = snapshotRef.current;
      if (!snapshot || snapshot.others.length === 0) return;

      const deltaWidth = params.width - snapshot.width;
      const deltaHeight = params.height - snapshot.height;
      if (!deltaWidth && !deltaHeight) return;

      setNodes((nodes) =>
        nodes.map((node) => {
          const other = snapshot.others.find((item) => item.id === node.id);
          if (!other) return node;
          const width = Math.max(
            MIN_NODE_WIDTH,
            Math.round(other.width + deltaWidth),
          );
          const height = Math.max(
            MIN_NODE_HEIGHT,
            Math.round(other.height + deltaHeight),
          );
          return {
            ...node,
            width,
            height,
            measured: { ...node.measured, width, height },
          };
        }),
      );
    },
    [setNodes],
  );

  const onResizeEnd = useCallback(() => {
    snapshotRef.current = null;
    // Sekali di akhir resize: refresh posisi/ukuran di panel Properties.
    useFlowStore.getState().bumpRevision();
  }, []);

  return { onResizeStart, onResize, onResizeEnd };
}
