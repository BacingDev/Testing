"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Box, Button, HStack, Text } from "@chakra-ui/react";
import { TbArrowLeft, TbPencil, TbRefresh } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import PageRenderer from "@/components/landing/page-renderer";
import { getCanvasGraph } from "@/lib/canvas-api";

/**
 * Halaman hasil canvas: graph dari DB (PUT /graph) dirender sebagai
 * landing page — bukan React Flow, melainkan section beneran.
 * Urutan section mengikuti posisi Y node di canvas.
 *
 * Data dicek ulang tiap POLL_MS: kalau canvas disimpan ulang dari editor,
 * muncul indikator "ada perubahan" + tombol muat ulang. Halaman sengaja
 * TIDAK diganti otomatis supaya bacaan tidak lompat tiba-tiba.
 */
const POLL_MS = 10000;

function graphKey(nodes) {
  return JSON.stringify(nodes ?? []);
}

export default function LandingFromCanvasPage({ params }) {
  const { id } = use(params);
  const [nodes, setNodes] = useState(null);
  const [pendingNodes, setPendingNodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const nodesRef = useRef(null);
  nodesRef.current = nodes;

  const fetchNodes = useCallback(async () => {
    const graph = await getCanvasGraph(id);
    return graph?.nodes ?? [];
  }, [id]);

  // Muat awal.
  useEffect(() => {
    let active = true;
    fetchNodes()
      .then((fresh) => {
        if (!active) return;
        setNodes(fresh);
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
  }, [fetchNodes]);

  // Cek berkala: ada simpanan baru di server?
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(async () => {
      try {
        const fresh = await fetchNodes();
        const current = nodesRef.current;
        if (current && graphKey(fresh) !== graphKey(current)) {
          setPendingNodes(fresh);
        }
      } catch {
        // Gagal cek berkala: abaikan, coba lagi periode berikut.
        // Tidak menimpa error manual/awal supaya halaman tetap kebaca.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [loading, fetchNodes]);

  const handleApplyUpdate = () => {
    if (!pendingNodes) return;
    setNodes(pendingNodes);
    setPendingNodes(null);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const fresh = await fetchNodes();
      setNodes(fresh);
      setPendingNodes(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  };

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
            <Button
              size="xs"
              variant="ghost"
              onClick={handleRefresh}
              loading={refreshing}
              title="Cek ulang data dari server sekarang"
            >
              <TbRefresh size={14} />
              Refresh
            </Button>
            <Badge colorPalette="orange" variant="subtle" size="sm">
              dari canvas #{id}
            </Badge>
          </HStack>

          {/* Indikator: canvas disimpan ulang setelah halaman dibuka. */}
          {pendingNodes ? (
            <HStack
              mt={3}
              px={4}
              py={2.5}
              gap={3}
              flexWrap="wrap"
              borderWidth="1px"
              borderColor="orange.solid"
              borderRadius="lg"
              bg="orange.subtle"
            >
              <Badge colorPalette="orange" variant="solid" size="sm">
                Ada perubahan
              </Badge>
              <Text fontSize="sm" flex="1" minWidth="200px">
                Canvas ini baru saja disimpan ulang. Muat ulang untuk melihat
                versi terbaru.
              </Text>
              <Button size="xs" colorPalette="orange" onClick={handleApplyUpdate}>
                <TbRefresh size={14} />
                Muat perubahan
              </Button>
            </HStack>
          ) : null}
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
