import { Box, Text } from "@chakra-ui/react";

export function ListNode({ props, style, rows }) {
  const serverRows = Array.isArray(rows) ? rows : null;
  const items = serverRows
    ? serverRows.map((row) => {
        if (props.field && row && typeof row === "object" && row[props.field] !== undefined) {
          return String(row[props.field]);
        }
        return typeof row === "object" ? JSON.stringify(row) : String(row);
      })
    : Array.isArray(props.items)
      ? props.items
      : [];
  if (serverRows && serverRows.length === 0) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="md" p={4} textAlign="center" {...style}>
        <Text fontSize="sm" color="fg.muted">
          Tabel {props.table || ""} belum ada baris.
        </Text>
      </Box>
    );
  }
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
  defaultProps: { items: ["Item 1", "Item 2", "Item 3"], table: "", field: "" },
  propSchema: [
    { key: "items", label: "Item statis (satu per baris)", input: "textarea" },
    { key: "table", label: "Tabel data (ganti item statis)", input: "text" },
    { key: "field", label: "Field yang ditampilkan", input: "text" },
  ],
};
