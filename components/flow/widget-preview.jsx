"use client";

/**
 * WIDGET PREVIEW — render komponen beneran di badan node.
 *
 * Sebelumnya node hanya menampilkan gambar SVG placeholder. Sekarang tiap
 * unit katalog dirender sebagai komponen aslinya (button jadi Button, teks
 * jadi Text, dst) supaya hasil drag-n-drop langsung kelihatan di canvas.
 *
 * - Dipakai non-interaktif di editor (supaya drag/select node tetap jalan).
 * - Dipakai interaktif di halaman Hasil/Preview (button bisa diklik, input
 *   bisa diketik).
 * - Props widget tersimpan di `node.data.widget` dan ikut ke-save ke BE
 *   apa adanya (kolom JSONB, BE tidak perlu diubah).
 */

import { memo, useState } from "react";
import { Box, Button, Image, Input, Text } from "@chakra-ui/react";
import {
  AreaValue,
  BoolValue,
  EnumValue,
  NumberValue,
  PropRow,
  TextValue,
} from "@/components/properties/ue-details";
import { DEFAULT_NODE_IMAGE } from "@/data/dummy-flow";

/**
 * Daftar pilihan untuk field enum. Nilai yang tersimpan di JSON hanyalah
 * string/number/array primitif supaya gampang ditulis tangan.
 */
export const WIDGET_ENUMS = {
  colors: ["blue", "green", "red", "orange", "purple", "gray"],
  buttonVariants: ["solid", "outline", "ghost"],
  buttonSizes: ["xs", "sm", "md"],
  textSizes: ["xs", "sm", "md", "lg", "xl"],
  aligns: ["left", "center", "right"],
  directions: ["row", "column", "grid"],
};

/** Isi default widget tiap unit katalog (dipakai saat node baru di-drop). */
export const WIDGET_DEFAULTS = {
  button: { text: "Klik saya", color: "blue", variant: "solid", size: "xs" },
  text: { text: "Teks contoh — ubah lewat Properti", size: "sm", align: "left", bold: false },
  "text-input": { label: "Nama", placeholder: "Ketik di sini…" },
  select: { label: "Pilihan", options: ["Opsi 1", "Opsi 2", "Opsi 3"] },
  header: { text: "Judul Aplikasi", subtitle: "" },
  table: {
    title: "Data",
    columns: ["Nama", "Nilai"],
    rows: [
      ["Contoh A", "10"],
      ["Contoh B", "20"],
    ],
  },
  chart: { title: "Grafik", values: [35, 65, 45, 80, 55] },
  form: { title: "Formulir", submitText: "Kirim" },
  page: { text: "Halaman" },
  container: { text: "Kontainer", direction: "row", columns: 2 },
  image: { alt: "" },
  heading: { text: "Judul", level: 1, align: "left" },
  list: { items: ["Item 1", "Item 2", "Item 3"], table: "", field: "" },
  card: { title: "Kartu" },
  // --- section landing (di-render full-page oleh /landing/[id]) ---
  hero: {
    eyebrow: "Format 01 — Landing Page",
    title: "Susun landing page di canvas",
    subtitle: "Tiap section adalah komponen sidebar yang bisa di-drag ke canvas.",
    ctaPrimary: "Mulai gratis",
    ctaSecondary: "Lihat contoh",
  },
  "logo-strip": {
    title: "DIPERCAYA TIM YANG MEMBANGUN DENGAN CANVAS",
    logos: "Nusantara Co, Kirana, BacingDev, Sagara, Lentera",
  },
  "features-grid": {
    title: "Semua yang perlu untuk page builder",
    subtitle: "Enam kemampuan inti.",
    items: [
      "Drag & drop canvas | Susun page, container, dan form langsung di canvas.",
      "Node, edge & port | Relasi antar komponen divisualkan sebagai graph.",
      "Preview runtime | Lihat hasil akhir read-only seperti user melihatnya.",
    ].join("\n"),
  },
  "how-it-works": {
    title: "Dari kanvas kosong ke landing live",
    steps: [
      "Drag komponen | Pilih section dari sidebar lalu jatuhkan ke canvas.",
      "Hubungkan alur | Tarik edge antar node sesuai kebutuhan data.",
      "Preview & publish | Buka sebagai halaman, cek tampilan, lalu simpan.",
    ].join("\n"),
  },
  testimonial: {
    title: "Kata mereka yang sudah coba",
    quotes: [
      "Bikin struktur landing jadi kelihatan. | Anisa P. | Product Designer",
      "Preview read-only-nya ngebantu stakeholder. | Bagas R. | Frontend Dev",
    ].join("\n"),
  },
  pricing: {
    title: "Mulai gratis, naik saat siap",
    subtitle: "",
    plans: [
      "Hobi | Rp0 | / selamanya | 3 canvas; Komponen dasar; Preview read-only",
      "*Pro | Rp99rb | / bulan | Canvas tanpa batas; Simpan ke server; Ekspor production",
      "Tim | Rp249rb | / bulan | Semua di Pro; Workspace tim; SSO (segera)",
    ].join("\n"),
  },
  "cta-banner": {
    title: "Siap susun landing pertamamu?",
    subtitle: "Buka editor, drag section Hero ke canvas, tekan preview.",
    ctaPrimary: "Mulai di Editor",
    ctaSecondary: "Baca Blog dulu",
  },
  footer: {
    brand: "Workflow Studio",
    links: "Editor, Blog, List, Canvas",
    copyright: "© 2026 — dibuat dari canvas",
  },
  stats: {
    title: "Angka bicara",
    items: ["120+ | Canvas tersimpan", "9 | Section siap drag", "4 mnt | Deploy otomatis"].join(
      "\n",
    ),
  },
};

