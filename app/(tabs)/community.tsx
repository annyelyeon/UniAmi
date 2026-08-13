import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { AvatarInitials } from "../../src/components/AvatarInitials";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
import type { Board, Post, User } from "../../src/types/models";

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


type PostRow = {
  id: string;
  author_id: string;
  author_nickname: string;
  board_name: string;
  university: string;
  content: string;
  upvote_count: number;
  comment_count: number;
  created_at: string;
};

type CommunityPost = Post & {
  authorNickname: string;
};

async function fetchCommunityPosts(university: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, author_nickname, board_name, university, content, upvote_count, comment_count, created_at",
    )
    .eq("university", university)
    .order("created_at", { ascending: false });

  if (error) {
    return { posts: [] as CommunityPost[], error };
  }

  const posts = (data as PostRow[] | null | undefined)?.map((post) => ({
    id: post.id,
    authorId: post.author_id,
    authorNickname: post.author_nickname,
    boardName: post.board_name,
    university: post.university,
    content: post.content,
    upvoteCount: post.upvote_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
  })) ?? [];

  return { posts, error: null };
}

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

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postTopRow}>
        <AvatarInitials name={post.authorNickname} />
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.authorNickname}</Text>
          <Text style={styles.postBoard}>{post.boardName}</Text>
        </View>
      </View>

      <Text style={styles.postBody}>{post.content}</Text>

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
          onPress={() => router.push(`/community/messages/${post.authorId}`)}
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
  const { profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      if (!profile?.university) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      setLoadingPosts(true);
      const result = await fetchCommunityPosts(profile.university);
      setPosts(result.posts);
      setLoadingPosts(false);
    };

    loadPosts();
  }, [profile?.university]);

  const submitPost = async () => {
    const content = newPostText.trim();

    if (!content || !profile) {
      return;
    }

    setSubmittingPost(true);

    const { error } = await supabase.from("posts").insert({
      author_id: profile.id,
      author_nickname: profile.nickname,
      board_name: "General",
      university: profile.university,
      content,
      upvote_count: 0,
      comment_count: 0,
    });

    setSubmittingPost(false);

    if (error) {
      return;
    }

    setNewPostText("");

    if (profile?.university) {
      setLoadingPosts(true);
      const result = await fetchCommunityPosts(profile.university);
      setPosts(result.posts);
      setLoadingPosts(false);
    }
  };

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
      <View style={styles.composerCard}>
        <TextInput
          accessibilityLabel="Write a new post"
          editable={!authLoading && !submittingPost && Boolean(profile)}
          multiline
          onChangeText={setNewPostText}
          placeholder="Share something with your university community..."
          placeholderTextColor={colors.muted}
          style={styles.composerInput}
          value={newPostText}
        />
        <View style={styles.composerActions}>
          <Text style={styles.composerHint}>Posting as {profile?.nickname ?? "your account"}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!newPostText.trim() || submittingPost || authLoading || !profile}
            onPress={submitPost}
            style={({ pressed }) => [
              styles.postButton,
              (!newPostText.trim() || submittingPost || authLoading || !profile) && styles.postButtonDisabled,
              pressed && !(!newPostText.trim() || submittingPost || authLoading || !profile)
                ? styles.cardPressed
                : null,
            ]}
          >
            <Text style={styles.postButtonText}>{submittingPost ? "Posting..." : "Post"}</Text>
          </Pressable>
        </View>
      </View>

      {loadingPosts ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No posts yet — be the first!</Text>
        </View>
      ) : (
        <View style={styles.postsList}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </View>
      )}
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