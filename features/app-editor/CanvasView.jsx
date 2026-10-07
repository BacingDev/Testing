"use client";

import { Box, IconButton, Text } from "@chakra-ui/react";
import { TbArrowDown, TbArrowUp, TbTrash } from "react-icons/tb";
import { registry } from "@/features/app-renderer/registry";
import { toChakraStyle } from "@/features/app-renderer/style";
import { useAppEditorStore } from "@/features/app-editor/store";

function EditorNode({ node }) {
  const selectedId = useAppEditorStore((state) => state.selectedId);
  const selectNode = useAppEditorStore((state) => state.selectNode);
  const deleteNode = useAppEditorStore((state) => state.deleteNode);
  const moveNode = useAppEditorStore((state) => state.moveNode);
  const selected = selectedId === node.id;
  const entry = registry[node.type];

  const children = (node.children ?? []).map((child) => (
    <EditorNode key={child.id} node={child} />
  ));

  let body;
  if (!entry) {
    body = (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="red.solid" borderRadius="md" p={3}>
        <Text fontSize="sm" color="red.fg">
          Tipe tidak dikenal: {String(node.type)}
        </Text>
      </Box>
    );
  } else {
    const Component = entry.component;
    const props = { ...(entry.defaultProps ?? {}), ...(node.props ?? {}) };
    body = <Component props={props} style={toChakraStyle(node.style)} nodes={children} />;
  }

  return (
    <Box
      position="relative"
      borderRadius="md"
      outline={selected ? "2px solid" : "2px solid transparent"}
      outlineColor={selected ? "blue.solid" : "transparent"}
      _hover={{ outlineColor: selected ? "blue.solid" : "blue.200" }}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(node.id);
      }}
      title={`${node.type} — klik untuk pilih`}
    >
      {body}
      {selected ? (
        <Box position="absolute" top={1} right={1} display="flex" gap={1} bg="bg.panel" borderRadius="md" p={0.5} boxShadow="sm">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Naik"
            onClick={(event) => {
              event.stopPropagation();
              moveNode(node.id, -1);
            }}
          >
            <TbArrowUp />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Turun"
            onClick={(event) => {
              event.stopPropagation();
              moveNode(node.id, 1);
            }}
          >
            <TbArrowDown />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            aria-label="Hapus"
            onClick={(event) => {
              event.stopPropagation();
              deleteNode(node.id);
            }}
          >
            <TbTrash />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}

export default function CanvasView({ components }) {
  const selectNode = useAppEditorStore((state) => state.selectNode);

  if (!components || components.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border"
        borderRadius="xl"
        bg="bg.panel"
        p={10}
        textAlign="center"
        onClick={() => selectNode(null)}
      >
        <Text fontWeight="semibold">Halaman kosong</Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Klik komponen di palet kiri untuk menambah.
        </Text>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3} onClick={() => selectNode(null)}>
      {components.map((node) => (
        <EditorNode key={node.id} node={node} />
      ))}
    </Box>
  );
}
