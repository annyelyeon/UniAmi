import { router, Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenShell } from "../src/components/ScreenShell";
import { useAuth } from "../src/context/AuthContext";
import { getUniversityEmailErrorMessage, isAllowedUniversityEmail } from "../src/lib/universityEmail";
import { colors } from "../src/theme/colors";

export default function SignUpScreen() {
  const { signUp, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState("1");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isAllowedUniversityEmail(trimmedEmail)) {
      setLocalError(getUniversityEmailErrorMessage());
      return;
    }

    setLoading(true);
    setLocalError(null);

    const result = await signUp({
      email: trimmedEmail,
      password,
      nickname: nickname.trim(),
      university: university.trim(),
      campus: campus.trim(),
      faculty: faculty.trim(),
      year: year.trim(),
    });

    setLoading(false);

    if (result.success) {
      router.replace({ pathname: "/verify-email", params: { email: trimmedEmail } });
    }
  };

  return (
    <ScreenShell title="Sign up" subtitle="Create your university-only UniAmi account.">
      <ScrollView contentContainerStyle={styles.formCard}>
        <TextInput value={email} onChangeText={setEmail} placeholder="University email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} />
        <TextInput value={nickname} onChangeText={setNickname} placeholder="Nickname" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={university} onChangeText={setUniversity} placeholder="University" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={campus} onChangeText={setCampus} placeholder="Campus" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={faculty} onChangeText={setFaculty} placeholder="Faculty" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={year} onChangeText={setYear} placeholder="Year (1, 2, 3, postgraduate)" placeholderTextColor={colors.muted} style={styles.input} />

        {localError || authError ? <Text style={styles.errorText}>{localError ?? authError}</Text> : null}

        <Pressable accessibilityRole="button" onPress={handleSignUp} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{loading ? "Creating account..." : "Create account"}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable accessibilityRole="button" style={styles.secondaryLinkButton}>
            <Text style={styles.secondaryLinkText}>Back to login</Text>
          </Pressable>
        </Link>
      </ScrollView>
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