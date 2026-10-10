"use client";

/**
 * Primitif panel ala Unreal Engine 5 (Outliner + Details).
 *
 * - Category: header lipat (▸/▾) seperti "Transform", "Rendering".
 * - PropRow: baris dua kolom (label | nilai) dengan pemisah kolom yang bisa
 *   digeser dan tombol reset-ke-default (↺) di ujung kanan.
 * - Kontrol nilai: teks, area, angka (bisa di-scrub), vektor X/Y, enum, bool,
 *   warna, dan read-only.
 * - Pencarian: baris yang labelnya tidak cocok disembunyikan, kategori yang
 *   kosong ikut disembunyikan lewat :has().
 *
 * Warna sengaja ditulis langsung (bukan token Chakra) supaya identik dengan
 * palet editor UE5 dan tidak bergantung pada color mode.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { TbArrowBackUp, TbChevronDown, TbChevronRight, TbSearch, TbX } from "react-icons/tb";

export const UE = {
  window: "#151515",
  panel: "#242424",
  tab: "#1a1a1a",
  header: "#2f2f2f",
  headerHover: "#383838",
  row: "#1c1c1c",
  rowAlt: "#202020",
  rowHover: "#2a2a2a",
  line: "#0f0f0f",
  input: "#0f0f0f",
  inputBorder: "#383838",
  inputHover: "#4a4a4a",
  accent: "#0070e0",
  select: "#103c66",
  selectHover: "#16497a",
  text: "#c0c0c0",
  textBright: "#ffffff",
  textDim: "#8a8a8a",
  axisX: "#c8331c",
  axisY: "#58a019",
  axisZ: "#2564c8",
};

const FONT_SIZE = "11px";
const ROW_HEIGHT = "26px";

// ---------------------------------------------------------------------------
// Konteks: pencarian + rasio kolom label/nilai
// ---------------------------------------------------------------------------

const DetailsContext = createContext({ query: "", split: 0.4, setSplit: () => {} });

export function DetailsRoot({ query = "", children }) {
  const [split, setSplitState] = useState(0.4);
  const rootRef = useRef(null);
  const setSplit = useCallback((clientX) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return;
    const ratio = (clientX - rect.left) / rect.width;
    setSplitState(Math.min(0.75, Math.max(0.2, ratio)));
  }, []);
  const searching = query.trim() !== "";

  return (
    <DetailsContext.Provider value={{ query: query.trim().toLowerCase(), split, setSplit }}>
      <Box
        ref={rootRef}
        fontSize={FONT_SIZE}
        color={UE.text}
        css={{
          "--ue-split": `${split * 100}%`,
          ...(searching
            ? { "& [data-ue-category]:not(:has([data-ue-row]))": { display: "none" } }
            : {}),
        }}
      >
        {children}
      </Box>
    </DetailsContext.Provider>
  );
}

function matches(query, label) {
  return !query || String(label).toLowerCase().includes(query);
}

// ---------------------------------------------------------------------------
// Struktur panel
// ---------------------------------------------------------------------------

/** Strip tab di atas panel (mis. "Outliner", "Details"). */
export function PanelTab({ icon: Icon, title, right }) {
  return (
    <Flex
      align="flex-end"
      height="28px"
      flexShrink="0"
      bg={UE.window}
      borderBottomWidth="1px"
      borderColor={UE.line}
      px={1}
      gap={1}
    >
      <Flex
        align="center"
        gap={1.5}
        height="24px"
        px={3}
        bg={UE.panel}
        color={UE.textBright}
        fontSize={FONT_SIZE}
        roundedTop="4px"
        borderTopWidth="2px"
        borderColor={UE.accent}
      >
        {Icon ? <Icon size={13} /> : null}
        {title}
      </Flex>
      <Box flex="1" />
      {right}
    </Flex>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search" }) {
  return (
    <Flex
      align="center"
      gap={1.5}
      height="24px"
      px={2}
      bg={UE.input}
      borderWidth="1px"
      borderColor={UE.inputBorder}
      rounded="3px"
      color={UE.textDim}
      flex="1"
      minW="0"
      _focusWithin={{ borderColor: UE.accent }}
      _hover={{ borderColor: UE.inputHover }}
    >
      <TbSearch size={12} />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle({ padding: 0, border: "none", height: "100%" })}
      />
      {value ? (
        <Box as="button" type="button" aria-label="Hapus pencarian" onClick={() => onChange("")}>
          <TbX size={12} />
        </Box>
      ) : null}
    </Flex>
  );
}

export function Category({ title, right, defaultOpen = true, children }) {
  const { query } = useContext(DetailsContext);
  const [open, setOpen] = useState(defaultOpen);
  const expanded = open || !!query;

  return (
    <Box data-ue-category="" borderBottomWidth="1px" borderColor={UE.line}>
      <Flex
        as="button"
        type="button"
        width="full"
        align="center"
        gap={1}
        height={ROW_HEIGHT}
        px={1.5}
        bg={UE.header}
        color={UE.textBright}
        fontWeight="semibold"
        fontSize={FONT_SIZE}
        textAlign="left"
        _hover={{ bg: UE.headerHover }}
        aria-expanded={expanded}
        onClick={() => setOpen((value) => !value)}
      >
        {expanded ? <TbChevronDown size={12} /> : <TbChevronRight size={12} />}
        <Box flex="1" minW="0" truncate>
          {title}
        </Box>
        {right ? (
          <Flex align="center" gap={1} onClick={(event) => event.stopPropagation()}>
            {right}
          </Flex>
        ) : null}
      </Flex>
      {expanded ? <Box>{children}</Box> : null}
    </Box>
  );
}

