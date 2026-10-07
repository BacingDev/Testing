import {
  Badge,
  Box,
  Button,
  HStack,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { TbArrowRight } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import SavedCanvasList from "@/components/landing/saved-list";

export const metadata = {
  title: "Landing — Workflow Studio",
  description:
    "Daftar halaman landing yang dirender dari canvas tersimpan.",
};

const STEPS = [
  {
    no: "01",
    title: "Susun di editor",
    desc: "Drag Hero, Features, Pricing, dan section lain dari sidebar ke canvas, dari atas ke bawah.",
  },
  {
    no: "02",
    title: "Simpan ke server",
    desc: "Beri nama canvas lalu simpan. Isi tiap section tersimpan sebagai data di database.",
  },
  {
    no: "03",
    title: "Buka sebagai halaman",
    desc: "Pilih canvas di bawah — halamannya ke-render dari data tersimpan dan ikut update saat canvas disimpan ulang.",
  },
];

export default function LandingPage() {
  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />

      <Box
        as="main"
        width="100%"
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 8, md: 12 }}
        pb={{ base: 12, md: 20 }}
      >
        <HStack gap={2} mb={4}>
          <Badge colorPalette="orange" variant="subtle" size="sm">
            Halaman dari canvas
          </Badge>
        </HStack>
        <Text
          as="h1"
          fontSize={{ base: "3xl", md: "4xl" }}
          lineHeight="1.08"
          fontWeight="bold"
          letterSpacing="tight"
        >
          Landing yang hidup dari canvas
        </Text>
        <Text mt={3} color="fg.muted" fontSize={{ base: "md", md: "lg" }} maxW="680px" lineHeight="1.7">
          Setiap halaman di bawah dirender langsung dari data canvas yang
          tersimpan di server. Simpan ulang canvas-nya, halamannya ikut
          update — ada indikator kalau ada perubahan baru.
        </Text>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Button colorPalette="blue" size="md" mt={5}>
            Buka Editor <TbArrowRight size={16} />
          </Button>
        </Link>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} my={{ base: 8, md: 10 }}>
          {STEPS.map((s) => (
            <Box
              key={s.no}
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              bg="bg.panel"
              p={5}
            >
              <Text fontSize="sm" fontWeight="bold" color="orange.fg">
                {s.no}
              </Text>
              <Text mt={1} fontWeight="bold">
                {s.title}
              </Text>
              <Text mt={1} fontSize="sm" color="fg.muted" lineHeight="1.7">
                {s.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <Text as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb={4}>
          Pilih halaman
        </Text>
        <SavedCanvasList />
      </Box>
    </Box>
  );
}
