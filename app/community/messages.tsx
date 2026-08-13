import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AvatarInitials } from "../../src/components/AvatarInitials";
import { ScreenShell } from "../../src/components/ScreenShell";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";

type ConversationRow = {
  other_user_id: string;
  other_nickname: string;
  last_message: string;
  last_message_created_at: string;
};

async function fetchConversations() {
  const { data, error } = await supabase.rpc("get_dm_conversations");

  if (error) {
    return { conversations: [] as ConversationRow[], error };
  }

  return {
    conversations: (data as ConversationRow[] | null | undefined) ?? [],
    error: null,
  };
}

function formatPreview(message: string) {
  return message.length > 48 ? `${message.slice(0, 45)}...` : message;
}

function ConversationCard({ conversation }: { conversation: ConversationRow }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/community/messages/${conversation.other_user_id}`)}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <AvatarInitials name={conversation.other_nickname} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.name}>{conversation.other_nickname}</Text>
          <Text style={styles.time}>{new Date(conversation.last_message_created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.preview}>{formatPreview(conversation.last_message)}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function CommunityMessagesScreen() {
  const { profile, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!profile?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await fetchConversations();
    setConversations(result.conversations);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations]),
  );

  return (
    <ScreenShell
      title="Direct Messages"
      subtitle="1:1 conversations with your university community."
    >
      {loading || authLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No messages yet</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.other_user_id} conversation={conversation} />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  preview: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
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
});