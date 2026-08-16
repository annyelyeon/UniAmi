import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AvatarInitials } from "../../src/components/AvatarInitials";
import { ScreenShell } from "../../src/components/ScreenShell";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";
import { supabase } from "src/lib/supabase";
import { useCallback, useEffect, useState } from "react";

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

export default function ProfileScreen() {
  const { profile } = useAuth();
  const [postCount, setPostCount] = useState<number>(0);
  const [ownedCount, setOwnedCount] = useState<number>(0);
  const communitiesCount = profile?.joinedClubs.length ?? 0;
  const subjectCount = profile?.faculty ? 4 : 0;

  useEffect(() => {
    const loadPostCount = async () => {
      if (!profile?.id) return;

      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", profile.id);

      setPostCount(count ?? 0);
    };

    loadPostCount();
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      const loadOwnedCount = async () => {
        const ownedIds = await getOwnedPackIds();
        setOwnedCount(ownedIds.length);
      };

      void loadOwnedCount();
    }, [])
  );

  if (!profile) {
    return null;
  }

  return (
    <ScreenShell title="Profile" subtitle="Verified identity and account overview.">
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push("/about" as never)}
          style={styles.headerIconButton}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.identityCard}>
        <AvatarInitials name={profile.nickname} />
        <Text style={styles.nickname}>{profile.nickname}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.verifiedBadge]}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#166534" />
            <Text style={[styles.badgeText, styles.verifiedBadgeText]}>Verified student</Text>
          </View>
          {profile.isPremium ? (
            <View style={[styles.badge, styles.premiumBadge]}>
              <Ionicons name="diamond-outline" size={14} color={colors.brandRed} />
              <Text style={[styles.badgeText, styles.premiumBadgeText]}>Premium</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <InfoRow icon="business-outline" label="University" value={profile.university} />
        <InfoRow icon="location-outline" label="Campus" value={profile.campus} />
        <InfoRow icon="school-outline" label="Faculty" value={profile.faculty} />
        <InfoRow icon="calendar-outline" label="Year" value={`${profile.year}`} />
      </View>

      {profile.isPremium ? (
        <View style={styles.bannerCard}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIconWrap}>
              <Ionicons name="briefcase-outline" size={22} color={colors.brandRed} />
            </View>
            <View style={styles.bannerTextBlock}>
              <Text style={styles.bannerTitle}>Job recruiting board unlocked</Text>
              <Text style={styles.bannerSubtitle}>Premium access enabled for graduate roles.</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Activity</Text>
      </View>

      <View style={styles.activityGrid}>
        <ActivityStatCard
          value={`${ownedCount} packs`}
          label="Stickers owned"
          onPress={() => router.push("/my-stickers")}
        />
        <ActivityStatCard
          value={`${postCount}`}
          label="Posts created"
          onPress={() => router.push("/(tabs)/community")}
        />
        <ActivityStatCard
          value={`${communitiesCount}`}
          label="Clubs & Groups"
          onPress={() => router.push("/(tabs)/community")}
        />
        <ActivityStatCard
          value={`${subjectCount}`}
          label="Active subjects"
          onPress={() => router.push("/(tabs)/subject-info")}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settings</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/about" as never)}
        style={({ pressed }) => [styles.settingsRow, pressed ? styles.rowPressed : null]}
      >
        <View style={styles.settingsLeft}>
          <View style={styles.settingsIconWrap}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
          </View>
          <Text style={styles.settingsLabel}>About</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
      </Pressable>
    </ScreenShell>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIconWrap}>
          <Ionicons name={icon} size={16} color={colors.accent} />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActivityStatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.activityCard, pressed ? styles.rowPressed : null]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  nickname: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  verifiedBadge: {
    backgroundColor: "#DCFCE7",
  },
  verifiedBadgeText: {
    color: "#166534",
  },
  premiumBadge: {
    backgroundColor: "#FEE2E2",
  },
  premiumBadgeText: {
    color: colors.brandRed,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  infoLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  infoValue: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
  },
  bannerCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FECACA",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  bannerTextBlock: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    color: colors.brandRed,
    fontSize: 18,
    fontWeight: "800",
  },
  bannerSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  activityCard: {
    flexBasis: "48%",
    width: "48%",
    minWidth: 0,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  settingsRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  settingsLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  rowPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
});