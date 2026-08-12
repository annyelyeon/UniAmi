import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../src/components/ScreenShell";
import { useAuth } from "../src/context/AuthContext";
import { supabase } from "../src/lib/supabase";
import { colors } from "../src/theme/colors";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { session, refreshProfile } = useAuth();

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await refreshProfile();
        router.replace("/home");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshProfile]);

  useEffect(() => {
    if (session?.user) {
      router.replace("/home");
    }
  }, [session]);

  return (
    <ScreenShell title="Check your email" subtitle="Finish verifying your account to enter UniAmi.">
      <View style={styles.card}>
        <Text style={styles.bodyText}>
          We sent a verification link to {email ?? "your university inbox"}. Once Supabase confirms
          the email is verified, you will be sent into the app automatically.
        </Text>

        <Pressable accessibilityRole="button" onPress={() => router.replace("/login")} style={styles.button}>
          <Text style={styles.buttonText}>Back to login</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 13,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});