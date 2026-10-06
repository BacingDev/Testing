"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ReactFlow } from "@xyflow/react";
import { Badge, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { TbArrowLeft } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import { getCanvasGraph } from "@/lib/canvas-api";
import { WidgetPreview } from "@/components/flow/widget-preview";

/** Urutan baca: atas ke bawah, kiri ke kanan. */
function byXY(a, b) {
  return a.position.y - b.position.y || a.position.x - b.position.x;
}

/**
 * Render runtime bersarang: page memuat container/widget, container
 * menyusun anaknya berjajar (flex row + wrap). Widget tampil polos —
 * drag button ya button aja, tanpa kartu pembungkus.
 */
function RuntimeNode({ node, childrenOf, depth = 0, seen }) {
  if (seen.has(node.id)) return null;
  const nextSeen = new Set(seen);
  nextSeen.add(node.id);
  const kids = [...(childrenOf.get(node.id) ?? [])].sort(byXY);

  if (node.data.unitId === "page") {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border"
        p={4}
      >
        {kids.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Page kosong — jatuhkan container ke dalam page di editor.
          </Text>
        ) : (
          <Flex direction="column" gap={3}>
            {kids.map((kid) => (
              <RuntimeNode
                key={kid.id}
                node={kid}
                childrenOf={childrenOf}
                depth={depth + 1}
                seen={nextSeen}
              />
            ))}
          </Flex>
        )}
      </Box>
    );
  }

  if (node.data.unitId === "container") {
    return (
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border"
        borderRadius="md"
        p={3}
      >
        {kids.length === 0 ? (
          <Text fontSize="xs" color="fg.muted" textAlign="center">
            Container kosong
          </Text>
        ) : (
          <Flex
            direction={node.data.widget?.direction === "column" ? "column" : "row"}
            wrap={node.data.widget?.direction === "column" ? "nowrap" : "wrap"}
            gap={2}
            align={node.data.widget?.direction === "column" ? "stretch" : "center"}
          >            {kids.map((kid) => (
              <RuntimeNode
                key={kid.id}
                node={kid}
                childrenOf={childrenOf}
                depth={depth + 1}
                seen={nextSeen}
              />
            ))}
          </Flex>
        )}
      </Box>
    );
  }

  // Widget lepas / anak container: tampil polos apa adanya.
  if (node.data.unitId) {
    return (
      <Box minWidth={node.data.unitId === "button" ? "auto" : "180px"}>
        <WidgetPreview
          unitId={node.data.unitId}
          widget={node.data.widget}
          label={node.data.label}
          image={node.data.image}
          interactive
          showLabel={false}
          fill={false}
          bare
        />
      </Box>
    );
  }

  return (
    <Text fontSize="sm" color="fg.muted">
      {node.data.label}
    </Text>
  );
}

/**
 * Pratinjau runtime ala artikel app builder: graph yang sama dibaca dari
 * server, tapi dirender tanpa chrome editor (tidak bisa drag, connect,
 * atau select).
 *
 * Dua cara melihat hasil:
 * - Tab Hasil: komponen dirender beneran dari atas ke bawah seperti aplikasi
 *   jadi (button bisa diklik, input bisa diketik).
 * - Tab Graph: struktur node/edge read-only seperti di editor.
 */
function toPreviewNodes(nodes) {
  return (nodes ?? []).map((node) => ({
    id: node.key,
    position: {
      x: Number(node.position?.x ?? 0),
      y: Number(node.position?.y ?? 0),
    },
    data: {
      label: node.data?.label ?? node.key,
      unitId: node.data?.unitId ?? node.data?.componentType ?? null,
      widget: node.data?.widget ?? {},
      image: node.data?.image ?? null,
    },
  }));
}

function toPreviewEdges(edges) {
  return (edges ?? []).map((edge) => ({
    id: edge.key,
    source: edge.source,
    target: edge.target,
  }));
}

export default function CanvasPreviewPage({ params }) {
  const { id } = use(params);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("hasil");

  useEffect(() => {
    let active = true;
    getCanvasGraph(id)
      .then((graph) => {
        if (!active) return;
        setNodes(toPreviewNodes(graph.nodes));
        setEdges(toPreviewEdges(graph.edges));
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box
        as="main"
        width="100%"
        maxW="1100px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 8 }}
      >
        <HStack gap={2} mb={4} flexWrap="wrap">
          <Link href="/canvases" style={{ textDecoration: "none" }}>
            <Button size="xs" variant="outline">
              <TbArrowLeft size={14} />
              Canvas
            </Button>
          </Link>
          <Badge colorPalette="purple" variant="subtle">
            Preview
          </Badge>
          <Text fontSize="xs" color="fg.muted">
            read-only, {nodes.length} node, {edges.length} edge
          </Text>
        </HStack>
        <HStack gap={1} mb={4} flexWrap="wrap">
          <Button
            size="xs"
            variant={tab === "hasil" ? "solid" : "outline"}
            colorPalette="purple"
            onClick={() => setTab("hasil")}
          >
            Hasil
          </Button>
          <Button
            size="xs"
            variant={tab === "graph" ? "solid" : "outline"}
            colorPalette="purple"
            onClick={() => setTab("graph")}
          >
            Graph
          </Button>
          <Text fontSize="xs" color="fg.muted" ml={1}>
            {tab === "hasil"
              ? "tampilan aplikasi jadi, bisa diklik/diketik"
              : "struktur node seperti di editor"}
          </Text>
        </HStack>
        {error ? (
          <Text color="red" fontSize="sm" mb={4}>
            {error}
          </Text>
        ) : null}
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.panel"
          height="70vh"
          minHeight="420px"
        >
          {loading ? (
            <Flex align="center" justify="center" height="100%">
              <Text fontSize="sm" color="fg.muted">
                Memuat pratinjau…
              </Text>
            </Flex>
          ) : tab === "hasil" ? (
            <Box height="100%" overflowY="auto" p={4}>
              {nodes.length === 0 ? (
                <Text fontSize="sm" color="fg.muted" textAlign="center" mt={8}>
                  Canvas masih kosong — tambah komponen di editor lalu simpan.
                </Text>
              ) : (
                (() => {
                  const childrenOf = new Map();
                  const knownIds = new Set(nodes.map((node) => node.id));
                  for (const node of nodes) {
                    const parentKey =
                      node.data?.parentKey != null
                        ? String(node.data.parentKey)
                        : null;
                    if (parentKey && parentKey !== node.id && knownIds.has(parentKey)) {
                      if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
                      childrenOf.get(parentKey).push(node);
                    }
                  }
                  const roots = nodes
                    .filter((node) => {
                      const parentKey =
                        node.data?.parentKey != null
                          ? String(node.data.parentKey)
                          : null;
                      return (
                        !parentKey || parentKey === node.id || !knownIds.has(parentKey)
                      );
                    })
                    .sort(byXY);
                  return (
                    <Flex direction="column" gap={3} maxW="720px" mx="auto">
                      {roots.map((node) => (
                        <RuntimeNode
                          key={node.id}
                          node={node}
                          childrenOf={childrenOf}
                          seen={new Set()}
                        />
                      ))}
                    </Flex>
                  );
                })()
              )}
            </Box>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
