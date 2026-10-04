"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ReactFlow } from "@xyflow/react";
import { Badge, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { TbArrowLeft } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import { getCanvasGraph } from "@/lib/canvas-api";

/**
 * Pratinjau runtime ala artikel app builder: graph yang sama dibaca dari
 * server, tapi dirender tanpa chrome editor (tidak bisa drag, connect,
 * atau select). Node custom editor dipetakan ke node bawaan supaya preview
 * tidak tergantung pada store editor.
 */
function toPreviewNodes(nodes) {
  return (nodes ?? []).map((node) => ({
    id: node.key,
    position: {
      x: Number(node.position?.x ?? 0),
      y: Number(node.position?.y ?? 0),
    },
    data: { label: node.data?.label ?? node.key },
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
        <HStack gap={2} mb={4}>
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
