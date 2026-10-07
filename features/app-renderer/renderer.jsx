"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Text } from "@chakra-ui/react";
import { notify } from "@/lib/toast";
import { registry } from "@/features/app-renderer/registry";
import { runAction } from "@/features/app-renderer/actions";
import { toChakraStyle } from "@/features/app-renderer/style";

export function normalizePath(path) {
  if (typeof path !== "string" || path === "") return "/";
  const clean = path.split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return `/${clean}`;
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

export function findPageByPath(pages, path) {
  const target = normalizePath(path);
  return (pages ?? []).find((page) => normalizePath(page.path) === target) ?? null;
}

export function RenderNode({ node }) {
  if (!node || typeof node !== "object") return null;
  const entry = registry[node.type];
  if (!entry) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="red.solid" borderRadius="md" p={3}>
        <Text fontSize="sm" color="red.fg">
          Tipe tidak dikenal: {String(node.type)}
        </Text>
      </Box>
    );
  }
  const Component = entry.component;
  const props = { ...(entry.defaultProps ?? {}), ...(node.props ?? {}) };
  const children = (node.children ?? []).map((child) => (
    <RenderNode key={child.id} node={child} />
  ));
  return <Component props={props} style={toChakraStyle(node.style)} nodes={children} />;
}

export function RenderPage({ page }) {
  if (!page) return null;
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      {(page.components ?? []).map((component) => (
        <RenderNode key={component.id} node={component} />
      ))}
    </Box>
  );
}

function collectTables(components, into = new Set()) {
  for (const node of components ?? []) {
    if (node?.props?.table) into.add(node.props.table);
    const submit = node?.events?.onClick;
    if (submit?.action === "submit_form" && submit.table) into.add(submit.table);
    if (node?.children?.length > 0) collectTables(node.children, into);
  }
  return [...into];
}

function RunNode({ node, formId, rt }) {
  if (!node || typeof node !== "object") return null;
  const entry = registry[node.type];
  if (!entry) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="red.solid" borderRadius="md" p={3}>
        <Text fontSize="sm" color="red.fg">
          Tipe tidak dikenal: {String(node.type)}
        </Text>
      </Box>
    );
  }
  const Component = entry.component;
  const props = { ...(entry.defaultProps ?? {}), ...(node.props ?? {}) };
  const childFormId = node.type === "Form" ? node.id : formId;
  const children = (node.children ?? []).map((child) => (
    <RunNode key={child.id} node={child} formId={childFormId} rt={rt} />
  ));
  const extra = {};
  if (node.type === "Input") {
    const key = props.label || node.id;
    extra.value = rt.forms[formId]?.[key] ?? "";
    extra.onInput = (value) => rt.setFormValue(formId, key, value);
  }
  if (node.type === "Button" && node.events?.onClick) {
    extra.onClick = () => rt.runNodeEvent(node, formId);
  }
  if (node.type === "Form") {
    extra.onSubmit = () => rt.submitFormNode(node);
  }
  if (node.type === "List" && props.table) {
    extra.rows = rt.tables[props.table] ?? null;
  }
  if (node.type === "Text") {
    extra.vars = rt.vars;
  }
  return (
    <Component props={props} style={toChakraStyle(node.style)} nodes={children} {...extra} />
  );
}

function emptyPageBlock(message) {
  return (
    <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="lg" p={8} textAlign="center">
      <Text fontSize="sm" color="fg.muted">
        {message}
      </Text>
    </Box>
  );
}

export function AppRenderer({ definition, path, pageId, basePath = "", onNavigate, dataSource }) {
  const router = useRouter();
  const pages = definition?.pages ?? [];
  const [vars, setVars] = useState({});
  const [forms, setForms] = useState({});
  const [tables, setTables] = useState({});
  const formsRef = useRef({});
  formsRef.current = forms;

  const page = (() => {
    if (path !== undefined && path !== null) return findPageByPath(pages, path);
    if (pageId) return pages.find((item) => item.id === pageId) ?? null;
    return pages[0] ?? null;
  })();

  useEffect(() => {
    if (!dataSource?.loadTable || !page) return;
    let active = true;
    for (const name of collectTables(page.components)) {
      dataSource
        .loadTable(name)
        .then((rows) => {
          if (active) setTables((prev) => ({ ...prev, [name]: rows ?? [] }));
        })
        .catch(() => {
          if (active) setTables((prev) => ({ ...prev, [name]: [] }));
        });
    }
    return () => {
      active = false;
    };
  }, [page, dataSource]);

  if (pages.length === 0) return emptyPageBlock("App ini belum punya page.");
  if ((path !== undefined && path !== null) && !page) {
    return (
      <Box borderWidth="1px" borderStyle="dashed" borderColor="border" borderRadius="lg" p={8} textAlign="center">
        <Text fontWeight="bold">404 — halaman tidak ada</Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Tidak ada page untuk path {normalizePath(path)} di app ini.
        </Text>
      </Box>
    );
  }
  if (!page) return emptyPageBlock("App ini belum punya page.");

  const navigate = (to) => {
    const target = String(to || "/");
    if (onNavigate) onNavigate(target);
    else router.push(`${basePath}${target.startsWith("/") ? target : `/${target}`}`);
  };

  const setFormValue = (fid, key, value) => {
    if (!fid) return;
    setForms((prev) => ({ ...prev, [fid]: { ...(prev[fid] ?? {}), [key]: value } }));
  };

  const submitTable = async (table, values) => {
    if (!table) {
      notify({ title: "Form belum memilih tabel", description: "Isi props table di editor.", type: "warning" });
      return;
    }
    if (!dataSource?.submitRow) {
      notify({ title: "Submit (demo)", description: JSON.stringify(values), type: "info" });
      return;
    }
    try {
      await dataSource.submitRow(table, values);
      notify({ title: "Tersimpan", type: "success" });
      try {
        const rows = await dataSource.loadTable(table);
        setTables((prev) => ({ ...prev, [table]: rows ?? [] }));
      } catch {
        return;
      }
    } catch (err) {
      notify({ title: "Gagal menyimpan", description: err instanceof Error ? err.message : String(err), type: "error" });
    }
  };

  const actionCtx = (fid) => ({
    navigate,
    message: (text) => notify({ title: text || "" }),
    setVar: (key, value) => setVars((prev) => ({ ...prev, [key]: value })),
    formValues: () => (fid ? formsRef.current[fid] ?? {} : {}),
    submitForm: submitTable,
    callApi: async (url, method) => {
      try {
        const res = await fetch(url, { method: method || "GET" });
        notify({ title: res.ok ? `OK (${res.status})` : `Gagal (${res.status})`, type: res.ok ? "success" : "error" });
      } catch (err) {
        notify({ title: "API gagal", description: err instanceof Error ? err.message : String(err), type: "error" });
      }
    },
  });

  const rt = {
    vars,
    forms,
    tables,
    setFormValue,
    runNodeEvent: (node, fid) => runAction(node.events?.onClick, actionCtx(fid)),
    submitFormNode: (node) => submitTable(node.props?.table || "", formsRef.current[node.id] ?? {}),
  };

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      {(page.components ?? []).map((component) => (
        <RunNode key={component.id} node={component} formId={null} rt={rt} />
      ))}
    </Box>
  );
}
