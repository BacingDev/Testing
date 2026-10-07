"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Box, Button, HStack, Text } from "@chakra-ui/react";
import { TbArrowLeft } from "react-icons/tb";
import { AppRenderer } from "@/features/app-renderer/renderer";
import { createAppDataSource } from "@/lib/app-data-source";
import { fetchPublished } from "@/lib/apps-api";

export default function PublishedAppPage({ params }) {
  const { slug, path } = use(params);
  const currentPath = `/${(path ?? []).join("/")}`;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublished(slug)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const dataSource = useMemo(
    () => (data?.id ? createAppDataSource(data.id) : null),
    [data],
  );

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Box as="main" width="100%" maxW="720px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        {loading ? (
          <Text fontSize="sm" color="fg.muted">
            Memuat app…
          </Text>
        ) : error || !data ? (
          <Box textAlign="center" py={10}>
            <Text fontWeight="bold">App tidak bisa dibuka</Text>
            <Text fontSize="sm" color="fg.muted" mt={2}>
              {error || "Data kosong."} Mungkin slug salah atau app belum dipublish.
            </Text>
            <Link href="/apps" style={{ textDecoration: "none" }}>
              <Button size="sm" variant="outline" mt={4}>
                <TbArrowLeft size={14} />
                Aplikasi saya
              </Button>
            </Link>
          </Box>
        ) : (
          <Box>
            <HStack gap={2} mb={4}>
              <Text fontSize="xs" color="fg.muted">
                {data.name}
              </Text>
              <Badge size="sm" variant="subtle" colorPalette="purple">
                v{data.version}
              </Badge>
            </HStack>
            <AppRenderer
              definition={data.definition}
              path={currentPath}
              basePath={`/app/${slug}`}
              dataSource={dataSource}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
