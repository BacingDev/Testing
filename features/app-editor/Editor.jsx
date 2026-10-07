"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { TbDeviceMobile, TbMonitor } from "react-icons/tb";
import CanvasView from "@/features/app-editor/CanvasView";
import Palette from "@/features/app-editor/Palette";
import PropertyPanel from "@/features/app-editor/PropertyPanel";
import { useAppEditorStore, writeLocalDraft } from "@/features/app-editor/store";

const AUTOSAVE_DELAY_MS = 1200;

export default function Editor() {
  const definition = useAppEditorStore((state) => state.definition);
  const pageId = useAppEditorStore((state) => state.pageId);
  const selectPage = useAppEditorStore((state) => state.selectPage);
  const appId = useAppEditorStore((state) => state.appId);
  const serverMode = useAppEditorStore((state) => state.serverMode);
  const undo = useAppEditorStore((state) => state.undo);
  const redo = useAppEditorStore((state) => state.redo);
  const [mobile, setMobile] = useState(false);
  const [autosaved, setAutosaved] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!definition || !appId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      writeLocalDraft(appId, useAppEditorStore.getState().definition);
      setAutosaved(true);
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [definition, appId]);

  const onKey = useCallback(
    (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    },
    [undo, redo],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (!definition) {
    return (
      <Box p={8}>
        <Text fontSize="sm" color="fg.muted">
          Memuat editor…
        </Text>
      </Box>
    );
  }

  const pages = definition.pages ?? [];
  const page = pages.find((item) => item.id === pageId) ?? pages[0];

  return (
    <Flex direction="column" height="100%" minHeight="0">
      <HStack
        gap={2}
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.panel"
        flexWrap="wrap"
      >
        <Text fontSize="sm" fontWeight="bold" mr={1}>
          {definition.name}
        </Text>
        {pages.map((item) => (
          <Button
            key={item.id}
            size="xs"
            variant={item.id === page?.id ? "solid" : "ghost"}
            colorPalette="blue"
            onClick={() => selectPage(item.id)}
          >
            {item.title}
          </Button>
        ))}
        <Box flex="1" />
        {autosaved ? (
          <Text fontSize="xs" color="fg.muted">
            autosave lokal ✓{serverMode ? "" : " (server belum tersedia)"}
          </Text>
        ) : null}
        <IconButton
          size="xs"
          variant={mobile ? "solid" : "ghost"}
          colorPalette="blue"
          aria-label="Preview mobile"
          title="Preview mobile (375px)"
          aria-pressed={mobile}
          onClick={() => setMobile((value) => !value)}
        >
          <TbDeviceMobile />
        </IconButton>
        <IconButton
          size="xs"
          variant={!mobile ? "solid" : "ghost"}
          colorPalette="blue"
          aria-label="Preview desktop"
          title="Preview desktop"
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          <TbMonitor />
        </IconButton>
      </HStack>

      <Flex flex="1" minHeight="0" direction={{ base: "column", lg: "row" }} overflowY={{ base: "auto", lg: "hidden" }}>
        <Box
          flexShrink="0"
          width={{ base: "auto", lg: "220px" }}
          borderRightWidth={{ base: "0", lg: "1px" }}
          borderBottomWidth={{ base: "1px", lg: "0" }}
          borderColor="border"
          bg="bg.panel"
          overflowY={{ base: "visible", lg: "auto" }}
        >
          <Palette />
        </Box>

        <Box flex="1" minWidth="0" overflowY="auto" bg="bg.subtle" p={{ base: 3, md: 6 }}>
          <Box
            width="100%"
            maxW={mobile ? "375px" : "720px"}
            mx="auto"
            borderWidth={mobile ? "2px" : "0"}
            borderColor={mobile ? "border" : undefined}
            borderRadius={mobile ? "2xl" : undefined}
            bg={mobile ? "bg.panel" : undefined}
            p={mobile ? 3 : 0}
          >
            {mobile ? (
              <Text fontSize="xs" color="fg.muted" textAlign="center" mb={2}>
                375px — preview mobile
              </Text>
            ) : null}
            <CanvasView components={page?.components ?? []} />
          </Box>
        </Box>

        <Box
          flexShrink="0"
          width={{ base: "auto", lg: "300px" }}
          borderLeftWidth={{ base: "0", lg: "1px" }}
          borderTopWidth={{ base: "1px", lg: "0" }}
          borderColor="border"
          bg="bg.panel"
          overflowY={{ base: "visible", lg: "auto" }}
        >
          <PropertyPanel />
        </Box>
      </Flex>
    </Flex>
  );
}
