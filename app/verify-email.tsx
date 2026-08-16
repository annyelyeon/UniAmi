import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/context/AuthContext";
import { supabase } from "../src/lib/supabase";
import { colors } from "../src/theme/colors";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { session, refreshProfile, resendVerificationEmail } = useAuth();

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContainer}>
          <View style={styles.card}>
            <View style={styles.logoFrame}>
              <Image
                source={require("./assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              Finish verifying your account to enter UniAmi.
            </Text>

            <View style={styles.messageBox}>
              <Text style={styles.bodyText}>
                We sent a verification link to {email ?? "your university inbox"}. Once Supabase
                confirms the email is verified, you will be sent into the app automatically.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/login")}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Back to login</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const resolvedEmail = typeof email === "string" ? email : "";

                if (!resolvedEmail) {
                  return;
                }

                await resendVerificationEmail(resolvedEmail);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Resend verification email</Text>
            </Pressable>
          </View>

          <View style={styles.footerBox}>
            <Text style={styles.disclaimerText}>
              This website/app is for a class assignment and not for commercial purposes.
            </Text>
            <Text style={styles.abnText}>ABN: 12 345 678 910</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  card: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 24,
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
    alignSelf: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    alignSelf: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    alignSelf: "center",
  },
  messageBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#FD0000",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
    shadowColor: "#FD0000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FD0000",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: "#FD0000",
    fontSize: 14,
    fontWeight: "800",
  },
  footerBox: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
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