"use client";

import { use, useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import Navbar from "@/components/layout/navbar";
import Editor from "@/features/app-editor/Editor";
import { readLocalDraft, useAppEditorStore } from "@/features/app-editor/store";
import { fetchApp } from "@/lib/apps-api";
import { demoDefinition } from "@/app/(app)/renderer-demo/sample";

function blankDefinition(appId) {
  return {
    version: 1,
    name: appId === "demo" ? "toko-kopi" : `App ${appId}`,
    pages: [{ id: "p1", path: "/", title: "Home", components: [] }],
  };
}

export default function AppEditorPage({ params }) {
  const { appId } = use(params);
  const [status, setStatus] = useState("loading");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const store = useAppEditorStore.getState();
      if (appId === "demo") {
        const local = readLocalDraft("demo");
        store.load(local ?? demoDefinition, { appId: "demo", serverMode: false });
        if (active) {
          setStatus("ready");
          setNotice(local ? "Draft lokal dimuat." : "Contoh toko-kopi dimuat.");
        }
        return;
      }
      try {
        const app = await fetchApp(appId);
        if (!active) return;
        store.load(app.definition, { appId, serverMode: true });
        setStatus("ready");
        setNotice(`Terhubung ke server: ${app.name}.`);
      } catch (err) {
        const local = readLocalDraft(appId);
        if (!active) return;
        store.load(local ?? blankDefinition(appId), { appId, serverMode: false });
        setStatus("ready");
        setNotice(
          `Server tidak terjangkau (${err instanceof Error ? err.message : String(err)}). Mode lokal.`,
        );
      }
    })();
    return () => {
      active = false;
    };
  }, [appId]);

  return (
    <Box display="flex" flexDirection="column" height="100vh" overflow="hidden" bg="bg.subtle">
      <Navbar />
      {notice ? (
        <Box px={3} py={1.5} borderBottomWidth="1px" borderColor="border" bg="bg.panel">
          <Text fontSize="xs" color="fg.muted">
            /editor/{appId} · {notice}
          </Text>
        </Box>
      ) : null}
      <Box flex="1" minHeight="0" overflow="hidden">
        {status === "ready" ? (
          <Editor />
        ) : (
          <Box p={8}>
            <Text fontSize="sm" color="fg.muted">
              Memuat app…
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
