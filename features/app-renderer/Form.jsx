import { Box, Button, Text } from "@chakra-ui/react";

export function FormNode({ props, style, nodes, onSubmit }) {
  return (
    <Box
      as="form"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.panel"
      p={5}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      {...style}
    >
      <Text fontWeight="bold" mb={4}>
        {props.title || "Formulir"}
      </Text>
      <Box display="flex" flexDirection="column" gap={3} mb={4}>
        {nodes}
      </Box>
      <Button type="submit" colorPalette="green" width="full">
        {props.submitText || "Kirim"}
      </Button>
    </Box>
  );
}

export const formDefinition = {
  defaultProps: { title: "Formulir", submitText: "Kirim", table: "" },
  propSchema: [
    { key: "title", label: "Judul form", input: "text" },
    { key: "submitText", label: "Tulisan tombol", input: "text" },
    { key: "table", label: "Tabel tujuan submit", input: "text" },
  ],
};
