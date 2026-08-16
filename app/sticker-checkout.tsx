import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../src/theme/colors";

type PaymentMethod = "paypal" | "apple" | "card";

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
  const { packId, title, price } = useLocalSearchParams<{
    packId?: string;
    title?: string;
    price?: string;
  }>();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const priceAUD = Number.parseFloat(typeof price === "string" ? price : "1.99");
  const safePrice = Number.isFinite(priceAUD) ? priceAUD : 1.99;
  const gst = (safePrice * 0.1).toFixed(2);
  const creatorShare = (safePrice * 0.833).toFixed(2);
  const platformShare = (safePrice * 0.167).toFixed(2);
  const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString("en-AU");
  const packName = typeof title === "string" && title.trim() ? title : packId ? packId.replace(/-/g, " ") : "Sticker Pack";

  const selectedMethodLabel =
    paymentMethod === "paypal" ? "PayPal" : paymentMethod === "apple" ? "Apple / Google Pay" : "Credit / Debit Card";

  const handlePay = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);

      const purchasedPackId = typeof packId === "string" ? packId : "";
      if (!purchasedPackId) return;

      void (async () => {
        const existingIds = await getOwnedPackIds();
        const nextIds = existingIds.includes(purchasedPackId)
          ? existingIds
          : [...existingIds, purchasedPackId];

        await persistOwnedPackIds(nextIds);
      })();
    }, 1200);
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
                  <Text style={styles.itemPrice}>${safePrice.toFixed(2)} AUD</Text>
                </View>

                <Text style={styles.sectionTitle}>Select payment method</Text>

                <View style={styles.methodGroup}>
                  <Pressable
                    style={[styles.methodBtn, paymentMethod === "paypal" && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod("paypal")}
                  >
                    <Ionicons
                      name="logo-paypal"
                      size={20}
                      color={paymentMethod === "paypal" ? "#0070BA" : colors.muted}
                    />
                    <Text style={[styles.methodText, paymentMethod === "paypal" && styles.methodTextActive]}>PayPal</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.methodBtn, paymentMethod === "apple" && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod("apple")}
                  >
                    <Ionicons
                      name="logo-apple"
                      size={20}
                      color={paymentMethod === "apple" ? "#000000" : colors.muted}
                    />
                    <Text style={[styles.methodText, paymentMethod === "apple" && styles.methodTextActive]}>Apple / Google Pay</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.methodBtn, paymentMethod === "card" && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod("card")}
                  >
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={paymentMethod === "card" ? "#FD0000" : colors.muted}
                    />
                    <Text style={[styles.methodText, paymentMethod === "card" && styles.methodTextActive]}>
                      Credit / Debit Card
                    </Text>
                  </Pressable>
                </View>

                <Pressable style={styles.payBtn} onPress={handlePay} disabled={isProcessing}>
                  <Text style={styles.payBtnText}>
                    {isProcessing ? "Authorising..." : `Pay $${safePrice.toFixed(2)} AUD with ${selectedMethodLabel}`}
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
                  <Text style={styles.invoiceRow}>Item: {packName}</Text>
                  <Text style={styles.invoiceRow}>Payment Mode: {selectedMethodLabel.toUpperCase()}</Text>
                  <Text style={styles.invoiceRow}>Subtotal: ${(safePrice - Number(gst)).toFixed(2)} AUD</Text>
                  <Text style={styles.invoiceRow}>GST (10%): ${gst} AUD</Text>
                  <View style={styles.divider} />
                  <Text style={styles.invoiceTotal}>Total Paid: ${safePrice.toFixed(2)} AUD</Text>
                </View>

                <Pressable
                  style={styles.doneBtn}
                  onPress={() => {
                    const purchasedPackId = typeof packId === "string" ? packId : "";
                    if (purchasedPackId) {
                      void (async () => {
                        const existingIds = await getOwnedPackIds();
                        const nextIds = existingIds.includes(purchasedPackId)
                          ? existingIds
                          : [...existingIds, purchasedPackId];

                        await persistOwnedPackIds(nextIds);
                      })();
                    }

                    router.push("/sticker-marketplace");
                  }}
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