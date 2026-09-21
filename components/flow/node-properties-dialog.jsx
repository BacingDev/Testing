"use client";

import { useState } from "react";
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
import { TbX } from "react-icons/tb";
import { RangeControl } from "@/components/ui/range-control";
import { UnitNodePreview } from "@/components/flow/node/unit-node-preview";
import { UNIT_CATALOG } from "@/data/unit-catalog";

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
      maxH="168px"
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

      <Dialog.Body>
        <Stack gap={5}>
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

          <HStack gap={6}>
            <Checkbox.Root
              size="sm"
              checked={flipHorizontal}
              onCheckedChange={(details) => setFlipHorizontal(!!details.checked)}
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
          </HStack>

          <Checkbox.Root
            size="sm"
            checked={shown}
            onCheckedChange={(details) => setShown(!!details.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Tampilkan node</Checkbox.Label>
          </Checkbox.Root>

          <Field.Root>
            <Field.Label>Pratinjau</Field.Label>
            <Flex
              justify="center"
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border"
              borderRadius="lg"
              p={4}
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

export function NodePropertiesDialog({ node, open, onOpenChange, onSave }) {
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
            {node ? (
              <NodePropertiesForm
                key={node.id}
                node={node}
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
