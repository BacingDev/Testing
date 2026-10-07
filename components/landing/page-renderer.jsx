"use client";

/**
 * PAGE RENDERER — susun node canvas menjadi halaman vertikal.
 *
 * Urutan section = posisi Y absolut node di canvas (node yang di atas
 * ter-render duluan). Node bersarang (parentKey) posisinya dijumlahkan
 * dengan semua parent-nya, jadi anak di dalam container ikut urutan yang
 * benar. Node wadah (page/container) sendiri tidak di-render — hanya
 * section di dalamnya.
 *
 * Aturan main di canvas: susun section dari atas ke bawah sesuai urutan
 * halaman yang diinginkan.
 */

import { Box, Text } from "@chakra-ui/react";
import { getUnitId } from "@/components/flow/widget-preview";
import { GenericUnitSection, LANDING_SECTIONS } from "@/components/landing/sections";

function absoluteY(nodesByKey, node) {
  let y = Number(node?.position?.y ?? 0);
  let parentKey = node?.data?.parentKey != null ? String(node.data.parentKey) : null;
  const guard = new Set();
  while (parentKey && !guard.has(parentKey)) {
    guard.add(parentKey);
    const parent = nodesByKey.get(parentKey);
    if (!parent) break;
    y += Number(parent?.position?.y ?? 0);
    parentKey =
      parent?.data?.parentKey != null ? String(parent.data.parentKey) : null;
  }
  return y;
}

export function sectionNodes(graphNodes) {
  const list = Array.isArray(graphNodes) ? graphNodes : [];
  const byKey = new Map(list.map((node) => [String(node.key), node]));
  return list
    .filter((node) => node?.data?.shown !== "F")
    .map((node) => ({ node, unitId: getUnitId(node?.data), y: absoluteY(byKey, node) }))
    .filter(({ node, unitId }) => unitId && node?.data && unitId !== "page" && unitId !== "container")
    .sort((a, b) => a.y - b.y || Number(a.node?.position?.x ?? 0) - Number(b.node?.position?.x ?? 0));
}

export default function PageRenderer({ nodes }) {
  const sections = sectionNodes(nodes);

  if (sections.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border"
        borderRadius="xl"
        bg="bg.panel"
        p={10}
        textAlign="center"
        my={8}
      >
        <Text fontWeight="bold">Canvas ini belum punya section halaman</Text>
        <Text fontSize="sm" color="fg.muted" mt={2} lineHeight="1.7">
          Buka canvas di editor, drag komponen Landing Page (Hero, Features,
          Pricing, …) dari sidebar kiri, susun dari atas ke bawah, lalu simpan
          ke server.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      {sections.map(({ node, unitId }) => {
        const Section = LANDING_SECTIONS[unitId];
        if (Section) {
          return <Section key={String(node.key)} widget={node.data?.widget} />;
        }
        return (
          <GenericUnitSection
            key={String(node.key)}
            unitId={unitId}
            widget={node.data?.widget}
            label={node.data?.label}
            image={node.data?.image}
          />
        );
      })}
    </Box>
  );
}
