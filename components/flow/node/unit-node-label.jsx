"use client";

import { memo } from "react";
import { Box, Text } from "@chakra-ui/react";

export const UnitNodeLabel = memo(function UnitNodeLabel({ label, topOffset }) {
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
