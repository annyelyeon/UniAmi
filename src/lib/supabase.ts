import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export function getAuthRedirectUrl(path = "/login") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL(normalizedPath, window.location.origin).toString();
    }

    return `http://localhost:8081${normalizedPath}`;
  }

  return Linking.createURL(normalizedPath);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});