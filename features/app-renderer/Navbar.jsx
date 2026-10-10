import { Box, HStack, Text } from "@chakra-ui/react";

export function NavbarNode({ props, style }) {
  const links = String(props.links ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    <Box
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      px={4}
      py={3}
      {...style}
    >
      <HStack gap={4} flexWrap="wrap">
        <Text fontWeight="bold">{props.brand || "Brand"}</Text>
        <Box flex="1" />
        {links.map((link) => (
          <Text key={link} fontSize="sm" color="fg.muted">
            {link}
          </Text>
        ))}
      </HStack>
    </Box>
  );
}

export const navbarDefinition = {
  defaultProps: { brand: "Brand", links: "Beranda, Harga, Kontak" },
  propSchema: [
    { key: "brand", label: "Nama brand", input: "text" },
    { key: "links", label: "Tautan (pisahkan koma)", input: "text" },
  ],
};
