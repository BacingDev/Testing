export const UNIT_CATEGORIES = [
  { key: "layout", label: "Layout" },
  { key: "data", label: "Data" },
  { key: "form", label: "Formulir" },
  { key: "action", label: "Aksi" },
];

export const UNIT_CATALOG = [
  {
    id: "page",
    name: "PAGE",
    label: "Page",
    category: "layout",
    image: "/components/page.svg",
    width: 200,
    height: 140,
  },
  {
    id: "container",
    name: "CONTAINER",
    label: "Container",
    category: "layout",
    image: "/components/container.svg",
    width: 200,
    height: 120,
  },
  {
    id: "header",
    name: "HEADER",
    label: "Header",
    category: "layout",
    image: "/components/header.svg",
    width: 200,
    height: 100,
  },
  {
    id: "table",
    name: "TABLE",
    label: "Data Table",
    category: "data",
    image: "/components/table.svg",
    width: 220,
    height: 140,
  },
  {
    id: "chart",
    name: "CHART",
    label: "Chart",
    category: "data",
    image: "/components/chart.svg",
    width: 200,
    height: 140,
  },
  {
    id: "text",
    name: "TEXT",
    label: "Text",
    category: "data",
    image: "/components/text.svg",
    width: 180,
    height: 100,
  },
  {
    id: "image",
    name: "IMAGE",
    label: "Image",
    category: "data",
    image: "/components/image.svg",
    width: 180,
    height: 120,
  },
  {
    id: "form",
    name: "FORM",
    label: "Form",
    category: "form",
    image: "/components/form.svg",
    width: 200,
    height: 140,
  },
  {
    id: "text-input",
    name: "TEXT-INPUT",
    label: "Text Input",
    category: "form",
    image: "/components/text-input.svg",
    width: 200,
    height: 100,
  },
  {
    id: "select",
    name: "SELECT",
    label: "Select",
    category: "form",
    image: "/components/select.svg",
    width: 200,
    height: 100,
  },
  {
    id: "button",
    name: "BUTTON",
    label: "Button",
    category: "action",
    image: "/components/button.svg",
    width: 180,
    height: 100,
  },
];

const byId = UNIT_CATALOG.reduce((map, unit) => {
  map[unit.id] = unit;
  return map;
}, {});

export const UNIT_CATALOG_BY_ID = byId;

export function getUnitsByCategory(categoryKey) {
  return UNIT_CATALOG.filter((unit) => unit.category === categoryKey);
}
