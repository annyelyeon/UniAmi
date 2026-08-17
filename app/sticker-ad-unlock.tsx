import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../src/context/AuthContext";
import { supabase } from "../src/lib/supabase";
import { ScreenShell } from "../src/components/ScreenShell";
import { colors } from "../src/theme/colors";

const TOTAL_GEMS_FOR_PACK = 240;
const AD_GEM_REWARD = 10;
const AD_COUNTDOWN_SECONDS = 5;

export default function StickerAdUnlockScreen() {
  const { packId } = useLocalSearchParams<{ packId?: string }>();
  const { profile, refreshProfile } = useAuth();

  const [gems, setGems] = useState<number>(profile?.gemsBalance ?? 0);
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(AD_COUNTDOWN_SECONDS);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    setGems(profile?.gemsBalance ?? 0);
  }, [profile?.gemsBalance]);

  useEffect(() => {
    if (!isWatching) return;

    if (countdown <= 0) {
      setIsWatching(false);
      setCountdown(AD_COUNTDOWN_SECONDS);
      const nextGems = gems + AD_GEM_REWARD;
      setGems(nextGems);

      void (async () => {
        const userId = profile?.id;
        if (!userId) return;

        const { error } = await supabase
          .from("profiles")
          .update({ gems_balance: nextGems, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (!error) {
          await refreshProfile();
        }
      })();
      return;
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, gems, isWatching, profile?.id, refreshProfile]);

  const handleWatchAd = () => {
    if (isWatching) return;
    setIsWatching(true);
    setCountdown(AD_COUNTDOWN_SECONDS);
  };

  const handleRedeem = () => {
    if (gems < TOTAL_GEMS_FOR_PACK) return;
    setIsUnlocked(true);
  };

  const progress = Math.min((gems / TOTAL_GEMS_FOR_PACK) * 100, 100);
  const adsNeeded = Math.max(0, Math.ceil((TOTAL_GEMS_FOR_PACK - gems) / AD_GEM_REWARD));
  const goalText = `${gems} / ${TOTAL_GEMS_FOR_PACK} Gems — ${adsNeeded} more ad${adsNeeded === 1 ? "" : "s"} to unlock your next sticker!`;

  return (
    <ScreenShell
      title="Rewarded Ad Unlock"
      subtitle="Earn gems by watching short partner clips"
    >
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Gem Rewards</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!isUnlocked ? (
        <View style={styles.card}>
          <View style={styles.walletBox}>
            <View style={styles.walletRow}>
              <Ionicons name="diamond" size={28} color="#0284C7" />
              <View>
                <Text style={styles.walletLabel}>Your Gem Balance</Text>
                <Text style={styles.walletValue}>{gems} Gems</Text>
              </View>
            </View>
            <Text style={styles.walletRate}>1 Ad = 10 Gems ($0.05 AUD Value)</Text>
          </View>

          <View style={styles.goalBox}>
            <Text style={styles.goalTitle}>Unlock: {packId?.replace(/-/g, " ") || "Sticker Pack"}</Text>
            <Text style={styles.goalTarget}>{goalText}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <Pressable style={styles.adBtn} onPress={handleWatchAd} disabled={isWatching}>
            {isWatching ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFF" />
                <Text style={styles.adBtnText}>Ad countdown: {countdown}s (+10 Gems)</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="play-circle" size={22} color="#FFF" />
                <Text style={styles.adBtnText}>Watch Short Ad (+10 Gems)</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.redeemBtn, gems < TOTAL_GEMS_FOR_PACK && styles.redeemBtnDisabled]}
            onPress={handleRedeem}
            disabled={gems < TOTAL_GEMS_FOR_PACK}
          >
            <Text style={styles.redeemBtnText}>
              {gems >= TOTAL_GEMS_FOR_PACK ? "Redeem 240 Gems to Unlock" : `Need ${TOTAL_GEMS_FOR_PACK - gems} More Gems`}
            </Text>
          </Pressable>

          <Text style={styles.creatorNote}>
            ✓ Student creator receives $1.00 AUD and UniAmi keeps a $0.20 AUD platform margin.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.successBox}>
            <Ionicons name="gift" size={54} color={colors.accent} />
            <Text style={styles.successTitle}>Pack Unlocked!</Text>
            <Text style={styles.successText}>
              240 Gems successfully redeemed for {packId?.replace(/-/g, " ") || "Sticker Pack"}.
            </Text>
          </View>
          <Pressable style={styles.doneBtn} onPress={() => router.push("/sticker-marketplace")}>
            <Text style={styles.doneBtnText}>Use My Stickers</Text>
          </Pressable>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  headerSpacer: { width: 40 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 20, gap: 16 },
  walletBox: { backgroundColor: "#F0F9FF", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#BAE6FD", gap: 6 },
  walletRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  walletLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  walletValue: { color: "#0369A1", fontSize: 22, fontWeight: "800" },
  walletRate: { color: "#0284C7", fontSize: 12, fontWeight: "600" },
  goalBox: { gap: 6 },
  goalTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  goalTarget: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  progressBarBg: { height: 12, backgroundColor: "#E2E8F0", borderRadius: 999, overflow: "hidden", marginTop: 4 },
  progressBarFill: { height: "100%", backgroundColor: colors.accent },
  goalProgressText: { fontSize: 12, fontWeight: "700", color: colors.text, textAlign: "right" },
  adBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 16, alignItems: "center" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  adBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  redeemBtn: { backgroundColor: "#16A34A", padding: 16, borderRadius: 16, alignItems: "center" },
  redeemBtnDisabled: { backgroundColor: "#94A3B8" },
  redeemBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  creatorNote: { color: colors.muted, fontSize: 11, textAlign: "center", fontWeight: "600" },
  successBox: { alignItems: "center", gap: 8, paddingVertical: 16 },
  successTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  successText: { fontSize: 13, color: colors.muted, textAlign: "center", fontWeight: "600" },
  doneBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 16, alignItems: "center" },
  doneBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});