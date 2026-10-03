"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import {
  Box,
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
  Toaster,
  ToastCloseTrigger,
  ToastDescription,
  ToastIndicator,
  ToastRoot,
  ToastTitle,
} from "@chakra-ui/react";
import { appToaster } from "@/lib/toast";

const segoeFamily =
  '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: {
        fonts: {
          heading: { value: segoeFamily },
          body: { value: segoeFamily },
          mono: {
            value:
              '"Segoe UI", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
        },
      },
    },
  }),
);

function EmotionRegistry({ children }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "css" });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export default function Providers({ children }) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        {children}
        <Toaster toaster={appToaster}>
          {(toast) => (
            <ToastRoot>
              <ToastIndicator />
              <ToastCloseTrigger />
              <Box flex="1" minW="0" pe="4">
                <ToastTitle>{toast.title}</ToastTitle>
                {toast.description ? (
                  <ToastDescription>{toast.description}</ToastDescription>
                ) : null}
              </Box>
            </ToastRoot>
          )}
        </Toaster>
      </ChakraProvider>
    </EmotionRegistry>
  );
}