import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import Navbar from "@/components/layout/navbar";
import { AppRenderer } from "@/features/app-renderer/renderer";
import { demoDefinition } from "@/app/(app)/renderer-demo/sample";

export const metadata = {
  title: "Renderer Demo — Workflow Studio",
  description: "Demo renderer JSON app menjadi UI, tanpa editor.",
};

export default function RendererDemoPage() {
  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box
        as="main"
        width="100%"
        maxW="720px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 8, md: 12 }}
      >
        <HStack gap={2} mb={3}>
          <Badge colorPalette="teal" variant="subtle" size="sm">
            Tahap 2 — Renderer
          </Badge>
          <Badge variant="outline" size="sm">
            {demoDefinition.name} v{demoDefinition.version}
          </Badge>
        </HStack>
        <Text as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mb={2}>
          Hasil render JSON
        </Text>
        <Text fontSize="sm" color="fg.muted" mb={6}>
          Di bawah ini murni hasil baca JSON lewat registry — belum ada editor,
          belum ada event.
        </Text>
        <AppRenderer definition={demoDefinition} />
      </Box>
    </Box>
  );
}
