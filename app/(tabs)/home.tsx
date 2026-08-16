import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../src/theme/colors";

const subjectChips = [
  "Business",
  "Information Technology",
  "Computer Science",
  "Design & UX",
  "Medicine & Health",
  "Engineering",
  "Law",
  "Arts & Humanities",
  "Psychology",
  "Nursing",
  "Data Science",
  "Marketing",
  "Cybersecurity",
];

const communityPosts = [
  {
    initials: "JK",
    label: "Verified student • Engineering board",
    body: "Anyone know if COMP3308 project is still 4 people this semester?",
  },
  {
    initials: "IT",
    label: "IT Society • Club post",
    body: "Networking night this Thursday, 6pm - free pizza 🍕",
  },
  {
    initials: "SV",
    label: "Verified student • General board",
    body: "Best cheap lunch spots near campus?",
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <Image source={require("../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.brandTitle}>UniAmi</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={({ pressed }) => [styles.notificationButton, pressed ? styles.cardPressed : null]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/community")}
            style={({ pressed }) => [styles.communityCard, pressed ? styles.cardPressed : null]}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.titleWrap}>
                <View style={styles.iconWrap}>
                  <Ionicons name="people-outline" size={22} color={colors.accent} />
                </View>
                <Text style={styles.sectionTitle}>Community hub</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
            </View>

            <View style={styles.communityFeed}>
              {communityPosts.map((post) => (
                <View key={post.label} style={styles.postRow}>
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarText}>{post.initials}</Text>
                  </View>

                  <View style={styles.postBody}>
                    <Text style={styles.postMeta}>{post.label}</Text>
                    <Text style={styles.postText}>{post.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Pressable>

          <View style={styles.subjectSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subjectTitle}>Subjects</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/subject-info")}
                style={({ pressed }) => [styles.seeAllButton, pressed ? styles.cardPressed : null]}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward-outline" size={14} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectRow}
            >
              {subjectChips.map((subject) => (
                <Pressable
                  key={subject}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/(tabs)/subject-info", params: { filter: subject } })}
                  style={({ pressed }) => [styles.subjectChip, pressed ? styles.subjectChipPressed : null]}
                >
                  <Text style={styles.subjectChipText}>{subject}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarLeft}>
              <View style={styles.calendarHeaderRow}>
                <View style={styles.titleWrap}>
                  <View style={styles.calendarIconWrap}>
                    <Ionicons name="calendar-outline" size={22} color={colors.brandRed} />
                  </View>
                  <View style={styles.calendarTextWrap}>
                    <Text style={styles.calendarTitle}>My Calendar</Text>
                    <Text style={styles.calendarSubtitle}>Upcoming classes & daily notes</Text>
                  </View>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/personal")}
                style={({ pressed }) => [styles.timetableButton, pressed ? styles.cardPressed : null]}
              >
                <Text style={styles.timetableButtonText}>View Full Timetable</Text>
                <Ionicons name="arrow-forward-outline" size={16} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.calendarWidget}>
              <View style={styles.eventItem}>
                <View style={styles.eventStripRed} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventTime}>Today • 9:00 AM - 11:00 AM</Text>
                  <Text style={styles.eventTitle}>Database Systems (NIT3274)</Text>
                  <Text style={styles.eventRoom}>Building C • Lab 204</Text>
                </View>
              </View>

              <View style={styles.eventItem}>
                <View style={styles.eventStripBlue} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventTime}>Tomorrow • 11:30 AM - 1:30 PM</Text>
                  <Text style={styles.eventTitle}>Web Application Development</Text>
                  <Text style={styles.eventRoom}>Building A • Room 102</Text>
                </View>
              </View>

              <View style={styles.noteBar}>
                <Text style={styles.noteText}>📝 Project report due Fri</Text>
                <Text style={styles.noteText}>Mood: ⚡ Focused</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/sticker-marketplace")}
            style={({ pressed }) => [styles.marketCard, pressed ? styles.cardPressed : null]}
          >
            <View style={styles.marketBadge}>
              <Ionicons name="happy-outline" size={22} color={colors.accent} />
            </View>

            <View style={styles.marketTextWrap}>
              <Text style={styles.marketTitle}>Sticker marketplace</Text>
              <Text style={styles.marketSubtitle}>Customize your posts and notes</Text>
            </View>

            <Ionicons name="chevron-forward-outline" size={20} color={colors.accent} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  container: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  communityCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    backgroundColor: colors.surfaceSoft,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  communityFeed: {
    backgroundColor: "#FAF7F2",
    borderRadius: 18,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  postRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  avatarBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.accentStrong,
    fontSize: 11,
    fontWeight: "800",
  },
  postBody: {
    flex: 1,
    gap: 4,
  },
  postMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  postText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  subjectSection: {
    gap: 10,
  },
  subjectTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  seeAllText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  subjectRow: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 4,
  },
  subjectChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  subjectChipPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.96,
  },
  subjectChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    flexWrap: "wrap",
  },
  calendarLeft: {
    flex: 1,
    minWidth: 220,
    gap: 14,
    justifyContent: "space-between",
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarTextWrap: {
    gap: 4,
  },
  calendarTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  calendarSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  timetableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAF7F2",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  timetableButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  calendarWidget: {
    flex: 1,
    minWidth: 260,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  eventStripRed: {
    width: 4,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#FD0000",
  },
  eventStripBlue: {
    width: 4,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  eventBody: {
    flex: 1,
    gap: 3,
  },
  eventTime: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  eventTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  eventRoom: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  noteBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexWrap: "wrap",
  },
  noteText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  marketCard: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  marketBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FDE7E7",
    alignItems: "center",
    justifyContent: "center",
  },
  marketTextWrap: {
    flex: 1,
    gap: 4,
  },
  marketTitle: {
    color: colors.brandRed,
    fontWeight: "800",
    fontSize: 18,
  },
  marketSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
});