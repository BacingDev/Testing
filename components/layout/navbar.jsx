"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const blogActive = pathname?.startsWith("/blog") ?? false;
  const dirty = useGraphStore((state) => state.dirty);
  const [saveState, setSaveState] = useState("idle");

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
      px={{ base: 3, sm: 4 }}
      py={1.5}
    >
      <Flex align="center" justify="space-between" gap={3}>
        <HStack gap={4}>
          <HStack gap={1.5} color="fg">
            <TbHierarchy2 size={15} />
            <Text fontSize="xs" fontWeight="bold" letterSpacing="tight">
              Workflow Studio
            </Text>
          </HStack>
          <Link href="/blog" style={{ textDecoration: "none", color: "inherit" }}>
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              color={blogActive ? "blue.fg" : "fg.muted"}
              bg={blogActive ? "blue.subtle" : "transparent"}
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <Text fontSize="xs" fontWeight="semibold">
                Blog
              </Text>
            </HStack>
          </Link>
          <Text
            display={{ base: "none", md: "block" }}
            fontSize="xs"
            color="fg.muted"
          >
            Diagram parent / nodes / edges
          </Text>
        </HStack>
        <HStack gap={1.5}>
          <HStack
            gap={1}
            px={1.5}
            py={0.5}
            rounded="md"
            borderWidth="1px"
            borderColor="border"
            bg="bg.muted"
            color="fg"
          >
            <TbZoomScan size={12} />
            <Text fontSize="xs" fontWeight="semibold" tabularNums>
              {Math.round(zoom * 100)}%
            </Text>
          </HStack>
          <Button
            size="xs"
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
            <TbDeviceFloppy size={14} />
            {saveLabel}
          </Button>
          <Button size="xs" variant="solid" colorPalette="gray">
            <TbDownload size={14} />
            Ekspor
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}