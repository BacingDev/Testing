"use client";

import { useState } from "react";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { AppRenderer, normalizePath } from "@/features/app-renderer/renderer";
import { demoDefinition } from "@/app/(app)/renderer-demo/sample";

const LINKS = ["/", "/checkout", "/rusak"];

export default function DemoViewer() {
  const [path, setPath] = useState("/");

  return (
    <Box>
      <HStack gap={2} mb={2} flexWrap="wrap">
        {LINKS.map((link) => (
          <Button
            key={link}
            size="xs"
            variant={normalizePath(path) === link ? "solid" : "outline"}
            colorPalette="teal"
            onClick={() => setPath(link)}
          >
            {link}
          </Button>
        ))}
      </HStack>
      <Text fontSize="xs" color="fg.muted" mb={6}>
        Path aktif: {normalizePath(path)} — di-resolve renderer ke page yang cocok.
      </Text>
      <AppRenderer definition={demoDefinition} path={path} />
    </Box>
  );
}
