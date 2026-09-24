"use client";

/**
 * DOMAIN PORT — satu file untuk semua yang berhubungan dengan port:
 * - FlowPort / PortShape (tampilan + seleksi port, cuma ganti warna stroke)
 * - PortPropertiesDialog (dialog properti port)
 */

import { memo, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  IconButton,
  Input,
  Portal,
  SegmentGroup,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Handle, Position } from "@xyflow/react";
import { TbX } from "react-icons/tb";
import { useFlowContext } from "@/components/flow/flow-context";
import { RangeControl } from "@/components/ui/range-control";
import { useFlowStore } from "@/stores/flow-store";
import { useGraphStore } from "@/stores/graph-store";
import { portKey } from "@/stores/selection-key";

const SELECT_COLOR = "#2563eb";

/**
 * Domain sidelocation: 0 = bawah, 1 = kanan, 2 = atas, 3 = kiri
 * (atas/bawah terbalik dari mapping React Flow Top=0 / Bottom=2)
 */
export const sideToPosition = {
  0: Position.Bottom,
  1: Position.Right,
  2: Position.Top,
  3: Position.Left,
};

/** Offset along the node edge; works for any sidelocation + position %. */
export function getHandleStyle(sidelocation, position) {
  const pct = `${position}%`;
  return {
    ...(sidelocation === 1 || sidelocation === 3
      ? { top: pct }
      : { left: pct }),
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0,
    overflow: "visible",
  };
}

/** Jarak label dari tip — ngaruh ke adanya panah di sisi port tersebut. */
function getLabelGap(portType, hasArrow) {
  if (portType === "exposed port" || portType === "virtual port") return 16;
  // Port tujuan edge punya panah → label diberi jarak agar tidak tertutup.
  // Port sumber/tanpa edge tidak ada panah → label didempetkan ke port.
  return hasArrow ? 12 : 5;
}

/**
 * Peran port di dalam grafik: apakah menjadi ujung source/target suatu edge.
 * Arah tampil port diturunkan dari sini — port tanpa edge tampil sebagai
 * default/neutral, terlepas dari nilai `hasDirection` yang tersimpan.
 */
function usePortRole(nodeId, portId) {
  const edges = useGraphStore((state) => state.edges);
  return useMemo(() => {
    const id = String(portId);
    let source = false;
    let target = false;
    for (const edge of edges) {
      if (edge.source === nodeId && String(edge.sourceHandle) === id)
        source = true;
      if (edge.target === nodeId && String(edge.targetHandle) === id)
        target = true;
      if (source && target) break;
    }
    return { source, target };
  }, [edges, nodeId, portId]);
}

