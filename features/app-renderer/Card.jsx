import { Box, Text } from "@chakra-ui/react";

export function CardNode({ props, style, nodes }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.panel"
      p={5}
      {...style}
    >
      {props.title ? (
        <Text fontWeight="bold" mb={2}>
          {props.title}
        </Text>
      ) : null}
      {nodes}
    </Box>
  );
}

export const cardDefinition = {
  defaultProps: { title: "Kartu" },
  propSchema: [{ key: "title", label: "Judul kartu", input: "text" }],
};
