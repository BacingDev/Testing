"use client";

import { UNIT_CATALOG_BY_ID } from "@/data/unit-catalog";

export const APP_TO_UNIT = {
  Text: "text",
  Heading: "heading",
  Button: "button",
  Image: "image",
  Input: "text-input",
  Form: "form",
  Container: "container",
  List: "list",
  Card: "card",
};

export const UNIT_TO_APP = Object.fromEntries(
  Object.entries(APP_TO_UNIT).map(([app, unit]) => [unit, app]),
);

const ROW_GAP = 170;
const CHILD_GAP = 140;

function unitOf(type) {
  return UNIT_CATALOG_BY_ID[APP_TO_UNIT[type] ?? ""];
}

function displayLabel(type, props) {
  return (
    props.label || props.title || props.text || props.table || type
  );
}

function forwardWidget(type, props, extra) {
  const widget = { ...(props ?? {}), ...(extra ?? {}) };
  if (type === "Button") {
    widget.text = props?.label ?? widget.text ?? "Button";
    delete widget.label;
  }
  if (type === "Image") {
    delete widget.src;
  }
  if (type === "Container") {
    delete widget.gap;
  }
  return widget;
}

export function appPageToNodes(page) {
  const nodes = [];
  const walk = (components, parentId, baseX, baseY) => {
    (components ?? []).forEach((component, index) => {
      const unit = unitOf(component.type);
      if (!unit) return;
      const y = baseY + index * (parentId ? CHILD_GAP : ROW_GAP);
      const id = String(component.id);
      nodes.push({
        id,
        type: "workflow",
        position: { x: parentId ? 24 : 80, y: parentId ? y - baseY + 24 : y },
        width: unit.width ?? 200,
        height: unit.height ?? 120,
        zIndex: 10,
        ...(parentId ? { parentId, extent: "parent" } : {}),
        data: {
          label: displayLabel(component.type, component.props ?? {}),
          image: unit.image,
          shown: "T",
          style: {},
          ports: [],
          unitId: unit.id,
          widget: forwardWidget(component.type, component.props, null),
          ...(component.type === "Image" && component.props?.src
            ? { image: component.props.src }
            : {}),
          appType: component.type,
          appEvents: component.events ?? {},
          appStyle: component.style ?? {},
          appExtra:
            component.type === "Container" && component.props?.gap !== undefined
              ? { gap: component.props.gap }
              : {},
          ...(parentId ? { parentKey: parentId } : {}),
        },
      });
      walk(component.children, id, baseX, y);
    });
  };
  walk(page?.components, null, 80, 40);
  return nodes;
}

function backwardProps(unitId, node) {
  const widget = node.data?.widget ?? {};
  const extra = node.data?.appExtra ?? {};
  switch (unitId) {
    case "button":
      return {
        label: widget.text ?? "Button",
        variant: widget.variant ?? "solid",
        color: widget.color ?? "blue",
        size: widget.size ?? "md",
      };
    case "text-input":
      return { label: widget.label ?? "", placeholder: widget.placeholder ?? "" };
    case "image":
      return { src: node.data?.image ?? "", alt: widget.alt ?? "" };
    case "heading":
      return {
        text: widget.text ?? "",
        level: [1, 2, 3].includes(widget.level) ? widget.level : 1,
        align: widget.align ?? "left",
      };
    case "list": {
      const items = Array.isArray(widget.items)
        ? widget.items
        : String(widget.items ?? "")
            .split("\n")
            .map((part) => part.trim())
            .filter(Boolean);
      return { items, table: widget.table ?? "", field: widget.field ?? "" };
    }
    case "card":
      return { title: widget.title ?? "" };
    case "form":
      return {
        title: widget.title ?? "",
        submitText: widget.submitText ?? "",
        table: widget.table ?? "",
      };
    case "container":
      return { direction: widget.direction ?? "column", ...(extra.gap !== undefined ? { gap: extra.gap } : {}) };
    case "text":
      return {
        text: widget.text ?? "",
        size: widget.size ?? "md",
        align: widget.align ?? "left",
        bold: !!widget.bold,
      };
    default:
      return null;
  }
}

function orderByPosition(list) {
  return [...list].sort(
    (a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0),
  );
}

export function canvasToComponents(nodes) {
  const list = nodes ?? [];
  const byId = new Map(list.map((node) => [node.id, node]));
  const childrenOf = new Map();
  for (const node of list) {
    const parent = node.parentId ?? node.data?.parentKey ?? null;
    if (parent && parent !== node.id && byId.has(String(parent))) {
      const key = String(parent);
      if (!childrenOf.has(key)) childrenOf.set(key, []);
      childrenOf.get(key).push(node);
      continue;
    }
    if (!childrenOf.has("")) childrenOf.set("", []);
    childrenOf.get("").push(node);
  }
  let skipped = 0;
  const build = (node) => {
    const unitId = node.data?.unitId;
    const appType = node.data?.appType || UNIT_TO_APP[unitId];
    const props = appType ? backwardProps(unitId, node) : null;
    if (!appType || !props) {
      skipped += 1;
      return null;
    }
    const kids = orderByPosition(childrenOf.get(node.id) ?? [])
      .map(build)
      .filter(Boolean);
    return {
      id: String(node.id),
      type: appType,
      props,
      style: node.data?.appStyle ?? {},
      children: kids,
      events: node.data?.appEvents ?? {},
    };
  };
  const components = orderByPosition(childrenOf.get("") ?? []).map(build).filter(Boolean);
  return { components, skipped };
}
