import RequireAuth from "@/components/auth/require-auth";

export default function AppLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
