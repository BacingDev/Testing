"use client";

/**
 * SECTION RENDERER — tiap unit landing dirender sebagai section full-page.
 *
 * Sumber data: `node.data.widget` dari graph canvas (kolom JSONB di BE).
 * Semua field dibaca defensif: kalau widget kosong / format salah, pakai
 * default WIDGET_DEFAULTS supaya halaman tetap ke-render, bukan blank.
 */

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { TbArrowRight, TbCheck, TbQuote } from "react-icons/tb";
import { WIDGET_DEFAULTS } from "@/components/flow/widget-preview";

function widgetOf(widget, unitId) {
  return { ...(WIDGET_DEFAULTS[unitId] ?? {}), ...(widget ?? {}) };
}

function lines(text) {
  return String(text ?? "")
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
}

function csv(text) {
  return String(text ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function pipes(line, count) {
  const parts = String(line ?? "")
    .split("|")
    .map((part) => part.trim());
  while (parts.length < count) parts.push("");
  return parts;
}

function Container({ children }) {
  return (
    <Box width="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
      {children}
    </Box>
  );
}

const PALETTES = ["blue", "purple", "teal", "orange", "green", "yellow"];

export function HeroSection({ widget }) {
  const w = widgetOf(widget, "hero");
  const checks = ["Tanpa coding", "Preview read-only", "Tersimpan di DB"];
  return (
    <Box py={{ base: 10, md: 16 }}>
      <Container>
        <Box maxW="720px" mx="auto" textAlign="center">
          {w.eyebrow ? (
            <Badge colorPalette="blue" variant="subtle" size="sm" mb={4}>
              {w.eyebrow}
            </Badge>
          ) : null}
          <Text
            as="h1"
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1.08"
            fontWeight="bold"
            letterSpacing="tight"
          >
            {w.title || "Judul hero"}
          </Text>
          {w.subtitle ? (
            <Text mt={4} color="fg.muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
              {w.subtitle}
            </Text>
          ) : null}
          <HStack mt={6} gap={3} justify="center" flexWrap="wrap">
            {w.ctaPrimary ? (
              <Button colorPalette="blue" size="md">
                {w.ctaPrimary} <TbArrowRight size={16} />
              </Button>
            ) : null}
            {w.ctaSecondary ? (
              <Button variant="outline" size="md">
                {w.ctaSecondary}
              </Button>
            ) : null}
          </HStack>
          <HStack mt={6} gap={5} justify="center" color="fg.muted" fontSize="sm" flexWrap="wrap">
            {checks.map((check) => (
              <HStack key={check} gap={1.5}>
                <TbCheck size={15} /> {check}
              </HStack>
            ))}
          </HStack>
        </Box>
      </Container>
    </Box>
  );
}

export function LogoStripSection({ widget }) {
  const w = widgetOf(widget, "logo-strip");
  const logos = csv(w.logos);
  if (logos.length === 0) return null;
  return (
    <Box pb={{ base: 6, md: 10 }}>
      <Container>
        <Box borderWidth="1px" borderColor="border" borderRadius="xl" bg="bg.panel" px={6} py={5}>
          {w.title ? (
            <Text fontSize="xs" color="fg.muted" textAlign="center" mb={3}>
              {w.title}
            </Text>
          ) : null}
          <Flex justify="center" gap={{ base: 4, md: 8 }} flexWrap="wrap">
            {logos.map((logo) => (
              <Text key={logo} fontSize="sm" fontWeight="bold" color="fg.muted">
                {logo}
              </Text>
            ))}
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}

export function FeaturesSection({ widget }) {
  const w = widgetOf(widget, "features-grid");
  const items = lines(w.items).map((line) => {
    const [title, desc] = pipes(line, 2);
    return { title: title || line, desc };
  });
  if (items.length === 0) return null;
  return (
    <Box py={{ base: 6, md: 10 }}>
      <Container>
        {w.title ? (
          <Text as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" textAlign="center">
            {w.title}
          </Text>
        ) : null}
        {w.subtitle ? (
          <Text mt={2} color="fg.muted" textAlign="center">
            {w.subtitle}
          </Text>
        ) : null}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4} mt={6}>
          {items.map((item, i) => (
            <Box
              key={`${item.title}-${i}`}
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              bg="bg.panel"
              p={5}
            >
              <Badge colorPalette={PALETTES[i % PALETTES.length]} variant="subtle" size="sm" mb={3}>
                {String(i + 1).padStart(2, "0")}
              </Badge>
              <Text fontWeight="bold">{item.title}</Text>
              {item.desc ? (
                <Text mt={1.5} fontSize="sm" color="fg.muted" lineHeight="1.7">
                  {item.desc}
                </Text>
              ) : null}
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export function StepsSection({ widget }) {
  const w = widgetOf(widget, "how-it-works");
  const steps = lines(w.steps).map((line) => {
    const [title, desc] = pipes(line, 2);
    return { title: title || line, desc };
  });
  if (steps.length === 0) return null;
  return (
    <Box py={{ base: 6, md: 10 }}>
      <Container>
        <Box borderWidth="1px" borderColor="border" borderRadius="2xl" bg="bg.panel" p={{ base: 5, md: 8 }}>
          {w.title ? (
            <Text as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" textAlign="center">
              {w.title}
            </Text>
          ) : null}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mt={6}>
            {steps.map((step, i) => (
              <Box key={`${step.title}-${i}`}>
                <Text fontSize="sm" fontWeight="bold" color="blue.fg">
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <Text mt={1} fontWeight="bold">
                  {step.title}
                </Text>
                {step.desc ? (
                  <Text mt={1} fontSize="sm" color="fg.muted" lineHeight="1.7">
                    {step.desc}
                  </Text>
                ) : null}
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
}

export function TestimonialsSection({ widget }) {
  const w = widgetOf(widget, "testimonial");
  const quotes = lines(w.quotes).map((line) => {
    const [quote, name, role] = pipes(line, 3);
    return { quote, name: name || "Anonim", role };
  });
  if (quotes.length === 0) return null;
  return (
    <Box py={{ base: 6, md: 10 }}>
      <Container>
        {w.title ? (
          <Text as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" textAlign="center">
            {w.title}
          </Text>
        ) : null}
        <SimpleGrid columns={{ base: 1, md: quotes.length >= 3 ? 3 : quotes.length }} gap={4} mt={6}>
          {quotes.map((t, i) => (
            <Box
              key={`${t.name}-${i}`}
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              bg="bg.panel"
              p={5}
            >
              <TbQuote size={22} />
              <Text mt={3} fontSize="sm" lineHeight="1.7">
                “{t.quote}”
              </Text>
              <Text mt={4} fontSize="sm" fontWeight="bold">
                {t.name}
              </Text>
              {t.role ? (
                <Text fontSize="xs" color="fg.muted">
                  {t.role}
                </Text>
              ) : null}
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export function PricingSection({ widget }) {
  const w = widgetOf(widget, "pricing");
  const plans = lines(w.plans).map((line) => {
    let highlight = false;
    let rest = line.trim();
    if (rest.startsWith("*")) {
      highlight = true;
      rest = rest.slice(1).trim();
    }
    const [name, price, period, featuresRaw] = pipes(rest, 4);
    return {
      name: name || "Paket",
      price: price || "-",
      period,
      features: String(featuresRaw ?? "")
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean),
      highlight,
    };
  });
  if (plans.length === 0) return null;
  return (
    <Box py={{ base: 6, md: 10 }}>
      <Container>
        {w.title ? (
          <Text as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" textAlign="center">
            {w.title}
          </Text>
        ) : null}
        {w.subtitle ? (
          <Text mt={2} color="fg.muted" textAlign="center">
            {w.subtitle}
          </Text>
        ) : null}
        <SimpleGrid columns={{ base: 1, md: plans.length >= 3 ? 3 : plans.length }} gap={4} mt={6}>
          {plans.map((plan) => (
            <Box
              key={plan.name}
              borderWidth={plan.highlight ? "2px" : "1px"}
              borderColor={plan.highlight ? "blue.solid" : "border"}
              borderRadius="xl"
              bg="bg.panel"
              p={6}
              position="relative"
            >
              {plan.highlight ? (
                <Badge colorPalette="blue" variant="solid" position="absolute" top="-3" left="6" size="sm">
                  Populer
                </Badge>
              ) : null}
              <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                {plan.name}
              </Text>
              <HStack align="baseline" gap={1} mt={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {plan.price}
                </Text>
                {plan.period ? (
                  <Text fontSize="xs" color="fg.muted">
                    {plan.period}
                  </Text>
                ) : null}
              </HStack>
              <Flex direction="column" gap={2} mt={4} mb={5}>
                {plan.features.map((feat) => (
                  <HStack key={feat} gap={2} fontSize="sm">
                    <TbCheck size={15} />
                    <Text>{feat}</Text>
                  </HStack>
                ))}
              </Flex>
              <Button
                width="full"
                colorPalette={plan.highlight ? "blue" : "gray"}
                variant={plan.highlight ? "solid" : "outline"}
              >
                Pilih {plan.name}
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export function CtaSection({ widget }) {
  const w = widgetOf(widget, "cta-banner");
  return (
    <Box py={{ base: 6, md: 10 }}>
      <Container>
        <Box
          borderRadius="2xl"
          bg="blue.solid"
          color="white"
          px={{ base: 6, md: 12 }}
          py={{ base: 8, md: 12 }}
          textAlign="center"
        >
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            {w.title || "Siap mulai?"}
          </Text>
          {w.subtitle ? (
            <Text mt={2} opacity="0.85">
              {w.subtitle}
            </Text>
          ) : null}
          <HStack mt={6} justify="center" gap={3} flexWrap="wrap">
            {w.ctaPrimary ? (
              <Button bg="white" color="blue.fg" size="md" _hover={{ bg: "gray.100" }}>
                {w.ctaPrimary} <TbArrowRight size={16} />
              </Button>
            ) : null}
            {w.ctaSecondary ? (
              <Button variant="outline" color="white" borderColor="whiteAlpha.400" size="md">
                {w.ctaSecondary}
              </Button>
            ) : null}
          </HStack>
        </Box>
      </Container>
    </Box>
  );
}

export function PageFooterSection({ widget }) {
  const w = widgetOf(widget, "footer");
  const links = csv(w.links);
  return (
    <Box pb={8} pt={4}>
      <Container>
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
          <Text fontWeight="bold" color="fg">
            {w.brand || "Workflow Studio"}
          </Text>
          <HStack gap={4} flexWrap="wrap">
            {links.map((link) => (
              <Text key={link}>{link}</Text>
            ))}
          </HStack>
          <Text>{w.copyright || ""}</Text>
        </Flex>
      </Container>
    </Box>
  );
}

export function StatsSection({ widget }) {
  const w = widgetOf(widget, "stats");
  const items = lines(w.items).map((line) => {
    const [value, label] = pipes(line, 2);
    return { value: value || "-", label };
  });
  if (items.length === 0) return null;
  return (
    <Box py={{ base: 6, md: 10 }}>
      <Container>
        {w.title ? (
          <Text as="h2" fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" textAlign="center">
            {w.title}
          </Text>
        ) : null}
        <Flex justify="center" gap={{ base: 6, md: 12 }} mt={5} flexWrap="wrap">
          {items.map((item, i) => (
            <Box key={`${item.label}-${i}`} textAlign="center">
              <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold" color="blue.fg">
                {item.value}
              </Text>
              {item.label ? (
                <Text fontSize="sm" color="fg.muted">
                  {item.label}
                </Text>
              ) : null}
            </Box>
          ))}
        </Flex>
      </Container>
    </Box>
  );
}

// --- unit dasar: tetap ke-render supaya canvas campuran tidak bolong ---

function GenericSection({ title, children }) {
  return (
    <Box py={4}>
      <Container>
        <Box borderWidth="1px" borderColor="border" borderRadius="xl" bg="bg.panel" p={5}>
          {title ? (
            <Text fontSize="sm" fontWeight="bold" mb={3}>
              {title}
            </Text>
          ) : null}
          {children}
        </Box>
      </Container>
    </Box>
  );
}

export function GenericUnitSection({ unitId, widget, label, image }) {
  const w = widget ?? {};
  switch (unitId) {
    case "header":
      return (
        <Box bg="blue.solid" py={4}>
          <Container>
            <Text fontSize="xl" fontWeight="bold" color="white">
              {w.text || label || "Header"}
            </Text>
            {w.subtitle ? (
              <Text fontSize="sm" color="whiteAlpha.800">
                {w.subtitle}
              </Text>
            ) : null}
          </Container>
        </Box>
      );
    case "text":
      return (
        <Box py={4}>
          <Container>
            <Text
              fontSize={w.size || "md"}
              fontWeight={w.bold ? "bold" : "normal"}
              textAlign={w.align || "left"}
            >
              {w.text || label || ""}
            </Text>
          </Container>
        </Box>
      );
    case "button":
      return (
        <Box py={4}>
          <Container>
            <Button
              size={w.size || "md"}
              variant={w.variant || "solid"}
              colorPalette={w.color || "blue"}
            >
              {w.text || label || "Button"}
            </Button>
          </Container>
        </Box>
      );
    case "image":
      return (
        <Box py={4}>
          <Container>
            {image ? (
              <Image src={image} alt={w.alt || label || "Image"} borderRadius="lg" mx="auto" />
            ) : (
              <Text color="fg.muted" fontSize="sm">
                {w.alt || label || "Image"}
              </Text>
            )}
          </Container>
        </Box>
      );
    case "form":
      return (
        <GenericSection title={w.title || label || "Formulir"}>
          <Input placeholder="Isian…" mb={3} />
          <Button colorPalette="green" width="full">
            {w.submitText || "Kirim"}
          </Button>
        </GenericSection>
      );
    case "text-input":
      return (
        <GenericSection title={w.label || label || "Input"}>
          <Input placeholder={w.placeholder || "Ketik di sini…"} />
        </GenericSection>
      );
    case "select": {
      const options = Array.isArray(w.options) && w.options.length > 0 ? w.options : ["Opsi 1"];
      return (
        <GenericSection title={w.label || label || "Pilihan"}>
          <select
            style={{
              fontSize: 14,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "white",
              width: "100%",
            }}
          >
            {options.map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {String(opt)}
              </option>
            ))}
          </select>
        </GenericSection>
      );
    }
    case "table": {
      const columns = Array.isArray(w.columns) && w.columns.length > 0 ? w.columns : ["Kolom"];
      const rows = Array.isArray(w.rows) ? w.rows : [];
      return (
        <GenericSection title={w.title || label || "Tabel"}>
          <Box overflowX="auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col)}
                      style={{ textAlign: "left", borderBottom: "2px solid #cbd5e1", padding: "8px" }}
                    >
                      {String(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} style={{ borderBottom: "1px solid #e2e8f0", padding: "8px" }}>
                        {String(row?.[j] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </GenericSection>
      );
    }
    case "chart": {
      const values = Array.isArray(w.values) && w.values.length > 0 ? w.values : [40, 60];
      const max = Math.max(...values, 1);
      return (
        <GenericSection title={w.title || label || "Grafik"}>
          <Box display="flex" alignItems="flex-end" gap="6px" height="140px">
            {values.map((value, i) => (
              <Box
                key={i}
                flex="1"
                borderRadius="md"
                bg="blue.solid"
                style={{ height: `${Math.max(5, Math.round((value / max) * 100))}%` }}
              />
            ))}
          </Box>
        </GenericSection>
      );
    }
    default:
      return (
        <GenericSection title={w.text || label || unitId}>
          <Text fontSize="sm" color="fg.muted">
            Section “{unitId}” belum punya tampilan halaman — isi dari Properti node.
          </Text>
          <Text fontSize="sm" color="fg.muted" mt={2}>
            <Link href="/" style={{ textDecoration: "underline" }}>
              Buka di editor
            </Link>
          </Text>
        </GenericSection>
      );
  }
}

export const LANDING_SECTIONS = {
  hero: HeroSection,
  "logo-strip": LogoStripSection,
  "features-grid": FeaturesSection,
  "how-it-works": StepsSection,
  testimonial: TestimonialsSection,
  pricing: PricingSection,
  "cta-banner": CtaSection,
  footer: PageFooterSection,
  stats: StatsSection,
};
