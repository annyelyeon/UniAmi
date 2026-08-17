import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
import type { User } from "../../src/types/models";
import CommunityPosts from "../../src/components/CommunityPosts";
import type { Community } from "../../src/types/models";


function CommunityHeader() {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerTitle}>Community</Text>
      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open direct messages"
          onPress={() => router.push("/community/messages")}
          style={styles.headerIconButton}
        >
          <Ionicons name="paper-plane-outline" size={20} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={styles.headerIconButton}
        >
          <Ionicons name="search-outline" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function RecruitingBanner() {
  const { profile } = useAuth();

  const openRecruitingBoard = () => {
    if (!profile?.isPremium) {
      router.push("/premium-upsell");
      return;
    }

    router.push("/community/board/job-recruiting");
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openRecruitingBoard}
      style={({ pressed }) => [
        styles.recruitingCard,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.recruitingLeft}>
        <View style={styles.recruitingIconWrap}>
          <Ionicons name="briefcase-outline" size={22} color={colors.brandRed} />
        </View>
        <View style={styles.recruitingTextBlock}>
          <Text style={styles.recruitingTitle}>Job recruiting board</Text>
          <Text style={styles.recruitingSubtitle}>
            Graduate roles from partner employers
          </Text>
        </View>
      </View>

      <View style={styles.premiumBadge}>
        <Ionicons name="lock-closed-outline" size={12} color="#7F1D1D" />
        <Text style={styles.premiumBadgeText}>Premium</Text>
      </View>
    </Pressable>
  );
}

function BoardCard({
  community,
  isMember,
  onJoin,
  onLeave,
}: {
  community: Community;
  isMember?: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  return (
    <View style={{ width: "48%" }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/community/board/${community.id}`)}
        style={({ pressed }) => [styles.boardCard, pressed ? styles.cardPressed : null]}
      >
        <View style={styles.boardIconWrap}>
          <Ionicons name="layers-outline" size={20} color={colors.accent} />
        </View>
        <Text style={styles.boardTitle}>{community.name}</Text>
        <Text style={styles.boardMembers}>{(community.member_count ?? 0).toLocaleString()} members</Text>
      </Pressable>

      <View style={{ height: 8 }} />
      <Pressable
        accessibilityRole="button"
        onPress={() => (isMember ? onLeave(community.id) : onJoin(community.id))}
        style={({ pressed }) => [
          {
            backgroundColor: isMember ? colors.surface : colors.accent,
            paddingVertical: 8,
            borderRadius: 12,
            alignItems: "center",
          },
          pressed ? styles.cardPressed : null,
        ]}
      >
        <Text style={{ color: isMember ? colors.text : "#fff", fontWeight: "800" }}>
          {isMember ? "Joined" : "Join"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function CommunityScreen() {
  const { profile, loading: authLoading } = useAuth();
  const [facultyBoards, setFacultyBoards] = useState<Community[]>([]);
  const [clubBoards, setClubBoards] = useState<Community[]>([]);
  const [memberships, setMemberships] = useState<Record<string, true>>({});

  useEffect(() => {
    const loadBoards = async () => {
      const { data } = await supabase.from("communities").select("id, name, type, description, member_count");
      const all = (data ?? []) as Community[];
      setFacultyBoards(all.filter((c) => c.type === "faculty"));
      setClubBoards(all.filter((c) => c.type === "club"));
    };

    const loadMemberships = async () => {
      if (!profile?.id) return;
      const { data } = await supabase.from("community_memberships").select("community_id").eq("user_id", profile.id);
      const map: Record<string, true> = {};
      (data ?? []).forEach((r: any) => { map[r.community_id] = true; });
      setMemberships(map);
    };

    void loadBoards();
    void loadMemberships();
  }, [profile?.id]);

  const joinCommunity = async (communityId: string) => {
    if (!profile) return;
    await supabase.from("community_memberships").insert({ user_id: profile.id, community_id: communityId });
    setMemberships((m) => ({ ...m, [communityId]: true }));
  };

  const leaveCommunity = async (communityId: string) => {
    if (!profile) return;
    await supabase.from("community_memberships").delete().match({ user_id: profile.id, community_id: communityId });
    setMemberships((m) => { const copy = { ...m }; delete copy[communityId]; return copy; });
  };

  // posts are handled by the shared CommunityPosts component

  // Post composition is handled inside the CommunityPosts component

  return (
    <ScreenShell title="Community" subtitle="Boards and posts for your university community.">
      <CommunityHeader />
      <RecruitingBanner />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Faculty boards</Text>
      </View>
      <View style={styles.boardGrid}>
        {facultyBoards.map((board) => (
          <BoardCard
            key={board.id}
            community={board}
            isMember={Boolean(memberships[board.id])}
            onJoin={joinCommunity}
            onLeave={leaveCommunity}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Clubs</Text>
      </View>
      <View style={styles.boardGrid}>
        {clubBoards.map((board) => (
          <BoardCard
            key={board.id}
            community={board}
            isMember={Boolean(memberships[board.id])}
            onJoin={joinCommunity}
            onLeave={leaveCommunity}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>General</Text>
      </View>
      <CommunityPosts />
    </ScreenShell>
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
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  recruitingCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FECACA",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  recruitingLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 12,
  },
  recruitingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  recruitingTextBlock: {
    flex: 1,
    gap: 4,
  },
  recruitingTitle: {
    color: colors.brandRed,
    fontSize: 18,
    fontWeight: "800",
  },
  recruitingSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDE68A",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  premiumBadgeText: {
    color: "#7F1D1D",
    fontSize: 12,
    fontWeight: "800",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  sectionHeader: {
    paddingTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  boardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  boardCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  boardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  boardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  boardMembers: {
    color: colors.muted,
    fontSize: 13,
  },
  postsList: {
    gap: 12,
  },
  composerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  composerInput: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 96,
    textAlignVertical: "top",
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  composerHint: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
  },
  postButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postButtonDisabled: {
    opacity: 0.45,
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  loadingState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    paddingVertical: 28,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  postCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  postTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  postMeta: {
    flex: 1,
    gap: 2,
  },
  postAuthor: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  postBoard: {
    color: colors.muted,
    fontSize: 13,
  },
  postBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  metricGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  messageLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  messageLinkText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
});