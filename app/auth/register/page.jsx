"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Input, Text } from "@chakra-ui/react";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="400px"
      mx="auto"
      my="40px"
      px="24px"
      py="32px"
      bg="bg.panel"
      rounded="lg"
      borderWidth="1px"
      borderColor="border"
    >
      <Text fontSize="xl" fontWeight="bold" textAlign="center" mb="24px">
        Daftar
      </Text>
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <Input
          type="text"
          placeholder="Nama lengkap (opsional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          mb="12px"
        />
        <Input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          mb="12px"
        />
        <Input
          type="password"
          required
          minLength={8}
          placeholder="Password (min. 8 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          mb="20px"
        />
        <Button
          type="submit"
          w="100%"
          colorPalette="green"
          loading={loading}
          disabled={loading}
        >
          Daftar
        </Button>
        {error ? (
          <Text color="red" fontSize="sm" mt="12px">
            {error}
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
  );
}
