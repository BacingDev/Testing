"use client";

import { useEffect, useState } from "react";
import { Badge, HStack, Text } from "@chakra-ui/react";
import { TbPlugConnected, TbPlugConnectedX } from "react-icons/tb";
import { fetchBackendHealth } from "@/lib/backend-health";

const REFRESH_MS = 30000;

export default function BackendStatus() {
  const [state, setState] = useState({
    phase: "checking",
    version: null,
    gitSha: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const data = await fetchBackendHealth();
        if (!active) return;
        setState({
          phase: data.status === "healthy" ? "online" : "degraded",
          version: data.version ?? null,
          gitSha: data.git_sha ?? null,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState({
          phase: "offline",
          version: null,
          gitSha: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    run();
    const timer = setInterval(run, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const online = state.phase === "online";
  const colorPalette = online
    ? "green"
    : state.phase === "checking"
      ? "gray"
      : "red";
  const label = online
    ? "BE online"
    : state.phase === "checking"
      ? "BE cek…"
      : state.phase === "degraded"
        ? "BE degraded"
        : "BE offline";
  const title = [
    `GET ${process.env.NEXT_PUBLIC_BACKEND_HEALTH_PATH ?? "/api/backend/health"}`,
    state.version ? `version ${state.version}` : null,
    state.gitSha ? `sha ${state.gitSha.slice(0, 7)}` : null,
    state.error ? `error ${state.error}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <HStack
      gap={1.5}
      px={1.5}
      py={0.5}
      rounded="md"
      borderWidth="1px"
      borderColor="border"
      bg="bg.muted"
      title={title}
    >
      {online ? (
        <TbPlugConnected size={12} />
      ) : (
        <TbPlugConnectedX size={12} />
      )}
      <Badge size="sm" variant="subtle" colorPalette={colorPalette}>
        {label}
      </Badge>
      {online && state.version ? (
        <Text fontSize="xs" color="fg.muted" tabularNums>
          v{state.version}
        </Text>
      ) : null}
    </HStack>
  );
}