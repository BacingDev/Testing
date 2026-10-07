"use client";

import { Box, Button, Text } from "@chakra-ui/react";
import { TbPlus } from "react-icons/tb";
import { componentTypes } from "@/features/app-renderer/registry";
import { useAppEditorStore } from "@/features/app-editor/store";

export default function Palette() {
  const addNode = useAppEditorStore((state) => state.addNode);
  const ready = useAppEditorStore((state) => state.definition !== null);

  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" px={3} pt={3} pb={2}>
        Komponen
      </Text>
      <Box display="flex" flexDirection={{ base: "row", lg: "column" }} gap={1.5} px={3} pb={3} overflowX={{ base: "auto", lg: "visible" }}>
        {componentTypes.map((type) => (
          <Button
            key={type}
            type="button"
            variant="surface"
            colorPalette="gray"
            size="sm"
            flexShrink="0"
            justifyContent="flex-start"
            disabled={!ready}
            onClick={() => addNode(type)}
            title={`Tambah ${type} ke halaman`}
          >
            <TbPlus size={14} />
            {type}
          </Button>
        ))}
      </Box>
      <Text fontSize="xs" color="fg.muted" px={3} pb={3}>
        Klik untuk tambah ke halaman aktif.
      </Text>
    </Box>
  );
}
