import { Image } from "@chakra-ui/react";

export function ImageNode({ props, style }) {
  if (!props.src) return null;
  return (
    <Image
      src={props.src}
      alt={props.alt || ""}
      borderRadius={props.radius || "md"}
      {...style}
    />
  );
}

export const imageDefinition = {
  defaultProps: { src: "", alt: "", radius: "md" },
  propSchema: [
    { key: "src", label: "URL gambar", input: "text" },
    { key: "alt", label: "Teks alt", input: "text" },
    { key: "radius", label: "Radius", input: "select", options: ["none", "sm", "md", "lg", "xl"] },
  ],
};
