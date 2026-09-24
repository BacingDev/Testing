"use client";

/**
 * DOMAIN EDGE — satu file untuk semua yang berhubungan dengan edge:
 * - Geometri path (alignToPortEdge, getEdgeSmoothPath, applyCrossingHops)
 * - WaypointEdge (tipe edge "waypoint" untuk React Flow, panah tanpa border)
 * - EdgePropertiesDialog (dialog properti edge)
 */

import { memo, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Portal,
  SegmentGroup,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getSmoothStepPath,
  useEdges,
  useInternalNode,
  useStore,
  useStoreApi,
} from "@xyflow/react";
import { TbX } from "react-icons/tb";
import { RangeControl } from "@/components/ui/range-control";
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "@/components/flow/constants";

// ---------------------------------------------------------------------------
// Geometri path edge
// ---------------------------------------------------------------------------

/** Seberapa jauh sisi luar port dari pusat handle (arah keluar node). */
const PORT_REACH = {
  port: 5,
  "exposed port": 13,
  "virtual port": 13,
};

/** Vektor keluar node per posisi handle (React Flow). */
const OUTWARD_BY_POSITION = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
};

/**
 * Geser titik handle ke tepi luar port (arah keluar node) sehingga ujung edge
 * (termasuk panah markerEnd) berhenti sejajar dengan port biasa dan tidak
 * tersembunyi di belakang body port / handle.
 */
export function alignToPortEdge(point, node, handleId) {
  const dir = OUTWARD_BY_POSITION[point.position] ?? { x: 0, y: 0 };
  const port = node?.data?.ports?.find(
    (p) => String(p.idpfport) === String(handleId),
  );
  const reach = PORT_REACH[port?.type] ?? 5;
  return {
    x: point.x + dir.x * reach,
    y: point.y + dir.y * reach,
    position: point.position,
  };
}

/** Domain sidelocation → sisi node (0 bawah, 1 kanan, 2 atas, 3 kiri). */
function getHandlePose(node, handleId) {
  const w = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
  const h = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
  // Dukung user node maupun internal node (useInternalNode / nodeLookup)
  const absolute =
    node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;
  const x = absolute?.x ?? 0;
  const y = absolute?.y ?? 0;
  const port = node.data?.ports?.find(
    (p) => String(p.idpfport) === String(handleId),
  );
  const pct = (port?.position ?? 50) / 100;
  const side = port?.sidelocation ?? 1;

  if (side === 2) {
    return { x: x + w * pct, y, position: Position.Top };
  }
  if (side === 0) {
    return { x: x + w * pct, y: y + h, position: Position.Bottom };
  }
  if (side === 1) {
    return { x: x + w, y: y + h * pct, position: Position.Right };
  }
  return { x, y: y + h * pct, position: Position.Left };
}

const BASE_OFFSET = 28;
const BORDER_RADIUS = 14;

export function getWaypointOffset(edgeIndex) {
  return BASE_OFFSET + (edgeIndex > -1 ? (edgeIndex % 4) * 10 : 0);
}

export function getWaypointPath(source, target, pathOptions = {}) {
  return getSmoothStepPath({
    sourceX: source.x,
    sourceY: source.y,
    sourcePosition: source.position,
    targetX: target.x,
    targetY: target.y,
    targetPosition: target.position,
    borderRadius: pathOptions.borderRadius ?? BORDER_RADIUS,
    offset: pathOptions.offset ?? BASE_OFFSET,
  });
}

export function getEdgeSmoothPath(edge, nodeById, pathOptions = {}) {
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  const source = alignToPortEdge(
    getHandlePose(sourceNode, edge.sourceHandle),
    sourceNode,
    edge.sourceHandle,
  );
  const target = alignToPortEdge(
    getHandlePose(targetNode, edge.targetHandle),
    targetNode,
    edge.targetHandle,
  );

  const [path, labelX, labelY] = getWaypointPath(source, target, pathOptions);

  return { path, labelX, labelY };
}

