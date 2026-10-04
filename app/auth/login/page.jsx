"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, HStack, IconButton, Input, Text } from "@chakra-ui/react";
import { TbEye, TbEyeOff, TbHierarchy2 } from "react-icons/tb";

// Gateway nginx memangkas prefix /api/<service>, jadi path lengkapnya:
// /api/user-management/ -> http://127.0.0.1:8001/ (service IDP/OAuth)
const LOGIN_URL = "/api/user-management/v1/auth/login/json";

function readError(data, fallback) {
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg ?? JSON.stringify(d)).join(", ");
  }
  if (typeof detail === "string" && detail) return detail;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sudah login? Langsung ke halaman utama, tidak perlu lihat form lagi.
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
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(readError(data, `Login gagal (HTTP ${res.status})`));
      }
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      router.push("/");
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
          Selamat datang kembali
        </Text>
        <Text fontSize="sm" color="fg.muted" textAlign="center" mt="4px" mb="24px">
          Masuk untuk mengelola workflow Anda
        </Text>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
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
              autoComplete="current-password"
              placeholder="Password Anda"
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
            colorPalette="blue"
            loading={loading}
            disabled={loading}
          >
            Masuk
          </Button>
          {error ? (
            <Text color="red" fontSize="sm" mt="12px">
              {error}
            </Text>
          ) : null}
        </form>
        <Text fontSize="sm" color="fg.muted" textAlign="center" mt="20px">
          Belum punya akun?{" "}
          <Link href="/auth/register" style={{ fontWeight: 600 }}>
            Daftar sekarang
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}
