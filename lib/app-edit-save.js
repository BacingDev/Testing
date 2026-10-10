"use client";

import { notify } from "@/lib/toast";
import { saveAppDefinition } from "@/lib/apps-api";
import { canvasToComponents } from "@/lib/app-canvas-bridge";
import { saveGraph as saveGraphLocal } from "@/lib/flow-save";
import { useGraphStore } from "@/stores/graph-store";

export async function saveEditingAppToServer() {
  const state = useGraphStore.getState();
  const editingApp = state.editingApp;
  if (!editingApp) return false;
  const { components, skipped } = canvasToComponents(state.nodes);
  state.updateEditingPage(editingApp.pageId, components);
  const definition = useGraphStore.getState().editingApp.definition;
  try {
    await saveAppDefinition(editingApp.appId, definition);
    await saveGraphLocal();
    notify({
      title: "Tersimpan ke app",
      description: skipped > 0 ? `${skipped} node non-app dilewati.` : undefined,
      type: skipped > 0 ? "warning" : "success",
    });
    return true;
  } catch (err) {
    notify({
      title: "Gagal menyimpan ke app",
      description: err instanceof Error ? err.message : String(err),
      type: "error",
    });
    return false;
  }
}
