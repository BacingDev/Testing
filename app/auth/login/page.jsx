"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Input, Text } from "@chakra-ui/react";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        Masuk
      </Text>
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          mb="20px"
        />
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
  );
}
