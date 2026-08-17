import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";
import type { Post } from "../types/models";

type Props = {
  communityId?: string | null;
};

type PostRow = {
  id: string;
  author_id: string;
  author_nickname: string;
  university: string;
  content: string;
  upvote_count: number;
  comment_count: number;
  created_at: string;
};

export default function CommunityPosts({ communityId: initialCommunityId }: Props) {
  const { profile, loading: authLoading } = useAuth();
  const [communityId, setCommunityId] = useState<string | null | undefined>(initialCommunityId);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCommunityId(initialCommunityId);
  }, [initialCommunityId]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!communityId) {
        // try to resolve General
        const { data: general, error: gErr } = await supabase
          .from("communities")
          .select("id")
          .eq("name", "General")
          .limit(1)
          .maybeSingle();

        if (gErr || !general) {
          setPosts([]);
          setLoadingPosts(false);
          return;
        }

        setCommunityId((general as any).id as string);
        return;
      }

      setLoadingPosts(true);

      const { data, error } = await supabase
        .from("posts")
        .select("id, author_id, author_nickname, university, content, upvote_count, comment_count, created_at")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });

      if (error) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      const mapped = (data as PostRow[] | null | undefined)?.map((p) => ({
        id: p.id,
        authorId: p.author_id,
        authorNickname: p.author_nickname,
        university: p.university,
        content: p.content,
        upvoteCount: p.upvote_count,
        commentCount: p.comment_count,
        createdAt: p.created_at,
      })) ?? [];

      setPosts(mapped);
      setLoadingPosts(false);
    };

    void loadPosts();
  }, [communityId]);

  const submitPost = async () => {
    const content = newPostText.trim();
    if (!content || !profile) return;

    setSubmittingPost(true);

    const payload: any = {
      author_id: profile.id,
      author_nickname: profile.nickname,
      content,
      upvote_count: 0,
      comment_count: 0,
      university: profile.university,
    };

    // Ensure we have a community id
    let targetCommunityId = communityId;
    if (!targetCommunityId) {
      const { data: general } = await supabase.from("communities").select("id").eq("name", "General").limit(1).maybeSingle();
      targetCommunityId = general?.id;
    }

    if (targetCommunityId) payload.community_id = targetCommunityId;

    const { error } = await supabase.from("posts").insert(payload);

    setSubmittingPost(false);

    if (error) {
      return;
    }

    setNewPostText("");

    // refresh
    setLoadingPosts(true);
    const { data } = await supabase
      .from("posts")
      .select("id, author_id, author_nickname, university, content, upvote_count, comment_count, created_at")
      .eq("community_id", targetCommunityId)
      .order("created_at", { ascending: false });

    setPosts((data as PostRow[] | null | undefined)?.map((p) => ({
      id: p.id,
      authorId: p.author_id,
      authorNickname: p.author_nickname,
      university: p.university,
      content: p.content,
      upvoteCount: p.upvote_count,
      commentCount: p.comment_count,
      createdAt: p.created_at,
    })) ?? []);

    setLoadingPosts(false);
  };

  function PostCard({ post }: { post: Post }) {
    return (
      <View style={styles.postCard}>
        <View style={styles.postTopRow}>
          <View style={styles.avatarPlaceholder} />
          <View style={styles.postMeta}>
            <Text style={styles.postAuthor}>{post.authorNickname}</Text>
            <Text style={styles.postBoard}>{post.university}</Text>
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

  return (
    <View>
      <View style={styles.composerCard}>
        <TextInput
          accessibilityLabel="Write a new post"
          editable={!authLoading && !submittingPost && Boolean(profile)}
          multiline
          onChangeText={setNewPostText}
          placeholder="Share something with your community..."
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
              pressed && !(!newPostText.trim() || submittingPost || authLoading || !profile) ? styles.cardPressed : null,
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
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  postButtonDisabled: { opacity: 0.45 },
  postButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  cardPressed: { transform: [{ scale: 0.99 }], opacity: 0.96 },
  loadingState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    paddingVertical: 28,
  },
  loadingText: { color: colors.muted, fontSize: 14 },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  emptyStateText: { color: colors.muted, fontSize: 14, textAlign: "center" },
  postsList: { gap: 12 },
  postCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  postTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceSoft },
  postMeta: { flex: 1, gap: 2 },
  postAuthor: { color: colors.text, fontSize: 15, fontWeight: "800" },
  postBoard: { color: colors.muted, fontSize: 13 },
  postBody: { color: colors.text, fontSize: 15, lineHeight: 22 },
  postFooter: { flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" },
  metricGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  metricText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  messageLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  messageLinkText: { color: colors.accent, fontSize: 13, fontWeight: "800" },
});
