import { Box, Text } from "@chakra-ui/react";

export function VideoNode({ props, style }) {
  if (!props.url) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="lg" p={6} textAlign="center" {...style}>
        <Text fontSize="sm" color="fg.muted">
          Isi URL video di properti.
        </Text>
      </Box>
    );
  }
  return (
    <Box
      as="iframe"
      src={props.url}
      title={props.title || "Video"}
      width="100%"
      height="320px"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      {...style}
    />
  );
}

export const videoDefinition = {
  defaultProps: { url: "", title: "Video" },
  propSchema: [
    { key: "url", label: "URL embed", input: "text" },
    { key: "title", label: "Judul", input: "text" },
  ],
};
