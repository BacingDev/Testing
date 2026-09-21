"use client";

import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import {
  TbArrowsSplit,
  TbBox,
  TbMaximize,
  TbPlugConnected,
  TbSchema,
  TbZoomIn,
  TbZoomOut,
  TbZoomReset,
} from "react-icons/tb";
import { useFlowStore } from "@/stores/flow-store";

const CONTEXT_ITEMS = [
  { key: "diagram", label: "Diagram", icon: TbSchema },
  { key: "nodes", label: "Nodes", icon: TbBox },
  { key: "edges", label: "Edges", icon: TbArrowsSplit },
  { key: "ports", label: "Ports", icon: TbPlugConnected },
];

export default function ContextMenu() {
  const zoom = useFlowStore((state) => state.zoom);
  const zoomIn = useFlowStore((state) => state.zoomIn);
  const zoomOut = useFlowStore((state) => state.zoomOut);
  const zoomReset = useFlowStore((state) => state.zoomReset);
  const fitView = useFlowStore((state) => state.fitView);

  return (
    <Box
      as="nav"
      flexShrink="0"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      px={{ base: 4, sm: 6 }}
      py={2}
      overflowX="auto"
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Flex as="ul" listStyleType="none" align="center" gap={1}>
          {CONTEXT_ITEMS.map((item, index) => (
            <Box as="li" key={item.key}>
              <Button
                size="sm"
                variant={index === 0 ? "solid" : "ghost"}
                colorPalette="gray"
              >
                <item.icon style={{ marginRight: "6px" }} />
                {item.label}
              </Button>
            </Box>
          ))}
        </Flex>
        <HStack gap={1}>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="gray"
            aria-label="Perkecil (zoom out)"
            onClick={zoomOut}
          >
            <TbZoomOut />
          </IconButton>
          <Button size="sm" variant="ghost" cursor="default" minWidth="3.5rem">
            <Text fontSize="xs" fontWeight="semibold" tabularNums>
              {Math.round(zoom * 100)}%
            </Text>
          </Button>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="gray"
            aria-label="Perbesar (zoom in)"
            onClick={zoomIn}
          >
            <TbZoomIn />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="gray"
            aria-label="Reset zoom"
            onClick={zoomReset}
          >
            <TbZoomReset />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="gray"
            aria-label="Fit view"
            onClick={fitView}
          >
            <TbMaximize />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  );
}