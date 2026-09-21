"use client";

import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import {
  TbDeviceFloppy,
  TbDownload,
  TbHierarchy2,
  TbZoomScan,
} from "react-icons/tb";
import { useFlowStore } from "@/stores/flow-store";

export default function Navbar() {
  const zoom = useFlowStore((state) => state.zoom);

  return (
    <Box
      as="header"
      flexShrink="0"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
      px={{ base: 4, sm: 6 }}
      py={3}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <HStack gap={6}>
          <HStack gap={2} color="fg">
            <TbHierarchy2 size={18} />
            <Text fontSize="sm" fontWeight="bold" letterSpacing="tight">
              Workflow Studio
            </Text>
          </HStack>
          <Text
            display={{ base: "none", md: "block" }}
            fontSize="xs"
            color="fg.muted"
          >
            Diagram parent / nodes / edges
          </Text>
        </HStack>
        <HStack gap={2}>
          <HStack
            gap={1.5}
            px={2}
            py={1}
            rounded="md"
            borderWidth="1px"
            borderColor="border"
            bg="bg.muted"
            color="fg"
          >
            <TbZoomScan size={14} />
            <Text fontSize="xs" fontWeight="semibold" tabularNums>
              {Math.round(zoom * 100)}%
            </Text>
          </HStack>
          <Button size="sm" variant="outline">
            <TbDeviceFloppy style={{ marginRight: "6px" }} />
            Simpan
          </Button>
          <Button size="sm" variant="solid" colorPalette="gray">
            <TbDownload style={{ marginRight: "6px" }} />
            Ekspor
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}