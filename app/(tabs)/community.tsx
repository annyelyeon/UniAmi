import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { AvatarInitials } from "../../src/components/AvatarInitials";
import { colors } from "../../src/theme/colors";
import type { Board, Post, User } from "../../src/types/models";

const currentUser: User = {
  id: "user-current",
  nickname: "Ava",
  verifiedUniversityEmail: "ava@student.uni.edu.au",
  university: "UniAmi University",
  campus: "City",
  faculty: "Information Technology",
  year: 2,
  isPremium: false,
  premiumStatus: "free",
  createdAt: "2026-01-10T08:30:00Z",
  updatedAt: "2026-08-01T11:45:00Z",
};

const boards: Board[] = [
  {
    id: "engineering-it",
    university: "UniAmi University",
    type: "faculty",
    title: "Engineering & IT",
    description: "Faculty board for coursework, opportunities, and support.",
    faculty: "Engineering & IT",
    memberCount: 1280,
    createdByUserId: "user-admin",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "business",
    university: "UniAmi University",
    type: "faculty",
    title: "Business",
    description: "Faculty board for business students and study groups.",
    faculty: "Business",
    memberCount: 940,
    createdByUserId: "user-admin",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "design",
    university: "UniAmi University",
    type: "faculty",
    title: "Design",
    description: "Creative discussions, resources, and portfolio feedback.",
    faculty: "Design",
    memberCount: 620,
    createdByUserId: "user-admin",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "health",
    university: "UniAmi University",
    type: "faculty",
    title: "Health",
    description: "Discussion board for health programs and placements.",
    faculty: "Health",
    memberCount: 730,
    createdByUserId: "user-admin",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const posts: Array<Post & { boardTitle: string; author: User }> = [
  {
    id: "post-1",
    boardId: "engineering-it",
    authorUserId: "user-001",
    title: "",
    body: "Has anyone got tips for the COMP2003 lab this week? The setup step is taking longer than expected.",
    upvoteCount: 18,
    commentCount: 6,
    createdAt: "2026-08-11T09:20:00Z",
    updatedAt: "2026-08-11T09:20:00Z",
    boardTitle: "Engineering & IT",
    author: {
      id: "user-001",
      nickname: "Liam",
      verifiedUniversityEmail: "liam@student.uni.edu.au",
      university: "UniAmi University",
      campus: "City",
      faculty: "Engineering & IT",
      year: 3,
      isPremium: false,
      premiumStatus: "free",
      createdAt: "2026-02-10T07:45:00Z",
      updatedAt: "2026-08-05T12:00:00Z",
    },
  },
  {
    id: "post-2",
    boardId: "business",
    authorUserId: "user-002",
    title: "",
    body: "Reminder: the internship info session recording is up now. Worth watching if you missed it live.",
    upvoteCount: 25,
    commentCount: 4,
    createdAt: "2026-08-10T14:05:00Z",
    updatedAt: "2026-08-10T14:05:00Z",
    boardTitle: "Business",
    author: {
      id: "user-002",
      nickname: "Mia",
      verifiedUniversityEmail: "mia@student.uni.edu.au",
      university: "UniAmi University",
      campus: "City",
      faculty: "Business",
      year: 2,
      isPremium: true,
      premiumStatus: "premium",
      createdAt: "2026-01-18T10:10:00Z",
      updatedAt: "2026-08-02T09:15:00Z",
    },
  },
  {
    id: "post-3",
    boardId: "design",
    authorUserId: "user-003",
    title: "",
    body: "Anyone want to swap feedback on the portfolio assignment? Happy to review wireframes.",
    upvoteCount: 12,
    commentCount: 3,
    createdAt: "2026-08-09T18:40:00Z",
    updatedAt: "2026-08-09T18:40:00Z",
    boardTitle: "Design",
    author: {
      id: "user-003",
      nickname: "Noah",
      verifiedUniversityEmail: "noah@student.uni.edu.au",
      university: "UniAmi University",
      campus: "North",
      faculty: "Design",
      year: 4,
      isPremium: false,
      premiumStatus: "free",
      createdAt: "2026-03-22T08:00:00Z",
      updatedAt: "2026-07-31T16:30:00Z",
    },
  },
];

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
  const openRecruitingBoard = () => {
    if (!currentUser.isPremium) {
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

function BoardCard({ board }: { board: Board }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/community/board/${board.id}`)}
      style={({ pressed }) => [styles.boardCard, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.boardIconWrap}>
        <Ionicons name="layers-outline" size={20} color={colors.accent} />
      </View>
      <Text style={styles.boardTitle}>{board.title}</Text>
      <Text style={styles.boardMembers}>{board.memberCount.toLocaleString()} members</Text>
    </Pressable>
  );
}

function PostCard({ post }: { post: (typeof posts)[number] }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postTopRow}>
        <AvatarInitials name={post.author.nickname} />
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.author.nickname}</Text>
          <Text style={styles.postBoard}>{post.boardTitle}</Text>
        </View>
      </View>

      <Text style={styles.postBody}>{post.body}</Text>

      <View style={styles.postFooter}>
        <View style={styles.metricGroup}>
          <Ionicons name="arrow-up-outline" size={16} color={colors.muted} />
          <Text style={styles.metricText}>{post.upvoteCount}</Text>
        </View>
        <View style={styles.metricGroup}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.muted} />
          <Text style={styles.metricText}>{post.commentCount}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/community/messages", params: { userId: post.author.id } })}
          style={styles.messageLink}
        >
          <Ionicons name="paper-plane-outline" size={16} color={colors.accent} />
          <Text style={styles.messageLinkText}>Message</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  return (
    <ScreenShell title="Community" subtitle="Boards and posts for your university community.">
      <CommunityHeader />
      <RecruitingBanner />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Faculty boards</Text>
      </View>
      <View style={styles.boardGrid}>
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>General</Text>
      </View>
      <View style={styles.postsList}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </View>
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

export default function CommunityScreen() {
  return (
    <ScreenShell
      title="Community"
      subtitle="Placeholder for boards, direct messages, and the Premium recruiting board."
    />
  );
}