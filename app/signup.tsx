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
import {
  getUniversityEmailErrorMessage,
  isAllowedUniversityEmail,
  UNIVERSITY_EMAIL_LOOKUP,
} from "../src/lib/universityEmail";
import { colors } from "../src/theme/colors";

const normalizeField = (value: string) => value.replace(/\s+/g, " ").trim();

const DISALLOWED_NICKNAME_TOKENS = [
  "admin",
  "administrator",
  "moderator",
  "support",
  "staff",
  "official",
  "uniami",
  "owner",
];

const VALID_YEAR_OPTIONS = new Set(["1", "2", "3", "4", "5", "6", "postgraduate"]);

export default function SignUpScreen() {
  const { signUp, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const requiredFields = [
      ["email", email],
      ["password", password],
      ["nickname", nickname],
      ["university", university],
      ["campus", campus],
      ["faculty", faculty],
      ["year", year],
    ] as const;

    for (const [, value] of requiredFields) {
      if (!value || !value.trim()) {
        setLocalError("Please complete all required fields before creating your account.");
        return;
      }
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedNickname = normalizeField(nickname);
    const trimmedUniversity = normalizeField(university);
    const trimmedCampus = normalizeField(campus);
    const trimmedFaculty = normalizeField(faculty);
    const trimmedYear = normalizeField(year).toLowerCase();

    if (!trimmedEmail.includes("@")) {
      setLocalError("Enter a valid university email address.");
      return;
    }

    if (!isAllowedUniversityEmail(trimmedEmail)) {
      setLocalError(getUniversityEmailErrorMessage(trimmedEmail));
      return;
    }

    const expectedUniversity = UNIVERSITY_EMAIL_LOOKUP[trimmedEmail.split("@")[1] as keyof typeof UNIVERSITY_EMAIL_LOOKUP]?.university;

    if (!expectedUniversity) {
      setLocalError(getUniversityEmailErrorMessage(trimmedEmail));
      return;
    }

    if (trimmedUniversity.length < 2 || trimmedUniversity.toLowerCase() !== expectedUniversity.toLowerCase()) {
      setLocalError(
        `University must match your email domain: ${expectedUniversity}.`
      );
      return;
    }

    const allowedCampuses = UNIVERSITY_EMAIL_LOOKUP[
      trimmedEmail.split("@")[1] as keyof typeof UNIVERSITY_EMAIL_LOOKUP
    ]?.campuses.map((campusName) => campusName.toLowerCase());

    if (!allowedCampuses || !allowedCampuses.includes(trimmedCampus.toLowerCase())) {
      setLocalError(
        `Campus must be one of: ${UNIVERSITY_EMAIL_LOOKUP[trimmedEmail.split("@")[1] as keyof typeof UNIVERSITY_EMAIL_LOOKUP]?.campuses.join(", ")}.`
      );
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/.test(password)) {
      setLocalError(
        "Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number."
      );
      return;
    }

    if (!/^[A-Za-z0-9]{2,20}$/.test(trimmedNickname)) {
      setLocalError(
        "Nickname must be 2-20 letters or numbers only, with no special characters or spaces."
      );
      return;
    }

    const normalizedNickname = trimmedNickname.toLowerCase();
    if (DISALLOWED_NICKNAME_TOKENS.some((token) => normalizedNickname.includes(token))) {
      setLocalError("Nickname cannot include admin or staff-style names.");
      return;
    }

    if (!/[A-Za-z]/.test(trimmedFaculty) || trimmedFaculty.length < 2 || /[^A-Za-z0-9\s&'().,-]/.test(trimmedFaculty)) {
      setLocalError("Faculty must contain at least 2 valid letters and use standard text characters.");
      return;
    }

    if (!VALID_YEAR_OPTIONS.has(trimmedYear)) {
      setLocalError("Please enter a valid year of study: 1, 2, 3, 4, 5, 6, or postgraduate.");
      return;
    }

    setLoading(true);
    setLocalError(null);

    const result = await signUp({
      email: trimmedEmail,
      password,
      nickname: trimmedNickname,
      university: trimmedUniversity,
      campus: trimmedCampus,
      faculty: trimmedFaculty,
      year: trimmedYear,
    });

    setLoading(false);

    if (!result.success) {
      setLocalError(result.error ?? "Unable to create your account right now. Please try again.");
      return;
    }

    router.replace({
      pathname: "/verify-email",
      params: { email: trimmedEmail },
    });
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

              <Text style={styles.pageTitle}>Sign up</Text>
              <Text style={styles.pageSubtitle}>
                Create your university-only UniAmi account.
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
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nickname</Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="e.g. Ava"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>University</Text>
                  <TextInput
                    value={university}
                    onChangeText={setUniversity}
                    placeholder="e.g. Victoria University"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Campus</Text>
                  <TextInput
                    value={campus}
                    onChangeText={setCampus}
                    placeholder="e.g. Footscray"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Faculty</Text>
                  <TextInput
                    value={faculty}
                    onChangeText={setFaculty}
                    placeholder="e.g. Information Technology"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    value={year}
                    onChangeText={setYear}
                    placeholder="1, 2, 3, postgraduate"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>
              </View>

              {localError || authError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{localError ?? authError}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleSignUp}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create account</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Link href="/login" asChild>
                <Pressable
                  accessibilityRole="button"
                  style={styles.secondaryLinkButton}
                >
                  <Text style={styles.secondaryLinkText}>Back to login</Text>
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
  inputRow: {
    flexDirection: "row",
    gap: 12,
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
    paddingVertical: 12,
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
    gap: 8,
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