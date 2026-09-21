"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Flex, HStack, Tabs, Text } from "@chakra-ui/react";
import { TbBan, TbSettings2 } from "react-icons/tb";
import { CanvasTable } from "@/components/properties/canvas-table";
import { DetailTable } from "@/components/properties/detail-table";
import {
  buildCanvasRows,
  buildDetailTabs,
  deriveFocus,
  detailSignature,
  listSignature,
  summarizeSelection,
} from "@/components/properties/graph-utils";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";

export default function PropertiesPanel() {
  const listSig = useGraphStore((state) =>
    listSignature(state.nodes, state.edges),
  );
  const detailSig = useGraphStore((state) =>
    detailSignature(state.nodes, state.edges),
  );
  const revision = useFlowStore((state) => state.revision);
  const selectionSig = useGraphStore((state) => {
    const nodes = state.nodes
      .filter((node) => node.selected)
      .map((node) => node.id)
      .join(",");
    const edges = state.edges
      .filter((edge) => edge.selected)
      .map((edge) => edge.id)
      .join(",");
    return `n:${nodes}|e:${edges}|p:${state.selectedPortKeys.join(",")}`;
  });
  const selectNode = useGraphStore((state) => state.selectNode);
  const setFocusNodeId = useFlowStore((state) => state.setFocusNodeId);
  const [tabState, setTabState] = useState({ key: null, value: null });

  /**
   * Data dibaca via getState() dan di-memo pada signature supaya panel tidak
   * ikut render ulang saat node digeser (posisi tidak memengaruhi listSig).
   */
  const rows = useMemo(() => {
    const { nodes, edges } = useGraphStore.getState();
    return buildCanvasRows(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSig]);

  /** Ringkasan seleksi; hanya berubah saat seleksi berubah (bukan saat drag). */
  const selection = useMemo(() => {
    const { nodes, edges, selectedPortKeys } = useGraphStore.getState();
    return summarizeSelection(nodes, edges, selectedPortKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionSig]);

  const focus = useMemo(() => {
    const { nodes, edges, selectedPortKeys } = useGraphStore.getState();
    return deriveFocus(nodes, edges, selectedPortKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionSig, detailSig, revision]);

  const tabs = useMemo(() => {
    const { nodes, edges } = useGraphStore.getState();
    return buildDetailTabs(focus, nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailSig, revision, focus]);

  const nodeCount = rows.length;

  const focusKind = focus?.kind;
  const focusId = focus?.id;
  const focusPortId = focus?.portId;
  const focusKey = `${focusKind ?? ""}:${focusId ?? ""}:${focusPortId ?? ""}`;

  const preferredTab =
    focusKind === "edge" ? "edge" : focusPortId ? "ports" : "node";
  const hasPreferred = tabs.some((item) => item.value === preferredTab);
  const isStoredValid =
    tabState.key === focusKey &&
    tabs.some((item) => item.value === tabState.value);
  const activeTab = isStoredValid
    ? tabState.value
    : hasPreferred
      ? preferredTab
      : tabs[0]?.value;
  const activeItem = tabs.find((item) => item.value === activeTab) ?? null;

  const handleSelect = useCallback(
    (row) => {
      selectNode(row.id);
      setFocusNodeId(row.id);
    },
    [selectNode, setFocusNodeId],
  );

  const isMulti = selection.count > 1;

  return (
    <Flex direction="column" flex="1" minH="0" width="full">
      <Flex
        direction="column"
        gap={1}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor="border"
      >
        <HStack gap={2} color="fg">
          <TbSettings2 size={16} />
          <Text fontSize="sm" fontWeight="semibold">
            Properties
          </Text>
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          {isMulti
            ? `${selection.count} item dipilih (${selection.nodeCount} node · ${selection.edgeCount} edge · ${selection.portCount} port) · properti dinonaktifkan`
            : `${nodeCount} node. Klik baris untuk detail.`}
        </Text>
      </Flex>

      <Flex direction="column" flex="1" minH="0" px={3} py={3}>
        <CanvasTable
          rows={rows}
          selectedKeys={selection.selectedKeys}
          onSelect={handleSelect}
        />
      </Flex>

      {isMulti ? (
        <Box
          px={4}
          pb={4}
          borderTopWidth="1px"
          borderColor="border"
          bg="bg.subtle"
          pt={3}
        >
          <Box
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="border"
            borderRadius="lg"
            p={4}
            bg="bg.panel"
          >
            <HStack gap={2} color="fg.muted">
              <TbBan size={14} />
              <Text fontSize="xs" fontWeight="semibold">
                Properti dinonaktifkan
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.subtle" mt={1}>
              {selection.count} item dipilih ({selection.nodeCount} node ·{" "}
              {selection.edgeCount} edge · {selection.portCount} port). Pilih
              satu item saja untuk melihat properti.
            </Text>
          </Box>
        </Box>
      ) : focus ? (
        <Tabs.Root
          value={activeTab}
          onValueChange={(details) =>
            setTabState({ key: focusKey, value: details.value })
          }
          size="sm"
          variant="enclosed"
          colorPalette="blue"
          borderTopWidth="1px"
          borderColor="border"
          bg="bg.subtle"
          maxH="45%"
          minH="0"
          display="flex"
          flexDirection="column"
          px={3}
          pt={3}
          css={{ "--tabs-height": "28px" }}
        >
          <Tabs.List gap={1} flexShrink="0" overflowX="auto">
            {tabs.map((item) => (
              <Tabs.Trigger
                key={item.value}
                value={item.value}
                whiteSpace="nowrap"
                fontSize="11px"
                px="2"
                py="0.5"
                minW="fit-content"
              >
                {item.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {/* Hanya tab aktif yang dirender — tabel detail cukup berat kalau
              semua tab ikut dirender tiap kali data berubah. */}
          {activeItem ? (
            <Tabs.Content
              value={activeItem.value}
              flex="1"
              minH="0"
              overflowY="auto"
              px={0}
              pt={2}
              pb={3}
            >
              <DetailTable
                table={activeItem.table}
                highlightId={activeItem.value === "ports" ? focusPortId : null}
              />
            </Tabs.Content>
          ) : null}
        </Tabs.Root>
      ) : (
        <Box px={4} pb={4}>
          <Box
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="border"
            borderRadius="lg"
            p={4}
          >
            <Text fontSize="xs" color="fg.subtle">
              Belum ada item dipilih.
            </Text>
          </Box>
        </Box>
      )}
    </Flex>
  );
}
