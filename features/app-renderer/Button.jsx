import { Button } from "@chakra-ui/react";

export function ButtonNode({ props, style, onClick }) {
  return (
    <Button
      variant={props.variant || "solid"}
      colorPalette={props.color || "blue"}
      size={props.size || "md"}
      onClick={onClick}
      {...style}
    >
      {props.label || "Button"}
    </Button>
  );
}

export const buttonDefinition = {
  defaultProps: { label: "Beli", variant: "solid", color: "blue", size: "md" },
  propSchema: [
    { key: "label", label: "Label", input: "text" },
    { key: "variant", label: "Gaya", input: "select", options: ["solid", "outline", "ghost"] },
    {
      key: "color",
      label: "Warna",
      input: "select",
      options: ["blue", "green", "red", "orange", "purple", "gray"],
    },
    { key: "size", label: "Ukuran", input: "select", options: ["xs", "sm", "md", "lg"] },
  ],
};
