"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flex, Text } from "@chakra-ui/react";

/**
 * Penjaga halaman aplikasi. Kalau tidak ada access_token di localStorage,
 * pengguna dilempar ke halaman login dan tidak bisa melihat isi web.
 */
export default function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    setAuthorized(true);
  }, [router, pathname]);

  if (!authorized) {
    return (
      <Flex
        minHeight="100vh"
        align="center"
        justify="center"
        bg="bg.subtle"
      >
        <Text fontSize="sm" color="fg.muted">
          Memeriksa sesi…
        </Text>
      </Flex>
    );
  }

  return children;
}
