import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvatarInitials } from "../../src/components/AvatarInitials";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";
import { supabase } from "../../src/lib/supabase";

const OWNED_PACKS_STORAGE_KEY = "@uni_ami_owned_packs";
const CREATED_PACKS_STORAGE_KEY = "@uni_ami_created_packs";
const CREATED_PACKS_DATA_KEY = "@uni_ami_created_packs_data";

const VALID_STARTER_IDS = [
  "campus-starter",
  "exam-week",
  "tech-code",
  "cute-mascot",
  "study-moods",
  "campus-art",
];

const getOwnedPackIds = async (): Promise<string[]> => {
  try {
    const rawOwned = await AsyncStorage.getItem(OWNED_PACKS_STORAGE_KEY);
    const rawCreated = await AsyncStorage.getItem(CREATED_PACKS_STORAGE_KEY);
    const rawLocalPacks = await AsyncStorage.getItem(CREATED_PACKS_DATA_KEY);

    const parsedOwned: string[] = rawOwned ? JSON.parse(rawOwned) : ["campus-starter"];
    const parsedCreated: string[] = rawCreated ? JSON.parse(rawCreated) : [];
    const localPacks: any[] = rawLocalPacks ? JSON.parse(rawLocalPacks) : [];

    const candidateIds = Array.from(
      new Set([...parsedOwned, ...parsedCreated, "campus-starter"])
    );

    const matchedStarterIds = candidateIds.filter((id) =>
      VALID_STARTER_IDS.includes(id)
    );

    const validLocalCustomIds = localPacks
      .filter((p) => p && candidateIds.includes(p.id))
      .map((p) => p.id);

    const otherCandidateIds = candidateIds.filter(
      (id) => !matchedStarterIds.includes(id) && !validLocalCustomIds.includes(id)
    );

    let validDbIds: string[] = [];
    if (otherCandidateIds.length > 0) {
      const { data: dbPacks } = await supabase
        .from("sticker_packs")
        .select("id")
        .in("id", otherCandidateIds)
        .eq("status", "approved");

      if (dbPacks && dbPacks.length > 0) {
        validDbIds = dbPacks.map((p: any) => p.id);
      }
    }

    const verifiedIds = Array.from(
      new Set([...matchedStarterIds, ...validLocalCustomIds, ...validDbIds])
    );

    await AsyncStorage.setItem(
      OWNED_PACKS_STORAGE_KEY,
      JSON.stringify(verifiedIds)
    );

    return verifiedIds;
  } catch {
    return ["campus-starter"];
  }
};

