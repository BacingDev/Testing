import { Box } from "@chakra-ui/react";

export function SpacerNode({ props, style }) {
  return <Box height={`${Math.max(0, Number(props.height) || 32)}px`} {...style} />;
}

export const spacerDefinition = {
  defaultProps: { height: 32 },
  propSchema: [{ key: "height", label: "Tinggi (px)", input: "number" }],
};
