"use client";

import { Button, Dialog, Portal, Text } from "@chakra-ui/react";

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
      size="sm"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm" color="fg.muted">
                {name ? (
                  <>
                    <Text as="span" fontWeight="semibold" color="fg">
                      {name}
                    </Text>{" "}
                  </>
                ) : null}
                {description}
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="ghost"
                size="sm"
                colorPalette="gray"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button size="sm" colorPalette="red" onClick={onConfirm}>
                Hapus
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
