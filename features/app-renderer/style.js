const COLOR_PATTERN = /^[a-z]+-\d{2,3}$/;
const RADIUS_TOKENS = new Set(["none", "xs", "sm", "md", "lg", "xl", "full"]);
const SPACING_PATTERN = /^\d+$/;

export function toChakraColor(token) {
  if (typeof token !== "string" || !COLOR_PATTERN.test(token)) return undefined;
  const dash = token.lastIndexOf("-");
  return `${token.slice(0, dash)}.${token.slice(dash + 1)}`;
}

export function toChakraStyle(style) {
  if (!style || typeof style !== "object") return {};
  const out = {};
  const bg = toChakraColor(style.bg);
  if (bg) out.bg = bg;
  const color = toChakraColor(style.color);
  if (color) out.color = color;
  if (typeof style.radius === "string" && RADIUS_TOKENS.has(style.radius)) {
    out.borderRadius = style.radius;
  }
  for (const key of ["p", "px", "py", "m", "mt", "mb"]) {
    const value = style[key];
    if (typeof value === "number" || (typeof value === "string" && SPACING_PATTERN.test(value))) {
      out[key] = value;
    }
  }
  if (["left", "center", "right"].includes(style.align)) {
    out.textAlign = style.align;
  }
  return out;
}
