import { Box } from "@chakra-ui/react";

export function ContainerNode({ props, style, nodes }) {
  return (
    <Box
      display="flex"
      flexDirection={props.direction === "row" ? "row" : "column"}
      gap={props.gap || 3}
      {...style}
    >
      {nodes}
    </Box>
  );
}

export const containerDefinition = {
  defaultProps: { direction: "column", gap: 3 },
  propSchema: [
    { key: "direction", label: "Arah", input: "select", options: ["column", "row"] },
    { key: "gap", label: "Jarak", input: "number" },
  ],
};
