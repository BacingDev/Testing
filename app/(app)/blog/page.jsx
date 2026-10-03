import {
  Badge,
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { blogPosts } from "@/data/blog-posts";

export const metadata = {
  title: "Blog — Workflow Studio",
  description: "Catatan tentang workflow builder, app builder, dan database.",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export default function BlogPage() {
  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box as="main" width="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 10, md: 16 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "flex-end" }}
          justify="space-between"
          gap={6}
          mb={10}
        >
          <Box maxW="720px">
            <HStack gap={2} mb={4}>
              <Badge colorPalette="blue" variant="subtle">
                Workflow Notes
              </Badge>
              <Text fontSize="xs" color="fg.muted">
                {blogPosts.length} artikel
              </Text>
            </HStack>
            <Text
              as="h1"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.05"
              fontWeight="bold"
              letterSpacing="tight"
            >
              Blog
            </Text>
            <Text mt={4} color="fg.muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
              Konsep app builder, layout component, interaksi canvas, dan model database yang bisa dijadikan fondasi Workflow Studio.
            </Text>
          </Box>
          <Box
            px={4}
            py={3}
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.panel"
            minW={{ md: "260px" }}
          >
            <Text fontSize="xs" color="fg.muted">
              Fokus
            </Text>
            <Text mt={1} fontWeight="semibold">
              Canvas-first application builder
            </Text>
          </Box>
        </Flex>

        <SimpleGrid columns={1} maxW="820px" gap={5}>
          {blogPosts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                as="article"
                height="100%"
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                bg="bg.panel"
                p={5}
                transition="transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease"
                _hover={{
                  transform: "translateY(-4px)",
                  boxShadow: "xl",
                  borderColor: `${post.colorPalette}.300`,
                }}
              >
                <Flex align="center" justify="space-between" gap={3} mb={6}>
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="42px"
                    rounded="xl"
                    colorPalette={post.colorPalette}
                    bg={`${post.colorPalette}.subtle`}
                    fontWeight="bold"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Flex>
                  <Badge colorPalette={post.colorPalette} variant="subtle">
                    {post.category}
                  </Badge>
                </Flex>
                <Text as="h2" fontSize="xl" fontWeight="bold" lineHeight="1.35">
                  {post.title}
                </Text>
                <Text mt={3} color="fg.muted" fontSize="sm" lineHeight="1.7">
                  {post.excerpt}
                </Text>
                <HStack mt={6} gap={2} color="fg.muted" fontSize="xs">
                  <Text>{formatDate(post.publishedAt)}</Text>
                  <Text>•</Text>
                  <Text>{post.readTime}</Text>
                </HStack>
              </Box>
            </Link>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
