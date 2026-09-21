"use client";

import { memo, useCallback, useState } from "react";
import { Box } from "@chakra-ui/react";
import { DEFAULT_NODE_IMAGE } from "@/data/dummy-flow";

/** Rasio intrinsik default semua gambar unit (viewBox 160×100). */
const FALLBACK_IMAGE = { width: 160, height: 100 };

function drawnSize(containerWidth, containerHeight, imageWidth, imageHeight, visual) {
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
