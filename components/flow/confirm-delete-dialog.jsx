"use client";

import { Box, Button, Dialog, HStack, Portal, Text } from "@chakra-ui/react";
import { TbTrash } from "react-icons/tb";

/**
 * Konfirmasi hapus generik untuk node, edge, dan port.
 *
 * `name` ditampilkan tebal, `description` menjelaskan dampak penghapusan.
 */
export function ConfirmDeleteDialog({
  open,
  title = "Hapus item?",
  name,
  description,
  onOpenChange,
  onConfirm,
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      role="alertdialog"
      placement="center"
      scrollBehavior="inside"
      size="xs"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
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
            <Dialog.Header pb={3}>
              <HStack align="flex-start" gap={3}>
                <Box
                  display="grid"
                  placeItems="center"
                  boxSize="36px"
                  flexShrink={0}
                  rounded="lg"
                  bg="red.solid"
                  color="white"
                >
                  <TbTrash size={18} />
                </Box>
                <Box minW="0">
                  <Dialog.Title>{title}</Dialog.Title>
                  {name ? (
                    <Dialog.Description noOfLines={2} mt={0.5}>
                      {name}
                    </Dialog.Description>
                  ) : null}
                </Box>
              </HStack>
            </Dialog.Header>
            <Dialog.Body py={3}>
              <Text fontSize="sm" color="fg.muted" lineHeight="short">
                {description}
              </Text>
            </Dialog.Body>
            <Dialog.Footer
              bg="bg.panel"
              borderTopWidth="1px"
              borderColor="border"
            >
              <Button
                minW="80px"
                variant="ghost"
                size="sm"
                colorPalette="gray"
                onClick={() => onOpenChange({ open: false })}
              >
                Batal
              </Button>
              <Button
                minW="88px"
                size="sm"
                colorPalette="red"
                gap={1.5}
                onClick={onConfirm}
              >
                <TbTrash size={15} />
                Hapus
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
