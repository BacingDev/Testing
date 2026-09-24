"use client";

/**
 * DOMAIN NODE — satu file untuk semua yang berhubungan dengan node:
 * - NodeBorder (bingkai seleksi/hover)
 * - UnitNodeLabel + UnitNodePreview (tampilan badan node)
 * - useMultiResize (resize multi-seleksi)
 * - UnitNode (tipe node "workflow" untuk React Flow)
 * - NodePropertiesDialog (dialog properti node)
 */

import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Portal,
  SegmentGroup,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import { TbX } from "react-icons/tb";
import { FlowPort, GhostPortHandle } from "@/components/flow/port";
import { useFlowContext } from "@/components/flow/flow-context";
import { RangeControl } from "@/components/ui/range-control";
import { DEFAULT_NODE_IMAGE } from "@/data/dummy-flow";
import { UNIT_CATALOG } from "@/data/unit-catalog";
import { useFlowStore } from "@/stores/flow-store";
import {
  CONNECT_OVERLAY_SOURCE_ID,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  RESIZE_COLOR,
} from "@/components/flow/constants";

// ---------------------------------------------------------------------------
// NodeBorder
// ---------------------------------------------------------------------------

const NodeBorder = memo(function NodeBorder({
  height,
  width,
  isSelected,
  styleBorderDotted = false,
  isNotShownNode = false,
}) {
  const { zoom } = useViewport();
  const [hovered, setHovered] = useState(false);
  const strokeWidth = 2 / zoom;
  const stroke = useMemo(
    () => (hovered ? "#7dd3fc" : isSelected ? "#2563eb" : "#94a3b8"),
    [hovered, isSelected],
  );
  const dash =
    isSelected || isNotShownNode
      ? "none"
      : hovered && styleBorderDotted
        ? `${4 / zoom} ${2 / zoom}`
        : "none";

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        pointerEvents: "auto",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={width - strokeWidth}
        height={height - strokeWidth}
        rx="4"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
      />
    </svg>
  );
});

// ---------------------------------------------------------------------------
// UnitNodeLabel
// ---------------------------------------------------------------------------

export const UnitNodeLabel = memo(function UnitNodeLabel({
  label,
  topOffset,
}) {
  return (
    <Box
      pointerEvents="none"
      position="absolute"
      left="50%"
      zIndex={50}
      width="max-content"
      maxWidth="13.75rem"
      bg="white"
      rounded="md"
      px={1.5}
      py={0.5}
      textAlign="center"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="border"
      style={{
        top: `calc(100% + ${topOffset}px)`,
        transform: "translateX(-50%)",
      }}
    >
      <Text
        noOfLines={1}
        fontSize="xs"
        fontWeight="semibold"
        lineHeight="tight"
        color="gray.900"
      >
        {label}
      </Text>
    </Box>
  );
});

// ---------------------------------------------------------------------------
// UnitNodePreview
// ---------------------------------------------------------------------------

/** Rasio intrinsik default semua gambar unit (viewBox 160×100). */
const FALLBACK_IMAGE = { width: 160, height: 100 };

function drawnSize(
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
  visual,
) {
  if (visual === "stretch") {
    return { width: containerWidth, height: containerHeight };
  }
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  return { width: imageWidth * scale, height: imageHeight * scale };
}

/**
 * Faktor skala agar gambar yang sudah dirotasi tetap muat di dalam border
 * (tidak keluar / terpotong).
 */
