"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, HStack, Text } from "@chakra-ui/react";
import { TbDeviceFloppy, TbEye, TbX } from "react-icons/tb";
import { notify } from "@/lib/toast";
import { saveAppDefinition } from "@/lib/apps-api";
import { appPageToNodes, canvasToComponents } from "@/lib/app-canvas-bridge";
import { saveGraph as saveGraphLocal } from "@/lib/flow-save";
import { AppRenderer } from "@/features/app-renderer/renderer";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";

export default function AppEditBar() {
  const editingApp = useGraphStore((state) => state.editingApp);
  const previewOpen = useFlowStore((state) => state.previewOpen);
  const setPreviewOpen = useFlowStore((state) => state.setPreviewOpen);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!editingApp) return null;
  const pages = editingApp.definition.pages ?? [];
  const page = pages.find((item) => item.id === editingApp.pageId) ?? pages[0];

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
    setPreviewOpen(false);
    useGraphStore.getState().clearEditingApp();
    router.push("/apps");
  };

  const previewDefinition = previewOpen
    ? {
        version: 1,
        name: editingApp.name,
        pages: [
          {
            ...(page ?? { id: editingApp.pageId, path: "/", title: "Halaman" }),
            components: canvasToComponents(useGraphStore.getState().nodes).components,
          },
        ],
      }
    : null;

  return (
    <>
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
        <Button size="xs" variant="outline" onClick={() => setPreviewOpen(true)}>
          <TbEye size={14} />
          Hasil
        </Button>
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
    {previewOpen && previewDefinition ? (
      <Box position="fixed" inset="0" zIndex={60}>
        <Box
          position="absolute"
          inset="0"
          bg="blackAlpha.600"
          onClick={() => setPreviewOpen(false)}
          aria-hidden="true"
        />
        <Box
          position="absolute"
          top={{ base: 2, md: 6 }}
          bottom={{ base: 2, md: 6 }}
          left="50%"
          width="min(760px, calc(100vw - 24px))"
          transform="translateX(-50%)"
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          boxShadow="2xl"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <HStack
            gap={2}
            px={4}
            py={2.5}
            borderBottomWidth="1px"
            borderColor="border"
            bg="bg.panel"
            flexShrink="0"
          >
            <Badge colorPalette="orange" variant="subtle" size="sm">
              Hasil
            </Badge>
            <Text fontSize="xs" fontWeight="semibold" flex="1" minWidth="0" noOfLines={1}>
              {page?.path ?? "/"} — live dari canvas, belum tersimpan
            </Text>
            <Button size="xs" variant="ghost" onClick={() => setPreviewOpen(false)} aria-label="Tutup hasil">
              <TbX size={15} />
              Tutup
            </Button>
          </HStack>
          <Box flex="1" minH="0" overflowY="auto" py={4}>
            <AppRenderer
              definition={previewDefinition}
              path={page?.path ?? "/"}
              onNavigate={() => notify({ title: "Preview satu halaman", type: "info" })}
            />
          </Box>
        </Box>
      </Box>
    ) : null}
    </>
  );
}