/**
 * Tebak unitId dari data node lama yang belum punya `unitId`
 * (seed lokal / canvas yang sudah tersimpan sebelum fitur ini ada).
 */
export function getUnitId(data) {
  if (data?.unitId && WIDGET_DEFAULTS[data.unitId]) return data.unitId;
  const legacy = String(
    data?.componentType ?? data?.facilityType ?? "",
  ).toLowerCase();
  if (legacy && WIDGET_DEFAULTS[legacy]) return legacy;
  return null;
}

function Shell({ children, label, fill = true, bare = false }) {
  if (bare) {
    return (
      <Box
        position={fill ? "absolute" : "relative"}
        inset={fill ? "0" : undefined}
        minHeight={fill ? undefined : "24px"}
        overflow="hidden"
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        justifyContent="center"
      >
        {children}
      </Box>
    );
  }
  return (
    <Box
      position={fill ? "absolute" : "relative"}
      inset={fill ? "0" : undefined}
      minHeight={fill ? undefined : "64px"}
      overflow="hidden"
      rounded="md"
      bg="white"
      boxShadow="sm"
      px={2}
      py={1.5}
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      justifyContent="center"
      gap={1}
    >
      {children}
      {label ? (
        <Text
          fontSize="9px"
          color="fg.muted"
          noOfLines={1}
          textAlign="center"
          mt="auto"
        >
          {label}
        </Text>
      ) : null}
    </Box>
  );
}

