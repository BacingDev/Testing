"use client";

import { useState } from "react";
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
  Stack,
  Text,
} from "@chakra-ui/react";
import { TbX } from "react-icons/tb";
import { RangeControl } from "@/components/ui/range-control";

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

const PREVIEW_SIZE = 132;

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

function PortPreview({ type, direction, side, position, hasMetadata, name }) {
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

  const labelStyle = {
    ...(vertical ? { left: "50%", transform: "translateX(-50%)" } : { top: "50%", transform: "translateY(-50%)" }),
    ...(side === 0 ? { top: "16px" } : {}),
    ...(side === 1 ? { left: "16px" } : {}),
    ...(side === 2 ? { bottom: "16px" } : {}),
    ...(side === 3 ? { right: "16px" } : {}),
  };

  return (
    <Flex justify="center" bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="lg" p={6}>
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
              <circle cx="5" cy="5" r="4.5" fill={fill} stroke={stroke} strokeWidth="1" />
            ) : (
              <>
                {isExposed ? (
                  <polygon points="5,0.5 9.5,5 5,9.5 0.5,5" fill={fill} stroke={stroke} strokeWidth="1" />
                ) : null}
                {isVirtual ? (
                  <rect x="1" y="0.5" width="8" height="8" fill={fill} stroke={stroke} strokeWidth="1" />
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
          {name ? (
            <Box
              position="absolute"
              whiteSpace="nowrap"
              rounded="sm"
              bg="white/90"
              px={1}
              fontSize="9px"
              fontWeight="medium"
              lineHeight="none"
              color="gray.700"
              boxShadow="sm"
              style={labelStyle}
            >
              {name}
            </Box>
          ) : null}
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
        <Dialog.Description>
          {port.name || "Port"} · {port.idpfport} pada node {node.data.label ?? node.id}
        </Dialog.Description>
      </Dialog.Header>

      <Dialog.Body>
        <Stack gap={5}>
          <Field.Root>
            <Field.Label>Nama port</Field.Label>
            <Input
              size="sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field.Root>

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

          <Checkbox.Root
            size="sm"
            checked={hasMetadata}
            onCheckedChange={(details) => setHasMetadata(!!details.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Punya metadata</Checkbox.Label>
          </Checkbox.Root>

          <Field.Root>
            <Field.Label>Catatan</Field.Label>
            <Input
              size="sm"
              placeholder="Opsional"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Pratinjau</Field.Label>
            <PortPreview
              type={type}
              direction={direction}
              side={Number(side)}
              position={position}
              hasMetadata={hasMetadata}
              name={name}
            />
          </Field.Root>
        </Stack>
      </Dialog.Body>

      <Dialog.Footer>
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

export function PortPropertiesDialog({ node, port, open, onOpenChange, onSave }) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {node && port ? (
              <PortPropertiesForm
                key={`${node.id}:${port.idpfport}`}
                node={node}
                port={port}
                onCancel={() => onOpenChange(false)}
                onSave={onSave}
              />
            ) : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
