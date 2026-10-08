import { Box } from "@chakra-ui/react";

export function ContainerNode({ props, style, nodes }) {
  const columns = Math.max(1, Math.min(6, Number(props.columns) || 2));
  if (props.direction === "grid") {
    return (
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${columns}, minmax(0, 1fr))`}
        gap={props.gap ?? 3}
        {...style}
      >
        {nodes}
      </Box>
    );
  }
  return (
    <Box
      display="flex"
      flexDirection={props.direction === "row" ? "row" : "column"}
      gap={props.gap ?? 3}
      {...style}
    >
      {nodes}
    </Box>
  );
}

export const containerDefinition = {
  defaultProps: { direction: "column", gap: 3, columns: 2 },
  propSchema: [
    { key: "direction", label: "Layout", input: "select", options: ["column", "row", "grid"] },
    { key: "columns", label: "Kolom grid", input: "number" },
    { key: "gap", label: "Jarak", input: "number" },
  ],
};
