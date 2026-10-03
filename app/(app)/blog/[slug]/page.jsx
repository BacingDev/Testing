import {
  Badge,
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import { blogPosts, getBlogPost } from "@/data/blog-posts";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Artikel tidak ditemukan — Blog" };
  return {
    title: `${post.title} — Blog`,
    description: post.excerpt,
  };
}

function BlogBlock({ block }) {
  if (block.type === "callout") {
    return (
      <Box
        borderLeftWidth="4px"
        borderLeftColor="blue.solid"
        borderRadius="lg"
        bg="blue.subtle"
        px={5}
        py={4}
      >
        <Text fontWeight="bold" color="blue.fg" mb={1}>
          {block.title}
        </Text>
        <Text fontSize="sm" lineHeight="1.7" color="fg.muted">
          {block.content}
        </Text>
      </Box>
    );
  }

  if (block.type === "paragraph") {
    return (
      <Text fontSize="md" lineHeight="1.85" color="fg.muted">
        {block.content}
      </Text>
    );
  }

  if (block.type === "list") {
    return (
      <Box as="ul" pl={5} display="grid" gap={3}>
        {block.items.map((item) => (
          <Text as="li" key={item} fontSize="md" lineHeight="1.75" color="fg.muted">
            {item}
          </Text>
        ))}
      </Box>
    );
  }

  if (block.type === "steps") {
    return (
      <Box as="ol" pl={5} display="grid" gap={3}>
        {block.items.map((item) => (
          <Text as="li" key={item} fontSize="md" lineHeight="1.75" color="fg.muted">
            {item}
          </Text>
        ))}
      </Box>
    );
  }

  if (block.type === "code") {
    return (
      <Box
        as="pre"
        overflowX="auto"
        bg="#111827"
        color="#e5edf8"
        borderRadius="lg"
        p={5}
        fontSize="sm"
        lineHeight="1.7"
        fontFamily="mono"
      >
        <Text as="code" fontFamily="inherit" fontSize="inherit">
          {block.content}
        </Text>
      </Box>
    );
  }

  if (block.type === "table") {
    return (
      <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="lg">
        <Box as="table" width="100%" borderCollapse="collapse" fontSize="sm">
          <Box as="thead" bg="bg.muted">
            <Box as="tr">
              {block.columns.map((column) => (
                <Box as="th" key={column} textAlign="left" p={3} fontWeight="semibold">
                  {column}
                </Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {block.rows.map((row) => (
              <Box as="tr" key={row.join("-")} borderTopWidth="1px" borderColor="border">
                {row.map((cell) => (
                  <Box as="td" key={cell} p={3} color="fg.muted" verticalAlign="top">
                    {cell}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
}

function NextReadingLink({ post, sectionIndex }) {
  const nextSection = post.sections[sectionIndex + 1];
  if (nextSection) {
    return (
      <Link href={`#${nextSection.id}`} style={{ textDecoration: "none" }}>
        <HStack
          mt={7}
          p={3}
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.panel"
          justify="space-between"
          gap={4}
          _hover={{ borderColor: "blue.300", bg: "blue.subtle" }}
        >
          <Box minW="0">
            <Text fontSize="xs" color="blue.fg" fontWeight="semibold">
              Bagian berikutnya
            </Text>
            <Text mt={1} fontSize="sm" fontWeight="semibold" noOfLines={1}>
              {nextSection.title}
            </Text>
          </Box>
          <Text fontSize="xl" color="blue.fg" aria-hidden="true">
            →
          </Text>
        </HStack>
      </Link>
    );
  }

  const currentIndex = blogPosts.findIndex((item) => item.slug === post.slug);
  const nextPost = blogPosts[currentIndex + 1];
  return (
    <Link
      href={nextPost ? `/blog/${nextPost.slug}` : "/blog"}
      style={{ textDecoration: "none" }}
    >
      <HStack
        mt={7}
        p={3}
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        bg="bg.panel"
        justify="space-between"
        gap={4}
        _hover={{ borderColor: "blue.300", bg: "blue.subtle" }}
      >
        <Box minW="0">
          <Text fontSize="xs" color="blue.fg" fontWeight="semibold">
            {nextPost ? "Artikel berikutnya" : "Navigasi"}
          </Text>
          <Text mt={1} fontSize="sm" fontWeight="semibold" noOfLines={1}>
            {nextPost?.title ?? "Kembali ke daftar artikel"}
          </Text>
        </Box>
        <Text fontSize="xl" color="blue.fg" aria-hidden="true">
          →
        </Text>
      </HStack>
    </Link>
  );
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug);

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box as="main" width="100%" maxW="1100px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 8, md: 12 }}>
        <Box display={{ base: "block", md: "none" }} mb={6}>
          <Link href="/blog" style={{ textDecoration: "none" }}>
            <HStack
              display="inline-flex"
              gap={2}
              px={3}
              py={2}
              rounded="md"
              color="blue.fg"
              bg="blue.subtle"
              fontSize="sm"
              fontWeight="semibold"
            >
              <Text aria-hidden="true">←</Text>
              <Text>Daftar artikel</Text>
            </HStack>
          </Link>
        </Box>

        <Box mt={8} maxW="820px">
          <HStack gap={3} flexWrap="wrap" mb={5}>
            <Badge colorPalette={post.colorPalette} variant="subtle">
              {post.category}
            </Badge>
            <Text fontSize="sm" color="fg.muted">
              {formatDate(post.publishedAt)}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {post.readTime} baca
            </Text>
          </HStack>
          <Text
            as="h1"
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1.1"
            fontWeight="bold"
            letterSpacing="tight"
          >
            {post.title}
          </Text>
          <Text mt={5} fontSize={{ base: "md", md: "lg" }} color="fg.muted" lineHeight="1.8">
            {post.excerpt}
          </Text>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns={{
            base: "minmax(0, 1fr)",
            md: "minmax(0, 1fr) 280px",
          }}
          gap={{ base: 10, md: 14 }}
          alignItems="start"
          mt={12}
        >
          <Box as="article" minW="0">
            {post.sections.map((section, sectionIndex) => (
              <Box as="section" key={section.id} id={section.id} mb={12} scrollMarginTop="96px">
                <Text as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb={5}>
                  {section.title}
                </Text>
                <Flex direction="column" gap={5}>
                  {section.blocks.map((block, index) => (
                    <BlogBlock key={`${section.id}-${index}`} block={block} />
                  ))}
                </Flex>
                <NextReadingLink post={post} sectionIndex={sectionIndex} />
              </Box>
            ))}

            {relatedPosts.length ? (
              <Box borderTopWidth="1px" borderColor="border" pt={7} mt={4}>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                Artikel terkait
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                {relatedPosts.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Box
                      borderWidth="1px"
                      borderColor="border"
                      borderRadius="lg"
                      bg="bg.panel"
                      p={4}
                      _hover={{ borderColor: `${item.colorPalette}.300`, boxShadow: "md" }}
                    >
                      <Badge colorPalette={item.colorPalette} variant="subtle" mb={2}>
                        {item.category}
                      </Badge>
                      <Text fontWeight="semibold" lineHeight="1.4">
                        {item.title}
                      </Text>
                    </Box>
                  </Link>
                ))}
                </SimpleGrid>
              </Box>
            ) : null}
          </Box>

          <Box
            display={{ base: "none", md: "block" }}
            position="sticky"
            top="24"
            maxH="calc(100dvh - 120px)"
            overflowY="auto"
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.panel"
            p={5}
          >
            <Link href="/blog" style={{ textDecoration: "none" }}>
              <HStack
                gap={2}
                px={3}
                py={2.5}
                rounded="md"
                color="blue.fg"
                bg="blue.subtle"
                _hover={{ bg: "bg.muted" }}
              >
                <Text aria-hidden="true">←</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  Daftar artikel
                </Text>
              </HStack>
            </Link>
            <Text
              mt={6}
              mb={4}
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="wide"
              color="fg.muted"
            >
              Isi artikel
            </Text>
            <Flex direction="column" gap={3}>
            {post.sections.map((section, sectionIndex) => (
                <Link key={section.id} href={`#${section.id}`} style={{ textDecoration: "none" }}>
                  <Text fontSize="sm" color="fg.muted" _hover={{ color: "blue.fg" }}>
                    {section.title}
                  </Text>
                </Link>
              ))}
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
