import { Heading } from "@chakra-ui/react";

const SIZES = { 1: "2xl", 2: "xl", 3: "lg" };

export function HeadingNode({ props, style }) {
  const level = [1, 2, 3].includes(props.level) ? props.level : 1;
  return (
    <Heading
      as={`h${level}`}
      size={SIZES[level]}
      textAlign={props.align || "left"}
      {...style}
    >
      {props.text || ""}
    </Heading>
  );
}

export const headingDefinition = {
  defaultProps: { text: "Judul", level: 1, align: "left" },
  propSchema: [
    { key: "text", label: "Isi judul", input: "text" },
    { key: "level", label: "Level", input: "select", options: [1, 2, 3] },
    { key: "align", label: "Rata", input: "select", options: ["left", "center", "right"] },
  ],
};
