"use client";

import { useEffect } from "react";
import { Box, Button } from "@chakra-ui/react";

const MENU_WIDTH = 184;
const MENU_HEIGHT = 104;
const EDGE_GAP = 8;

/**
 * Menu klik-kanan generik untuk item canvas (node, edge, port).
 *
 * `items`: [{ key, label, icon, colorPalette, onSelect }]. Posisi dijepit ke
 * dalam viewport supaya tidak terpotong di tepi layar.
 */
export function CanvasContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const left =
    typeof window === "undefined"
      ? x
      : Math.max(
          EDGE_GAP,
          Math.min(x, window.innerWidth - MENU_WIDTH - EDGE_GAP),
        );
  const top =
    typeof window === "undefined"
      ? y
      : Math.max(
          EDGE_GAP,
          Math.min(y, window.innerHeight - MENU_HEIGHT - EDGE_GAP),
        );

  return (
    <>
      <Box
        position="fixed"
        inset="0"
        zIndex={60}
        onPointerDown={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <Box
        position="fixed"
        left={`${left}px`}
        top={`${top}px`}
        zIndex={61}
        minWidth={`${MENU_WIDTH}px`}
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        boxShadow="lg"
        p={1}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              colorPalette={item.colorPalette ?? "gray"}
              size="sm"
              width="full"
              justifyContent="flex-start"
              fontWeight="medium"
              onClick={item.onSelect}
            >
              {Icon ? (
                <Icon size={15} style={{ marginRight: "8px" }} />
              ) : null}
              {item.label}
            </Button>
          );
        })}
      </Box>
    </>
  );
}
