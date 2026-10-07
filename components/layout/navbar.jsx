"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import {
  TbAdjustments,
  TbDeviceFloppy,
  TbDownload,
  TbHierarchy2,
  TbLayoutSidebar,
  TbLogout,
  TbZoomScan,
} from "react-icons/tb";
import { saveGraph } from "@/lib/flow-save";
import {
  clearAuth,
  getAuthToken,
  getServerAuthToken,
  subscribeAuth,
} from "@/lib/auth-token";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";
import BackendStatus from "@/components/layout/backend-status";

export default function Navbar({ onToggleLeft, onToggleRight }) {
  const zoom = useFlowStore((state) => state.zoom);
  const pathname = usePathname();
  const router = useRouter();
  const blogActive = pathname?.startsWith("/blog") ?? false;
  const landingActive = pathname?.startsWith("/landing") ?? false;
  const appsActive = (pathname?.startsWith("/apps") ?? false) || (pathname?.startsWith("/editor") ?? false);
  const listActive = pathname?.startsWith("/list") ?? false;
  const canvasActive = pathname?.startsWith("/canvases") ?? false;
  const dirty = useGraphStore((state) => state.dirty);
  const [saveState, setSaveState] = useState("idle");
  const token = useSyncExternalStore(
    subscribeAuth,
    getAuthToken,
    getServerAuthToken,
  );
  const hasToken = token !== null;

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const handleSave = async () => {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      const saved = await saveGraph();
      if (!saved) throw new Error("Penyimpanan browser sedang digunakan");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      console.error("[navbar] simpan gagal:", error);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const saveLabel =
    saveState === "saving"
      ? "Menyimpan…"
      : saveState === "saved"
        ? "Tersimpan"
        : saveState === "error"
          ? "Gagal"
          : dirty
            ? "Simpan *"
            : "Simpan";

  return (
    <Box
      as="header"
      flexShrink="0"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      px={{ base: 3, sm: 4 }}
      py={1.5}
    >
      <Flex align="center" justify="space-between" gap={2} flexWrap="wrap">
        <HStack gap={{ base: 1, sm: 4 }} color="fg" flexWrap="wrap">
          {onToggleLeft ? (
            <IconButton
              size="xs"
              variant="ghost"
              display={{ base: "flex", md: "none" }}
              aria-label="Buka palette komponen"
              onClick={onToggleLeft}
            >
              <TbLayoutSidebar />
            </IconButton>
          ) : null}
          <Link
            href="/"
            style={{ textDecoration: "none", color: "inherit" }}
            title="Ke halaman utama"
          >
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              _hover={{ bg: "bg.muted" }}
            >
              <TbHierarchy2 size={15} />
              <Text fontSize="xs" fontWeight="bold" letterSpacing="tight">
                Workflow Studio
              </Text>
            </HStack>
          </Link>
          <Link
            href="/blog"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              color={blogActive ? "blue.fg" : "fg.muted"}
              bg={blogActive ? "blue.subtle" : "transparent"}
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <Text fontSize="xs" fontWeight="semibold">
                Blog
              </Text>
            </HStack>
          </Link>
          <Link
            href="/landing"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              color={landingActive ? "orange.fg" : "fg.muted"}
              bg={landingActive ? "orange.subtle" : "transparent"}
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <Text fontSize="xs" fontWeight="semibold">
                Landing
              </Text>
            </HStack>
          </Link>
          <Link
            href="/apps"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              color={appsActive ? "teal.fg" : "fg.muted"}
              bg={appsActive ? "teal.subtle" : "transparent"}
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <Text fontSize="xs" fontWeight="semibold">
                Apps
              </Text>
            </HStack>
          </Link>
          <Link
            href="/list"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              color={listActive ? "green.fg" : "fg.muted"}
              bg={listActive ? "green.subtle" : "transparent"}
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <Text fontSize="xs" fontWeight="semibold">
                List
              </Text>
            </HStack>
          </Link>
          <Link
            href="/canvases"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <HStack
              gap={1.5}
              px={2}
              py={0.5}
              rounded="md"
              color={canvasActive ? "purple.fg" : "fg.muted"}
              bg={canvasActive ? "purple.subtle" : "transparent"}
              _hover={{ bg: "bg.muted", color: "fg" }}
            >
              <Text fontSize="xs" fontWeight="semibold">
                Preview
              </Text>
            </HStack>
          </Link>
        </HStack>
        <HStack gap={1.5} flexWrap="wrap">
          <Box display={{ base: "none", sm: "block" }}>
            <BackendStatus />
          </Box>
          <HStack
            gap={1}
            px={1.5}
            py={0.5}
            rounded="md"
            borderWidth="1px"
            borderColor="border"
            bg="bg.muted"
            color="fg"
            display={{ base: "none", md: "flex" }}
          >
            <TbZoomScan size={12} />
            <Text fontSize="xs" fontWeight="semibold" tabularNums>
              {Math.round(zoom * 100)}%
            </Text>
          </HStack>
          <Button
            size="xs"
            variant="outline"
            loading={saveState === "saving"}
            colorPalette={saveState === "error" ? "red" : undefined}
            title={
              dirty
                ? "Ada perubahan belum tersimpan (autosave lokal aktif)"
                : "Semua perubahan tersimpan di browser"
            }
            onClick={handleSave}
          >
            <TbDeviceFloppy size={14} />
            <Text as="span" display={{ base: "none", sm: "inline" }}>
              {saveLabel}
            </Text>
          </Button>
          <Button size="xs" variant="solid" colorPalette="gray">
            <TbDownload size={14} />
            <Text as="span" display={{ base: "none", sm: "inline" }}>
              Ekspor
            </Text>
          </Button>
          <HStack gap={1}>
            {hasToken ? (
              <Button
                size="xs"
                variant="outline"
                colorPalette="red"
                onClick={handleLogout}
                title="Keluar dan hapus sesi"
              >
                <TbLogout size={14} />
                <Text as="span" display={{ base: "none", sm: "inline" }}>
                  Keluar
                </Text>
              </Button>
            ) : (
              <>
                <Link href="/auth/login" style={{ textDecoration: "none" }}>
                  <Button size="xs" variant="outline" colorPalette="blue">
                    Masuk
                  </Button>
                </Link>
                <Link href="/auth/register" style={{ textDecoration: "none" }}>
                  <Button size="xs" variant="outline" colorPalette="green">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </HStack>
          {onToggleRight ? (
            <IconButton
              size="xs"
              variant="ghost"
              display={{ base: "flex", md: "none" }}
              aria-label="Buka panel properti"
              onClick={onToggleRight}
            >
              <TbAdjustments />
            </IconButton>
          ) : null}
        </HStack>
      </Flex>
    </Box>
  );
}
