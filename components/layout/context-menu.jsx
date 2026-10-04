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
      px={{ base: 3, sm: 4 }}
      py={1}
      overflowX="auto"
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Flex as="ul" listStyleType="none" align="center" gap={1}>
          {CONTEXT_ITEMS.map((item, index) => (
            <Box as="li" key={item.key}>
              <Button
                size="2xs"
                variant={index === 0 ? "solid" : "ghost"}
                colorPalette="gray"
              >
                <item.icon size={13} />
                {item.label}
              </Button>
            </Box>
          ))}
        </Flex>
        <HStack gap={0.5}>
          <IconButton
            size="2xs"
            variant="ghost"
            colorPalette="gray"
            aria-label="Perkecil (zoom out)"
            onClick={zoomOut}
          >
            <TbZoomOut />
          </IconButton>
          <Button size="2xs" variant="ghost" cursor="default" minWidth="2.75rem">
            <Text fontSize="xs" fontWeight="semibold" tabularNums>
              {Math.round(zoom * 100)}%
            </Text>
          </Button>
          <IconButton
            size="2xs"
            variant="ghost"
            colorPalette="gray"
            aria-label="Perbesar (zoom in)"
            onClick={zoomIn}
          >
            <TbZoomIn />
          </IconButton>
          <IconButton
            size="2xs"
            variant="ghost"
            colorPalette="gray"
            aria-label="Reset zoom"
            onClick={zoomReset}
          >
            <TbZoomReset />
          </IconButton>
          <IconButton
            size="2xs"
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