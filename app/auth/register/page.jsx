"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, HStack, IconButton, Input, Text } from "@chakra-ui/react";
import { TbEye, TbEyeOff, TbHierarchy2 } from "react-icons/tb";

// Gateway nginx memangkas prefix /api/<service>, jadi path lengkapnya:
// /api/user-management/ -> http://127.0.0.1:8001/ (service IDP/OAuth)
const REGISTER_URL = "/api/user-management/v1/auth/register";

function readError(data, fallback) {
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg ?? JSON.stringify(d)).join(", ");
  }
  if (typeof detail === "string" && detail) return detail;
  return fallback;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sudah login? Langsung ke halaman utama, tidak perlu daftar lagi.
  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Kontrak BE (UserCreate): email + password wajib, full_name opsional.
        // Register mengembalikan 201 UserRead (tanpa token), jadi setelah
        // sukses arahkan ke halaman login.
        body: JSON.stringify({
          email,
          password,
          ...(fullName ? { full_name: fullName } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(readError(data, `Registrasi gagal (HTTP ${res.status})`));
      }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minHeight="100vh"
      align="center"
      justify="center"
      bg="bg.subtle"
      px={4}
      py={10}
    >
      <Box
        w="100%"
        maxW="400px"
        px="28px"
        py="32px"
        bg="bg.panel"
        rounded="lg"
        borderWidth="1px"
        borderColor="border"
      >
        <HStack gap={1.5} justify="center" color="fg" mb="8px">
          <TbHierarchy2 size={18} />
          <Text fontSize="sm" fontWeight="bold" letterSpacing="tight">
            Workflow Studio
          </Text>
        </HStack>
        <Text fontSize="xl" fontWeight="bold" textAlign="center">
          Buat akun baru
        </Text>
        <Text fontSize="sm" color="fg.muted" textAlign="center" mt="4px" mb="24px">
          Daftar untuk mulai mengelola workflow
        </Text>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <Text fontSize="sm" fontWeight="semibold" mb="6px">
            Nama lengkap
          </Text>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Nama Anda (opsional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            mb="14px"
          />
          <Text fontSize="sm" fontWeight="semibold" mb="6px">
            Email
          </Text>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            mb="14px"
          />
          <Text fontSize="sm" fontWeight="semibold" mb="6px">
            Password
          </Text>
          <Flex gap={2} mb="20px">
            <Input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min. 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              flex="1"
              minWidth="0"
            />
            <IconButton
              variant="outline"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <TbEyeOff size={16} /> : <TbEye size={16} />}
            </IconButton>
          </Flex>
          <Button
            type="submit"
            w="100%"
            colorPalette="green"
            loading={loading}
            disabled={loading || success}
          >
            Daftar
          </Button>
          {error ? (
            <Text color="red" fontSize="sm" mt="12px">
              {error}
            </Text>
          ) : null}
          {success ? (
            <Text color="green" fontSize="sm" mt="12px">
              Pendaftaran berhasil! Mengalihkan ke halaman masuk…
            </Text>
          ) : null}
        </form>
        <Text fontSize="sm" color="fg.muted" textAlign="center" mt="20px">
          Sudah punya akun?{" "}
          <Link href="/auth/login" style={{ fontWeight: 600 }}>
            Masuk sekarang
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}