function WidgetBody({ unitId, widget, label, image }) {
  switch (unitId) {
    case "button":
      return (
        <Button
          size={widget?.size || "xs"}
          variant={widget?.variant || "solid"}
          colorPalette={widget?.color || "blue"}
          width="100%"
        >
          {widget?.text || label || "Button"}
        </Button>
      );
    case "text":
      return (
        <Text
          fontSize={widget?.size || "sm"}
          fontWeight={widget?.bold ? "bold" : "medium"}
          textAlign={widget?.align || "left"}
          noOfLines={3}
          width="100%"
        >
          {widget?.text || label || "Text"}
        </Text>
      );
    case "text-input":
      return (
        <>
          {widget?.label ? (
            <Text fontSize="10px" fontWeight="semibold">
              {widget.label}
            </Text>
          ) : null}
          <Input
            size="xs"
            placeholder={widget?.placeholder || "Ketik…"}
            readOnly={false}
          />
        </>
      );
    case "select": {
      const options =
        Array.isArray(widget?.options) && widget.options.length > 0
          ? widget.options
          : ["Opsi 1"];
      return (
        <>
          {widget?.label ? (
            <Text fontSize="10px" fontWeight="semibold">
              {widget.label}
            </Text>
          ) : null}
          {/* select HTML polos: bebas dari API versi Chakra */}
          <select
            style={{
              fontSize: 12,
              padding: "4px 6px",
              borderRadius: 6,
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
        </>
      );
    }
    case "header":
      return (
        <Box bg="blue.solid" borderRadius="md" px={2} py={1.5}>
          <Text fontSize="sm" fontWeight="bold" color="white" noOfLines={1}>
            {widget?.text || label || "Header"}
          </Text>
          {widget?.subtitle ? (
            <Text fontSize="10px" color="whiteAlpha.800" noOfLines={1}>
              {widget.subtitle}
            </Text>
          ) : null}
        </Box>
      );
    case "heading": {
      const level = [1, 2, 3].includes(widget?.level) ? widget.level : 1;
      return (
        <Text
          fontSize={level === 1 ? "md" : level === 2 ? "sm" : "xs"}
          fontWeight="bold"
          textAlign={widget?.align || "left"}
          noOfLines={2}
          width="100%"
        >
          {widget?.text || label || "Heading"}
        </Text>
      );
    }
    case "list": {
      const rawItems = Array.isArray(widget?.items)
        ? widget.items
        : String(widget?.items ?? "")
            .split("\n")
            .map((part) => part.trim())
            .filter(Boolean);
      const items = rawItems.slice(0, 3);
      return (
        <>
          <Text fontSize="10px" fontWeight="semibold" noOfLines={1}>
            {widget?.table || label || "List"}
          </Text>
          {items.map((item, i) => (
            <Text key={i} fontSize="9px" color="fg.muted" noOfLines={1}>
              • {String(item)}
            </Text>
          ))}
          {widget?.table ? (
            <Text fontSize="9px" color="blue.fg" noOfLines={1}>
              ⛁ {widget.table}
            </Text>
          ) : null}
        </>
      );
    }
    case "card":
      return (
        <Box borderWidth="1px" borderColor="border" borderRadius="md" p={2} textAlign="center">
          <Text fontSize="xs" fontWeight="semibold" noOfLines={2}>
            {widget?.title || label || "Card"}
          </Text>
        </Box>
      );
    case "table": {
      const columns =
        Array.isArray(widget?.columns) && widget.columns.length > 0
          ? widget.columns
          : ["Kolom"];
      const rows = Array.isArray(widget?.rows) ? widget.rows : [];
      return (
        <>
          <Text fontSize="10px" fontWeight="semibold" noOfLines={1}>
            {widget?.title || label || "Table"}
          </Text>
          <table style={{ fontSize: 10, width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col)}
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #cbd5e1",
                      padding: "2px 4px",
                      color: "#64748b",
                    }}
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
                    <td
                      key={j}
                      style={{ borderBottom: "1px solid #f1f5f9", padding: "2px 4px" }}
                    >
                      {String(row?.[j] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }
    case "chart": {
      const values =
        Array.isArray(widget?.values) && widget.values.length > 0
          ? widget.values
          : [40, 60];
      const max = Math.max(...values, 1);
      return (
        <>
          <Text fontSize="10px" fontWeight="semibold" noOfLines={1}>
            {widget?.title || label || "Chart"}
          </Text>
          <Box display="flex" alignItems="flex-end" gap="3px" height="48px">
            {values.map((value, i) => (
              <Box
                key={i}
                flex="1"
                borderRadius="sm"
                bg="blue.solid"
                style={{ height: `${Math.max(8, Math.round((value / max) * 100))}%` }}
              />
            ))}
          </Box>
        </>
      );
    }
    case "form":
      return (
        <>
          <Text fontSize="10px" fontWeight="semibold" noOfLines={1}>
            {widget?.title || label || "Form"}
          </Text>
          <Input size="xs" placeholder="Isian…" />
          <Button size="xs" colorPalette="green" width="100%">
            {widget?.submitText || "Kirim"}
          </Button>
        </>
      );
    case "page":
      return (
        <Box
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border"
          borderRadius="md"
          p={2}
          textAlign="center"
        >
          <Text fontSize="xs" fontWeight="semibold">
            {widget?.text || label || "Page"}
          </Text>
        </Box>
      );
    case "container":
      return (
        <Box borderWidth="1px" borderColor="border" borderRadius="md" p={2}>
          <Text fontSize="xs" color="fg.muted" noOfLines={2}>
            {widget?.text || label || "Container"}
          </Text>
        </Box>
      );
    case "image":
      return (
        <>
          <Image
            src={image || DEFAULT_NODE_IMAGE}
            alt={widget?.alt || label || "Image"}
            width="full"
            height="64px"
            objectFit="contain"
            draggable={false}
          />
          {widget?.alt ? (
            <Text fontSize="9px" color="fg.muted" textAlign="center" noOfLines={1}>
              {widget.alt}
            </Text>
          ) : null}
        </>
      );
    case "hero":
    case "cta-banner":
      return (
        <>
          <Text fontSize="10px" fontWeight="bold" noOfLines={2}>
            {widget?.title || label || "Hero"}
          </Text>
          {widget?.subtitle ? (
            <Text fontSize="9px" color="fg.muted" noOfLines={2}>
              {widget.subtitle}
            </Text>
          ) : null}
          <Button size="xs" colorPalette="blue" width="100%">
            {widget?.ctaPrimary || "CTA"}
          </Button>
        </>
      );
    case "logo-strip":
    case "stats": {
      const items =
        unitId === "logo-strip"
          ? String(widget?.logos ?? "")
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean)
          : String(widget?.items ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);
      return (
        <>
          <Text fontSize="10px" fontWeight="semibold" noOfLines={1}>
            {widget?.title || label || unitId}
          </Text>
          <Text fontSize="9px" color="fg.muted" noOfLines={2}>
            {items.slice(0, 3).join(" • ") || "—"}
          </Text>
        </>
      );
    }
    case "features-grid":
    case "how-it-works":
    case "testimonial":
    case "pricing":
    case "footer": {
      const raw =
        widget?.items ?? widget?.steps ?? widget?.quotes ?? widget?.plans ?? widget?.links ?? "";
      const count = String(raw)
        .split(unitId === "footer" ? "," : "\n")
        .map((part) => part.trim())
        .filter(Boolean).length;
      return (
        <>
          <Text fontSize="10px" fontWeight="semibold" noOfLines={2}>
            {widget?.title || widget?.brand || label || unitId}
          </Text>
          <Text fontSize="9px" color="fg.muted">
            {count} item
          </Text>
        </>
      );
    }
    default:
      return (
        <Text fontSize="xs" color="fg.muted">
          {label || unitId}
        </Text>
      );
  }
}

/**
 * @param interactive false = di editor (klik tembus ke node, drag tetap jalan),
 *                    true  = di Hasil/preview (button/input bisa dipakai).
 */
export const WidgetPreview = memo(function WidgetPreview({
  unitId,
  widget,
  label,
  image,
  interactive = false,
  showLabel = true,
  fill = true,
  bare = false,
}) {
  return (
    <Box
      position={fill ? "absolute" : "static"}
      inset={fill ? "0" : undefined}
      pointerEvents={interactive ? "auto" : "none"}
      className={interactive ? undefined : "nodrag"}
    >
      <Shell label={showLabel && !bare ? label : null} fill={fill} bare={bare}>
        <WidgetBody unitId={unitId} widget={widget} label={label} image={image} />
      </Shell>
    </Box>
  );
});

/**
 * Field edit isi widget untuk panel Details (gaya UE5).
 * onChange dipanggil dengan object widget baru tiap field berubah.
 * Semua nilai yang disimpan adalah JSON primitif (string/number/array)
 * sehingga bisa ditulis tangan langsung sebagai JSON.
 */
const splitList = (text, sep) =>
  text
    .split(sep)
    .map((part) => part.trim())
    .filter(Boolean);

const WIDGET_FIELDS = {
  button: [
    { key: "text", label: "Tulisan button", placeholder: "Klik saya" },
    { key: "color", label: "Warna", options: WIDGET_ENUMS.colors },
    { key: "variant", label: "Gaya", options: WIDGET_ENUMS.buttonVariants },
    { key: "size", label: "Ukuran", options: WIDGET_ENUMS.buttonSizes },
  ],
  text: [
    { key: "text", label: "Isi teks", placeholder: "Tulis sesuatu…", area: 2 },
    { key: "size", label: "Ukuran huruf", options: WIDGET_ENUMS.textSizes },
    { key: "align", label: "Rata", options: WIDGET_ENUMS.aligns },
    { key: "bold", label: "Tebal (bold)", bool: true },
  ],
  header: [
    { key: "text", label: "Judul header", placeholder: "Judul Aplikasi" },
    { key: "subtitle", label: "Subjudul" },
  ],
  heading: [
    { key: "text", label: "Isi judul", placeholder: "Judul" },
    { key: "level", label: "Level", options: [1, 2, 3] },
    { key: "align", label: "Rata", options: WIDGET_ENUMS.aligns },
  ],
  list: [
    {
      key: "items",
      label: "Item statis",
      tooltip: "Satu baris satu item",
      area: 3,
      placeholder: "Item 1\nItem 2",
      format: (value) => (Array.isArray(value) ? value.join("\n") : ""),
      parse: (text) => splitList(text, "\n"),
    },
    { key: "table", label: "Tabel data", tooltip: "Mengganti item statis" },
    { key: "field", label: "Field ditampilkan" },
  ],
  card: [{ key: "title", label: "Judul kartu", placeholder: "Kartu" }],
  page: [{ key: "text", label: "Nama halaman", placeholder: "Halaman" }],
  container: [
    { key: "text", label: "Keterangan", placeholder: "Kontainer" },
    { key: "direction", label: "Layout", options: WIDGET_ENUMS.directions },
    { key: "columns", label: "Kolom grid", number: { min: 1, max: 6 } },
  ],
  image: [{ key: "alt", label: "Teks alt/caption" }],
  "text-input": [
    { key: "label", label: "Label input", placeholder: "Nama" },
    { key: "placeholder", label: "Placeholder", placeholder: "Ketik di sini…" },
  ],
  select: [
    { key: "label", label: "Label", placeholder: "Pilihan" },
    {
      key: "options",
      label: "Opsi",
      tooltip: "Pisahkan dengan koma",
      placeholder: "Opsi 1, Opsi 2",
      format: (value) => (Array.isArray(value) ? value.join(", ") : ""),
      parse: (text) => splitList(text, ","),
    },
  ],
  table: [
    { key: "title", label: "Judul tabel", placeholder: "Data" },
    {
      key: "columns",
      label: "Kolom",
      tooltip: "Pisahkan dengan koma",
      placeholder: "Nama, Nilai",
      format: (value) => (Array.isArray(value) ? value.join(", ") : ""),
      parse: (text) => splitList(text, ","),
    },
    {
      key: "rows",
      label: "Baris",
      tooltip: "Satu baris per baris, sel dipisah |",
      area: 3,
      placeholder: "Contoh A | 10\nContoh B | 20",
      format: (value) =>
        Array.isArray(value) ? value.map((row) => (row ?? []).join(" | ")).join("\n") : "",
      parse: (text) =>
        text
          .split("\n")
          .map((line) => line.split("|").map((cell) => cell.trim()))
          .filter((cells) => cells.some((cell) => cell !== "")),
    },
  ],
  chart: [
    { key: "title", label: "Judul grafik", placeholder: "Grafik" },
    {
      key: "values",
      label: "Nilai",
      tooltip: "Pisahkan dengan koma",
      placeholder: "35, 65, 45",
      format: (value) => (Array.isArray(value) ? value.join(", ") : ""),
      parse: (text) =>
        text
          .split(",")
          .map((part) => Number(part.trim()))
          .filter((num) => Number.isFinite(num)),
    },
  ],
  form: [
    { key: "title", label: "Judul form", placeholder: "Formulir" },
    { key: "submitText", label: "Tulisan tombol", placeholder: "Kirim" },
  ],
  hero: [
    { key: "eyebrow", label: "Label kecil" },
    { key: "title", label: "Judul besar" },
    { key: "subtitle", label: "Subjudul", area: 3 },
    { key: "ctaPrimary", label: "Tombol utama" },
    { key: "ctaSecondary", label: "Tombol kedua" },
  ],
  "logo-strip": [
    { key: "title", label: "Judul strip" },
    { key: "logos", label: "Logo", tooltip: "Pisahkan dengan koma" },
  ],
  "features-grid": [
    { key: "title", label: "Judul" },
    { key: "subtitle", label: "Subjudul" },
    { key: "items", label: "Fitur", tooltip: "Satu per baris: Judul | Deskripsi", area: 4 },
  ],
  "how-it-works": [
    { key: "title", label: "Judul" },
    { key: "steps", label: "Langkah", tooltip: "Satu per baris: Judul | Deskripsi", area: 4 },
  ],
  testimonial: [
    { key: "title", label: "Judul" },
    { key: "quotes", label: "Testimoni", tooltip: "Satu per baris: Kutipan | Nama | Peran", area: 4 },
  ],
  pricing: [
    { key: "title", label: "Judul" },
    { key: "subtitle", label: "Subjudul" },
    {
      key: "plans",
      label: "Paket",
      tooltip: "Satu per baris: Nama | Harga | Periode | fitur a; fitur b — awali * untuk populer",
      area: 4,
    },
  ],
  "cta-banner": [
    { key: "title", label: "Judul" },
    { key: "subtitle", label: "Subjudul" },
    { key: "ctaPrimary", label: "Tombol utama" },
    { key: "ctaSecondary", label: "Tombol kedua" },
  ],
  footer: [
    { key: "brand", label: "Nama brand" },
    { key: "links", label: "Tautan", tooltip: "Pisahkan dengan koma" },
    { key: "copyright", label: "Copyright" },
  ],
  stats: [
    { key: "title", label: "Judul" },
    { key: "items", label: "Statistik", tooltip: "Satu per baris: Angka | Label", area: 3 },
  ],
};

export function hasWidgetFields(unitId) {
  return !!WIDGET_FIELDS[unitId];
}

/** Field yang dipakai list-like (`format`/`parse`) disimpan mentah selama diketik. */
function ListTextValue({ field, value, onCommit }) {
  const [draft, setDraft] = useState(null);
  const text = draft ?? field.format(value);
  const handle = (next) => {
    setDraft(next);
    onCommit(field.parse(next));
  };
  return field.area ? (
    <AreaValue
      value={text}
      rows={field.area}
      placeholder={field.placeholder}
      onChange={handle}
    />
  ) : (
    <Box flex="1" minW="0" onBlur={() => setDraft(null)}>
      <TextValue value={text} placeholder={field.placeholder} onChange={handle} />
    </Box>
  );
}

export function WidgetFields({ unitId, widget, onChange }) {
  const fields = WIDGET_FIELDS[unitId];
  if (!fields) return null;
  const value = widget ?? {};
  const defaults = WIDGET_DEFAULTS[unitId] ?? {};
  const set = (patch) => onChange({ ...value, ...patch });

  return fields.map((field) => {
    const current = value[field.key];
    const fallback = defaults[field.key];
    const modified =
      fallback !== undefined && JSON.stringify(current ?? null) !== JSON.stringify(fallback);
    const reset = () => set({ [field.key]: fallback });

    let control;
    if (field.options) {
      control = (
        <EnumValue
          value={current ?? field.options[0]}
          options={field.options}
          onChange={(next) => set({ [field.key]: next })}
        />
      );
    } else if (field.bool) {
      control = <BoolValue value={!!current} onChange={(next) => set({ [field.key]: next })} />;
    } else if (field.number) {
      control = (
        <NumberValue
          value={Number(current ?? fallback ?? 0)}
          min={field.number.min}
          max={field.number.max}
          onChange={(next) => set({ [field.key]: next })}
        />
      );
    } else if (field.parse) {
      control = (
        <ListTextValue
          key={field.key}
          field={field}
          value={current}
          onCommit={(next) => set({ [field.key]: next })}
        />
      );
    } else if (field.area) {
      control = (
        <AreaValue
          value={current ?? ""}
          rows={field.area}
          placeholder={field.placeholder}
          onChange={(next) => set({ [field.key]: next })}
        />
      );
    } else {
      control = (
        <TextValue
          value={current ?? ""}
          placeholder={field.placeholder}
          onChange={(next) => set({ [field.key]: next })}
        />
      );
    }

    return (
      <PropRow
        key={field.key}
        label={field.label}
        tooltip={field.tooltip}
        modified={modified}
        onReset={reset}
      >
        {control}
      </PropRow>
    );
  });
}

/** Live preview kecil untuk dialog properti (selalu non-interaktif). */
export function WidgetDraftPreview({ unitId, widget, label, image }) {
  return (
    <Box position="relative" width="200px" height="112px">
      <WidgetPreview
        unitId={unitId}
        widget={widget}
        label={label}
        image={image}
        interactive={false}
        showLabel={false}
      />
    </Box>
  );
}
