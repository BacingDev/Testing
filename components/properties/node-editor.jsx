"use client";

import { Box, Field, Input, Text } from "@chakra-ui/react";
import { WidgetFields, getUnitId } from "@/components/flow/widget-preview";
import { useGraphStore } from "@/stores/graph-store";

export default function NodeEditor({ node }) {
  const updateNodeData = useGraphStore((state) => state.updateNodeData);

  if (!node) return null;
  const unitId = getUnitId(node.data);

  return (
    <Box
      px={3}
      py={2.5}
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      flexShrink="0"
      maxH="42%"
      overflowY="auto"
    >
      <Text
        fontSize="10px"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="wider"
        color="fg.muted"
        mb={2}
        noOfLines={1}
      >
        Edit: {node.data?.label || node.data?.unitId || node.id}
      </Text>
      <Field.Root mb={2}>
        <Field.Label>Nama node</Field.Label>
        <Input
          size="sm"
          value={node.data?.label ?? ""}
          onChange={(event) => updateNodeData(node.id, { label: event.target.value })}
        />
      </Field.Root>
      {unitId === "image" ? (
        <Field.Root mb={2}>
          <Field.Label>URL gambar (src)</Field.Label>
          <Input
            size="sm"
            value={node.data?.image ?? ""}
            placeholder="https://…"
            onChange={(event) => updateNodeData(node.id, { image: event.target.value })}
          />
        </Field.Root>
      ) : null}
      {unitId ? (
        <Box display="flex" flexDirection="column" gap={2}>
          <WidgetFields
            unitId={unitId}
            widget={node.data?.widget ?? {}}
            onChange={(widget) => updateNodeData(node.id, { widget })}
          />
        </Box>
      ) : (
        <Text fontSize="xs" color="fg.muted">
          Node ini tidak punya isi yang bisa diedit.
        </Text>
      )}
    </Box>
  );
}
