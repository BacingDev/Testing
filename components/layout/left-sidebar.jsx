"use client";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Image,
  Separator,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  TbAffiliate,
  TbArrowsSplit,
  TbBox,
  TbBuildingFactory,
  TbCircleDot,
  TbDiamond,
  TbSquare,
} from "react-icons/tb";
import { getUnitsByCategory, UNIT_CATEGORIES } from "@/data/unit-catalog";
import { useFlowStore } from "@/stores/flow-store";

const DRAG_MIME = "application/x-myapp-unit";

const CATEGORY_ICON = {
  equipment: TbBuildingFactory,
  organization: TbAffiliate,
};

const TOOL_ITEMS = [
  {
    key: "node",
    icon: TbBox,
    tooltip: "Tambah node — drag unit ke canvas",
  },
  {
    key: "edge",
    icon: TbArrowsSplit,
    tooltip: "Mode tambah edge — tarik dari node ke node",
  },
  {
    key: "port",
    type: "port",
    icon: TbCircleDot,
    tooltip: "Mode tambah port biasa (bulat)",
  },
  {
    key: "virtual port",
    type: "virtual port",
    icon: TbSquare,
    tooltip: "Mode tambah virtual port / VP (kotak)",
  },
  {
    key: "exposed port",
    type: "exposed port",
    icon: TbDiamond,
    tooltip: "Mode tambah exposed port / EP (diamond)",
  },
];

function UnitItem({ unit }) {
  return (
    <Box>
      <Button
        type="button"
        variant="surface"
        colorPalette="gray"
        size="sm"
        width="full"
        justifyContent="flex-start"
        draggable
        cursor="grab"
        _active={{ cursor: "grabbing" }}
        onDragStart={(event) => {
          event.dataTransfer.setData(DRAG_MIME, unit.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        title={`Drag ke canvas: ${unit.name}`}
      >
        <HStack gap={2} minWidth="0" flex="1">
          <Image
            src={unit.image}
            alt={unit.name}
            boxSize="9"
            flexShrink="0"
            objectFit="contain"
            draggable={false}
          />
          <Text minWidth="0" flex="1" noOfLines={1} fontSize="xs" fontWeight="medium">
            {unit.name}
          </Text>
        </HStack>
      </Button>
    </Box>
  );
}

export default function LeftSidebar() {
  const showPorts = useFlowStore((state) => state.showPorts);
  const setShowPorts = useFlowStore((state) => state.setShowPorts);
  const tool = useFlowStore((state) => state.tool);
  const setTool = useFlowStore((state) => state.setTool);
  const portType = useFlowStore((state) => state.portType);
  const setPortType = useFlowStore((state) => state.setPortType);

  return (
    <Flex
      as="aside"
      direction="column"
      width="64"
      flexShrink="0"
      overflowY="auto"
      borderRightWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <Box px={2} py={2.5}>
        <HStack gap={1}>
          {TOOL_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.type
              ? tool === "port" && portType === item.type
              : tool === item.key;
            return (
              <Tooltip.Root
                key={item.key}
                positioning={{ placement: "right" }}
                openDelay={150}
              >
                <Tooltip.Trigger asChild>
                  <IconButton
                    size="sm"
                    variant={isActive ? "solid" : "ghost"}
                    colorPalette="blue"
                    flex="1"
                    aria-label={item.tooltip}
                    aria-pressed={isActive}
                    onClick={() => {
                      if (item.type) {
                        setPortType(item.type);
                        setTool("port");
                      } else {
                        setTool(item.key);
                      }
                    }}
                  >
                    <Icon />
                  </IconButton>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>{item.tooltip}</Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            );
          })}
        </HStack>
      </Box>

      {tool === "node" ? (
        <>
          <Separator />
          {UNIT_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICON[category.key];
            return (
              <Box key={category.key} px={3} pt={3}>
                <HStack gap={1.5} color="fg" mb={2}>
                  <Icon size={15} />
                  <Text fontSize="sm" fontWeight="semibold">
                    {category.label}
                  </Text>
                </HStack>
                <Flex direction="column" gap={1.5} pb={3}>
                  {getUnitsByCategory(category.key).map((unit) => (
                    <UnitItem key={unit.id} unit={unit} />
                  ))}
                </Flex>
                <Separator />
              </Box>
            );
          })}
        </>
      ) : null}

      <Box mt="auto" px={4} py={3}>
        <Checkbox.Root
          size="sm"
          checked={showPorts}
          onCheckedChange={(details) => setShowPorts(!!details.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Tampilkan port</Checkbox.Label>
        </Checkbox.Root>
      </Box>
    </Flex>
  );
}