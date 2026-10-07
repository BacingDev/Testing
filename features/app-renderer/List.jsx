import { Box, Text } from "@chakra-ui/react";

export function ListNode({ props, style }) {
  const items = Array.isArray(props.items) ? props.items : [];
  return (
    <Box display="flex" flexDirection="column" gap={2} {...style}>
      {items.map((item, index) => (
        <Box
          key={index}
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          bg="bg.panel"
          px={4}
          py={2.5}
        >
          <Text fontSize="sm">{String(item)}</Text>
        </Box>
      ))}
    </Box>
  );
}

export const listDefinition = {
  defaultProps: { items: ["Item 1", "Item 2", "Item 3"] },
  propSchema: [{ key: "items", label: "Item (satu per baris)", input: "textarea" }],
};
