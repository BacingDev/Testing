import { Text } from "@chakra-ui/react";

export function TextNode({ props, style, vars }) {
  const text = String(props.text || "").replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) =>
    vars && vars[key] !== undefined ? String(vars[key]) : match,
  );
  return (
    <Text
      fontSize={props.size || "md"}
      fontWeight={props.bold ? "bold" : "normal"}
      textAlign={props.align || "left"}
      {...style}
    >
      {text}
    </Text>
  );
}

export const textDefinition = {
  defaultProps: { text: "Teks contoh", size: "md", align: "left", bold: false },
  propSchema: [
    { key: "text", label: "Isi teks", input: "textarea" },
    { key: "size", label: "Ukuran", input: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    { key: "align", label: "Rata", input: "select", options: ["left", "center", "right"] },
    { key: "bold", label: "Tebal", input: "boolean" },
  ],
};
