import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { colors } from "../../src/theme/colors";

type HomeCardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  highlight?: boolean;
};

function HomeCard({ title, subtitle, icon, onPress, highlight }: HomeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlight ? styles.highlightCard : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, highlight ? styles.highlightIconWrap : null]}>
          <Ionicons
            name={icon}
            size={24}
            color={highlight ? colors.brandRed : colors.accent}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.cardTitle, highlight ? styles.highlightText : null]}>
            {title}
          </Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward-outline"
        size={22}
        color={highlight ? colors.brandRed : colors.muted}
      />
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <ScreenShell
      title="Home"
      subtitle="Quick navigation hub for the core UniAmi sections."
    >
      <HomeCard
        title="Community Hub"
        subtitle="Boards, posts and messages"
        icon="people-outline"
        onPress={() => router.push("/community")}
      />
      <HomeCard
        title="Subject Info"
        subtitle="Reviews and assessment details"
        icon="book-outline"
        onPress={() => router.push("/subject-info")}
      />
      <HomeCard
        title="My Calendar"
        subtitle="Timetable and notes"
        icon="calendar-outline"
        onPress={() => router.push("/personal")}
      />
      <HomeCard
        title="Sticker Marketplace"
        subtitle="Customise your posts and notes"
        icon="happy-outline"
        highlight
        onPress={() => router.push("/sticker-marketplace")}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
  highlightCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FECACA",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  highlightIconWrap: {
    backgroundColor: "#FEE2E2",
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  highlightText: {
    color: colors.brandRed,
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});