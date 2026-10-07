"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Box, Button, HStack, Text } from "@chakra-ui/react";
import { TbArrowLeft, TbPencil } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import PageRenderer from "@/components/landing/page-renderer";
import { getCanvasGraph } from "@/lib/canvas-api";

/**
 * Halaman hasil canvas: graph yang sama dari DB (PUT /graph) dirender
 * sebagai landing page — bukan React Flow, melainkan section beneran.
 * Urutan section mengikuti posisi Y node di canvas.
 */
export default function LandingFromCanvasPage({ params }) {
  const { id } = use(params);
  const [nodes, setNodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCanvasGraph(id)
      .then((graph) => {
        if (!active) return;
        setNodes(graph?.nodes ?? []);
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
      <Box as="main" width="100%" pb={10}>
        <Box width="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} pt={4}>
          <HStack gap={2} flexWrap="wrap">
            <Link href="/landing" style={{ textDecoration: "none" }}>
              <Button size="xs" variant="outline">
                <TbArrowLeft size={14} />
                Landing
              </Button>
            </Link>
            <Link href={`/canvases/${id}/preview`} style={{ textDecoration: "none" }}>
              <Button size="xs" variant="outline">
                Preview graph
              </Button>
            </Link>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button size="xs" variant="outline" colorPalette="green">
                <TbPencil size={14} />
                Edit di canvas
              </Button>
            </Link>
            <Badge colorPalette="orange" variant="subtle" size="sm">
              dari canvas #{id}
            </Badge>
          </HStack>
        </Box>

        {loading ? (
          <Box width="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={10}>
            <Text fontSize="sm" color="fg.muted">
              Memuat halaman dari server…
            </Text>
          </Box>
        ) : error ? (
          <Box width="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={10}>
            <Text fontSize="sm" color="red.fg">
              {error}
            </Text>
          </Box>
        ) : (
          <PageRenderer nodes={nodes} />
        )}
      </Box>
    </Box>
  );
}
