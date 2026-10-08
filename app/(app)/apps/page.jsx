"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Flex, HStack, Input, Text } from "@chakra-ui/react";
import { TbExternalLink, TbHierarchy2, TbPencil, TbPlus, TbRocket, TbTrash } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import { createApp, deleteApp, fetchApp, listApps, listVersions, publishApp } from "@/lib/apps-api";
import { appPageToNodes } from "@/lib/app-canvas-bridge";
import { saveGraph as saveGraphLocal } from "@/lib/flow-save";
import { useGraphStore } from "@/stores/graph-store";

function VersionHistory({ appId }) {
  const [versions, setVersions] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (versions === null) {
      try {
        setVersions(await listVersions(appId));
      } catch {
        setVersions([]);
      }
    }
  };

  return (
    <Box>
      <Button size="xs" variant="ghost" onClick={load}>
        {open ? "Tutup riwayat" : "Riwayat publish"}
      </Button>
      {open ? (
        <Box mt={1} pl={2} borderLeftWidth="2px" borderColor="border">
          {versions === null ? (
            <Text fontSize="xs" color="fg.muted">
              Memuat…
            </Text>
          ) : versions.length === 0 ? (
            <Text fontSize="xs" color="fg.muted">
              Belum pernah publish.
            </Text>
          ) : (
            versions.map((version) => (
              <Text key={version.id} fontSize="xs" color="fg.muted">
                v{version.version} · {String(version.created_at).slice(0, 16).replace("T", " ")}
              </Text>
            ))
          )}
        </Box>
      ) : null}
    </Box>
  );
}

export default function AppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    listApps()
      .then((data) => {
        if (active) setApps(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
          setApps([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const app = await createApp({ name: name.trim() });
      router.push(`/editor/${app.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Hapus app "${app.name}" beserta data dan versinya?`)) return;
    setBusyId(app.id);
    try {
      await deleteApp(app.id);
      setApps((prev) => (prev ?? []).filter((item) => item.id !== app.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleEditCanvas = async (app) => {
    setBusyId(app.id);
    setError("");
    try {
      const full = await fetchApp(app.id);
      const page = (full.definition.pages ?? [])[0];
      if (!page) throw new Error("App ini belum punya page.");
      useGraphStore.getState().setEditingApp({
        appId: full.id,
        slug: full.slug,
        name: full.name,
        definition: full.definition,
        pageId: page.id,
      });
      useGraphStore.getState().hydrate({ nodes: appPageToNodes(page), edges: [] });
      await saveGraphLocal();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (app) => {
    setBusyId(app.id);
    setNotice("");
    try {
      const version = await publishApp(app.id);
      setNotice(`"${app.name}" terpublish sebagai v${version.version}: /app/${app.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box as="main" width="100%" maxW="820px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 8, md: 12 }}>
        <HStack gap={2} mb={2}>
          <Badge colorPalette="teal" variant="subtle">
            App Builder
          </Badge>
          <Text fontSize="xs" color="fg.muted">
            {apps === null ? "…" : `${apps.length} app milikmu`}
          </Text>
        </HStack>
        <Text as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" letterSpacing="tight">
          Aplikasi saya
        </Text>
        <Text mt={1} color="fg.muted" fontSize="sm">
          Hanya app milikmu yang terlihat di sini. Publish untuk mendapatkan URL publik.
        </Text>

        <Box borderWidth="1px" borderColor="border" borderRadius="lg" bg="bg.panel" p={4} mt={6} mb={6}>
          <form onSubmit={handleCreate} style={{ width: "100%" }}>
            <Text fontSize="sm" fontWeight="semibold" mb="6px">
              Buat app baru
            </Text>
            <Flex direction={{ base: "column", md: "row" }} gap={2}>
              <Input
                required
                placeholder="Nama app, mis. Toko Kopi"
                value={name}
                onChange={(event) => setName(event.target.value)}
                flex="1"
                minWidth="0"
              />
              <Button type="submit" colorPalette="teal" loading={busy} disabled={busy}>
                <TbPlus size={16} />
                Buat + edit
              </Button>
            </Flex>
          </form>
        </Box>

        {notice ? (
          <Box borderWidth="1px" borderColor="green.solid" borderRadius="lg" bg="green.subtle" p={3} mb={4}>
            <Text fontSize="sm">{notice}</Text>
          </Box>
        ) : null}
        {error ? (
          <Text color="red" fontSize="sm" mb={4}>
            {error}
          </Text>
        ) : null}

        {apps === null ? (
          <Text fontSize="sm" color="fg.muted">
            Memuat…
          </Text>
        ) : apps.length === 0 ? (
          <Box borderWidth="1px" borderColor="border" borderRadius="lg" bg="bg.panel" p={8} textAlign="center">
            <Text fontWeight="semibold">Belum ada app</Text>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Buat app pertama lewat form di atas, atau coba editor demo di /editor/demo.
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={3}>
            {apps.map((app) => (
              <Box key={app.id} borderWidth="1px" borderColor="border" borderRadius="lg" bg="bg.panel" p={4}>
                <Flex align="flex-start" justify="space-between" gap={3} flexWrap="wrap">
                  <Box minWidth="0" flex="1">
                    <Text fontWeight="semibold">{app.name}</Text>
                    <HStack gap={2} mt={1} flexWrap="wrap">
                      <Badge size="sm" variant="subtle" colorPalette="teal">
                        /{app.slug}
                      </Badge>
                      <Badge size="sm" variant="subtle" colorPalette="blue">
                        {(app.definition?.pages ?? []).length} page
                      </Badge>
                    </HStack>
                    <Box mt={2}>
                      <VersionHistory appId={app.id} />
                    </Box>
                  </Box>
                  <HStack gap={1} flexShrink="0" flexWrap="wrap">
                    <Link href={`/editor/${app.id}`} style={{ textDecoration: "none" }}>
                      <Button size="xs" variant="outline" colorPalette="green">
                        <TbPencil size={14} />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="blue"
                      loading={busyId === app.id}
                      onClick={() => handleEditCanvas(app)}
                      title="Edit di canvas React Flow"
                    >
                      <TbHierarchy2 size={14} />
                      Canvas
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="purple"
                      loading={busyId === app.id}
                      onClick={() => handlePublish(app)}
                      title="Snapshot versi baru"
                    >
                      <TbRocket size={14} />
                      Publish
                    </Button>
                    <Link href={`/app/${app.slug}`} style={{ textDecoration: "none" }}>
                      <Button size="xs" variant="outline" title="Buka URL publik">
                        <TbExternalLink size={14} />
                        Buka
                      </Button>
                    </Link>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="red"
                      loading={busyId === app.id}
                      onClick={() => handleDelete(app)}
                      title="Hapus"
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
