"use client";

import { useState } from "react";
import { Box, FormControl, Input, Label, Button, Text, ErrorMessage } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registrasi gagal");
      if (data.access_token) localStorage.setItem("access_token", data.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registrasi gagal");
    }
  };

  return (
    <Box w="100%" maxW="400px" mx="auto" my="20px" py="40px" bg="bg.panel" rounded="lg">
      <Box textAlign="center" mb="30px">
        <Text fontSize="xl" fontWeight="bold" color="fg">
          Daftar
        </Text>
      </Box>
      <FormControl onSubmit={handleSubmit} sx={{ maxW: "400px", width: "100%" }}>
        <Input
          placeholder="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          mb="16px"
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          isInvalid={!!error}
          mb="16px"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          isInvalid={!!error}
          mb="24px"
        />
        <Button type="submit" w="100%" mb="8px" colorPalette="green">
          Daftar
        </Button>
        {error && <ErrorMessage color="red" mt="4px">{error}</ErrorMessage>}
        <Box textAlign="center" mt="20px">
          <Text color="fg.muted" fontSize="sm">
            Sudah punya akun? <Link href="/login" color="blue.fg" fontWeight="semibold">
              Masuk sekarang
            </Link>
          </Text>
        </Box>
      </FormControl>
    </Box>
  );
}