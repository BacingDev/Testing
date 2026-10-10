import { Box } from "@chakra-ui/react";

export function DividerNode({ props, style }) {
  return (
    <Box
      borderTopWidth={`${Math.max(1, Number(props.thickness) || 2)}px`}
      borderTopStyle="solid"
      borderTopColor={props.color || "gray.200"}
      my={2}
      {...style}
    />
  );
}

export const dividerDefinition = {
  defaultProps: { thickness: 2, color: "gray.200" },
  propSchema: [
    { key: "thickness", label: "Tebal (px)", input: "number" },
    { key: "color", label: "Warna", input: "text" },
  ],
};
