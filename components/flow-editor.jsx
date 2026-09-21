"use client";

import { useSyncExternalStore } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "@/components/flow/flow-canvas";

// false saat render server, true setelah mount di client.
const emptySubscribe = () => () => {};

export default function FlowEditor() {
  // React Flow mengukur node hanya di client; merendernya saat SSR menghasilkan
  // HTML yang tidak cocok → hydration mismatch. Render setelah mount saja.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
