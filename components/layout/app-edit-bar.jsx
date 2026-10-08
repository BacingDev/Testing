"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, HStack, Text } from "@chakra-ui/react";
import { TbDeviceFloppy, TbX } from "react-icons/tb";
import { notify } from "@/lib/toast";
import { saveAppDefinition } from "@/lib/apps-api";
import { appPageToNodes, canvasToComponents } from "@/lib/app-canvas-bridge";
import { saveGraph as saveGraphLocal } from "@/lib/flow-save";
import { useGraphStore } from "@/stores/graph-store";

export default function AppEditBar() {
  const editingApp = useGraphStore((state) => state.editingApp);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!editingApp) return null;
  const pages = editingApp.definition.pages ?? [];

  const persistCurrentPage = () => {
    const { nodes } = useGraphStore.getState();
    const { components, skipped } = canvasToComponents(nodes);
    useGraphStore.getState().updateEditingPage(editingApp.pageId, components);
    return skipped;
  };

  const handleSwitchPage = async (pageId) => {
    if (pageId === editingApp.pageId) return;
    persistCurrentPage();
    useGraphStore.getState().switchEditingPage(pageId);
    const page = useGraphStore
      .getState()
      .editingApp.definition.pages.find((item) => item.id === pageId);
    useGraphStore.getState().hydrate({ nodes: appPageToNodes(page), edges: [] });
    await saveGraphLocal();
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const skipped = persistCurrentPage();
      const definition = useGraphStore.getState().editingApp.definition;
      await saveAppDefinition(editingApp.appId, definition);
      await saveGraphLocal();
      notify({
        title: "Tersimpan ke app",
        description: skipped > 0 ? `${skipped} node non-app dilewati.` : undefined,
        type: skipped > 0 ? "warning" : "success",
      });
    } catch (err) {
      notify({
        title: "Gagal menyimpan ke app",
        description: err instanceof Error ? err.message : String(err),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    useGraphStore.getState().clearEditingApp();
    router.push("/apps");
  };

  return (
    <Box
      borderBottomWidth="1px"
      borderColor="border"
      bg="orange.subtle"
      px={{ base: 3, sm: 4 }}
      py={1.5}
    >
      <HStack gap={2} flexWrap="wrap">
        <Badge colorPalette="orange" variant="solid" size="sm">
          Edit app
        </Badge>
        <Text fontSize="xs" fontWeight="bold">
          {editingApp.name}
        </Text>
        <select
          value={editingApp.pageId}
          onChange={(event) => handleSwitchPage(event.target.value)}
          aria-label="Pilih halaman"
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "white",
          }}
        >
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title} ({page.path})
            </option>
          ))}
        </select>
        <Box flex="1" />
        <Button size="xs" colorPalette="orange" loading={saving} onClick={handleSave}>
          <TbDeviceFloppy size={14} />
          Simpan ke App
        </Button>
        <Button size="xs" variant="outline" onClick={handleExit}>
          <TbX size={14} />
          Keluar
        </Button>
      </HStack>
    </Box>
  );
}