/** Sub-grup di dalam kategori (mis. elemen array "Index [0]"). */
export function SubGroup({ title, summary, indent = 1, right, defaultOpen = false, children }) {
  const { query } = useContext(DetailsContext);
  const [open, setOpen] = useState(defaultOpen);
  const expanded = open || !!query;

  return (
    <Box data-ue-category="">
      <Box
        display="grid"
        gridTemplateColumns="var(--ue-split) 1fr"
        minH={ROW_HEIGHT}
        bg={UE.row}
        borderTopWidth="1px"
        borderColor={UE.line}
        _hover={{ bg: UE.rowHover }}
      >
        <Flex
          as="button"
          type="button"
          align="center"
          gap={1}
          minW="0"
          textAlign="left"
          style={{ paddingLeft: 6 + indent * 12 }}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? <TbChevronDown size={11} /> : <TbChevronRight size={11} />}
          <Box truncate>{title}</Box>
        </Flex>
        <Flex align="center" gap={1} px={2} minW="0" color={UE.textDim}>
          <Box flex="1" minW="0" truncate>
            {summary}
          </Box>
          {right}
        </Flex>
      </Box>
      {expanded ? children : null}
    </Box>
  );
}

/**
 * Satu baris properti. `onReset` muncul sebagai ikon ↺ hanya bila
 * `modified` true — persis perilaku "Reset to Default" di UE5.
 */
export function PropRow({ label, indent = 1, modified = false, onReset, tooltip, children }) {
  const { query, setSplit } = useContext(DetailsContext);
  if (!matches(query, label)) return null;

  const startDrag = (event) => {
    event.preventDefault();
    const move = (moveEvent) => setSplit(moveEvent.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <Box
      data-ue-row=""
      display="grid"
      gridTemplateColumns="var(--ue-split) 1fr 20px"
      minH={ROW_HEIGHT}
      bg={UE.row}
      borderTopWidth="1px"
      borderColor={UE.line}
      _hover={{ bg: UE.rowHover }}
    >
      <Flex
        position="relative"
        align="center"
        minW="0"
        pr={2}
        title={tooltip ?? String(label)}
        style={{ paddingLeft: 6 + indent * 12 }}
      >
        <Box truncate>{label}</Box>
        <Box
          position="absolute"
          right="-3px"
          top="0"
          bottom="0"
          width="6px"
          cursor="col-resize"
          zIndex={1}
          onPointerDown={startDrag}
          _after={{
            content: '""',
            position: "absolute",
            left: "2.5px",
            top: 0,
            bottom: 0,
            width: "1px",
            bg: UE.line,
          }}
        />
      </Flex>
      <Flex align="center" gap={1} minW="0" px={2} py="2px">
        {children}
      </Flex>
      <Flex align="center" justify="center">
        {modified && onReset ? (
          <Box
            as="button"
            type="button"
            title="Reset ke default"
            aria-label={`Reset ${label} ke default`}
            color={UE.textDim}
            _hover={{ color: UE.textBright }}
            onClick={onReset}
          >
            <TbArrowBackUp size={13} />
          </Box>
        ) : null}
      </Flex>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Kontrol nilai
// ---------------------------------------------------------------------------

function inputStyle(extra) {
  return {
    width: "100%",
    minWidth: 0,
    height: 20,
    padding: "0 6px",
    fontSize: 11,
    fontFamily: "inherit",
    color: UE.textBright,
    background: UE.input,
    border: `1px solid ${UE.inputBorder}`,
    borderRadius: 3,
    outline: "none",
    ...extra,
  };
}

const focusCss = {
  "& input:focus, & textarea:focus, & select:focus": { borderColor: `${UE.accent} !important` },
  "& input:hover, & textarea:hover, & select:hover": { borderColor: UE.inputHover },
};

export function TextValue({ value, placeholder, onChange, readOnly = false }) {
  return (
    <Box flex="1" minW="0" css={focusCss}>
      <input
        value={value ?? ""}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        style={inputStyle(readOnly ? { color: UE.textDim } : undefined)}
      />
    </Box>
  );
}

export function AreaValue({ value, placeholder, rows = 3, onChange }) {
  return (
    <Box flex="1" minW="0" py="2px" css={focusCss}>
      <textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle({ height: "auto", padding: "3px 6px", resize: "vertical", lineHeight: 1.4 })}
      />
    </Box>
  );
}

export function EnumValue({ value, options, onChange, renderLabel }) {
  return (
    <Box flex="1" minW="0" css={focusCss}>
      <select
        value={String(value ?? options[0])}
        onChange={(event) => {
          const picked = options.find((opt) => String(opt) === event.target.value);
          onChange(picked ?? event.target.value);
        }}
        style={inputStyle({ padding: "0 4px", cursor: "pointer", colorScheme: "dark" })}
      >
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {renderLabel ? renderLabel(opt) : String(opt)}
          </option>
        ))}
      </select>
    </Box>
  );
}

