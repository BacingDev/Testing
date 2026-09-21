"use client";

import { Box } from "@chakra-ui/react";

/**
 * Kontrol slider berbasis <input type="range"> native.
 *
 * Dipakai menggantikan Slider Chakra/Ark yang drag-nya tidak jalan di dalam
 * Dialog. Input native pasti bisa di-drag, keyboard-accessible, dan tidak
 * menambah JS machine.
 */
export function RangeControl({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  "aria-label": ariaLabel,
}) {
  return (
    <Box
      as="input"
      type="range"
      width="full"
      height="5"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      cursor="pointer"
      style={{ accentColor: "#2563eb" }}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
