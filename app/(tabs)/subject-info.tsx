import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AvatarInitials } from "../../src/components/AvatarInitials";
import { ScreenShell } from "../../src/components/ScreenShell";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
import type { Subject, SubjectReview } from "../../src/types/models";

type SubjectRow = {
  code: string;
  title: string;
  average_rating: number;
  review_count: number;
  assessment_type: Subject["assessmentType"];
  num_assignments: number;
  group_project_required: boolean;
  group_size: number | null;
  prerequisites: string[];
};

type SubjectReviewRow = {
  id: string;
  subject_code: string;
  author_id: string;
  text: string;
  created_at: string;
};

type SubjectReviewView = SubjectReview & {
  id: string;
  createdAt: string;
};

const assessmentLabel: Record<Subject["assessmentType"], string> = {
  assignment: "Assignment-focused",
  quiz: "Quiz-focused",
  exam: "Exam-focused",
  project: "Project-focused",
  mixed: "Mixed assessment",
};

async function fetchSubjectByCode(code: string) {
  const trimmedCode = code.trim().toUpperCase();

  if (!trimmedCode) {
    return { subject: null as Subject | null, reviews: [] as SubjectReviewView[] };
  }

  const { data: subjectData, error: subjectError } = await supabase
    .from("subjects")
    .select("code, title, average_rating, review_count, assessment_type, num_assignments, group_project_required, group_size, prerequisites")
    .eq("code", trimmedCode)
    .maybeSingle();

  if (subjectError || !subjectData) {
    return { subject: null as Subject | null, reviews: [] as SubjectReviewView[] };
  }

  const { data: reviewData, error: reviewError } = await supabase
    .from("subject_reviews")
    .select("id, subject_code, author_id, text, created_at")
    .eq("subject_code", trimmedCode)
    .order("created_at", { ascending: false });

  if (reviewError) {
    return {
      subject: mapSubjectRow(subjectData as SubjectRow),
      reviews: [],
    };
  }

  return {
    subject: mapSubjectRow(subjectData as SubjectRow),
    reviews: (reviewData as SubjectReviewRow[] | null | undefined)?.map((review) => ({
      id: review.id,
      subjectCode: review.subject_code,
      authorId: review.author_id,
      text: review.text,
      createdAt: review.created_at,
    })) ?? [],
  };
}

function mapSubjectRow(row: SubjectRow): Subject {
  return {
    code: row.code,
    title: row.title,
    averageRating: row.average_rating,
    reviewCount: row.review_count,
    assessmentType: row.assessment_type,
    numAssignments: row.num_assignments,
    groupProjectRequired: row.group_project_required,
    groupSize: row.group_size ?? undefined,
    prerequisites: row.prerequisites,
  };
}

export default function SubjectInfoScreen() {
  const { profile } = useAuth();
  const [searchText, setSearchText] = useState("COMP3308");
  const [submittedCode, setSubmittedCode] = useState("COMP3308");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [reviews, setReviews] = useState<SubjectReviewView[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [postingReview, setPostingReview] = useState(false);

  const loadSubject = async (code: string) => {
    const result = await fetchSubjectByCode(code);
    setSubject(result.subject);
    setReviews(result.reviews);
    setLoading(false);
  };

  useEffect(() => {
    loadSubject(submittedCode);
  }, [submittedCode]);

  const submitSearch = () => {
    const nextCode = searchText.trim().toUpperCase();

    if (!nextCode) {
      return;
    }

    setSubmittedCode(nextCode);
    setLoading(true);
  };

  const submitReview = async () => {
    const text = reviewText.trim();

    if (!text || !profile || !subject) {
      return;
    }

    setPostingReview(true);

    const { error } = await supabase.from("subject_reviews").insert({
      subject_code: subject.code,
      author_id: profile.id,
      text,
    });

    setPostingReview(false);

    if (error) {
      return;
    }

    setReviewText("");
    await loadSubject(subject.code);
  };

  return (
    <ScreenShell title="Subject info" subtitle="Browse crowd-sourced subject reviews.">
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Subject info</Text>
        <Pressable accessibilityRole="button" onPress={submitSearch} style={styles.headerIconButton}>
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
          returnKeyType="search"
          onSubmitEditing={submitSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading subject...</Text>
        </View>
      ) : subject ? (
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
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No results for {submittedCode}</Text>
          <Text style={styles.emptyStateText}>Try another subject code to load details and reviews.</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent review</Text>
      </View>

      {reviews.length > 0 ? (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewTopRow}>
              <AvatarInitials name="Student" />
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewAuthor}>Student</Text>
                <Text style={styles.reviewSubject}>{review.subjectCode}</Text>
              </View>
            </View>

            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))
      ) : subject ? (
        <View style={styles.emptyReviewState}>
          <Text style={styles.emptyStateText}>No reviews yet — be the first to write one!</Text>
        </View>
      ) : null}

      {subject ? (
        <View style={styles.reviewComposerCard}>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Write a review..."
            placeholderTextColor={colors.muted}
            multiline
            style={styles.reviewComposerInput}
          />
          <View style={styles.reviewComposerFooter}>
            <Text style={styles.reviewComposerHint}>Posting as {profile?.nickname ?? "your account"}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!reviewText.trim() || postingReview || !profile}
              onPress={submitReview}
              style={({ pressed }) => [
                styles.reviewPostButton,
                (!reviewText.trim() || postingReview || !profile) && styles.reviewPostButtonDisabled,
                pressed && !(!reviewText.trim() || postingReview || !profile)
                  ? styles.cardPressed
                  : null,
              ]}
            >
              <Text style={styles.reviewPostButtonText}>{postingReview ? "Posting..." : "Post review"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
    paddingHorizontal: 18,
    paddingVertical: 28,
    gap: 6,
  },
  emptyReviewState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  reviewComposerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  reviewComposerInput: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
    textAlignVertical: "top",
  },
  reviewComposerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reviewComposerHint: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
  },
  reviewPostButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reviewPostButtonDisabled: {
    opacity: 0.45,
  },
  reviewPostButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
});