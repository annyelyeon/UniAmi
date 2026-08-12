import { router, Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenShell } from "../src/components/ScreenShell";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function LoginScreen() {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setLocalError(null);

    const success = await signIn(email.trim(), password);

    setLoading(false);

    if (success) {
      router.replace("/home");
    }
  };

  return (
    <ScreenShell title="Login" subtitle="Sign in with your university email and password.">
      <View style={styles.formCard}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="University email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
        />

        {localError || authError ? (
          <Text style={styles.errorText}>{localError ?? authError}</Text>
        ) : null}

        <Pressable accessibilityRole="button" onPress={handleLogin} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Login"}</Text>
        </Pressable>

        <Link href="/signup" asChild>
          <Pressable accessibilityRole="button" style={styles.secondaryLinkButton}>
            <Text style={styles.secondaryLinkText}>Create an account</Text>
          </Pressable>
        </Link>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  input: {
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  errorText: {
    color: colors.brandRed,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryLinkButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryLinkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
  },
});