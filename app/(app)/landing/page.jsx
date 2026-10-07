import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import {
  TbArrowRight,
  TbBolt,
  TbBox,
  TbCheck,
  TbDragDrop,
  TbEye,
  TbHierarchy2,
  TbLayoutDashboard,
  TbQuote,
  TbRocket,
  TbStar,
} from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import SavedCanvasList from "@/components/landing/saved-list";

export const metadata = {
  title: "Landing — Workflow Studio",
  description:
    "Contoh format landing page: hero, fitur, cara kerja, testimoni, harga, dan CTA.",
};

const LOGOS = ["Nusantara Co", "Kirana", "BacingDev", "Sagara", "Lentera"];

const FEATURES = [
  {
    icon: TbDragDrop,
    palette: "blue",
    title: "Drag & drop canvas",
    desc: "Susun page, container, form, dan chart langsung di canvas tanpa tulis layout manual.",
  },
  {
    icon: TbHierarchy2,
    palette: "purple",
    title: "Node, edge & port",
    desc: "Relasi antar komponen divisualkan sebagai graph — jelas mana parent, mana koneksi data.",
  },
  {
    icon: TbEye,
    palette: "teal",
    title: "Preview runtime",
    desc: "Lihat hasil akhir read-only persis seperti user melihatnya, tanpa chrome editor.",
  },
  {
    icon: TbBox,
    palette: "orange",
    title: "Komponen siap pakai",
    desc: "Header, tabel, form, chart, button — tinggal drag dari sidebar kiri.",
  },
  {
    icon: TbBolt,
    palette: "yellow",
    title: "Autosave lokal",
    desc: "Perubahan tersimpan otomatis di browser, tombol Simpan untuk sinkron ke server.",
  },
  {
    icon: TbLayoutDashboard,
    palette: "green",
    title: "Multi canvas",
    desc: "Satu workspace, banyak canvas tersimpan. Klik nama canvas untuk langsung muat ke editor.",
  },
];

const STEPS = [
  {
    no: "01",
    title: "Drag komponen",
    desc: "Pilih Hero, Features, Pricing, atau Form dari sidebar lalu jatuhkan ke canvas.",
  },
  {
    no: "02",
    title: "Hubungkan alur",
    desc: "Tarik edge antar node, atur port biasa / virtual / exposed sesuai kebutuhan data.",
  },
  {
    no: "03",
    title: "Preview & publish",
    desc: "Buka preview read-only, cek tampilan, lalu simpan dan ekspor.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Bikin struktur landing page jadi kelihatan. Tiap section itu node, jadi gampang diskusi dengan tim.",
    name: "Anisa P.",
    role: "Product Designer",
  },
  {
    quote:
      "Preview read-only-nya ngebantu banget — stakeholder lihat hasil akhir, bukan editor yang rame.",
    name: "Bagas R.",
    role: "Frontend Dev",
  },
  {
    quote:
      "Awalnya coba-coba, sekarang semua page baru selalu dimulai dari canvas dulu.",
    name: "Citra M.",
    role: "Founder",
  },
];

const PRICING = [
  {
    name: "Hobi",
    price: "Rp0",
    period: "/ selamanya",
    palette: "gray",
    cta: "Mulai gratis",
    features: ["3 canvas", "Komponen dasar", "Preview read-only", "Autosave lokal"],
  },
  {
    name: "Pro",
    price: "Rp99rb",
    period: "/ bulan",
    palette: "blue",
    cta: "Pilih Pro",
    highlight: true,
    features: [
      "Canvas tanpa batas",
      "Semua komponen landing",
      "Simpan ke server",
      "Ekspor production",
      "Prioritas support",
    ],
  },
  {
    name: "Tim",
    price: "Rp249rb",
    period: "/ bulan",
    palette: "purple",
    cta: "Hubungi kami",
    features: ["Semua di Pro", "Workspace tim", "Role & review", "SSO (segera)"],
  },
];

