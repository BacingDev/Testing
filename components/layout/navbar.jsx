"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import {
  TbAdjustments,
  TbDownload,
  TbHierarchy2,
  TbLayoutSidebar,
  TbLogout,
  TbZoomScan,
} from "react-icons/tb";
import {
  clearAuth,
  getAuthToken,
  getServerAuthToken,
  subscribeAuth,
} from "@/lib/auth-token";
import { useFlowStore } from "@/stores/flow-store";
import BackendStatus from "@/components/layout/backend-status";
import AppEditBar from "@/components/layout/app-edit-bar";

export default function Navbar({ onToggleLeft, onToggleRight }) {
  const zoom = useFlowStore((state) => state.zoom);
  const pathname = usePathname();
  const router = useRouter();
  const blogActive = pathname?.startsWith("/blog") ?? false;
  const listActive = pathname?.startsWith("/list") ?? false;
  const appsActive = (pathname?.startsWith("/apps") ?? false) || (pathname?.startsWith("/editor") ?? false);
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
                Aplikasi
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
      {pathname === "/" ? <AppEditBar /> : null}
    </Box>
  );
}
