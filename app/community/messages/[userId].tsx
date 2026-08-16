import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Bubble({
  message,
  isMine,
  partnerNickname,
}: {
  message: MessageRow;
  isMine: boolean;
  partnerNickname: string;
}) {
  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      {!isMine ? <AvatarInitials name={partnerNickname} /> : null}
      <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {message.body}
          </Text>
        </View>
        <Text style={[styles.bubbleTimestamp, isMine ? styles.bubbleTimestampMine : styles.bubbleTimestampTheirs]}>
          {formatMessageTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

export default function DirectMessageThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { profile } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [partnerNickname, setPartnerNickname] = useState("Student");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/community");
  };

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

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [loading, messages.length]);

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
    <ScreenShell title="Messages" subtitle="Stay connected with your university community.">
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <View style={styles.threadCard}>
          <View style={styles.chatHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back to community"
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed ? styles.cardPressed : null]}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </Pressable>

            <View style={styles.headerUserInfo}>
              <AvatarInitials name={partnerNickname} />
              <View style={styles.headerUserMeta}>
                <Text style={styles.headerUserName}>{partnerNickname}</Text>
                <Text style={styles.headerStatus}>Online now</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open conversation options"
              style={({ pressed }) => [styles.moreButton, pressed ? styles.cardPressed : null]}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
            </Pressable>
          </View>

          {messages.length > 0 ? (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.threadList}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <Bubble
                  key={message.id}
                  message={message}
                  isMine={message.sender_id === profile?.id}
                  partnerNickname={partnerNickname}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Say hi and start the conversation.</Text>
            </View>
          )}

          <View style={styles.composerCard}>
            <Pressable accessibilityRole="button" style={styles.attachButton}>
              <Ionicons name="attach-outline" size={18} color={colors.text} />
            </Pressable>
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
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
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
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 560,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    backgroundColor: "#FFFDFC",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerUserMeta: {
    flex: 1,
    gap: 2,
  },
  headerUserName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  headerStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  threadList: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubbleRowTheirs: {
    justifyContent: "flex-start",
  },
  bubbleWrap: {
    maxWidth: "78%",
    gap: 4,
  },
  bubbleWrapMine: {
    alignItems: "flex-end",
  },
  bubbleWrapTheirs: {
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 8,
  },
  bubbleTheirs: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 8,
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
  bubbleTimestamp: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    paddingHorizontal: 4,
  },
  bubbleTimestampMine: {
    color: colors.muted,
  },
  bubbleTimestampTheirs: {
    color: colors.muted,
  },
  composerCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 12,
    backgroundColor: "#FFFBF8",
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
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
    backgroundColor: colors.surface,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 14,
    shadowColor: "#FD0000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.45,
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
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
});