export function BoolValue({ value, onChange }) {
  return (
    <Box
      as="button"
      type="button"
      role="checkbox"
      aria-checked={!!value}
      boxSize="14px"
      flexShrink="0"
      rounded="2px"
      borderWidth="1px"
      borderColor={value ? UE.accent : UE.inputBorder}
      bg={value ? UE.accent : UE.input}
      color={UE.textBright}
      display="flex"
      alignItems="center"
      justifyContent="center"
      _hover={{ borderColor: value ? UE.accent : UE.inputHover }}
      onClick={() => onChange(!value)}
    >
      {value ? (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1.5 5.2 4 7.6 8.5 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ) : null}
    </Box>
  );
}

export function ReadonlyValue({ children }) {
  return (
    <Box flex="1" minW="0" truncate color={UE.textDim} title={typeof children === "string" ? children : undefined}>
      {children}
    </Box>
  );
}

function formatNumber(value, precision) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return precision > 0 ? num.toFixed(precision) : String(Math.round(num));
}

/**
 * Kotak angka ala UE: label sumbu berwarna di kiri bisa di-drag horizontal
 * untuk men-scrub nilai, teksnya bisa diketik langsung (Enter/blur = commit).
 */
export function NumberValue({ value, onChange, axis, color, step = 1, min, max, precision = 0 }) {
  const [draft, setDraft] = useState(null);
  const clamp = (num) => {
    let next = num;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const commit = () => {
    if (draft === null) return;
    const num = Number(draft);
    setDraft(null);
    if (Number.isFinite(num)) onChange(clamp(num));
  };

  const startScrub = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startValue = Number(value) || 0;
    const target = event.currentTarget;
    target.setPointerCapture?.(event.pointerId);
    const move = (moveEvent) => {
      const delta = Math.round((moveEvent.clientX - startX) / 2) * step;
      onChange(clamp(Number((startValue + delta).toFixed(Math.max(precision, 0)))));
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };

  return (
    <Flex
      flex="1"
      minW="0"
      align="stretch"
      height="20px"
      rounded="3px"
      overflow="hidden"
      borderWidth="1px"
      borderColor={UE.inputBorder}
      bg={UE.input}
      _hover={{ borderColor: UE.inputHover }}
      _focusWithin={{ borderColor: UE.accent }}
    >
      <Flex
        align="center"
        justify="center"
        flexShrink="0"
        width={axis ? "16px" : "6px"}
        bg={color ?? UE.inputBorder}
        color={UE.textBright}
        fontSize="10px"
        fontWeight="bold"
        cursor="ew-resize"
        title="Drag untuk mengubah nilai"
        onPointerDown={startScrub}
      >
        {axis}
      </Flex>
      <input
        inputMode="decimal"
        value={draft ?? formatNumber(value, precision)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(null);
            event.currentTarget.blur();
          }
        }}
        style={inputStyle({ border: "none", borderRadius: 0, height: "100%" })}
      />
    </Flex>
  );
}

/** Vektor 2 komponen (X/Y atau W/H) seperti "Location" di UE. */
export function VectorValue({ values, labels = ["X", "Y"], onChange, step, min, precision }) {
  const colors = [UE.axisX, UE.axisY, UE.axisZ];
  return (
    <Flex flex="1" minW="0" gap={1}>
      {values.map((item, index) => (
        <NumberValue
          key={labels[index]}
          axis={labels[index]}
          color={colors[index]}
          value={item}
          step={step}
          min={min}
          precision={precision}
          onChange={(next) => onChange(index, next)}
        />
      ))}
    </Flex>
  );
}

export function ColorValue({ value, options, onChange }) {
  return (
    <Flex flex="1" minW="0" gap={1} align="center">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Box
            key={option.value}
            as="button"
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            boxSize="16px"
            rounded="2px"
            bg={option.swatch}
            borderWidth="1px"
            borderColor={active ? UE.textBright : UE.inputBorder}
            boxShadow={active ? `0 0 0 1px ${UE.accent}` : undefined}
            onClick={() => onChange(option.value)}
          />
        );
      })}
    </Flex>
  );
}

/** Tombol ikon kecil di header kategori / baris (mis. ⊕ tambah, 🗑 hapus). */
export function IconAction({ label, onClick, children }) {
  return (
    <Flex
      as="button"
      type="button"
      align="center"
      justify="center"
      boxSize="18px"
      rounded="2px"
      color={UE.textDim}
      title={label}
      aria-label={label}
      _hover={{ color: UE.textBright, bg: UE.headerHover }}
      onClick={onClick}
    >
      {children}
    </Flex>
  );
}

export function EmptyState({ children }) {
  return (
    <Flex flex="1" align="flex-start" justify="center" pt={8} px={4} textAlign="center" color={UE.textDim} fontSize={FONT_SIZE}>
      {children}
    </Flex>
  );
}
