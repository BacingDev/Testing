"use client";

import { create } from "zustand";
import { registry } from "@/features/app-renderer/registry";
import { insertTree, moveTree, removeTree, updateTree, findTree } from "@/features/app-editor/tree";

const HISTORY_LIMIT = 50;

function snapshot(definition) {
  return JSON.parse(JSON.stringify(definition));
}

function storageKey(appId) {
  return `app-builder:draft:${appId}`;
}

export function readLocalDraft(appId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(appId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.pages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalDraft(appId, definition) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(appId), JSON.stringify(definition));
  } catch {
    return;
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function withHistory(set, get, nextDefinition) {
  const { definition, past } = get();
  const nextPast = [...past, snapshot(definition)];
  if (nextPast.length > HISTORY_LIMIT) nextPast.shift();
  set({ definition: nextDefinition, past: nextPast, future: [] });
}

function activePage(get) {
  const { definition, pageId } = get();
  return (definition.pages ?? []).find((page) => page.id === pageId) ?? definition.pages[0] ?? null;
}

function setPageComponents(set, get, pageId, components) {
  const { definition } = get();
  withHistory(set, get, {
    ...definition,
    pages: (definition.pages ?? []).map((page) =>
      page.id === pageId ? { ...page, components } : page,
    ),
  });
}

export const useAppEditorStore = create((set, get) => ({
  definition: null,
  pageId: null,
  selectedId: null,
  past: [],
  future: [],
  appId: null,
  serverMode: false,
  saveMessage: "",

  load: (definition, { appId, serverMode }) =>
    set({
      definition: snapshot(definition),
      pageId: definition.pages[0]?.id ?? null,
      selectedId: null,
      past: [],
      future: [],
      appId,
      serverMode: !!serverMode,
      saveMessage: "",
    }),

  selectPage: (pageId) => set({ pageId, selectedId: null }),

  addPage: () => {
    const { definition } = get();
    const pages = definition.pages ?? [];
    let n = pages.length + 1;
    while (pages.some((page) => page.id === `p${n}`)) n += 1;
    const page = { id: `p${n}`, path: `/page-${n}`, title: `Halaman ${n}`, components: [] };
    withHistory(set, get, { ...definition, pages: [...pages, page] });
    set({ pageId: page.id, selectedId: null });
  },

  deletePage: (id) => {
    const { definition, pageId } = get();
    const pages = definition.pages ?? [];
    if (pages.length <= 1) return false;
    const next = pages.filter((page) => page.id !== id);
    withHistory(set, get, { ...definition, pages: next });
    if (pageId === id) set({ pageId: next[0].id, selectedId: null });
    return true;
  },

  updatePage: (id, patch) => {
    const { definition } = get();
    withHistory(set, get, {
      ...definition,
      pages: (definition.pages ?? []).map((page) => (page.id === id ? { ...page, ...patch } : page)),
    });
  },

  selectNode: (id) => set({ selectedId: id }),

  addNode: (type) => {
    const entry = registry[type];
    if (!entry) return;
    const page = activePage(get);
    if (!page) return;
    const node = {
      id: uid("c"),
      type,
      props: { ...(entry.defaultProps ?? {}) },
      style: {},
      children: [],
      events: {},
    };
    setPageComponents(set, get, page.id, [...(page.components ?? []), node]);
    set({ selectedId: node.id });
  },

  updateProps: (id, patch) => {
    const page = activePage(get);
    if (!page) return;
    setPageComponents(
      set,
      get,
      page.id,
      updateTree(page.components, id, (node) => ({ ...node, props: { ...(node.props ?? {}), ...patch } })),
    );
  },

  updateStyle: (id, patch) => {
    const page = activePage(get);
    if (!page) return;
    setPageComponents(
      set,
      get,
      page.id,
      updateTree(page.components, id, (node) => ({ ...node, style: { ...(node.style ?? {}), ...patch } })),
    );
  },

  deleteNode: (id) => {
    const page = activePage(get);
    if (!page) return;
    const { nodes } = removeTree(page.components, id);
    setPageComponents(set, get, page.id, nodes);
    if (get().selectedId === id) set({ selectedId: null });
  },

  setNodeEvent: (id, eventName, action) => {
    const page = activePage(get);
    if (!page) return;
    setPageComponents(
      set,
      get,
      page.id,
      updateTree(page.components, id, (node) => {
        const events = { ...(node.events ?? {}) };
        if (action) events[eventName] = action;
        else delete events[eventName];
        return { ...node, events };
      }),
    );
  },

  moveNode: (id, delta) => {
    const page = activePage(get);
    if (!page) return;
    setPageComponents(set, get, page.id, moveTree(page.components, id, delta));
  },

  selectedNode: () => {
    const { definition, pageId, selectedId } = get();
    if (!selectedId) return null;
    const page = (definition.pages ?? []).find((item) => item.id === pageId);
    return findTree(page?.components ?? [], selectedId);
  },

  undo: () => {
    const { past, definition, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      definition: previous,
      past: past.slice(0, -1),
      future: [snapshot(definition), ...future].slice(0, HISTORY_LIMIT),
      selectedId: null,
    });
  },

  redo: () => {
    const { future, definition, past } = get();
    if (future.length === 0) return;
    const [next, ...rest] = future;
    set({
      definition: next,
      past: [...past, snapshot(definition)].slice(-HISTORY_LIMIT),
      future: rest,
      selectedId: null,
    });
  },

  setSaveMessage: (saveMessage) => set({ saveMessage }),
}));
