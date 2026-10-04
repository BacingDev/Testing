"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Flex, HStack, Input, Text } from "@chakra-ui/react";
import { TbDownload, TbEye, TbTrash, TbUpload } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import { useGraphStore } from "@/stores/graph-store";
import { saveGraph as saveGraphLocal } from "@/lib/flow-save";
import {
  createCanvas,
  deleteCanvas,
  getCanvasGraph,
  listCanvases,
  saveCanvasGraph,
  toEditorGraph,
} from "@/lib/canvas-api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value) {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
}

export default function CanvasesPage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const refresh = async () => {
    setError("");
    try {
      const data = await listCanvases();
      setCanvases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    listCanvases()
      .then((data) => {
        if (active) setCanvases(Array.isArray(data) ? data : []);
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
  }, []);

  const handleSaveCurrent = async (e) => {
    e.preventDefault();
    if (saving || !name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const canvas = await createCanvas({ name: name.trim() });
      const { nodes, edges } = useGraphStore.getState();
      await saveCanvasGraph(canvas.id, { nodes, edges });
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (canvas) => {
    setError("");
    setBusyId(canvas.id);
    try {
      const graph = await getCanvasGraph(canvas.id);
      useGraphStore.getState().hydrate(toEditorGraph(graph));
      await saveGraphLocal();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (canvas) => {
    if (!window.confirm(`Hapus canvas "${canvas.name}" beserta isinya?`)) return;
    setError("");
    setBusyId(canvas.id);
    try {
      await deleteCanvas(canvas.id);
      setCanvases((prev) => prev.filter((it) => it.id !== canvas.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box
        as="main"
        width="100%"
        maxW="820px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 8, md: 12 }}
      >
        <Box mb={6}>
          <HStack gap={2} mb={2}>
            <Badge colorPalette="purple" variant="subtle">
              App Builder
            </Badge>
            <Text fontSize="xs" color="fg.muted">
              {canvases.length} canvas
            </Text>
          </HStack>
          <Text as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" letterSpacing="tight">
            Canvas Tersimpan
          </Text>
          <Text mt={1} color="fg.muted" fontSize="sm">
            Simpan isi editor ke server, muat kembali, atau intip pratinjau read-only.
          </Text>
        </Box>

        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.panel"
          p={4}
          mb={6}
        >
          <form onSubmit={handleSaveCurrent} style={{ width: "100%" }}>
            <Text fontSize="sm" fontWeight="semibold" mb="6px">
              Simpan canvas yang sedang dibuka di editor
            </Text>
            <Flex direction={{ base: "column", md: "row" }} gap={2}>
              <Input
                required
                placeholder="Nama canvas, mis. Order Management"
                value={name}
                onChange={(e) => setName(e.target.value)}
                flex="1"
                minWidth="0"
              />
              <Button
                type="submit"
                colorPalette="purple"
                loading={saving}
                disabled={saving}
              >
                <TbUpload size={16} />
                Simpan ke server
              </Button>
            </Flex>
          </form>
        </Box>

        {error ? (
          <Text color="red" fontSize="sm" mb={4}>
            {error}
          </Text>
        ) : null}

        {loading ? (
          <Text fontSize="sm" color="fg.muted">
            Memuat canvas…
          </Text>
        ) : canvases.length === 0 ? (
          <Box
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.panel"
            p={8}
            textAlign="center"
          >
            <Text fontWeight="semibold">Belum ada canvas tersimpan</Text>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Susun di editor, beri nama, lalu simpan ke server.
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={3}>
            {canvases.map((canvas) => (
              <Box
                key={canvas.id}
                borderWidth="1px"
                borderColor="border"
                borderRadius="lg"
                bg="bg.panel"
                p={4}
              >
                <Flex align="flex-start" justify="space-between" gap={3}>
                  <Box minWidth="0" flex="1">
                    <Text fontWeight="semibold">{canvas.name}</Text>
                    {canvas.description ? (
                      <Text fontSize="sm" color="fg.muted">
                        {canvas.description}
                      </Text>
                    ) : null}
                    <HStack gap={2} mt={1}>
                      <Badge size="sm" variant="subtle" colorPalette="purple">
                        {canvas.node_count} node
                      </Badge>
                      <Badge size="sm" variant="subtle" colorPalette="blue">
                        {canvas.edge_count} edge
                      </Badge>
                      <Text fontSize="xs" color="fg.muted">
                        {formatDate(canvas.updated_at)}
                      </Text>
                    </HStack>
                  </Box>
                  <HStack gap={1} flexShrink="0">
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="green"
                      title="Muat ke editor"
                      loading={busyId === canvas.id}
                      onClick={() => handleLoad(canvas)}
                    >
                      <TbDownload size={14} />
                      Muat
                    </Button>
                    <Link
                      href={`/canvases/${canvas.id}/preview`}
                      style={{ textDecoration: "none" }}
                    >
                      <Button size="xs" variant="outline" title="Pratinjau read-only">
                        <TbEye size={14} />
                        Preview
                      </Button>
                    </Link>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="red"
                      title="Hapus"
                      onClick={() => handleDelete(canvas)}
                    >
                      <TbTrash size={14} />
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