export default function ProfileScreen() {
  const { profile } = useAuth();
  const [postCount, setPostCount] = useState<number>(0);
  const [ownedCount, setOwnedCount] = useState<number>(0);
  const [communitiesCount, setCommunitiesCount] = useState<number>(0);
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([]);
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
    void loadPostCount();
  }, [profile?.id]);

  useEffect(() => {
    const loadCommunitiesCount = async () => {
      if (!profile?.id) return;
      const { count } = await supabase
        .from("community_memberships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);
      setCommunitiesCount(count ?? 0);
    };
    void loadCommunitiesCount();
  }, [profile?.id]);

  useEffect(() => {
    const loadJoined = async () => {
      if (!profile?.id) {
        setJoinedCommunities([]);
        return;
      }
      const { data, error } = await supabase
        .from("community_memberships")
        .select("community_id(id, name, type, member_count)")
        .eq("user_id", profile.id)
        .limit(10);

      if (error) {
        setJoinedCommunities([]);
        return;
      }
      setJoinedCommunities((data ?? []).map((r: any) => r.community_id));
    };
    void loadJoined();
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

  const handleOpenLink = (url: string) => {
    void Linking.openURL(url).catch((err) =>
      console.warn("Could not open URL:", err)
    );
  };

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Row Without Banner */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>
                Verified identity and account overview.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => router.push("/about" as never)}
              style={({ pressed }) => [
                styles.headerIconButton,
                pressed && styles.rowPressed,
              ]}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* User Identity Card */}
          <View style={styles.identityCard}>
            <AvatarInitials name={profile.nickname} />
            <Text style={styles.nickname}>{profile.nickname}</Text>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#059669"
                />
                <Text style={[styles.badgeText, styles.verifiedBadgeText]}>
                  Verified student
                </Text>
              </View>
              {profile.isPremium ? (
                <View style={[styles.badge, styles.premiumBadge]}>
                  <Ionicons
                    name="diamond"
                    size={14}
                    color="#0284C7"
                  />
                  <Text style={[styles.badgeText, styles.premiumBadgeText]}>
                    Premium
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Student Info Card */}
          <View style={styles.sectionCard}>
            <InfoRow
              icon="business-outline"
              label="University"
              value={profile.university}
            />
            <InfoRow
              icon="location-outline"
              label="Campus"
              value={profile.campus}
            />
            <InfoRow
              icon="school-outline"
              label="Faculty"
              value={profile.faculty}
            />
            <InfoRow
              icon="calendar-outline"
              label="Year"
              value={`${profile.year}`}
            />
          </View>

          {/* Creator Studio Promo Banner */}
          <View style={styles.creatorBannerCard}>
            <View style={styles.creatorBannerLeft}>
              <View style={styles.creatorIconWrap}>
                <Text style={{ fontSize: 24 }}>🎨</Text>
              </View>
              <View style={styles.creatorTextBlock}>
                <View style={styles.creatorTitleRow}>
                  <Text style={styles.creatorBannerTitle}>
                    Create Your Sticker Pack
                  </Text>
                  <View style={styles.cutBadge}>
                    <Text style={styles.cutBadgeText}>83.33% Cut</Text>
                  </View>
                </View>
                <Text style={styles.creatorBannerSubtitle}>
                  Publish custom illustrations, gain student followers, and earn
                  revenue from every download.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push("/creator-studio" as any)}
              style={({ pressed }) => [
                styles.creatorActionBtn,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.creatorActionBtnText}>
                + Open Creator Studio
              </Text>
            </Pressable>
          </View>

          {/* Activity Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Activity</Text>
          </View>

          <View style={{ marginTop: 4 }}>
            <View style={styles.joinedClubsHeader}>
              <Text style={[styles.sectionTitle, { fontSize: 15 }]}>
                Joined clubs
              </Text>
              <Pressable
                onPress={() => router.push("/profile/joined-communities")}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            </View>

            <View style={styles.chipsWrap}>
              {joinedCommunities.length === 0 ? (
                <Text style={styles.emptyClubsText}>
                  You haven't joined any clubs yet.
                </Text>
              ) : (
                joinedCommunities.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => router.push(`/community/board/${c.id}`)}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Text style={styles.chipText}>{c.name}</Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* Activity Stats Grid */}
          <View style={styles.activityGrid}>
            <ActivityStatCard
              value={`${ownedCount} ${ownedCount === 1 ? "pack" : "packs"}`}
              label="Stickers owned"
              icon="color-palette-outline"
              theme="cyan"
              onPress={() => router.push("/my-stickers" as any)}
            />
            <ActivityStatCard
              value={`${postCount}`}
              label="Posts created"
              icon="chatbubbles-outline"
              theme="slate"
              onPress={() => router.push("/(tabs)/community")}
            />
            <ActivityStatCard
              value={`${communitiesCount}`}
              label="Clubs & Groups"
              icon="people-outline"
              theme="slate"
              onPress={() => router.push("/profile/joined-communities")}
            />
            <ActivityStatCard
              value={`${subjectCount}`}
              label="Active subjects"
              icon="book-outline"
              theme="slate"
              onPress={() => router.push("/(tabs)/subject-info")}
            />
          </View>

          {/* Settings & Links Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings & Info</Text>
          </View>

          <View style={styles.linksCard}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/about" as never)}
              style={({ pressed }) => [
                styles.linkRow,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.linkLeft}>
                <View style={[styles.linkIconWrap, { backgroundColor: "#F0F9FF" }]}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#0284C7"
                  />
                </View>
                <Text style={styles.linkLabel}>About UniAmi</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={colors.muted}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => handleOpenLink("https://instagram.com")}
              style={({ pressed }) => [
                styles.linkRow,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.linkLeft}>
                <View style={[styles.linkIconWrap, { backgroundColor: "#FDF2F8" }]}>
                  <Ionicons
                    name="logo-instagram"
                    size={18}
                    color="#DB2777"
                  />
                </View>
                <Text style={styles.linkLabel}>Follow on Instagram</Text>
              </View>
              <Ionicons
                name="open-outline"
                size={16}
                color={colors.muted}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => handleOpenLink("https://maps.google.com")}
              style={({ pressed }) => [
                styles.linkRow,
                { borderBottomWidth: 0 },
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.linkLeft}>
                <View style={[styles.linkIconWrap, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color="#059669"
                  />
                </View>
                <Text style={styles.linkLabel}>Campus Map & Navigation</Text>
              </View>
              <Ionicons
                name="open-outline"
                size={16}
                color={colors.muted}
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
          <Ionicons name={icon} size={16} color="#0284C7" />
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
  icon,
  theme = "slate",
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: "cyan" | "slate";
  onPress: () => void;
}) {
  const isCyan = theme === "cyan";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.activityCard,
        isCyan && styles.activityCardCyan,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.statHeaderRow}>
        <Text style={[styles.statValue, isCyan && styles.statValueCyan]}>
          {value}
        </Text>
        <Ionicons
          name={icon}
          size={18}
          color={isCyan ? "#0284C7" : "#64748B"}
        />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F2",
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 820,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: 1.5,
  },
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    alignItems: "center",
    gap: 12,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
  },
  nickname: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  verifiedBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBadgeText: {
    color: "#047857",
  },
  premiumBadge: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  premiumBadgeText: {
    color: "#0284C7",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomColor: "#F1F5F9",
    borderBottomWidth: 1,
    gap: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
  },
  infoLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  infoValue: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
  },
  creatorBannerCard: {
    backgroundColor: "#0F172A",
    borderRadius: 22,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  creatorBannerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  creatorIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  creatorTextBlock: {
    flex: 1,
    gap: 4,
  },
  creatorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  creatorBannerTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  cutBadge: {
    backgroundColor: "#065F46",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cutBadgeText: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "900",
  },
  creatorBannerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  creatorActionBtn: {
    backgroundColor: "#FD0000",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  creatorActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionHeader: {
    paddingTop: 8,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  joinedClubsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  seeAllText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyClubsText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12,
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  activityCard: {
    flexBasis: "48.5%",
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
  },
  activityCardCyan: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  statHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
  },
  statValueCyan: {
    color: "#0369A1",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  linksCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
});