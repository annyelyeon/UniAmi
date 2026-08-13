import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AvatarInitials } from "../../../src/components/AvatarInitials";
import { ScreenShell } from "../../../src/components/ScreenShell";
import { useAuth } from "../../../src/context/AuthContext";
import { supabase } from "../../../src/lib/supabase";
import { colors } from "../../../src/theme/colors";

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

async function fetchPartnerNickname(userId: string) {
  const { data, error } = await supabase.rpc("get_dm_user_nickname", {
    target_user_id: userId,
  });

  if (error) {
    return { nickname: "Student", error };
  }

  return { nickname: (data as string | null) ?? "Student", error: null };
}

async function fetchThread(currentUserId: string, partnerId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`,
    )
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: [] as MessageRow[], error };
  }

  return {
    messages: (data as MessageRow[] | null | undefined) ?? [],
    error: null,
  };
}

function Bubble({
  message,
  isMine,
}: {
  message: MessageRow;
  isMine: boolean;
}) {
  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      {!isMine ? <AvatarInitials name="Student" /> : null}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
          {message.body}
        </Text>
      </View>
    </View>
  );
}

export default function DirectMessageThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { profile } = useAuth();
  const [partnerNickname, setPartnerNickname] = useState("Student");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const loadThread = async () => {
    if (!profile?.id || !userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [nicknameResult, threadResult] = await Promise.all([
      fetchPartnerNickname(userId),
      fetchThread(profile.id, userId),
    ]);

    setPartnerNickname(nicknameResult.nickname);
    setMessages(threadResult.messages);
    setLoading(false);
  };

  useEffect(() => {
    loadThread();
  }, [profile?.id, userId]);

  const sendMessage = async () => {
    const body = messageText.trim();

    if (!body || !profile?.id || !userId) {
      return;
    }

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      sender_id: profile.id,
      recipient_id: userId,
      body,
    });

    setSending(false);

    if (error) {
      return;
    }

    setMessageText("");
    await loadThread();
  };

  return (
    <ScreenShell title={partnerNickname} subtitle="Simple direct message thread.">
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <View style={styles.threadCard}>
          {messages.length > 0 ? (
            <ScrollView contentContainerStyle={styles.threadList} showsVerticalScrollIndicator={false}>
              {messages.map((message) => (
                <Bubble key={message.id} message={message} isMine={message.sender_id === profile?.id} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Say hi!</Text>
            </View>
          )}

          <View style={styles.composerCard}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message"
              placeholderTextColor={colors.muted}
              multiline
              style={styles.composerInput}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!messageText.trim() || sending || !profile?.id}
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.sendButton,
                (!messageText.trim() || sending || !profile?.id) && styles.sendButtonDisabled,
                pressed && !(!messageText.trim() || sending || !profile?.id) ? styles.cardPressed : null,
              ]}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>{sending ? "Sending..." : "Send"}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  threadCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 520,
    overflow: "hidden",
  },
  threadList: {
    gap: 12,
    padding: 16,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubbleRowTheirs: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
  },
  bubbleTheirs: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: "#FFFFFF",
  },
  bubbleTextTheirs: {
    color: colors.text,
  },
  composerCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 14,
    backgroundColor: colors.surface,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: "top",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 360,
    padding: 16,
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 14,
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
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
});