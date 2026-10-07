"use client";

/**
 * EDITOR SHELL — layout 3 kolom yang responsif tanpa mengubah flow.
 *
 * - Desktop (md ke atas): sama persis seperti sebelumnya
 *   (kiri palette, tengah canvas, kanan properties).
 * - Mobile: sidebar disembunyikan, diganti tombol melayang
 *   (Palette / Panel) yang membuka panel overlay + backdrop.
 *   Semua handler drag, save, dan properti tetap sama.
 */

import { useState } from "react";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import { TbAdjustments, TbLayoutSidebar, TbX } from "react-icons/tb";
import FlowEditor from "@/components/flow-editor";
import Navbar from "@/components/layout/navbar";
import ContextMenu from "@/components/layout/context-menu";
import LeftSidebar from "@/components/layout/left-sidebar";
import RightSidebar from "@/components/layout/right-sidebar";

function MobilePanel({ side, title, onClose, children }) {
  const panelWidth = side === "right" ? "400px" : "300px";
  return (
    <>
      <Box
        position="absolute"
        inset="0"
        bg="blackAlpha.500"
        zIndex={40}
        onClick={onClose}
        aria-hidden="true"
      />
      <Box
        position="absolute"
        top="0"
        bottom="0"
        left={side === "left" ? "0" : undefined}
        right={side === "right" ? "0" : undefined}
        width={panelWidth}
        maxWidth="92vw"
        zIndex={41}
        bg="bg.panel"
        borderLeftWidth={side === "right" ? "1px" : undefined}
        borderRightWidth={side === "left" ? "1px" : undefined}
        borderColor="border"
        boxShadow="lg"
        overflowY="auto"
      >
        <Flex
          position="sticky"
          top="0"
          justify="space-between"
          align="center"
          px={3}
          py={2}
          bg="bg.panel"
          borderBottomWidth="1px"
          borderColor="border"
          zIndex={1}
        >
          <Box fontSize="sm" fontWeight="semibold">
            {title}
          </Box>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={`Tutup ${title}`}
            onClick={onClose}
          >
            <TbX />
          </IconButton>
        </Flex>
        {children}
      </Box>
    </>
  );
}

export default function EditorShell() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  return (
    <Flex direction="column" height="100vh" overflow="hidden" bg="bg.subtle">
      <Navbar
        onToggleLeft={() => {
          setRightOpen(false);
          setLeftOpen((open) => !open);
        }}
        onToggleRight={() => {
          setLeftOpen(false);
          setRightOpen((open) => !open);
        }}
      />
      <ContextMenu />
      <Flex
        minHeight="0"
        flex="1"
        overflow="hidden"
        position="relative"
      >
        {/* Desktop: tampil seperti biasa. Mobile: sembunyi. */}
        <Box display={{ base: "none", md: "contents" }}>
          <LeftSidebar />
        </Box>
        <Box as="main" flex="1" minWidth="0" overflow="hidden">
          <FlowEditor />
        </Box>
        <Box display={{ base: "none", md: "contents" }}>
          <RightSidebar />
        </Box>

        {/* Tombol melayang — hanya di mobile. */}
        {!leftOpen && !rightOpen ? (
          <>
            <IconButton
              display={{ base: "flex", md: "none" }}
              position="absolute"
              left={3}
              bottom={3}
              zIndex={30}
              colorPalette="blue"
              aria-label="Buka palette komponen"
              onClick={() => setLeftOpen(true)}
            >
              <TbLayoutSidebar />
            </IconButton>
            <IconButton
              display={{ base: "flex", md: "none" }}
              position="absolute"
              right={3}
              bottom={3}
              zIndex={30}
              colorPalette="purple"
              aria-label="Buka panel properti"
              onClick={() => setRightOpen(true)}
            >
              <TbAdjustments />
            </IconButton>
          </>
        ) : null}

        {/* Panel overlay — hanya di mobile. */}
        {leftOpen ? (
          <MobilePanel
            side="left"
            title="Komponen"
            onClose={() => setLeftOpen(false)}
          >
            {/* Mulai drag = panel ditutup supaya canvas bisa di-drop. */}
            <LeftSidebar onItemDragStart={() => setLeftOpen(false)} />
          </MobilePanel>
        ) : null}
        {rightOpen ? (
          <MobilePanel
            side="right"
            title="Properti"
            onClose={() => setRightOpen(false)}
          >
            <RightSidebar />
          </MobilePanel>
        ) : null}
      </Flex>
    </Flex>
  );
}