function getPortLabelStyle(sidelocation, portType, hasArrow) {
  const gap = getLabelGap(portType, hasArrow);
  switch (sidelocation) {
    case 2: // atas — label di luar (ke atas)
      return {
        left: "50%",
        bottom: `calc(100% + ${gap}px)`,
        transform: "translateX(-50%)",
      };
    case 1: // kanan
      return {
        left: `calc(100% + ${gap}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      };
    case 0: // bawah — label di luar (ke bawah)
      return {
        left: "50%",
        top: `calc(100% + ${gap}px)`,
        transform: "translateX(-50%)",
      };
    case 3: // kiri
      return {
        right: `calc(100% + ${gap}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      };
    default:
      return {};
  }
}

const PortShape = memo(function PortShape({ nodeId, port, active }) {
  const [hovered, setHovered] = useState(false);
  const showPorts = useFlowStore((state) => state.showPorts);
  const selectPort = useGraphStore((state) => state.selectPort);
  const { openPortMenu } = useFlowContext();
  const key = portKey(nodeId, port.idpfport);
  const isSelected = useGraphStore((state) =>
    state.selectedPortKeys.includes(key),
  );
  const { source, target } = usePortRole(nodeId, port.idpfport);
  // Arah visual dari edge aktual: tanpa edge / dua-duanya → neutral;
  // hanya keluar → outlet; hanya masuk → inlet.
  const effectiveDirection =
    source && target ? "neutral" : target ? "inlet" : source ? "outlet" : "neutral";
  const colors = useMemo(() => {
    const highlighted = hovered || isSelected || active;
    if (port.type === "exposed port")
      return {
        fill: port.hasMetadata ? "#fda4af" : "#ffe4e6",
        stroke: highlighted ? SELECT_COLOR : "#be123c",
      };
    if (port.type === "virtual port")
      return {
        fill: port.hasMetadata ? "#c4b5fd" : "#ede9fe",
        stroke: highlighted ? SELECT_COLOR : "#6d28d9",
      };
    if (effectiveDirection === "outlet")
      return {
        fill: port.hasMetadata ? "#fdba74" : "#ffedd5",
        stroke: highlighted ? SELECT_COLOR : "#c2410c",
      };
    if (effectiveDirection === "inlet")
      return {
        fill: port.hasMetadata ? "#86efac" : "#dcfce7",
        stroke: highlighted ? SELECT_COLOR : "#15803d",
      };
    return {
      fill: port.hasMetadata ? "#cbd5e1" : "#ffffff",
      stroke: highlighted ? SELECT_COLOR : "#111827",
    };
  }, [port.type, effectiveDirection, port.hasMetadata, hovered, isSelected, active]);
  const isExposed = port.type === "exposed port";
  const isVirtual = port.type === "virtual port";
  // Stroke seragam; seleksi / hover / active cuma ganti warna stroke.
  const strokeWidth = 1;
  const common = {
    ...colors,
    strokeWidth,
  };

  // Proporsional ke port biasa (10×10, r≈4): badan ~8px, kaki pendek ~4.5px
  // Stem ke +y lokal; rotasi agar kaki mengarah ke node (nempel di edge)
  const rotation = { 0: 180, 1: 90, 2: 0, 3: -90 }[port.sidelocation];
  const size = isExposed || isVirtual ? { w: 10, h: 13, tipX: 5, tipY: 12.5 } : { w: 10, h: 10, tipX: 5, tipY: 5 };

  return (
    <>
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        width={size.w}
        height={size.h}
        style={{
          position: "absolute",
          left: -size.tipX,
          top: -size.tipY,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${size.tipX}px ${size.tipY}px`,
          pointerEvents: "all",
          opacity: showPorts ? 1 : 0,
          overflow: "visible",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(event) => {
          // Jangan biarkan klik port ikut menyeleksi node induk — kalau tidak,
          // seleksi port langsung tertimpa seleksi node.
          event.preventDefault();
          event.stopPropagation();
          selectPort(key, event.shiftKey || event.metaKey || event.ctrlKey);
        }}
        onContextMenu={(event) => {
          // stopPropagation supaya menu klik-kanan node tidak ikut terbuka.
          event.preventDefault();
          event.stopPropagation();
          openPortMenu(nodeId, port.idpfport, event);
        }}
      >
        {/* Seleksi cuma ganti warna stroke via `common` di bawah — tanpa halo tambahan. */}
        {port.type === "port" ? (
          <circle cx="5" cy="5" r="4" {...common} />
        ) : null}
        {isExposed ? (
          <>
            {/* Diamond ~8px, setara diameter port biasa */}
            <polygon points="5,0.5 9.5,5 5,9.5 0.5,5" {...common} />
            <path d="M 5 9.5 L 5 12.5" {...common} />
          </>
        ) : null}
        {isVirtual ? (
          <>
            {/* Kotak ~8px + kaki pendek */}
            <rect x="1" y="0.5" width="8" height="8" {...common} />
            <path d="M 5 8.5 L 5 12.5" {...common} />
          </>
        ) : null}
      </svg>
      {showPorts && port.name ? (
        <Box
          pointerEvents="none"
          position="absolute"
          zIndex={20}
          whiteSpace="nowrap"
          rounded="sm"
          bg="white/90"
          px={1}
          fontSize="9px"
          fontWeight="medium"
          lineHeight="none"
          color="gray.700"
          boxShadow="sm"
          style={getPortLabelStyle(port.sidelocation, port.type, target)}
        >
          {port.name}
        </Box>
      ) : null}
    </>
  );
});

/**
 * Port bayangan selama drag body→body — layer yang sama dengan
 * FlowPort (Handle + svg 10×10), non-interaktif. Beda warna saja:
 * outlet = oranye, inlet = hijau (isi/stroke mengikuti arah port biasa).
 * Tidak dirender untuk drag dari port existing (port→port).
 */
export const GhostPortHandle = memo(function GhostPortHandle({
  side,
  position,
  kind = "outlet",
}) {
  const positionRf = sideToPosition[side];
  const handleStyle = getHandleStyle(side, position);
  const rotation = { 0: 180, 1: 90, 2: 0, 3: -90 }[side];
  const colors =
    kind === "inlet"
      ? { fill: "#dcfce7", stroke: "#15803d" }
      : { fill: "#ffedd5", stroke: "#c2410c" };
  if (positionRf == null) return null;
  return (
    <Handle
      type="source"
      position={positionRf}
      style={{
        ...handleStyle,
        pointerEvents: "none",
        zIndex: 25,
      }}
      isConnectable={false}
    >
      <svg
        viewBox="0 0 10 10"
        width={10}
        height={10}
        style={{
          position: "absolute",
          left: -5,
          top: -5,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "5px 5px",
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <circle
          cx="5"
          cy="5"
          r="4"
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={1.5}
          strokeDasharray="2.5 1.5"
          opacity={0.95}
        />
        <circle cx="5" cy="5" r={1.5} fill={colors.stroke} opacity={0.9} />
      </svg>
    </Handle>
  );
});

export const FlowPort = memo(function FlowPort({ nodeId, port, active }) {
  const { connectMode } = useFlowContext();
  const position = sideToPosition[port.sidelocation];
  const handleStyle = getHandleStyle(port.sidelocation, port.position);
  // Port biasa harus selalu punya handle source + target supaya edge yang
  // sudah tersimpan tetap ter-render (React Flow butuh source handle untuk
  // menghitung posisi edge). Bendera `isConnectable` yang membatasi kapan
  // port bisa dipakai membuat edge baru — bukan keberadaan handle-nya.
  const canEndEdge = port.type === "port";
  const isDirectionLocked =
    port.hasDirection === "inlet" || port.hasDirection === "outlet";
  const connectable = connectMode && canEndEdge && !isDirectionLocked;
  // Handle source + target SELALU dirender untuk port biasa — arah tidak
  // lagi ditutup-tutupi berdasarkan edge lama (itu bikin "kadang bisa
  // kadang ngga"). PortShape nempel di handle target.
  return (
    <>
      <Handle
        id={port.idpfport}
        type="target"
        position={position}
        style={handleStyle}
        isConnectable={connectable}
      >
        <PortShape nodeId={nodeId} port={port} active={active} />
      </Handle>
      {canEndEdge ? (
        <Handle
          id={port.idpfport}
          type="source"
          position={position}
          style={handleStyle}
          isConnectable={connectable}
        />
      ) : null}
    </>
  );
});

// ---------------------------------------------------------------------------
// PortPropertiesDialog
// ---------------------------------------------------------------------------

const DIRECTION_OPTIONS = [
  { value: "inlet", label: "Inlet" },
  { value: "outlet", label: "Outlet" },
  { value: "neutral", label: "Neutral" },
];

const SIDE_OPTIONS = [
  { value: "0", label: "Bawah" },
  { value: "1", label: "Kanan" },
  { value: "2", label: "Atas" },
  { value: "3", label: "Kiri" },
];

const TYPE_OPTIONS = [
  { value: "port", label: "Port" },
  { value: "exposed port", label: "Exposed" },
  { value: "virtual port", label: "Virtual" },
];

const STATUS_OPTIONS = [
  { value: "CONNECTED", label: "Connected" },
  { value: "DISCONNECTED", label: "Disconnected" },
  { value: "DROPPED", label: "Dropped" },
];

const PREVIEW_SIZE = 112;

function portColors(type, direction, hasMetadata) {
  if (type === "exposed port")
    return { fill: hasMetadata ? "#fda4af" : "#ffe4e6", stroke: "#be123c" };
  if (type === "virtual port")
    return { fill: hasMetadata ? "#c4b5fd" : "#ede9fe", stroke: "#6d28d9" };
  if (direction === "outlet")
    return { fill: hasMetadata ? "#fdba74" : "#ffedd5", stroke: "#c2410c" };
  if (direction === "inlet")
    return { fill: hasMetadata ? "#86efac" : "#dcfce7", stroke: "#15803d" };
  return { fill: hasMetadata ? "#cbd5e1" : "#ffffff", stroke: "#111827" };
}

function PortPreview({ type, direction, side, position, hasMetadata }) {
  const { fill, stroke } = portColors(type, direction, hasMetadata);
  const isExposed = type === "exposed port";
  const isVirtual = type === "virtual port";
  const vertical = side === 0 || side === 2;
  const offset = `${Math.max(0, Math.min(100, position))}%`;
  const rotation = { 0: 180, 1: 90, 2: 0, 3: -90 }[side];
  const tipX = 5;
  const tipY = type === "port" ? 5 : 12.5;

  const anchor = {
    ...(vertical ? { left: offset } : { top: offset }),
    ...(side === 0 ? { top: "100%" } : {}),
    ...(side === 1 ? { left: "100%" } : {}),
    ...(side === 2 ? { top: 0 } : {}),
    ...(side === 3 ? { left: 0 } : {}),
  };


  return (
    <Flex
      justify="center"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={3}
    >
      <Box
        position="relative"
        width={`${PREVIEW_SIZE}px`}
        height={`${PREVIEW_SIZE}px`}
        bg="bg.panel"
        borderWidth="2px"
        borderColor="border"
        borderRadius="lg"
      >
        <Box position="absolute" boxSize={0} style={anchor}>
          <svg
            viewBox="0 0 10 15"
            width="10"
            height="15"
            style={{
              position: "absolute",
              left: -tipX,
              top: -tipY,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${tipX}px ${tipY}px`,
              overflow: "visible",
            }}
          >
            {type === "port" ? (
              <circle
                cx="5"
                cy="5"
                r="4.5"
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
              />
            ) : (
              <>
                {isExposed ? (
                  <polygon
                    points="5,0.5 9.5,5 5,9.5 0.5,5"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="1"
                  />
                ) : null}
                {isVirtual ? (
                  <rect
                    x="1"
                    y="0.5"
                    width="8"
                    height="8"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="1"
                  />
                ) : null}
                <path
                  d={isExposed ? "M 5 9.5 L 5 12.5" : "M 5 8.5 L 5 12.5"}
                  stroke={stroke}
                  strokeWidth="1"
                  fill="none"
                />
              </>
            )}
          </svg>
        </Box>
      </Box>
    </Flex>
  );
}

function PortPropertiesForm({ node, port, onCancel, onSave }) {
  const [name, setName] = useState(port.name ?? "");
  const [direction, setDirection] = useState(port.hasDirection ?? "neutral");
  const [side, setSide] = useState(String(port.sidelocation ?? 0));
  const [position, setPosition] = useState(Number(port.position ?? 0));
  const [type, setType] = useState(port.type ?? "port");
  const [status, setStatus] = useState(port.connectionStatus ?? "DISCONNECTED");
  const [hasMetadata, setHasMetadata] = useState(!!port.hasMetadata);
  const [remark, setRemark] = useState(port.remark ?? "");

  const handleSave = () => {
    onSave(node.id, port.idpfport, {
      name,
      hasDirection: direction,
      sidelocation: Number(side),
      position,
      type,
      connectionStatus: status,
      hasMetadata,
      remark: remark.trim() ? remark : null,
    });
  };

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Properti port</Dialog.Title>
        <Dialog.Description noOfLines={2}>
          {port.name || "Port"} · {port.idpfport} pada node{" "}
          {node.data.label ?? node.id}
        </Dialog.Description>
      </Dialog.Header>

      <Dialog.Body
        minH="0"
        maxH="calc(100dvh - 190px)"
        overflowY="auto"
        py={4}
      >
        <Stack gap={4}>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <Field.Root>
              <Field.Label>Nama port</Field.Label>
              <Input
                size="sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Catatan</Field.Label>
              <Input
                size="sm"
                placeholder="Opsional"
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
              />
            </Field.Root>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <Field.Root>
              <Field.Label>Arah</Field.Label>
              <SegmentGroup.Root
                size="sm"
                value={direction}
                onValueChange={(details) => {
                  if (details.value) setDirection(details.value);
                }}
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={DIRECTION_OPTIONS} />
              </SegmentGroup.Root>
              <Field.HelperText>
                Inlet hanya menerima, outlet hanya mengirim, neutral keduanya.
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Tipe</Field.Label>
              <SegmentGroup.Root
                size="sm"
                value={type}
                onValueChange={(details) => {
                  if (details.value) setType(details.value);
                }}
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={TYPE_OPTIONS} />
              </SegmentGroup.Root>
            </Field.Root>
          </SimpleGrid>

          <Stack gap={4}>
            <Field.Root>
              <Field.Label>Sisi</Field.Label>
              <SegmentGroup.Root
                size="sm"
                value={side}
                onValueChange={(details) => {
                  if (details.value) setSide(details.value);
                }}
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={SIDE_OPTIONS} />
              </SegmentGroup.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Posisi pada sisi</Field.Label>
              <RangeControl
                min={0}
                max={100}
                step={1}
                value={position}
                onChange={setPosition}
                aria-label="Posisi pada sisi"
              />
              <Field.HelperText>
                <Text as="span" fontWeight="semibold" tabularNums>
                  {position}%
                </Text>{" "}
                dari ujung sisi
              </Field.HelperText>
            </Field.Root>
          </Stack>

          <Field.Root>
            <Field.Label>Status koneksi</Field.Label>
            <SegmentGroup.Root
              size="sm"
              value={status}
              onValueChange={(details) => {
                if (details.value) setStatus(details.value);
              }}
            >
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={STATUS_OPTIONS} />
            </SegmentGroup.Root>
          </Field.Root>

          <SimpleGrid
            columns={{ base: 1, sm: 2 }}
            gap={4}
            alignItems="start"
          >
            <Box
              borderWidth="1px"
              borderColor="border"
              borderRadius="lg"
              bg="bg.subtle"
              p={3}
            >
              <Checkbox.Root
                size="sm"
                checked={hasMetadata}
                onCheckedChange={(details) =>
                  setHasMetadata(!!details.checked)
                }
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Punya metadata</Checkbox.Label>
              </Checkbox.Root>
              <Text mt={2} fontSize="xs" color="fg.muted">
                Mengubah warna isi port menjadi lebih saturated.
              </Text>
            </Box>

            <Field.Root>
              <Field.Label>Pratinjau</Field.Label>
              <PortPreview
                type={type}
                direction={direction}
                side={Number(side)}
                position={position}
                hasMetadata={hasMetadata}
              />
            </Field.Root>
          </SimpleGrid>
        </Stack>
      </Dialog.Body>

      <Dialog.Footer
        bg="bg.panel"
        borderTopWidth="1px"
        borderColor="border"
      >
        <Button variant="ghost" size="sm" colorPalette="gray" onClick={onCancel}>
          Batal
        </Button>
        <Button size="sm" colorPalette="blue" onClick={handleSave}>
          Simpan
        </Button>
      </Dialog.Footer>

      <Dialog.CloseTrigger asChild>
        <IconButton variant="ghost" size="sm" aria-label="Tutup">
          <TbX />
        </IconButton>
      </Dialog.CloseTrigger>
    </>
  );
}

export function PortPropertiesDialog({
  node,
  port,
  open,
  onOpenChange,
  onSave,
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      scrollBehavior="inside"
      size="md"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.500" />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            width="calc(100vw - 32px)"
            maxH="calc(100dvh - 32px)"
            overflow="hidden"
            borderWidth="1px"
            borderColor="border"
            borderRadius="xl"
            boxShadow="2xl"
          >
            {node && port ? (
              <PortPropertiesForm
                key={`${node.id}:${port.idpfport}`}
                node={node}
                port={port}
                onCancel={() => onOpenChange({ open: false })}
                onSave={onSave}
              />
            ) : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
