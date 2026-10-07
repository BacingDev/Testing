"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flex, Text } from "@chakra-ui/react";
import {
  getAuthToken,
  getServerAuthToken,
  subscribeAuth,
} from "@/lib/auth-token";

/**
 * Penjaga halaman aplikasi. Kalau tidak ada access_token di localStorage,
 * pengguna dilempar ke halaman login dan tidak bisa melihat isi web.
 */
export default function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeAuth, getAuthToken, getServerAuthToken);

  useEffect(() => {
    if (token === null) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname ?? "/")}`);
    }
  }, [token, router, pathname]);

  if (token === null) {
    return (
      <Flex minHeight="100vh" align="center" justify="center" bg="bg.subtle">
        <Text fontSize="sm" color="fg.muted">
          Memeriksa sesi…
        </Text>
      </Flex>
    );
  }

  return children;
}
