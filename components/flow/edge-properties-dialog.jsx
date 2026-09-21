"use client";

import { useState } from "react";
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
  Stack,
  Text,
} from "@chakra-ui/react";
import { TbX } from "react-icons/tb";
import { RangeControl } from "@/components/ui/range-control";

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
        <Text as="span">{option.label}</Text>
      </HStack>
    ),
  }));
}

function EdgePropertiesForm({ edge, from, to, waypointCount, onCancel, onSave }) {
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
        <Dialog.Description>{edge.id}</Dialog.Description>
      </Dialog.Header>

      <Dialog.Body>
        <Stack gap={5}>
          <Field.Root>
            <Field.Label>Koneksi</Field.Label>
            <Box
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              px="3"
              py="2"
              fontSize="sm"
            >
              <Text color="fg.muted" fontSize="xs">
                Dari
              </Text>
              <Text fontWeight="medium">{from}</Text>
              <Text color="fg.muted" fontSize="xs" mt="1">
                Ke
              </Text>
              <Text fontWeight="medium">{to}</Text>
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
              </Text>{" "}
              · {waypointCount} titik waypoint
            </Field.HelperText>
          </Field.Root>

          <Checkbox.Root
            size="sm"
            checked={animated}
            onCheckedChange={(details) => setAnimated(!!details.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Garis bergerak (animasi)</Checkbox.Label>
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
      size="md"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {edge ? (
              <EdgePropertiesForm
                key={edge.id}
                edge={edge}
                from={from}
                to={to}
                waypointCount={waypointCount}
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
