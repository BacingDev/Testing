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

import { memo } from "react";
import { Box, Button, Field, Image, Input, Text } from "@chakra-ui/react";
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
 * Form edit isi widget untuk dialog Properti node.
 * onChange dipanggil dengan object widget baru tiap field berubah.
 * Semua nilai yang disimpan adalah JSON primitif (string/number/array)
 * sehingga bisa ditulis tangan langsung sebagai JSON.
 */
export function WidgetFields({ unitId, widget, onChange }) {
  const value = widget ?? {};
  const set = (patch) => onChange({ ...value, ...patch });

  const textField = (fieldKey, fieldLabel, placeholder) => (
    <Field.Root key={fieldKey}>
      <Field.Label>{fieldLabel}</Field.Label>
      <Input
        size="sm"
        value={value[fieldKey] ?? ""}
        placeholder={placeholder}
        onChange={(event) => set({ [fieldKey]: event.target.value })}
      />
    </Field.Root>
  );

  const enumField = (fieldKey, fieldLabel, options) => (
    <Field.Root key={fieldKey}>
      <Field.Label>{fieldLabel}</Field.Label>
      <select
        value={value[fieldKey] ?? options[0]}
        onChange={(event) => set({ [fieldKey]: event.target.value })}
        style={{
          fontSize: 13,
          padding: "6px 8px",
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
    </Field.Root>
  );

  const boolField = (fieldKey, fieldLabel) => (
    <label
      key={fieldKey}
      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
    >
      <input
        type="checkbox"
        checked={!!value[fieldKey]}
        onChange={(event) => set({ [fieldKey]: event.target.checked })}
      />
      {fieldLabel}
    </label>
  );

  const areaField = (fieldKey, fieldLabel, placeholder, rows = 3) => (
    <Field.Root key={fieldKey}>
      <Field.Label>{fieldLabel}</Field.Label>
      <textarea
        rows={rows}
        value={value[fieldKey] ?? ""}
        placeholder={placeholder}
        onChange={(event) => set({ [fieldKey]: event.target.value })}
        style={{
          fontSize: 13,
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #cbd5e1",
          background: "white",
          width: "100%",
          fontFamily: "inherit",
        }}
      />
    </Field.Root>
  );

  switch (unitId) {
    case "button":
      return (
        <>
          {textField("text", "Tulisan button", "Klik saya")}
          {enumField("color", "Warna", WIDGET_ENUMS.colors)}
          {enumField("variant", "Gaya", WIDGET_ENUMS.buttonVariants)}
          {enumField("size", "Ukuran", WIDGET_ENUMS.buttonSizes)}
        </>
      );
    case "text":
      return (
        <>
          {textField("text", "Isi teks", "Tulis sesuatu…")}
          {enumField("size", "Ukuran huruf", WIDGET_ENUMS.textSizes)}
          {enumField("align", "Rata", WIDGET_ENUMS.aligns)}
          {boolField("bold", "Tebal (bold)")}
        </>
      );
    case "header":
      return (
        <>
          {textField("text", "Judul header", "Judul Aplikasi")}
          {textField("subtitle", "Subjudul (opsional)", "")}
        </>
      );
    case "heading":
      return (
        <>
          {textField("text", "Isi judul", "Judul")}
          {enumField("level", "Level", [1, 2, 3])}
          {enumField("align", "Rata", WIDGET_ENUMS.aligns)}
        </>
      );
    case "list":
      return (
        <>
          <Field.Root>
            <Field.Label>Item statis (satu baris satu item)</Field.Label>
            <textarea
              rows={3}
              value={Array.isArray(value.items) ? value.items.join("\n") : ""}
              placeholder={"Item 1\nItem 2"}
              onChange={(event) =>
                set({
                  items: event.target.value
                    .split("\n")
                    .map((part) => part.trim())
                    .filter(Boolean),
                })
              }
              style={{
                fontSize: 13,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "white",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </Field.Root>
          {textField("table", "Tabel data (ganti item statis)", "")}
          {textField("field", "Field yang ditampilkan", "")}
        </>
      );
    case "card":
      return textField("title", "Judul kartu", "Kartu");
    case "page":
      return textField("text", "Nama halaman", "Halaman");
    case "container":
      return (
        <>
          {textField("text", "Keterangan", "Kontainer")}
          {enumField("direction", "Layout", WIDGET_ENUMS.directions)}
          {textField("columns", "Kolom grid", "2")}
        </>
      );
    case "image":
      return textField("alt", "Teks alt/caption", "");
    case "text-input":
      return (
        <>
          {textField("label", "Label input", "Nama")}
          {textField("placeholder", "Placeholder", "Ketik di sini…")}
        </>
      );
    case "select":
      return (
        <>
          {textField("label", "Label", "Pilihan")}
          <Field.Root>
            <Field.Label>Opsi (pisahkan koma)</Field.Label>
            <Input
              size="sm"
              value={Array.isArray(value.options) ? value.options.join(", ") : ""}
              placeholder="Opsi 1, Opsi 2, Opsi 3"
              onChange={(event) =>
                set({
                  options: event.target.value
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field.Root>
        </>
      );
    case "table":
      return (
        <>
          {textField("title", "Judul tabel", "Data")}
          <Field.Root>
            <Field.Label>Kolom (pisahkan koma)</Field.Label>
            <Input
              size="sm"
              value={Array.isArray(value.columns) ? value.columns.join(", ") : ""}
              placeholder="Nama, Nilai"
              onChange={(event) =>
                set({
                  columns: event.target.value
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Baris (satu baris per baris, sel pisah | )</Field.Label>
            <textarea
              rows={3}
              value={
                Array.isArray(value.rows)
                  ? value.rows.map((row) => (row ?? []).join(" | ")).join("\n")
                  : ""
              }
              placeholder={"Contoh A | 10\nContoh B | 20"}
              onChange={(event) =>
                set({
                  rows: event.target.value
                    .split("\n")
                    .map((line) => line.split("|").map((cell) => cell.trim()))
                    .filter((cells) => cells.some((cell) => cell !== "")),
                })
              }
              style={{
                fontSize: 13,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "white",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </Field.Root>
        </>
      );
    case "chart":
      return (
        <>
          {textField("title", "Judul grafik", "Grafik")}
          <Field.Root>
            <Field.Label>Nilai (pisahkan koma)</Field.Label>
            <Input
              size="sm"
              value={Array.isArray(value.values) ? value.values.join(", ") : ""}
              placeholder="35, 65, 45"
              onChange={(event) =>
                set({
                  values: event.target.value
                    .split(",")
                    .map((part) => Number(part.trim()))
                    .filter((num) => Number.isFinite(num)),
                })
              }
            />
          </Field.Root>
        </>
      );
    case "form":
      return (
        <>
          {textField("title", "Judul form", "Formulir")}
          {textField("submitText", "Tulisan tombol", "Kirim")}
        </>
      );
    case "hero":
      return (
        <>
          {textField("eyebrow", "Label kecil", "Format 01 — Landing Page")}
          {textField("title", "Judul besar", "Susun landing page di canvas")}
          {areaField("subtitle", "Subjudul", "Tulis deskripsi singkat…")}
          {textField("ctaPrimary", "Tombol utama", "Mulai gratis")}
          {textField("ctaSecondary", "Tombol kedua", "Lihat contoh")}
        </>
      );
    case "logo-strip":
      return (
        <>
          {textField("title", "Judul strip", "DIPERCAYA TIM…")}
          {textField("logos", "Logo (pisahkan koma)", "Acar, BacingDev, Kirana")}
        </>
      );
    case "features-grid":
      return (
        <>
          {textField("title", "Judul", "Semua yang perlu…")}
          {textField("subtitle", "Subjudul", "")}
          {areaField(
            "items",
            "Fitur (satu per baris: Judul | Deskripsi)",
            "Drag & drop | Susun langsung di canvas",
            4,
          )}
        </>
      );
    case "how-it-works":
      return (
        <>
          {textField("title", "Judul", "Dari kanvas kosong…")}
          {areaField(
            "steps",
            "Langkah (satu per baris: Judul | Deskripsi)",
            "Drag komponen | Pilih lalu jatuhkan",
            4,
          )}
        </>
      );
    case "testimonial":
      return (
        <>
          {textField("title", "Judul", "Kata mereka…")}
          {areaField(
            "quotes",
            "Testimoni (satu per baris: Kutipan | Nama | Peran)",
            "Bagus sekali | Anisa | Designer",
            4,
          )}
        </>
      );
    case "pricing":
      return (
        <>
          {textField("title", "Judul", "Mulai gratis…")}
          {textField("subtitle", "Subjudul", "")}
          {areaField(
            "plans",
            "Paket (satu per baris: Nama | Harga | Periode | fitur a; fitur b, awali * untuk populer)",
            "*Pro | Rp99rb | / bulan | Canvas tanpa batas; Support",
            4,
          )}
        </>
      );
    case "cta-banner":
      return (
        <>
          {textField("title", "Judul", "Siap susun landing pertamamu?")}
          {textField("subtitle", "Subjudul", "")}
          {textField("ctaPrimary", "Tombol utama", "Mulai di Editor")}
          {textField("ctaSecondary", "Tombol kedua", "Baca Blog dulu")}
        </>
      );
    case "footer":
      return (
        <>
          {textField("brand", "Nama brand", "Workflow Studio")}
          {textField("links", "Tautan (pisahkan koma)", "Editor, Blog, List, Canvas")}
          {textField("copyright", "Copyright", "© 2026 — dibuat dari canvas")}
        </>
      );
    case "stats":
      return (
        <>
          {textField("title", "Judul", "Angka bicara")}
          {areaField("items", "Statistik (satu per baris: Angka | Label)", "120+ | Canvas", 3)}
        </>
      );
    default:
      return null;
  }
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
