"use client";

import { useState } from "react";
import { Box, Button, Field, HStack, Input, Separator, Text } from "@chakra-ui/react";
import { TbDeviceFloppy, TbRedo, TbTrash, TbUndo } from "react-icons/tb";
import { registry } from "@/features/app-renderer/registry";
import { ACTION_PARAM_SCHEMAS, ACTION_TYPES } from "@/features/app-renderer/actions";
import { useAppEditorStore, writeLocalDraft } from "@/features/app-editor/store";
import { saveAppDefinition } from "@/lib/apps-api";

function coerce(schema, current, raw) {
  if (schema.input === "boolean") return !!raw;
  if (schema.input === "number") {
    const num = Number(raw);
    return Number.isFinite(num) ? num : current ?? 0;
  }
  if (Array.isArray(current)) {
    return String(raw ?? "")
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (typeof current === "number") {
    const num = Number(raw);
    return Number.isFinite(num) ? num : current;
  }
  return raw;
}

function displayValue(current) {
  if (Array.isArray(current)) return current.join("\n");
  return current ?? "";
}

function PropField({ schema, current, onChange }) {
  if (schema.input === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <input type="checkbox" checked={!!current} onChange={(event) => onChange(coerce(schema, current, event.target.checked))} />
        {schema.label}
      </label>
    );
  }
  if (schema.input === "select") {
    return (
      <Field.Root>
        <Field.Label>{schema.label}</Field.Label>
        <select
          value={displayValue(current)}
          onChange={(event) => onChange(coerce(schema, current, event.target.value))}
          style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", width: "100%" }}
        >
          {(schema.options ?? []).map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {String(opt)}
            </option>
          ))}
        </select>
      </Field.Root>
    );
  }
  if (schema.input === "textarea") {
    return (
      <Field.Root>
        <Field.Label>{schema.label}</Field.Label>
        <textarea
          rows={3}
          value={displayValue(current)}
          onChange={(event) => onChange(coerce(schema, current, event.target.value))}
          style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", width: "100%", fontFamily: "inherit" }}
        />
      </Field.Root>
    );
  }
  return (
    <Field.Root>
      <Field.Label>{schema.label}</Field.Label>
      <Input
        size="sm"
        type={schema.input === "number" ? "number" : "text"}
        value={displayValue(current)}
        onChange={(event) => onChange(coerce(schema, current, event.target.value))}
      />
    </Field.Root>
  );
}

const RADIUS_OPTIONS = ["none", "xs", "sm", "md", "lg", "xl", "full"];