function rotationScale(containerWidth, containerHeight, drawn, deg) {
  const normalized = ((deg % 360) + 360) % 360;
  if (!normalized || !drawn.width || !drawn.height) return 1;
  const rad = (normalized * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const boxWidth = drawn.width * cos + drawn.height * sin;
  const boxHeight = drawn.width * sin + drawn.height * cos;
  if (!boxWidth || !boxHeight) return 1;
  return Math.min(containerWidth / boxWidth, containerHeight / boxHeight, 1);
}

export const UnitNodePreview = memo(function UnitNodePreview({
  image,
  label,
  style,
  width,
  height,
}) {
  const visual = style?.visual ?? "fit";
  const rotate = style?.rotate ?? 0;
  const flipX = style?.horizontalFlip ? -1 : 1;
  const flipY = style?.verticalFlip ? -1 : 1;
  const [natural, setNatural] = useState(FALLBACK_IMAGE);

  const src = image || DEFAULT_NODE_IMAGE;

  const handleLoad = useCallback((event) => {
    const el = event.currentTarget;
    if (!el.naturalWidth || !el.naturalHeight) return;
    setNatural((prev) =>
      prev.width === el.naturalWidth && prev.height === el.naturalHeight
        ? prev
        : { width: el.naturalWidth, height: el.naturalHeight },
    );
  }, []);

  const drawn = drawnSize(width, height, natural.width, natural.height, visual);
  const scale = rotationScale(width, height, drawn, rotate);

  return (
    <Box
      position="absolute"
      inset="0"
      overflow="hidden"
      rounded="md"
      bg="white"
      boxShadow="sm"
    >
      {visual === "repeat" ? (
        <Box
          position="absolute"
          inset="0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: "repeat",
            backgroundSize: "48px auto",
            transform: `rotate(${rotate}deg) scale(${flipX}, ${flipY})`,
            transformOrigin: "center",
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          draggable={false}
          onLoad={handleLoad}
          onError={(event) => {
            event.currentTarget.src = DEFAULT_NODE_IMAGE;
          }}
          style={{
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            objectFit: visual === "stretch" ? "fill" : "contain",
            padding: visual === "stretch" ? 0 : "0.5rem",
            transform: `rotate(${rotate}deg) scale(${scale * flipX}, ${scale * flipY})`,
            transformOrigin: "center",
          }}
        />
      )}
    </Box>
  );
});

// ---------------------------------------------------------------------------
// useMultiResize
// ---------------------------------------------------------------------------

function dimensionsOf(node) {
  return {
    width: node?.measured?.width ?? node?.width ?? MIN_NODE_WIDTH,
    height: node?.measured?.height ?? node?.height ?? MIN_NODE_HEIGHT,
  };
}

/**
 * Resize satu node sekaligus mengikuti node lain yang sedang ter-select.
 * Selama drag, NodeResizer sudah mengurus node utama; hook ini hanya
 * menerapkan delta ukuran yang sama ke node ter-select lainnya.
 */
export function useMultiResize(nodeId) {
  const { getNodes } = useReactFlow();
  const { setNodes } = useFlowContext();
  const snapshotRef = useRef(null);

  const onResizeStart = useCallback(
    (event, params) => {
      const selected = getNodes().filter((node) => node.selected);
      const primarySelected = selected.some((node) => node.id === nodeId);

      snapshotRef.current = {
        width: params.width,
        height: params.height,
        others: primarySelected
          ? selected
              .filter((node) => node.id !== nodeId)
              .map((node) => ({ id: node.id, ...dimensionsOf(node) }))
          : [],
      };
    },
    [getNodes, nodeId],
  );

  const onResize = useCallback(
    (event, params) => {
      const snapshot = snapshotRef.current;
      if (!snapshot || snapshot.others.length === 0) return;

      const deltaWidth = params.width - snapshot.width;
      const deltaHeight = params.height - snapshot.height;
      if (!deltaWidth && !deltaHeight) return;

      setNodes((nodes) =>
        nodes.map((node) => {
          const other = snapshot.others.find((item) => item.id === node.id);
          if (!other) return node;
          const width = Math.max(
            MIN_NODE_WIDTH,
            Math.round(other.width + deltaWidth),
          );
          const height = Math.max(
            MIN_NODE_HEIGHT,
            Math.round(other.height + deltaHeight),
          );
          return {
            ...node,
            width,
            height,
            measured: { ...node.measured, width, height },
          };
        }),
      );
    },
    [setNodes],
  );

  const onResizeEnd = useCallback(() => {
    snapshotRef.current = null;
    // Sekali di akhir resize: refresh posisi/ukuran di panel Properties.
    useFlowStore.getState().bumpRevision();
  }, []);

  return { onResizeStart, onResize, onResizeEnd };
}

// ---------------------------------------------------------------------------
// UnitNode
// ---------------------------------------------------------------------------

// Handle tak terlihat yang menutupi badan node agar tarik edge body→body
// bisa dimulai dari mana saja di badan node. Sengaja HANYA source: kalau
// source + target overlay ditumpuk menutupi area yang sama, target (yang
// dirender belakangan) menutupi source sehingga drag tidak pernah mulai
// (handle target tidak bisa menginisiasi koneksi). Drop ke badan node tujuan
// ditangani via onConnectEnd (hit-test posisi) di FlowCanvas, jadi target
// overlay tidak diperlukan.
const CONNECT_OVERLAY_STYLE = {
  opacity: 0,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  minWidth: "100%",
  minHeight: "100%",
  transform: "none",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  zIndex: 0,
};

function UnitNodeComponent({ id, data, selected, width, height }) {
  const nodeWidth = width ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = height ?? DEFAULT_NODE_HEIGHT;
  const [hovered, setHovered] = useState(false);
  const { onResizeStart, onResize, onResizeEnd } = useMultiResize(id);
  const { connectMode } = useFlowContext();
  // Ghost outlet / inlet — selector per-node agar node lain tidak re-render.
  const connectGhost = useFlowStore((state) =>
    state.connectGhost && state.connectGhost.nodeId === id
      ? state.connectGhost
      : null,
  );
  const connectGhostInlet = useFlowStore((state) =>
    state.connectGhostInlet && state.connectGhostInlet.nodeId === id
      ? state.connectGhostInlet
      : null,
  );

  const ports = data.ports ?? [];
  // sidelocation 0 = bawah — dorong nama node agar tidak menutupi port/label port
  const bottomPorts = ports.filter((port) => port.sidelocation === 0);
  const hasTallBottom = bottomPorts.some(
    (port) => port.type === "virtual port" || port.type === "exposed port",
  );
  const labelTopOffset = hasTallBottom ? 28 : bottomPorts.length > 0 ? 22 : 5;

  return (
    <Box
      position="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: nodeWidth,
        height: nodeHeight,
        opacity: data.shown === "T" ? 1 : 0.35,
      }}
    >
      <UnitNodePreview
        image={data.image}
        label={data.label}
        style={data.style}
        width={nodeWidth}
        height={nodeHeight}
      />
      <NodeBorder
        height={nodeHeight}
        width={nodeWidth}
        isSelected={selected}
        styleBorderDotted={data.style?.visual === "fit"}
        isNotShownNode={data.shown === "F"}
      />
      {/* Overlay dirender SEBELUM port supaya port tetap bisa diklik/drag
          di mode edge (overlay di belakang, port di depan). */}
      {connectMode ? (
        <Handle
          id={CONNECT_OVERLAY_SOURCE_ID}
          type="source"
          position={Position.Right}
          className="react-flow__node-connect-overlay"
          style={CONNECT_OVERLAY_STYLE}
          isConnectable
        />
      ) : null}
      {ports.map((port) => (
        <FlowPort
          key={port.idpfport}
          nodeId={id}
          port={port}
          active={selected}
        />
      ))}
      {/* Ghost outlet (oranye) + inlet (hijau) — layer sama dengan port. */}
      {connectMode && connectGhost?.side != null ? (
        <GhostPortHandle
          side={connectGhost.side}
          position={connectGhost.position}
          kind="outlet"
        />
      ) : null}
      {connectMode && connectGhostInlet?.side != null ? (
        <GhostPortHandle
          side={connectGhostInlet.side}
          position={connectGhostInlet.position}
          kind="inlet"
        />
      ) : null}
      <UnitNodeLabel label={data.label} topOffset={labelTopOffset} />
      <NodeResizer
        nodeId={id}
        isVisible={selected || hovered}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color={RESIZE_COLOR}
        lineStyle={{ display: "none" }}
        handleStyle={{
          width: 9,
          height: 9,
          borderRadius: 3,
          border: "1.5px solid #ffffff",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.35)",
          zIndex: 30,
        }}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />
    </Box>
  );
}

