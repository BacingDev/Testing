"use client";

import { Box, Text } from "@chakra-ui/react";
import { registry } from "@/features/app-renderer/registry";
import { toChakraStyle } from "@/features/app-renderer/style";

export function RenderNode({ node }) {
  if (!node || typeof node !== "object") return null;
  const entry = registry[node.type];
  if (!entry) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="red.solid" borderRadius="md" p={3}>
        <Text fontSize="sm" color="red.fg">
          Tipe tidak dikenal: {String(node.type)}
        </Text>
      </Box>
    );
  }
  const Component = entry.component;
  const props = { ...(entry.defaultProps ?? {}), ...((node.props ?? {})) };
  const children = (node.children ?? []).map((child) => (
    <RenderNode key={child.id} node={child} />
  ));
  return <Component props={props} style={toChakraStyle(node.style)} nodes={children} />;
}

export function RenderPage({ page }) {
  if (!page) return null;
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      {(page.components ?? []).map((component) => (
        <RenderNode key={component.id} node={component} />
      ))}
    </Box>
  );
}

export function AppRenderer({ definition, pageId }) {
  const pages = definition?.pages ?? [];
  const page = (pageId && pages.find((item) => item.id === pageId)) || pages[0] || null;
  if (!page) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="lg" p={8} textAlign="center">
        <Text fontSize="sm" color="fg.muted">
          App ini belum punya page.
        </Text>
      </Box>
    );
  }
  return <RenderPage page={page} />;
}