function SectionBadge({ children }) {
  return (
    <Badge colorPalette="blue" variant="subtle" size="sm">
      {children}
    </Badge>
  );
}

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
        pb={{ base: 12, md: 20 }}
      >
        {/* ── HERO ─────────────────────────────────────────── */}
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="center"
          gap={{ base: 8, lg: 12 }}
          py={{ base: 10, md: 16 }}
        >
          <Box flex="1" maxW="600px">
            <HStack gap={2} mb={4} flexWrap="wrap">
              <SectionBadge>Format 01 — Landing Page</SectionBadge>
              <Badge colorPalette="green" variant="subtle" size="sm">
                <TbRocket size={12} /> Baru
              </Badge>
            </HStack>
            <Text
              as="h1"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.08"
              fontWeight="bold"
              letterSpacing="tight"
            >
              Susun landing page di canvas, preview dalam 1 klik.
            </Text>
            <Text mt={4} color="fg.muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
              Contoh format landing page Workflow Studio: tiap section (hero,
              fitur, harga) adalah komponen sidebar yang bisa di-drag ke
              canvas. Halaman ini sendiri contoh hasil akhirnya.
            </Text>
            <HStack mt={6} gap={3} flexWrap="wrap">
              <Link href="/" style={{ textDecoration: "none" }}>
                <Button colorPalette="blue" size="md">
                  Buka Editor <TbArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/canvases" style={{ textDecoration: "none" }}>
                <Button variant="outline" size="md">
                  Lihat Canvas
                </Button>
              </Link>
            </HStack>
            <HStack mt={6} gap={5} color="fg.muted" fontSize="sm" flexWrap="wrap">
              <HStack gap={1.5}>
                <TbCheck size={15} /> Tanpa coding
              </HStack>
              <HStack gap={1.5}>
                <TbCheck size={15} /> Preview read-only
              </HStack>
              <HStack gap={1.5}>
                <TbStar size={15} /> 8 section siap drag
              </HStack>
            </HStack>
          </Box>

          {/* mock visual ala canvas */}
          <Box
            flex="1"
            w="full"
            maxW="520px"
            borderWidth="1px"
            borderColor="border"
            borderRadius="2xl"
            bg="bg.panel"
            p={4}
            boxShadow="lg"
          >
            <HStack gap={1.5} mb={3} px={1}>
              <Box boxSize="2.5" rounded="full" bg="red.solid" />
              <Box boxSize="2.5" rounded="full" bg="yellow.solid" />
              <Box boxSize="2.5" rounded="full" bg="green.solid" />
              <Text ml={2} fontSize="xs" color="fg.muted">
                canvas / landing-01 — preview
              </Text>
            </HStack>
            <Box borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
              <Box bg="blue.subtle" px={4} py={3}>
                <Text fontSize="xs" fontWeight="bold" color="blue.fg">
                  HERO — headline + 2 CTA
                </Text>
              </Box>
              <SimpleGrid columns={3} gap={2} p={3}>
                {["Features", "Pricing", "Testimoni"].map((label) => (
                  <Box
                    key={label}
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="border"
                    borderRadius="lg"
                    py={5}
                    textAlign="center"
                  >
                    <Text fontSize="xs" color="fg.muted">
                      {label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              <Box bg="bg.muted" px={4} py={3}>
                <Text fontSize="xs" fontWeight="bold">
                  CTA + FOOTER
                </Text>
              </Box>
            </Box>
            <HStack mt={3} justify="space-between" px={1}>
              <Text fontSize="xs" color="fg.muted">
                8 node • 6 edge • autosave on
              </Text>
              <Badge colorPalette="green" variant="subtle" size="sm">
                tersimpan
              </Badge>
            </HStack>
          </Box>
        </Flex>

        {/* ── DARI CANVAS TERSIMPAN ─────────────────────────── */}
        <Box mb={{ base: 10, md: 16 }}>
          <SectionBadge>Dari canvas tersimpan</SectionBadge>
          <Text as="h2" mt={3} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Halaman hasil editanmu
          </Text>
          <Text mt={2} color="fg.muted" maxW="640px" mb={5}>
            Susun section di editor, simpan ke server, lalu buka sebagai
            halaman. Urutan section mengikuti posisi atas-bawah node di canvas.
          </Text>
          <SavedCanvasList />
        </Box>

        {/* ── LOGO STRIP ───────────────────────────────────── */}
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          bg="bg.panel"
          px={6}
          py={5}
          mb={{ base: 10, md: 16 }}
        >
          <Text fontSize="xs" color="fg.muted" textAlign="center" mb={3}>
            DIPERCAYA TIM YANG MEMBANGUN DENGAN CANVAS
          </Text>
          <Flex justify="center" gap={{ base: 4, md: 8 }} flexWrap="wrap">
            {LOGOS.map((logo) => (
              <Text key={logo} fontSize="sm" fontWeight="bold" color="fg.muted">
                {logo}
              </Text>
            ))}
          </Flex>
        </Box>

        {/* ── FITUR ────────────────────────────────────────── */}
        <Box mb={{ base: 10, md: 16 }}>
          <SectionBadge>Fitur</SectionBadge>
          <Text as="h2" mt={3} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Semua yang perlu untuk page builder
          </Text>
          <Text mt={2} color="fg.muted" maxW="640px">
            Enam kemampuan inti — masing-masing tersedia sebagai komponen di
            sidebar kiri editor.
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4} mt={6}>
            {FEATURES.map((f) => (
              <Box
                key={f.title}
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                bg="bg.panel"
                p={5}
                _hover={{ boxShadow: "md", borderColor: `${f.palette}.300` }}
                transition="box-shadow 160ms ease"
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="10"
                  rounded="lg"
                  bg={`${f.palette}.subtle`}
                  color={`${f.palette}.fg`}
                  mb={4}
                >
                  <f.icon size={20} />
                </Flex>
                <Text fontWeight="bold">{f.title}</Text>
                <Text mt={1.5} fontSize="sm" color="fg.muted" lineHeight="1.7">
                  {f.desc}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* ── CARA KERJA ───────────────────────────────────── */}
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="2xl"
          bg="bg.panel"
          p={{ base: 5, md: 8 }}
          mb={{ base: 10, md: 16 }}
        >
          <SectionBadge>Cara kerja</SectionBadge>
          <Text as="h2" mt={3} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Dari kanvas kosong ke landing live
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mt={6}>
            {STEPS.map((s) => (
              <Box key={s.no}>
                <Text fontSize="sm" fontWeight="bold" color="blue.fg">
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
        </Box>

        {/* ── TESTIMONI ────────────────────────────────────── */}
        <Box mb={{ base: 10, md: 16 }}>
          <SectionBadge>Testimoni</SectionBadge>
          <Text as="h2" mt={3} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Kata mereka yang sudah coba
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={6}>
            {TESTIMONIALS.map((t) => (
              <Box
                key={t.name}
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                bg="bg.panel"
                p={5}
              >
                <TbQuote size={22} color="var(--chakra-colors-fg-muted)" />
                <Text mt={3} fontSize="sm" lineHeight="1.7">
                  “{t.quote}”
                </Text>
                <Text mt={4} fontSize="sm" fontWeight="bold">
                  {t.name}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {t.role}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* ── HARGA ────────────────────────────────────────── */}
        <Box mb={{ base: 10, md: 16 }}>
          <SectionBadge>Harga</SectionBadge>
          <Text as="h2" mt={3} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Mulai gratis, naik saat siap
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={6}>
            {PRICING.map((p) => (
              <Box
                key={p.name}
                borderWidth={p.highlight ? "2px" : "1px"}
                borderColor={p.highlight ? "blue.solid" : "border"}
                borderRadius="xl"
                bg="bg.panel"
                p={6}
                position="relative"
              >
                {p.highlight ? (
                  <Badge
                    colorPalette="blue"
                    variant="solid"
                    position="absolute"
                    top="-3"
                    left="6"
                    size="sm"
                  >
                    Populer
                  </Badge>
                ) : null}
                <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                  {p.name}
                </Text>
                <HStack align="baseline" gap={1} mt={2}>
                  <Text fontSize="3xl" fontWeight="bold">
                    {p.price}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {p.period}
                  </Text>
                </HStack>
                <Flex direction="column" gap={2} mt={4} mb={5}>
                  {p.features.map((feat) => (
                    <HStack key={feat} gap={2} fontSize="sm">
                      <TbCheck size={15} />
                      <Text>{feat}</Text>
                    </HStack>
                  ))}
                </Flex>
                <Button
                  width="full"
                  colorPalette={p.highlight ? "blue" : "gray"}
                  variant={p.highlight ? "solid" : "outline"}
                >
                  {p.cta}
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* ── CTA ──────────────────────────────────────────── */}
        <Box
          borderRadius="2xl"
          bg="blue.solid"
          color="white"
          px={{ base: 6, md: 12 }}
          py={{ base: 8, md: 12 }}
          textAlign="center"
          mb={{ base: 10, md: 16 }}
        >
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            Siap susun landing pertamamu?
          </Text>
          <Text mt={2} opacity="0.85">
            Buka editor, drag section Hero ke canvas, tekan preview.
          </Text>
          <HStack mt={6} justify="center" gap={3} flexWrap="wrap">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button bg="white" color="blue.fg" size="md" _hover={{ bg: "gray.100" }}>
                Mulai di Editor <TbArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/blog" style={{ textDecoration: "none" }}>
              <Button variant="outline" color="white" borderColor="whiteAlpha.400" size="md">
                Baca Blog dulu
              </Button>
            </Link>
          </HStack>
        </Box>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap={4}
          pt={6}
          borderTopWidth="1px"
          borderColor="border"
          color="fg.muted"
          fontSize="sm"
        >
          <HStack gap={2}>
            <TbHierarchy2 size={15} />
            <Text fontWeight="bold" color="fg">
              Workflow Studio
            </Text>
          </HStack>
          <HStack gap={4} flexWrap="wrap">
            <Link href="/" style={{ textDecoration: "none" }}>
              Editor
            </Link>
            <Link href="/blog" style={{ textDecoration: "none" }}>
              Blog
            </Link>
            <Link href="/list" style={{ textDecoration: "none" }}>
              List
            </Link>
            <Link href="/canvases" style={{ textDecoration: "none" }}>
              Canvas
            </Link>
          </HStack>
          <Text>© 2026 — contoh format 01</Text>
        </Flex>
      </Box>
    </Box>
  );
}
