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

export function normalizePath(path) {
  if (typeof path !== "string" || path === "") return "/";
  const clean = path.split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return `/${clean}`;
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

export function findPageByPath(pages, path) {
  const target = normalizePath(path);
  return (pages ?? []).find((page) => normalizePath(page.path) === target) ?? null;
}

export function AppRenderer({ definition, path, pageId }) {
  const pages = definition?.pages ?? [];
  if (pages.length === 0) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="lg" p={8} textAlign="center">
        <Text fontSize="sm" color="fg.muted">
          App ini belum punya page.
        </Text>
      </Box>
    );
  }
  const byPath = path !== undefined && path !== null ? findPageByPath(pages, path) : null;
  const byId = pageId ? pages.find((item) => item.id === pageId) ?? null : null;
  const page = byPath || byId || null;
  if (path !== undefined && path !== null && !page) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="lg" p={8} textAlign="center">
        <Text fontWeight="bold">404 — halaman tidak ada</Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Tidak ada page untuk path {normalizePath(path)} di app ini.
        </Text>
      </Box>
    );
  }
  return <RenderPage page={page || pages[0] || null} />;
}
