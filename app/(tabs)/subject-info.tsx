import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AvatarInitials } from "../../src/components/AvatarInitials";
import { ScreenShell } from "../../src/components/ScreenShell";
import { colors } from "../../src/theme/colors";
import type { Subject, SubjectReview, User } from "../../src/types/models";

const subject: Subject = {
  code: "COMP3308",
  title: "Intro to AI",
  averageRating: 4.2,
  reviewCount: 128,
  assessmentType: "mixed",
  numAssignments: 2,
  groupProjectRequired: true,
  groupSize: 4,
  prerequisites: ["COMP1000", "MATH1021"],
};

const reviewer: User = {
  id: "user-101",
  nickname: "Sophie",
  verifiedUniversityEmail: "sophie@student.uni.edu.au",
  university: "UniAmi University",
  campus: "City",
  faculty: "Engineering & IT",
  year: 2,
  isPremium: false,
  premiumStatus: "free",
  createdAt: "2026-02-02T08:00:00Z",
  updatedAt: "2026-08-06T10:10:00Z",
};

const recentReview: SubjectReview & { author: User } = {
  subjectCode: subject.code,
  authorId: reviewer.id,
  text: "Strong subject if you like applied examples. The quizzes are manageable, but the group component benefits from planning early.",
  author: reviewer,
};

const assessmentLabel: Record<Subject["assessmentType"], string> = {
  assignment: "Assignment-focused",
  quiz: "Quiz-focused",
  exam: "Exam-focused",
  project: "Project-focused",
  mixed: "Mixed assessment",
};

export default function SubjectInfoScreen() {
  const [searchText, setSearchText] = useState("COMP3308");

  return (
    <ScreenShell title="Subject info" subtitle="Browse crowd-sourced subject reviews.">
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Subject info</Text>
        <Pressable accessibilityRole="button" style={styles.headerIconButton}>
          <Ionicons name="search-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search subject code"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.subjectCard}>
        <View style={styles.subjectTopRow}>
          <View style={styles.subjectHeading}>
            <Text style={styles.subjectCode}>{subject.code}</Text>
            <Text style={styles.subjectTitle}>{subject.title}</Text>
          </View>

          <View style={styles.ratingBlock}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={colors.accent} />
              <Text style={styles.ratingValue}>{subject.averageRating.toFixed(1)}</Text>
            </View>
            <Text style={styles.reviewCount}>{subject.reviewCount} reviews</Text>
          </View>
        </View>

        <View style={styles.infoTable}>
          <InfoRow label="Assessment" value={assessmentLabel[subject.assessmentType]} />
          <InfoRow label="Assignments" value={`${subject.numAssignments}`} />
          <InfoRow
            label="Group project"
            value={subject.groupProjectRequired ? `Yes${subject.groupSize ? `, groups of ${subject.groupSize}` : ""}` : "No"}
          />
          <InfoRow
            label="Prerequisites"
            value={subject.prerequisites.length > 0 ? subject.prerequisites.join(", ") : "None"}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent review</Text>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewTopRow}>
          <AvatarInitials name={recentReview.author.nickname} />
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewAuthor}>{recentReview.author.nickname}</Text>
            <Text style={styles.reviewSubject}>{subject.code}</Text>
          </View>
        </View>

        <Text style={styles.reviewText}>{recentReview.text}</Text>
      </View>
    </ScreenShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchInput: {
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  subjectCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  subjectTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  subjectHeading: {
    flex: 1,
    gap: 4,
  },
  subjectCode: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  subjectTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  ratingBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  reviewCount: {
    color: colors.muted,
    fontSize: 13,
  },
  infoTable: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 16,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  sectionHeader: {
    paddingTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  reviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewMeta: {
    flex: 1,
    gap: 2,
  },
  reviewAuthor: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  reviewSubject: {
    color: colors.muted,
    fontSize: 13,
  },
  reviewText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});