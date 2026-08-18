import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
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
    <View style={styles.boardCard}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/community/board/${community.id}`)}
        style={({ pressed }) => (pressed ? styles.cardPressed : null)}
      >
        <View style={styles.boardIconWrap}>
          <Ionicons name="layers-outline" size={20} color={colors.accent} />
        </View>
        <Text style={styles.boardTitle}>{community.name}</Text>
        <Text style={styles.boardMembers}>{(community.member_count ?? 0).toLocaleString()} members</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => (isMember ? onLeave(community.id) : onJoin(community.id))}
        style={({ pressed }) => [
          styles.boardButton,
          pressed ? styles.cardPressed : null,
          isMember ? { backgroundColor: colors.surface } : null,
        ]}
      >
        <Text style={[styles.boardButtonText, isMember ? { color: colors.text } : null]}>
          {isMember ? "Joined" : "Join"}
        </Text>
      </Pressable>
    </View>
  );
}

type JoinedBoard = { id: string; name: string };

function MyBoardsRow({ joinedBoards }: { joinedBoards: JoinedBoard[] }) {
  return (
    <View style={styles.chipsRow}>
      <View style={[styles.chip, styles.chipActive]}>
        <Text style={[styles.chipText, styles.chipTextActive]}>General</Text>
      </View>
      {joinedBoards.map((board) => (
        <Pressable
          key={board.id}
          accessibilityRole="button"
          onPress={() => router.push(`/community/board/${board.id}`)}
          style={({ pressed }) => [styles.chip, pressed ? styles.cardPressed : null]}
        >
          <Text style={styles.chipText}>{board.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function CommunityScreen() {
  const { profile } = useAuth();
  const [facultyBoards, setFacultyBoards] = useState<Community[]>([]);
  const [clubBoards, setClubBoards] = useState<Community[]>([]);
  const [memberships, setMemberships] = useState<Record<string, true>>({});
  const [joinedBoards, setJoinedBoards] = useState<JoinedBoard[]>([]);
  const [discoverOpen, setDiscoverOpen] = useState(false);

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

    const loadJoinedBoards = async () => {
      if (!profile?.id) {
        setJoinedBoards([]);
        return;
      }
      const { data, error } = await supabase
        .from("community_memberships")
        .select("communities(id, name)")
        .eq("user_id", profile.id);

      if (error || !data) {
        setJoinedBoards([]);
        return;
      }

      const boards = data
        .map((row: any) => (Array.isArray(row.communities) ? row.communities[0] : row.communities))
        .filter(Boolean) as JoinedBoard[];

      setJoinedBoards(boards);
    };

    void loadBoards();
    void loadMemberships();
    void loadJoinedBoards();
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

  return (
    <ScreenShell title="Community" subtitle="Boards and posts for your university community.">
      <CommunityHeader />
      <RecruitingBanner />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My boards</Text>
      </View>
      <MyBoardsRow joinedBoards={joinedBoards} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>General</Text>
      </View>
      <CommunityPosts />

      <Pressable
        accessibilityRole="button"
        onPress={() => setDiscoverOpen((v) => !v)}
        style={({ pressed }) => [styles.discoverHeader, pressed ? styles.cardPressed : null]}
      >
        <Text style={styles.discoverHeaderText}>Discover boards</Text>
        <Ionicons
          name={discoverOpen ? "chevron-up-outline" : "chevron-down-outline"}
          size={20}
          color={colors.text}
        />
      </Pressable>

      {discoverOpen ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Faculty boards</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.boardCarousel}
          >
            {facultyBoards.map((board) => (
              <BoardCard
                key={board.id}
                community={board}
                isMember={Boolean(memberships[board.id])}
                onJoin={joinCommunity}
                onLeave={leaveCommunity}
              />
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clubs</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.boardCarousel}
          >
            {clubBoards.map((board) => (
              <BoardCard
                key={board.id}
                community={board}
                isMember={Boolean(memberships[board.id])}
                onJoin={joinCommunity}
                onLeave={leaveCommunity}
              />
            ))}
          </ScrollView>
        </>
      ) : null}
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
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  discoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  discoverHeaderText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  boardCarousel: {
  flexDirection: "row",
  gap: 10,
  paddingRight: 4,
  },
  boardCard: {
    width: 150,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 6,
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
  boardButton: {
    marginTop: 12,
    width: "100%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  boardButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});