export const UnitNode = memo(UnitNodeComponent);

// ---------------------------------------------------------------------------
// NodePropertiesDialog
// ---------------------------------------------------------------------------

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 112;

const VISUAL_OPTIONS = [
  { value: "fit", label: "Default" },
  { value: "stretch", label: "Stretch" },
  { value: "repeat", label: "Repeat" },
];

function ImagePicker({ value, onChange }) {
  const inCatalog = UNIT_CATALOG.some((unit) => unit.image === value);
  const options =
    value && !inCatalog
      ? [{ id: "__current", label: "Saat ini", image: value }, ...UNIT_CATALOG]
      : UNIT_CATALOG;

  return (
    <Box
      maxH="144px"
      overflowY="auto"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={2}
      bg="bg.subtle"
    >
      <SimpleGrid columns={4} gap={2}>
        {options.map((unit) => {
          const isActive = unit.image === value;
          return (
            <Box
              key={unit.id}
              as="button"
              type="button"
              title={unit.label}
              aria-pressed={isActive}
              onClick={() => onChange(unit.image)}
              borderWidth={isActive ? "2px" : "1px"}
              borderColor={isActive ? "blue.solid" : "border"}
              borderRadius="md"
              bg="bg.panel"
              p={1}
              cursor="pointer"
              _hover={{ borderColor: isActive ? "blue.solid" : "fg.subtle" }}
            >
              <Image
                src={unit.image}
                alt={unit.label}
                width="full"
                height="32px"
                objectFit="contain"
                draggable={false}
              />
              <Text
                fontSize="9px"
                lineHeight="short"
                color={isActive ? "blue.fg" : "fg.muted"}
                noOfLines={1}
              >
                {unit.label}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function NodePropertiesForm({ node, onCancel, onSave }) {
  const initialStyle = node.data.style ?? {};
  const [label, setLabel] = useState(node.data.label ?? "");
  const [image, setImage] = useState(node.data.image ?? "");
  const [visual, setVisual] = useState(initialStyle.visual ?? "fit");
  const [rotate, setRotate] = useState(initialStyle.rotate ?? 0);
  const [flipHorizontal, setFlipHorizontal] = useState(
    !!initialStyle.horizontalFlip,
  );
  const [flipVertical, setFlipVertical] = useState(
    !!initialStyle.verticalFlip,
  );
  const [shown, setShown] = useState(node.data.shown !== "F");

  const draftStyle = {
    visual,
    rotate,
    horizontalFlip: flipHorizontal,
    verticalFlip: flipVertical,
  };

  const handleSave = () => {
    onSave(node.id, {
      label,
      image,
      shown: shown ? "T" : "F",
      style: draftStyle,
    });
  };

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Properti node</Dialog.Title>
        <Dialog.Description>{node.id}</Dialog.Description>
      </Dialog.Header>

      <Dialog.Body
        minH="0"
        maxH="calc(100dvh - 190px)"
        overflowY="auto"
        py={4}
      >
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Nama node</Field.Label>
            <Input
              size="sm"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Gambar unit</Field.Label>
            <ImagePicker value={image} onChange={setImage} />
            <Field.HelperText>
              Sumber gambar sama dengan daftar unit di sidebar kiri.
            </Field.HelperText>
          </Field.Root>

          <SimpleGrid
            columns={{ base: 1, sm: 2 }}
            gap={4}
            alignItems="start"
          >
            <Field.Root>
              <Field.Label>Tampilan gambar</Field.Label>
              <SegmentGroup.Root
                size="sm"
                value={visual}
                onValueChange={(details) => {
                  if (details.value) setVisual(details.value);
                }}
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={VISUAL_OPTIONS} />
              </SegmentGroup.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Rotasi</Field.Label>
              <RangeControl
                min={0}
                max={360}
                step={15}
                value={rotate}
                onChange={setRotate}
                aria-label="Rotasi"
              />
              <Field.HelperText>
                <Text as="span" fontWeight="semibold" tabularNums>
                  {rotate}°
                </Text>{" "}
                (kelipatan 15°)
              </Field.HelperText>
            </Field.Root>
          </SimpleGrid>

          <Box
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.subtle"
            p={3}
          >
            <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
              <Checkbox.Root
                size="sm"
                checked={flipHorizontal}
                onCheckedChange={(details) =>
                  setFlipHorizontal(!!details.checked)
                }
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Flip horizontal</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root
                size="sm"
                checked={flipVertical}
                onCheckedChange={(details) => setFlipVertical(!!details.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Flip vertical</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root
                size="sm"
                checked={shown}
                onCheckedChange={(details) => setShown(!!details.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Tampilkan node</Checkbox.Label>
              </Checkbox.Root>
            </SimpleGrid>
          </Box>

          <Field.Root>
            <Field.Label>Pratinjau</Field.Label>
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
                width={`${PREVIEW_WIDTH}px`}
                height={`${PREVIEW_HEIGHT}px`}
              >
                <UnitNodePreview
                  image={image}
                  label={label}
                  style={draftStyle}
                  width={PREVIEW_WIDTH}
                  height={PREVIEW_HEIGHT}
                />
              </Box>
            </Flex>
          </Field.Root>
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

export function NodePropertiesDialog({ node, open, onOpenChange, onSave }) {
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
            {node ? (
              <NodePropertiesForm
                key={node.id}
                node={node}
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
