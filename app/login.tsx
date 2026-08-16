import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

export default function LoginScreen() {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError("Please enter both university email and password.");
      return;
    }
    setLoading(true);
    setLocalError(null);

    const success = await signIn(email.trim(), password);

    setLoading(false);

    if (success) {
      router.replace("/home");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.centerContainer}>
            <View style={styles.masterCard}>
              <View style={styles.logoFrame}>
                <Image
                  source={require("./assets/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.pageTitle}>Login</Text>
              <Text style={styles.pageSubtitle}>
                Sign in with your university email and password.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>University Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. s8174987@student.vu.edu.au"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPassword}
                    style={[styles.input, styles.passwordInput]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.passwordToggle}
                  >
                    <Text style={styles.passwordToggleText}>{showPassword ? "Hide" : "Show"}</Text>
                  </Pressable>
                </View>
              </View>

              {localError || authError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{localError ?? authError}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Link href="/signup" asChild>
                <Pressable accessibilityRole="button" style={styles.secondaryLinkButton}>
                  <Text style={styles.secondaryLinkText}>Create an account</Text>
                </Pressable>
              </Link>
              <View style={styles.footerBox}>
                <Text style={styles.disclaimerText}>
                  This website/app is for a class assignment and not for commercial purposes.
                </Text>
                <Text style={styles.abnText}>ABN: 12 345 678 910</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  centerContainer: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    gap: 16,
  },
  masterCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  logoFrame: {
    width: 140,
    height: 140,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    alignSelf: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  pageTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
    alignSelf: "center",
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
    alignSelf: "center",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1.5,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  passwordToggleText: {
    color: "#FD0000",
    fontSize: 13,
    fontWeight: "700",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#FD0000",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
    shadowColor: "#FD0000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryLinkButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FD0000",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 13,
  },
  secondaryLinkText: {
    color: "#FD0000",
    fontSize: 14,
    fontWeight: "800",
  },
  footerBox: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  disclaimerText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  abnText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
});