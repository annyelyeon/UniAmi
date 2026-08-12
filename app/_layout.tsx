import { Stack, usePathname, router } from "expo-router";
import { type ReactNode, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../src/context/AuthContext";

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    const isPublicRoute = ["/login", "/signup", "/verify-email"].includes(pathname);
    const inProtectedArea = !isPublicRoute;

    if (!session && inProtectedArea) {
      router.replace("/login");
      return;
    }

    if (session && isPublicRoute) {
      router.replace("/home");
    }
  }, [loading, pathname, segments, session]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </AuthProvider>
    </SafeAreaProvider>
  );
}