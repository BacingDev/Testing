"use client";

import { createToaster } from "@chakra-ui/react";

export const appToaster = createToaster({
  placement: "top-end",
  duration: 4000,
  max: 3,
  offsets: "1rem",
});

/** Tampilkan toast. type: "info" | "success" | "warning" | "error". */
export function notify({ title, description, type = "info", duration }) {
  appToaster.create({ title, description, type, duration });
}