function samplePath(d, step = 5) {
  if (typeof document === "undefined" || !d) return [];
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", d);
  const len = el.getTotalLength();
  if (!len) return [];
  const pts = [];
  for (let i = 0; i <= len; i += step) {
    const p = el.getPointAtLength(i);
    pts.push({ x: p.x, y: p.y, len: i });
  }
  const end = el.getPointAtLength(len);
  if (!pts.length || pts[pts.length - 1].len < len) {
    pts.push({ x: end.x, y: end.y, len });
  }
  return pts;
}

function segmentIntersection(a1, a2, b1, b2) {
  const den = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);
  if (Math.abs(den) < 1e-8) return null;
  const t =
    ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / den;
  const u =
    -((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / den;
  if (t <= 0.03 || t >= 0.97 || u <= 0.03 || u >= 0.97) return null;
  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
    len: a1.len + t * (a2.len - a1.len),
  };
}

function findCrossings(pathPts, otherPts) {
  const hits = [];
  for (let i = 0; i < pathPts.length - 1; i += 1) {
    for (let j = 0; j < otherPts.length - 1; j += 1) {
      const hit = segmentIntersection(
        pathPts[i],
        pathPts[i + 1],
        otherPts[j],
        otherPts[j + 1],
      );
      if (hit) hits.push(hit);
    }
  }
  return hits;
}

/**
 * Sisipkan lengkungan (hop) di titik persilangan dengan edge lain.
 * Path dasar tetap smooth-step; data points tidak dipakai.
 *
 * `spanRadius` mengatur seberapa jauh hop melebar di sepanjang path;
 * tinggi lengkungan selalu di-proporsikan lebih kecil (radius*0.6) agar
 * hop tidak terlihat terlalu besar/bulky.
 */
export function applyCrossingHops(pathD, otherPathDs, spanRadius = 6) {
  if (typeof document === "undefined" || !pathD || !otherPathDs?.length) {
    return pathD;
  }

  const radius = spanRadius;
  const hopHeight = radius * 0.6;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", pathD);
  const totalLen = el.getTotalLength();
  if (totalLen < radius * 4) return pathD;

  const selfPts = samplePath(pathD, 4);
  const crossings = [];
  for (const other of otherPathDs) {
    const otherPts = samplePath(other, 4);
    crossings.push(...findCrossings(selfPts, otherPts));
  }

  crossings.sort((a, b) => a.len - b.len);
  const unique = [];
  for (const c of crossings) {
    const prev = unique[unique.length - 1];
    if (!prev || Math.hypot(c.x - prev.x, c.y - prev.y) > radius * 2.2) {
      if (c.len > radius * 1.5 && c.len < totalLen - radius * 1.5) {
        unique.push(c);
      }
    }
  }
  if (!unique.length) return pathD;

  let d = "";
  let cursor = 0;
  const start = el.getPointAtLength(0);
  d = `M ${start.x} ${start.y}`;

  for (const cross of unique) {
    const lenBefore = Math.max(cursor, cross.len - radius);
    const lenAfter = Math.min(totalLen, cross.len + radius);
    if (lenAfter <= lenBefore) continue;

    // trace sisa path sampai sebelum hop (ikut kurva asli)
    for (let L = cursor + 4; L < lenBefore; L += 4) {
      const p = el.getPointAtLength(L);
      d += ` L ${p.x} ${p.y}`;
    }
    const before = el.getPointAtLength(lenBefore);
    const after = el.getPointAtLength(lenAfter);
    d += ` L ${before.x} ${before.y}`;

    const a = el.getPointAtLength(Math.max(0, cross.len - 1));
    const b = el.getPointAtLength(Math.min(totalLen, cross.len + 1));
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dl = Math.hypot(dx, dy) || 1;
    const nx = -dy / dl;
    const ny = dx / dl;
    const ctrl = {
      x: cross.x + nx * hopHeight,
      y: cross.y + ny * hopHeight,
    };
    d += ` Q ${ctrl.x} ${ctrl.y} ${after.x} ${after.y}`;
    cursor = lenAfter;
  }

  for (let L = cursor + 4; L < totalLen; L += 4) {
    const p = el.getPointAtLength(L);
    d += ` L ${p.x} ${p.y}`;
  }
  const end = el.getPointAtLength(totalLen);
  d += ` L ${end.x} ${end.y}`;
  return d;
}

