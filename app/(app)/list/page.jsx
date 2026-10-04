"use client";

import { useEffect, useState } from "react";
import { Badge, Box, Button, Flex, HStack, Input, Text } from "@chakra-ui/react";
import { TbCheck, TbPencil, TbPlus, TbTrash, TbX } from "react-icons/tb";
import Navbar from "@/components/layout/navbar";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "@/lib/items-api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value) {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
}

export default function ListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    listItems()
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (submitting || !title.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const created = await createItem({
        title: title.trim(),
        description: description.trim(),
      });
      setItems((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDone = async (item) => {
    setError("");
    setBusyId(item.id);
    try {
      const updated = await updateItem(item.id, { is_done: !item.is_done });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async (item) => {
    if (!editTitle.trim()) return;
    setError("");
    setBusyId(item.id);
    try {
      const updated = await updateItem(item.id, {
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
      });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus "${item.title}"?`)) return;
    setError("");
    setBusyId(item.id);
    try {
      await deleteItem(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Navbar />
      <Box
        as="main"
        width="100%"
        maxW="820px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 8, md: 12 }}
      >
        <Flex align="center" justify="space-between" gap={3} mb={6}>
          <Box>
            <HStack gap={2} mb={2}>
              <Badge colorPalette="green" variant="subtle">
                List Item
              </Badge>
              <Text fontSize="xs" color="fg.muted">
                {items.length} item
              </Text>
            </HStack>
            <Text as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" letterSpacing="tight">
              Daftar Item
            </Text>
            <Text mt={1} color="fg.muted" fontSize="sm">
              Terhubung ke service list-item (CRUD penuh).
            </Text>
          </Box>
        </Flex>

        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.panel"
          p={4}
          mb={6}
        >
          <form onSubmit={handleCreate} style={{ width: "100%" }}>
            <Text fontSize="sm" fontWeight="semibold" mb="6px">
              Tambah item baru
            </Text>
            <Flex direction={{ base: "column", md: "row" }} gap={2}>
              <Input
                required
                placeholder="Judul item"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                flex="1"
                minWidth="0"
              />
              <Input
                placeholder="Deskripsi (opsional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                flex="1"
                minWidth="0"
              />
              <Button
                type="submit"
                colorPalette="green"
                loading={submitting}
                disabled={submitting}
              >
                <TbPlus size={16} />
                Tambah
              </Button>
            </Flex>
          </form>
        </Box>

        {error ? (
          <Text color="red" fontSize="sm" mb={4}>
            {error}
          </Text>
        ) : null}

        {loading ? (
          <Text fontSize="sm" color="fg.muted">
            Memuat item…
          </Text>
        ) : items.length === 0 ? (
          <Box
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.panel"
            p={8}
            textAlign="center"
          >
            <Text fontWeight="semibold">Belum ada item</Text>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Tambahkan item pertama lewat form di atas.
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={3}>
            {items.map((item) => (
              <Box
                key={item.id}
                borderWidth="1px"
                borderColor="border"
                borderRadius="lg"
                bg="bg.panel"
                p={4}
              >
                {editingId === item.id ? (
                  <Box>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      mb={2}
                      placeholder="Judul item"
                    />
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      mb={3}
                      placeholder="Deskripsi (opsional)"
                    />
                    <HStack gap={2}>
                      <Button
                        size="xs"
                        colorPalette="blue"
                        loading={busyId === item.id}
                        onClick={() => handleSaveEdit(item)}
                      >
                        <TbCheck size={14} />
                        Simpan
                      </Button>
                      <Button size="xs" variant="outline" onClick={cancelEdit}>
                        <TbX size={14} />
                        Batal
                      </Button>
                    </HStack>
                  </Box>
                ) : (
                  <Flex align="flex-start" justify="space-between" gap={3}>
                    <Box minWidth="0" flex="1">
                      <HStack gap={2} mb={1}>
                        <Text fontWeight="semibold" color={item.is_done ? "fg.muted" : "fg"}>
                          {item.title}
                        </Text>
                        <Badge
                          size="sm"
                          variant="subtle"
                          colorPalette={item.is_done ? "green" : "gray"}
                        >
                          {item.is_done ? "Selesai" : "Belum"}
                        </Badge>
                      </HStack>
                      {item.description ? (
                        <Text fontSize="sm" color="fg.muted">
                          {item.description}
                        </Text>
                      ) : null}
                      <Text fontSize="xs" color="fg.muted" mt={1}>
                        {formatDate(item.created_at)}
                      </Text>
                    </Box>
                    <HStack gap={1} flexShrink="0">
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette={item.is_done ? "gray" : "green"}
                        title={item.is_done ? "Tandai belum selesai" : "Tandai selesai"}
                        loading={busyId === item.id}
                        onClick={() => handleToggleDone(item)}
                      >
                        <TbCheck size={14} />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        title="Ubah"
                        onClick={() => startEdit(item)}
                      >
                        <TbPencil size={14} />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="red"
                        title="Hapus"
                        onClick={() => handleDelete(item)}
                      >
                        <TbTrash size={14} />
                      </Button>
                    </HStack>
                  </Flex>
                )}
              </Box>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
