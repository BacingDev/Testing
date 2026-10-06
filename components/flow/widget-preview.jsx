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

/** Isi default widget tiap unit katalog (dipakai saat node baru di-drop). */
export const WIDGET_DEFAULTS = {
  button: { text: "Klik saya" },
  text: { text: "Teks contoh — ubah lewat Properti" },
  "text-input": { label: "Nama", placeholder: "Ketik di sini…" },
  select: { label: "Pilihan", options: ["Opsi 1", "Opsi 2", "Opsi 3"] },
  header: { text: "Judul Aplikasi" },
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
  container: { text: "Kontainer" },
  image: {},
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
        <Button size="xs" colorPalette="blue" width="100%">
          {widget?.text || label || "Button"}
        </Button>
      );
    case "text":
      return (
        <Text fontSize="sm" fontWeight="medium" noOfLines={3}>
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
        </Box>
      );
    case "table": {
      const columns =
        Array.isArray(widget?.columns) && widget.columns.length > 0
          ? widget.columns
          : ["Kolom"];
      const rows = Array.isArray(widget?.rows) ? widget.rows.slice(0, 3) : [];
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
        <Image
          src={image || DEFAULT_NODE_IMAGE}
          alt={label || "Image"}
          width="full"
          height="64px"
          objectFit="contain"
          draggable={false}
        />
      );
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

  switch (unitId) {
    case "button":
      return textField("text", "Tulisan button", "Klik saya");
    case "text":
      return textField("text", "Isi teks", "Tulis sesuatu…");
    case "header":
      return textField("text", "Judul header", "Judul Aplikasi");
    case "page":
    case "container":
      return textField("text", "Keterangan", "");
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
      return textField("title", "Judul tabel", "Data");
    case "chart":
      return textField("title", "Judul grafik", "Grafik");
    case "form":
      return (
        <>
          {textField("title", "Judul form", "Formulir")}
          {textField("submitText", "Tulisan tombol", "Kirim")}
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
