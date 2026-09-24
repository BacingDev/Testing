"use client";

import { useState } from "react";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import {
  TbDeviceFloppy,
  TbDownload,
  TbHierarchy2,
  TbZoomScan,
} from "react-icons/tb";
import { saveGraph } from "@/lib/flow-save";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";

export default function Navbar() {
  const zoom = useFlowStore((state) => state.zoom);
  const dirty = useGraphStore((state) => state.dirty);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  const handleSave = async () => {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      const saved = await saveGraph();
      if (!saved) throw new Error("Penyimpanan browser sedang digunakan");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      console.error("[navbar] simpan gagal:", error);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const saveLabel =
    saveState === "saving"
      ? "Menyimpan…"
      : saveState === "saved"
        ? "Tersimpan"
        : saveState === "error"
          ? "Gagal"
          : dirty
            ? "Simpan *"
            : "Simpan";

  return (
    <Box
      as="header"
      flexShrink="0"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      px={{ base: 4, sm: 6 }}
      py={3}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <HStack gap={6}>
          <HStack gap={2} color="fg">
            <TbHierarchy2 size={18} />
            <Text fontSize="sm" fontWeight="bold" letterSpacing="tight">
              Workflow Studio
            </Text>
          </HStack>
          <Text
            display={{ base: "none", md: "block" }}
            fontSize="xs"
            color="fg.muted"
          >
            Diagram parent / nodes / edges
          </Text>
        </HStack>
        <HStack gap={2}>
          <HStack
            gap={1.5}
            px={2}
            py={1}
            rounded="md"
            borderWidth="1px"
            borderColor="border"
            bg="bg.muted"
            color="fg"
          >
            <TbZoomScan size={14} />
            <Text fontSize="xs" fontWeight="semibold" tabularNums>
              {Math.round(zoom * 100)}%
            </Text>
          </HStack>
          <Button
            size="sm"
            variant="outline"
            loading={saveState === "saving"}
            colorPalette={saveState === "error" ? "red" : undefined}
            title={
              dirty
                ? "Ada perubahan belum tersimpan (autosave lokal aktif)"
                : "Semua perubahan tersimpan di browser"
            }
            onClick={handleSave}
          >
            <TbDeviceFloppy style={{ marginRight: "6px" }} />
            {saveLabel}
          </Button>
          <Button size="sm" variant="solid" colorPalette="gray">
            <TbDownload style={{ marginRight: "6px" }} />
            Ekspor
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