// ---------------------------------------------------------------------------
// WaypointEdge
// ---------------------------------------------------------------------------

const HOP_RADIUS = 6;

function WaypointEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  data,
  markerEnd,
  style,
  selected,
}) {
  // Hanya subscribe 2 node ujung → edge lain tidak ikut render saat drag.
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const edges = useEdges();
  const store = useStoreApi();
  // Saat ada node di-drag/resize, hop persilangan di-skip supaya drag mulus.
  const interacting = useStore((state) =>
    state.nodes.some((node) => node.dragging || node.resizing),
  );

  const edgeIndex = edges.findIndex((edge) => edge.id === id);
  const offset = getWaypointOffset(edgeIndex);

  // Handle bounds bisa belum siap saat edge baru masuk → fallback pose
  // dari data port supaya path tetap finite (bukan "edge hilang" / NaN).
  const resolvePose = (x, y, position, node, handleId) => {
    const hasPort = node?.data?.ports?.some(
      (port) => String(port.idpfport) === String(handleId),
    );
    if (node && hasPort) return getHandlePose(node, handleId);
    if (Number.isFinite(x) && Number.isFinite(y) && position != null) {
      return { x, y, position };
    }
    if (!node) return null;
    return getHandlePose(node, handleId);
  };
  const sourcePose = resolvePose(
    sourceX,
    sourceY,
    sourcePosition,
    sourceNode,
    sourceHandleId,
  );
  const targetPose = resolvePose(
    targetX,
    targetY,
    targetPosition,
    targetNode,
    targetHandleId,
  );

  // Geser ujung edge ke tepi luar port supaya panah tidak tertutup handle
  const sourceAligned = sourcePose
    ? alignToPortEdge(sourcePose, sourceNode, sourceHandleId)
    : null;
  const targetAligned = targetPose
    ? alignToPortEdge(targetPose, targetNode, targetHandleId)
    : null;

  const [basePath, labelX, labelY] =
    sourceAligned && targetAligned
      ? getWaypointPath(sourceAligned, targetAligned, { offset })
      : ["", 0, 0];

  // Edge dengan id lebih besar mendapat lengkungan saat bertabrakan
  const otherPaths = useMemo(() => {
    if (interacting || !sourceNode || !targetNode) return [];
    const nodeLookup = store.getState().nodeLookup;
    return edges
      .filter((edge) => edge.id !== id && Number(edge.id) < Number(id))
      .map((edge) => getEdgeSmoothPath(edge, nodeLookup)?.path)
      .filter(Boolean);
  }, [edges, id, interacting, sourceNode, targetNode, store]);

  const path = useMemo(
    () =>
      interacting
        ? basePath
        : applyCrossingHops(basePath, otherPaths, HOP_RADIUS),
    [basePath, otherPaths, interacting],
  );

  if (!basePath) return null;

  // Seleksi cuma ganti warna garis → #2563eb (sama kayak port).
  // Panah dibiarkan default bawaan React Flow (tidak ikut warna select).
  // Ukuran garis dibuat tetap — tidak membesar saat selected.
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          ...style,
          stroke: selected ? "#2563eb" : style?.stroke,
          strokeWidth: style?.strokeWidth ?? 1,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      {data?.remark ? (
        <EdgeLabelRenderer>
          <Box
            className="nodrag nopan"
            position="absolute"
            rounded="full"
            borderWidth="1px"
            borderColor="border"
            bg="white"
            px={2}
            py={1}
            fontSize="xs"
            color="fg.muted"
            boxShadow="sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.remark}
          </Box>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const WaypointEdge = memo(WaypointEdgeComponent);

// ---------------------------------------------------------------------------
// EdgePropertiesDialog
// ---------------------------------------------------------------------------

const STROKE_OPTIONS = [
  { value: "black", label: "Hitam", swatch: "#111827" },
  { value: "#2563eb", label: "Biru", swatch: "#2563eb" },
  { value: "#16a34a", label: "Hijau", swatch: "#16a34a" },
  { value: "#dc2626", label: "Merah", swatch: "#dc2626" },
  { value: "#d97706", label: "Kuning", swatch: "#d97706" },
];

function colorItems() {
  return STROKE_OPTIONS.map((option) => ({
    value: option.value,
    label: (
      <HStack gap="1.5">
        <Box boxSize="10px" rounded="full" bg={option.swatch} />
      </HStack>
    ),
  }));
}

function EdgePropertiesForm({
  edge,
  from,
  to,
  waypointCount,
  onCancel,
  onSave,
}) {
  const initialStyle = edge.style ?? {};
  const [animated, setAnimated] = useState(!!edge.animated);
  const [strokeWidth, setStrokeWidth] = useState(
    Number(initialStyle.strokeWidth ?? 1),
  );
  const [stroke, setStroke] = useState(initialStyle.stroke ?? "black");
  const [remark, setRemark] = useState(edge.data?.remark ?? "");

  const handleSave = () => {
    onSave(edge.id, {
      animated,
      strokeWidth,
      stroke,
      remark: remark.trim() ? remark : null,
    });
  };

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Properti edge</Dialog.Title>
        <Dialog.Description noOfLines={1}>{edge.id}</Dialog.Description>
      </Dialog.Header>

      <Dialog.Body minH="0" maxH="calc(100dvh - 190px)" overflowY="auto" py={4}>
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Koneksi</Field.Label>
            <Box
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              bg="bg.subtle"
              px="3"
              py="2"
              fontSize="sm"
            >
              <Text color="fg.muted" fontSize="xs">
                Dari
              </Text>
              <Text fontWeight="medium" noOfLines={2}>
                {from}
              </Text>
              <Text color="fg.muted" fontSize="xs" mt="1">
                Ke
              </Text>
              <Text fontWeight="medium" noOfLines={2}>
                {to}
              </Text>
            </Box>
          </Field.Root>

          <Field.Root>
            <Field.Label>Warna garis</Field.Label>
            <SegmentGroup.Root
              size="sm"
              value={stroke}
              onValueChange={(details) => {
                if (details.value) setStroke(details.value);
              }}
            >
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={colorItems()} />
            </SegmentGroup.Root>
          </Field.Root>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} alignItems="start">
            <Field.Root>
              <Field.Label>Ketebalan garis</Field.Label>
              <RangeControl
                min={1}
                max={8}
                step={0.5}
                value={strokeWidth}
                onChange={setStrokeWidth}
                aria-label="Ketebalan garis"
              />
              <Field.HelperText>
                <Text as="span" fontWeight="semibold" tabularNums>
                  {strokeWidth}px
                </Text>
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Animasi garis</Field.Label>
              <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="lg"
                bg="bg.subtle"
                p={3}
              >
                <Checkbox.Root
                  size="sm"
                  checked={animated}
                  onCheckedChange={(details) => setAnimated(!!details.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>Garis bergerak</Checkbox.Label>
                </Checkbox.Root>
                <Text mt={2} fontSize="xs" color="fg.muted">
                  {waypointCount} titik waypoint pada edge ini.
                </Text>
              </Box>
            </Field.Root>
          </SimpleGrid>

          <Field.Root>
            <Field.Label>Catatan</Field.Label>
            <Input
              size="sm"
              placeholder="Opsional"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
            />
          </Field.Root>
        </Stack>
      </Dialog.Body>

      <Dialog.Footer bg="bg.panel" borderTopWidth="1px" borderColor="border">
        <Button
          variant="ghost"
          size="sm"
          colorPalette="gray"
          onClick={onCancel}
        >
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

export function EdgePropertiesDialog({
  edge,
  from,
  to,
  waypointCount,
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
      size="sm"
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
            {edge ? (
              <EdgePropertiesForm
                key={edge.id}
                edge={edge}
                from={from}
                to={to}
                waypointCount={waypointCount}
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
