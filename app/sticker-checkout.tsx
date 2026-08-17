import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/context/AuthContext";
import { supabase } from "../src/lib/supabase";
import { colors } from "../src/theme/colors";

type PaymentMethod = "apple" | "gems";

const OWNED_PACKS_STORAGE_KEY = "uniami_owned_packs";

const getOwnedPackIds = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(OWNED_PACKS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
};

const persistOwnedPackIds = async (packIds: string[]) => {
  await AsyncStorage.setItem(OWNED_PACKS_STORAGE_KEY, JSON.stringify(packIds));
};

export default function StickerCheckoutScreen() {
  const { profile, refreshProfile } = useAuth();
  const { packId, title, price, paymentMode } = useLocalSearchParams<{
    packId?: string;
    title?: string;
    price?: string;
    paymentMode?: string;
  }>();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentMode === "gems" ? "gems" : "apple"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const priceAUD = Number.parseFloat(typeof price === "string" ? price : "1.20");
  const safePrice = Number.isFinite(priceAUD) ? priceAUD : 1.2;
  const gemsNeeded = 240;
  const userGems = profile?.gemsBalance ?? 0;
  const missingGems = Math.max(0, gemsNeeded - userGems);
  const packName = typeof title === "string" && title.trim() ? title : packId ? packId.replace(/-/g, " ") : "Sticker Pack";

  const canAffordWithGems = userGems >= gemsNeeded;

  const selectedMethodLabel = paymentMethod === "apple" ? "Apple / Google Pay ($1.20 AUD)" : "Pay with 240 Gems";

  const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString("en-AU");
  const gst = (safePrice * 0.1).toFixed(2);

  const summaryItems = useMemo(
    () => [
      { label: "Sticker Pack", value: packName },
      { label: "Payment", value: selectedMethodLabel },
      { label: "Creator revenue", value: "$1.00 AUD" },
      { label: "Platform margin", value: "$0.20 AUD" },
    ],
    [packName, selectedMethodLabel]
  );

  const handlePay = async () => {
    const purchasedPackId = typeof packId === "string" ? packId : "";
    if (!purchasedPackId) return;

    setIsProcessing(true);
    setPaymentMessage(null);

    if (paymentMethod === "gems") {
      if (!canAffordWithGems) {
        setPaymentMessage(`You need ${missingGems} more gems to unlock this pack.`);
        setIsProcessing(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ gems_balance: userGems - gemsNeeded, updated_at: new Date().toISOString() })
        .eq("id", profile?.id);

      if (error) {
        setPaymentMessage("Unable to process gem payment right now. Please try again.");
        setIsProcessing(false);
        return;
      }

      const { error: purchaseError } = await supabase.from("sticker_purchases").insert({
        user_id: profile?.id,
        sticker_pack_id: purchasedPackId,
        payment_type: "gems",
        amount_aud: 1.2,
        creator_cut: 1.0,
        platform_cut: 0.2,
        status: "completed",
      });

      if (purchaseError) {
        setPaymentMessage("Purchase was not recorded. Please contact support.");
        setIsProcessing(false);
        return;
      }

      await refreshProfile();
      setIsProcessing(false);
      setIsPaid(true);

      const existingIds = await getOwnedPackIds();
      const nextIds = existingIds.includes(purchasedPackId)
        ? existingIds
        : [...existingIds, purchasedPackId];

      await persistOwnedPackIds(nextIds);
      return;
    }

    const { error: purchaseError } = await supabase.from("sticker_purchases").insert({
      user_id: profile?.id,
      sticker_pack_id: purchasedPackId,
      payment_type: "cash",
      amount_aud: safePrice,
      creator_cut: 1.0,
      platform_cut: 0.2,
      status: "completed",
    });

    if (purchaseError) {
      setPaymentMessage("Payment succeeded but the purchase record failed to save.");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);
    setIsPaid(true);

    const existingIds = await getOwnedPackIds();
    const nextIds = existingIds.includes(purchasedPackId)
      ? existingIds
      : [...existingIds, purchasedPackId];

    await persistOwnedPackIds(nextIds);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContainer}>
          <View style={styles.card}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>

            <View style={styles.logoFrame}>
              <Image
                source={require("./assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>{isPaid ? "Receipt & Invoice" : "Checkout"}</Text>
            <Text style={styles.subtitle}>
              {isPaid ? "Transaction confirmed successfully" : "Support student creators directly"}
            </Text>

            {!isPaid ? (
              <>
                <View style={styles.summaryBox}>
                  <Text style={styles.itemName}>{packName}</Text>
                  <Text style={styles.itemPrice}>$1.20 AUD</Text>
                </View>

                <Text style={styles.sectionTitle}>Select payment method</Text>

                <View style={styles.methodGroup}>
                  <Pressable
                    style={[styles.methodBtn, paymentMethod === "apple" && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod("apple")}
                  >
                    <Ionicons
                      name="logo-apple"
                      size={20}
                      color={paymentMethod === "apple" ? "#000000" : colors.muted}
                    />
                    <Text style={[styles.methodText, paymentMethod === "apple" && styles.methodTextActive]}>
                      Apple / Google Pay ($1.20 AUD)
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.methodBtn, paymentMethod === "gems" && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod("gems")}
                  >
                    <Ionicons
                      name="diamond"
                      size={18}
                      color={paymentMethod === "gems" ? colors.accent : colors.muted}
                    />
                    <Text style={[styles.methodText, paymentMethod === "gems" && styles.methodTextActive]}>
                      Pay with 240 Gems
                    </Text>
                  </Pressable>
                </View>

                {paymentMethod === "gems" && !canAffordWithGems ? (
                  <View style={styles.gemWarningBox}>
                    <Text style={styles.gemWarningText}>
                      You need {missingGems} more gems to unlock this pack.
                    </Text>
                    <Pressable
                      style={styles.inlineAdButton}
                      onPress={() => router.push("/sticker-ad-unlock")}
                    >
                      <Text style={styles.inlineAdButtonText}>Watch Ads to Earn Missing Gems</Text>
                    </Pressable>
                  </View>
                ) : null}

                {paymentMessage ? <Text style={styles.paymentMessage}>{paymentMessage}</Text> : null}

                <Pressable
                  style={styles.payBtn}
                  onPress={() => {
                    void handlePay();
                  }}
                  disabled={isProcessing || (paymentMethod === "gems" && !canAffordWithGems)}
                >
                  <Text style={styles.payBtnText}>
                    {isProcessing
                      ? "Authorising..."
                      : paymentMethod === "gems"
                        ? `Pay with 240 Gems`
                        : `Pay $1.20 AUD with Apple / Google Pay`}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.successHeader}>
                  <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
                  <Text style={styles.successTitle}>Payment Approved</Text>
                  <Text style={styles.successSub}>Thank you for supporting student artists!</Text>
                </View>

                <View style={styles.invoiceBox}>
                  <Text style={styles.invoiceRowBold}>UniAmi Pty Ltd</Text>
                  <Text style={styles.invoiceRow}>ABN: 12 345 678 910 (Temporary)</Text>
                  <Text style={styles.invoiceRow}>Invoice No: {invoiceNumber}</Text>
                  <Text style={styles.invoiceRow}>Date: {dateStr}</Text>
                  <View style={styles.divider} />
                  {summaryItems.map((item) => (
                    <Text key={item.label} style={styles.invoiceRow}>
                      {item.label}: {item.value}
                    </Text>
                  ))}
                  <View style={styles.divider} />
                  <Text style={styles.invoiceTotal}>Total Paid: ${safePrice.toFixed(2)} AUD</Text>
                </View>

                <Pressable
                  style={styles.doneBtn}
                  onPress={() => router.push("/sticker-marketplace")}
                >
                  <Text style={styles.doneBtnText}>Return to Marketplace</Text>
                </Pressable>
              </>
            )}
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  centerContainer: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    gap: 16,
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
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    zIndex: 1,
  },
  logoFrame: {
    width: 100,
    height: 100,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: -8,
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
    marginTop: -6,
  },
  summaryBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  itemPrice: {
    color: "#FD0000",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtext: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  methodGroup: {
    gap: 10,
  },
  methodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  methodBtnActive: {
    borderColor: "#FD0000",
    backgroundColor: "#FFF2F2",
  },
  methodText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  methodTextActive: {
    color: colors.text,
  },
  gemWarningBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 12,
    gap: 8,
  },
  gemWarningText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  inlineAdButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  inlineAdButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  paymentMessage: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  payBtn: {
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
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  successHeader: {
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  successSub: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
  invoiceBox: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  invoiceRowBold: {
    fontWeight: "800",
    fontSize: 14,
    color: colors.text,
  },
  invoiceRow: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 6,
  },
  invoiceTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
  },
  doneBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
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