export default function PropertyPanel({ onSaved }) {
  const definition = useAppEditorStore((state) => state.definition);
  const pageId = useAppEditorStore((state) => state.pageId);
  const selectPage = useAppEditorStore((state) => state.selectPage);
  const addPage = useAppEditorStore((state) => state.addPage);
  const deletePage = useAppEditorStore((state) => state.deletePage);
  const updatePage = useAppEditorStore((state) => state.updatePage);
  const selectedNode = useAppEditorStore((state) => state.selectedNode());
  const updateProps = useAppEditorStore((state) => state.updateProps);
  const updateStyle = useAppEditorStore((state) => state.updateStyle);
  const setNodeEvent = useAppEditorStore((state) => state.setNodeEvent);
  const deleteNode = useAppEditorStore((state) => state.deleteNode);
  const undo = useAppEditorStore((state) => state.undo);
  const redo = useAppEditorStore((state) => state.redo);
  const canUndo = useAppEditorStore((state) => state.past.length > 0);
  const canRedo = useAppEditorStore((state) => state.future.length > 0);
  const appId = useAppEditorStore((state) => state.appId);
  const serverMode = useAppEditorStore((state) => state.serverMode);
  const saveMessage = useAppEditorStore((state) => state.saveMessage);
  const setSaveMessage = useAppEditorStore((state) => state.setSaveMessage);
  const [saving, setSaving] = useState(false);
  const [newPath, setNewPath] = useState("");

  if (!definition) return null;

  const pages = definition.pages ?? [];
  const page = pages.find((item) => item.id === pageId) ?? pages[0];
  const entry = selectedNode ? registry[selectedNode.type] : null;
  const style = selectedNode?.style ?? {};

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const current = useAppEditorStore.getState().definition;
    writeLocalDraft(appId, current);
    if (serverMode) {
      try {
        await saveAppDefinition(appId, current);
        setSaveMessage("Draft tersimpan ke server + lokal.");
      } catch (err) {
        setSaveMessage(`Server gagal (${err instanceof Error ? err.message : String(err)}). Tersimpan lokal.`);
      }
    } else {
      setSaveMessage("Draft tersimpan lokal (server belum tersedia).");
    }
    setSaving(false);
    onSaved?.();
  };

  const handleDeletePage = () => {
    if (!page) return;
    if (!window.confirm(`Hapus halaman "${page.title}"?`)) return;
    const ok = deletePage(page.id);
    if (!ok) setSaveMessage("App harus punya minimal satu halaman.");
  };

  return (
    <Box display="flex" flexDirection="column" gap={4} px={3} py={3}>
      <HStack gap={1}>
        <Button size="xs" variant="outline" disabled={!canUndo} onClick={undo} title="Urungkan">
          <TbUndo size={14} />
          Undo
        </Button>
        <Button size="xs" variant="outline" disabled={!canRedo} onClick={redo} title="Ulangi">
          <TbRedo size={14} />
          Redo
        </Button>
        <Button size="xs" colorPalette="blue" loading={saving} onClick={handleSave} title="Simpan draft">
          <TbDeviceFloppy size={14} />
          Simpan
        </Button>
      </HStack>
      {saveMessage ? (
        <Text fontSize="xs" color="fg.muted">
          {saveMessage}
        </Text>
      ) : null}

      <Separator />

      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Halaman ({pages.length})
        </Text>
        <Box display="flex" flexDirection="column" gap={1.5}>
          {pages.map((item) => (
            <Button
              key={item.id}
              size="xs"
              variant={item.id === page?.id ? "solid" : "outline"}
              colorPalette={item.id === page?.id ? "blue" : "gray"}
              justifyContent="flex-start"
              onClick={() => selectPage(item.id)}
            >
              {item.title} · {item.path}
            </Button>
          ))}
          <Button size="xs" variant="ghost" onClick={addPage}>
            + Halaman
          </Button>
        </Box>
        {page ? (
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <Field.Root>
              <Field.Label>Judul halaman</Field.Label>
              <Input size="sm" value={page.title} onChange={(event) => updatePage(page.id, { title: event.target.value })} />
            </Field.Root>
            <HStack gap={1.5}>
              <Input
                size="sm"
                placeholder="/path-baru"
                value={newPath}
                onChange={(event) => setNewPath(event.target.value)}
              />
              <Button
                size="xs"
                variant="outline"
                disabled={!newPath.startsWith("/")}
                onClick={() => {
                  if (pages.some((item) => item.path === newPath && item.id !== page.id)) {
                    setSaveMessage("Path sudah dipakai halaman lain.");
                    return;
                  }
                  updatePage(page.id, { path: newPath });
                  setNewPath("");
                }}
              >
                Path
              </Button>
              <Button size="xs" variant="outline" colorPalette="red" onClick={handleDeletePage} title="Hapus halaman ini">
                <TbTrash size={14} />
              </Button>
            </HStack>
          </Box>
        ) : null}
      </Box>

      <Separator />

      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Properti
        </Text>
        {!selectedNode ? (
          <Text fontSize="xs" color="fg.muted">
            Klik komponen di canvas untuk mengubah props dan style.
          </Text>
        ) : !entry ? (
          <Text fontSize="xs" color="red.fg">
            Tipe {selectedNode.type} tidak dikenal registry.
          </Text>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Text fontSize="xs" color="fg.muted">
              {selectedNode.type} · {selectedNode.id}
            </Text>
            {(entry.propSchema ?? []).map((schema) => (
              <PropField
                key={schema.key}
                schema={schema}
                current={selectedNode.props?.[schema.key] ?? entry.defaultProps?.[schema.key]}
                onChange={(value) => updateProps(selectedNode.id, { [schema.key]: value })}
              />
            ))}
            <Text fontSize="xs" fontWeight="semibold" mt={1}>
              Style (token)
            </Text>
            <Field.Root>
              <Field.Label>Background (mis. blue-600)</Field.Label>
              <Input
                size="sm"
                value={style.bg ?? ""}
                placeholder="blue-600"
                onChange={(event) => updateStyle(selectedNode.id, { bg: event.target.value || undefined })}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Radius</Field.Label>
              <select
                value={style.radius ?? ""}
                onChange={(event) => updateStyle(selectedNode.id, { radius: event.target.value || undefined })}
                style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", width: "100%" }}
              >
                <option value="">—</option>
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field.Root>
            <Field.Root>
              <Field.Label>Padding</Field.Label>
              <Input
                size="sm"
                type="number"
                value={style.p ?? ""}
                placeholder="6"
                onChange={(event) => {
                  const num = Number(event.target.value);
                  updateStyle(selectedNode.id, { p: event.target.value === "" ? undefined : num });
                }}
              />
            </Field.Root>
            <Button size="xs" variant="outline" colorPalette="red" onClick={() => deleteNode(selectedNode.id)}>
              <TbTrash size={14} />
              Hapus komponen
            </Button>
            <Text fontSize="xs" fontWeight="semibold" mt={1}>
              Event onClick
            </Text>
            <Field.Root>
              <Field.Label>Aksi</Field.Label>
              <select
                value={selectedNode.events?.onClick?.action ?? ""}
                onChange={(event) => {
                  const action = event.target.value;
                  setNodeEvent(selectedNode.id, "onClick", action ? { action } : null);
                }}
                style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", width: "100%" }}
              >
                <option value="">— tidak ada —</option>
                {ACTION_TYPES.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </Field.Root>
            {(ACTION_PARAM_SCHEMAS[selectedNode.events?.onClick?.action] ?? []).map((schema) => (
              <PropField
                key={schema.key}
                schema={schema}
                current={selectedNode.events?.onClick?.[schema.key] ?? ""}
                onChange={(value) =>
                  setNodeEvent(selectedNode.id, "onClick", {
                    ...(selectedNode.events?.onClick ?? {}),
                    [schema.key]: value,
                  })
                }
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
