import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../src/lib/supabase";
import { colors } from "../src/theme/colors";

interface Message {
  id: string;
  sender: "user" | "ami";
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "ami",
    text: "Hi! I'm Ami, your campus AI study companion. How can I help you with your subjects, study plans, or coursework today?",
    timestamp: "Just now",
  },
];

const SUGGESTED_PROMPTS = [
  "Explain SQL normalization",
  "Help me plan my study schedule",
  "Tips for exam revision",
  "How to structure an academic report",
];

const fetchAIResponse = async (userText: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("chat", {
    body: { prompt: userText },
  });

  if (error) {
    throw new Error(error.message || "Failed to reach AI");
  }

  return data?.reply || "No response received.";
};

function renderInlineFormatting(rawText: string) {
  const parts = rawText.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={styles.boldText}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

function FormattedAmiText({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <View style={styles.formattedContainer}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={i} style={styles.spacer} />;
        }

        // Header parsing (### or ##)
        if (trimmed.startsWith("### ")) {
          return (
            <Text key={i} style={styles.heading3}>
              {renderInlineFormatting(trimmed.replace(/^###\s+/, ""))}
            </Text>
          );
        }
        if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          return (
            <Text key={i} style={styles.heading2}>
              {renderInlineFormatting(trimmed.replace(/^#{1,2}\s+/, ""))}
            </Text>
          );
        }

        // Bullet point parsing (* or + or -)
        const bulletMatch = trimmed.match(/^[\*\+\-]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletContent}>
                {renderInlineFormatting(bulletMatch[1])}
              </Text>
            </View>
          );
        }

        // Numbered list parsing (1. or 2.)
        const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
        if (numMatch) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.numberPrefix}>{numMatch[1]}</Text>
              <Text style={styles.bulletContent}>
                {renderInlineFormatting(numMatch[2])}
              </Text>
            </View>
          );
        }

        // Regular prose line
        return (
          <Text key={i} style={styles.amiMessageText}>
            {renderInlineFormatting(line)}
          </Text>
        );
      })}
    </View>
  );
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();
    setInputText("");
    setIsLoading(true);

    const appendAmiReply = (replyText: string) => {
      const amiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ami",
        text: replyText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, amiMessage]);
      scrollToBottom();
    };

    try {
      const reply = await fetchAIResponse(text);
      appendAmiReply(reply);
    } catch (error: any) {
      console.error("AI request failed:", error);
      appendAmiReply(
        `AI request failed: ${error.message || "Could not connect to AI service."}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Ami AI Companion</Text>
              <Text style={styles.headerSubtitle}>UniAmi Academic Study Assistant</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((item) => {
              const isUser = item.sender === "user";
              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageWrapper,
                    isUser ? styles.userMessageWrapper : styles.amiMessageWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.amiBubble,
                    ]}
                  >
                    {isUser ? (
                      <Text style={styles.userMessageText}>{item.text}</Text>
                    ) : (
                      <FormattedAmiText content={item.text} />
                    )}
                    <Text
                      style={[
                        styles.timestampText,
                        isUser ? styles.userTimestamp : styles.amiTimestamp,
                      ]}
                    >
                      {item.timestamp}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FD0000" />
                <Text style={styles.loadingText}>Ami is thinking...</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Quick Suggestion Chips */}
          <View style={styles.suggestionsContainer}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => sendMessage(prompt)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionChipText}>✨ {prompt}</Text>
              </Pressable>
            ))}
          </View>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Ami anything about coursework, study, or notes..."
              placeholderTextColor={colors.muted}
              style={styles.inputField}
              onSubmitEditing={() => sendMessage()}
            />
            <Pressable
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
              style={[
                styles.sendButton,
                inputText.trim().length > 0 && !isLoading
                  ? styles.sendButtonActive
                  : styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF7F2",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  messagesList: {
    paddingVertical: 10,
    gap: 12,
  },
  messageWrapper: {
    width: "100%",
    flexDirection: "row",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  amiMessageWrapper: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  userBubble: {
    backgroundColor: "#FD0000",
    borderBottomRightRadius: 4,
  },
  amiBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  userMessageText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
  },
  amiMessageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  formattedContainer: {
    gap: 3,
  },
  boldText: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  heading2: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 2,
  },
  heading3: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 2,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "700",
    marginRight: 6,
  },
  numberPrefix: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "700",
    marginRight: 6,
  },
  bulletContent: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "400",
  },
  spacer: {
    height: 6,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  amiTimestamp: {
    color: colors.muted,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    alignSelf: "flex-start",
  },
  loadingText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 8,
  },
  suggestionChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  sendButtonActive: {
    backgroundColor: "#FD0000",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});