"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "@/components/flow/flow-canvas";
import {
  graphContentKey,
  loadSavedGraph,
  refreshGraphDirty,
  saveGraph,
  setGraphBaseline,
} from "@/lib/flow-save";
import { useGraphStore } from "@/stores/graph-store";

// false saat render server, true setelah mount di client.
const emptySubscribe = () => () => {};

const AUTOSAVE_DELAY_MS = 1200;

export default function FlowEditor() {
  // React Flow mengukur node hanya di client; merendernya saat SSR menghasilkan
  // HTML yang tidak cocok → hydration mismatch. Render setelah mount saja.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  useEffect(() => {
    const data = loadSavedGraph();
    if (data) useGraphStore.getState().hydrate(data);

    setGraphBaseline();
    let lastSeenKey = graphContentKey();
    let timer = null;

    const unsubscribe = useGraphStore.subscribe((state, prev) => {
      if (state.nodes === prev.nodes && state.edges === prev.edges) return;
      const key = graphContentKey();
      if (key === lastSeenKey) {
        refreshGraphDirty();
        return;
      }
      lastSeenKey = key;
      refreshGraphDirty();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        saveGraph().catch((error) => {
          console.warn("[flow] autosave gagal:", error);
        });
      }, AUTOSAVE_DELAY_MS);
    });

    const onBeforeUnload = (event) => {
      if (!useGraphStore.getState().dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  if (!mounted) return null;

  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
