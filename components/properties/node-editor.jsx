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
      px={4}
      py={3}
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      flexShrink="0"
      maxH="42%"
      overflowY="auto"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={2} noOfLines={1}>
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
