"use client";

/**
 * Daftar canvas tersimpan (dari DB) yang bisa dibuka sebagai halaman.
 * Dipakai di /landing sebagai pintu masuk ke /landing/[id].
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { TbArrowRight } from "react-icons/tb";
import { listCanvases } from "@/lib/canvas-api";

export default function SavedCanvasList() {
  const [canvases, setCanvases] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listCanvases()
      .then((data) => {
        if (active) setCanvases(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
          setCanvases([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (canvases === null) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Memuat canvas tersimpan…
      </Text>
    );
  }

  if (error || canvases.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border"
        borderRadius="xl"
        bg="bg.panel"
        p={6}
        textAlign="center"
      >
        <Text fontSize="sm" fontWeight="semibold">
          Belum ada halaman dari canvas
        </Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Susun section di editor → simpan ke server → halaman muncul di sini.
        </Text>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Button size="sm" colorPalette="blue" mt={4}>
            Buka Editor
          </Button>
        </Link>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap={3}>
      {canvases.map((canvas) => (
        <Box
          key={canvas.id}
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          bg="bg.panel"
          p={4}
        >
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <Box minWidth="0">
              <Text fontWeight="semibold">{canvas.name}</Text>
              <HStack gap={2} mt={1}>
                <Badge size="sm" variant="subtle" colorPalette="purple">
                  {canvas.node_count} node
                </Badge>
                <Badge size="sm" variant="subtle" colorPalette="blue">
                  {canvas.edge_count} edge
                </Badge>
              </HStack>
            </Box>
            <Link href={`/landing/${canvas.id}`} style={{ textDecoration: "none" }}>
              <Button size="sm" colorPalette="orange">
                Buka halaman <TbArrowRight size={15} />
              </Button>
            </Link>
          </Flex>
        </Box>
      ))}
    </Flex>
  );
}
