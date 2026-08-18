import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, term: string) {
  const t = term.trim();
  if (!t) return <Text style={{ color: colors.text }}>{text}</Text>;

  const lower = text.toLowerCase();
  const search = t.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let idx = 0;
  while (idx < text.length) {
    const found = lower.indexOf(search, idx);
    if (found === -1) {
      parts.push({ text: text.slice(idx), match: false });
      break;
    }
    if (found > idx) {
      parts.push({ text: text.slice(idx, found), match: false });
    }
    parts.push({ text: text.slice(found, found + search.length), match: true });
    idx = found + search.length;
  }

  return (
    <Text>
      {parts.map((p, i) => (
        <Text key={i} style={p.match ? { color: colors.accentStrong, fontWeight: "800" } : { color: colors.text }}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

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
  created_by?: string | null;
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
  assignment: "Assignment",
  quiz: "Test",
  project: "Lab/project",
  mixed: "Mixed assessment",
};

async function fetchSubjectByCode(code: string) {
  const trimmedCode = code.trim().toUpperCase();

  if (!trimmedCode) {
    return { subject: null as Subject | null, reviews: [] as SubjectReviewView[], fuzzyMatches: [] as Subject[] };
  }

  // try exact match first
  console.log("[SubjectInfo] exact query start", { code: trimmedCode });
  const { data: exactData, error: exactError } = await supabase
    .from("subjects")
    .select(
      "code, title, average_rating, review_count, assessment_type, num_assignments, group_project_required, group_size, prerequisites, created_by",
    )
    .eq("code", trimmedCode)
    .maybeSingle();
  console.log("[SubjectInfo] exact query end", {
    code: trimmedCode,
    hasData: Boolean(exactData),
    error: exactError?.message ?? null,
  });

  if (exactError) {
    return { subject: null as Subject | null, reviews: [] as SubjectReviewView[], fuzzyMatches: [] as Subject[] };
  }

  if (exactData) {
    // fetch reviews for the exact match
    const reviewCode = (exactData as SubjectRow).code ?? trimmedCode;
    const { data: reviewData, error: reviewError } = await supabase
      .from("subject_reviews")
      .select("id, subject_code, author_id, text, created_at")
      .eq("subject_code", reviewCode)
      .order("created_at", { ascending: false });

    if (reviewError) {
      return { subject: mapSubjectRow(exactData as SubjectRow), reviews: [], fuzzyMatches: [] as Subject[] };
    }

    return {
      subject: mapSubjectRow(exactData as SubjectRow),
      reviews: (reviewData as SubjectReviewRow[] | null | undefined)?.map((review) => ({
        id: review.id,
        subjectCode: review.subject_code,
        authorId: review.author_id,
        text: review.text,
        createdAt: review.created_at,
      })) ?? [],
      fuzzyMatches: [] as Subject[],
    };
  }

  // no exact match -> fetch fuzzy matches (multiple) and return them for user selection
  const { data: fuzzyList, error: fuzzyError } = await supabase
    .from("subjects")
    .select(
      "code, title, average_rating, review_count, assessment_type, num_assignments, group_project_required, group_size, prerequisites, created_by",
    )
    .ilike("code", `%${trimmedCode}%`)
    .order("code", { ascending: true })
    .limit(10);

  if (fuzzyError || !fuzzyList || fuzzyList.length === 0) {
    return { subject: null as Subject | null, reviews: [], fuzzyMatches: [] as Subject[] };
  }

  return {
    subject: null as Subject | null,
    reviews: [],
    fuzzyMatches: (fuzzyList as SubjectRow[]).map(mapSubjectRow),
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
      createdBy: row.created_by ?? undefined,
  };
}

export default function SubjectInfoScreen() {
  const { profile } = useAuth();
  const [searchText, setSearchText] = useState("COMP3308");
  const [submittedCode, setSubmittedCode] = useState("COMP3308");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [reviews, setReviews] = useState<SubjectReviewView[]>([]);
  const [loading, setLoading] = useState(true);
  const [fuzzyMatches, setFuzzyMatches] = useState<Subject[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [postingReview, setPostingReview] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newAssessment, setNewAssessment] = useState<Subject["assessmentType"]>("assignment");
  const [newNumAssignments, setNewNumAssignments] = useState<number>(0);
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupSize, setNewGroupSize] = useState<number | undefined>(undefined);
  const [newPrereqs, setNewPrereqs] = useState("");
  const [submittingNew, setSubmittingNew] = useState(false);

  const loadSubject = async (code: string) => {
    try {
      console.log("[SubjectInfo] loadSubject start", { code });
      const result = await fetchSubjectByCode(code);
      console.log("[SubjectInfo] loadSubject end", {
        code,
        hasSubject: Boolean(result.subject),
        fuzzyCount: result.fuzzyMatches?.length ?? 0,
        reviewCount: result.reviews?.length ?? 0,
      });
      setSubject(result.subject ?? null);
      setReviews(result.reviews ?? []);
      setFuzzyMatches(result.fuzzyMatches ?? []);
    } catch (error) {
      console.error("[SubjectInfo] loadSubject failed", { code, error });
      setSubject(null);
      setReviews([]);
      setFuzzyMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubject(submittedCode);
  }, [submittedCode]);

  const submitSearch = () => {
    const nextCode = searchText.trim().toUpperCase();

    if (!nextCode) {
      return;
    }

    if (nextCode === submittedCode) {
      setLoading(true);
      loadSubject(nextCode);
      return;
    }

    setSubmittedCode(nextCode);
    setLoading(true);
  };

  // Debounced live search: when the user stops typing, perform lookup.
  useEffect(() => {
    const code = searchText.trim().toUpperCase();
    if (!code) return;
    if (code === submittedCode) return;

    const timer = setTimeout(() => {
      setSubmittedCode(code);
      setLoading(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

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

  const submitNewSubject = async () => {
    if (!profile?.id) return;
    const code = newCode.trim().toUpperCase();
    if (!code || !newTitle.trim()) return;

    setSubmittingNew(true);

    const payload: any = {
      code,
      title: newTitle.trim(),
      assessment_type: newAssessment,
      num_assignments: Number(newNumAssignments) || 0,
      group_project_required: Boolean(newGroupRequired),
      group_size: newGroupRequired ? (newGroupSize ?? null) : null,
      prerequisites: newPrereqs ? newPrereqs.split(",").map((s) => s.trim()).filter(Boolean) : [] ,
      created_by: profile.id,
    };

    const { error } = await supabase.from("subjects").insert(payload);

    setSubmittingNew(false);

    if (error) {
      Alert.alert("Error", error.message ?? "Failed to create subject");
      return;
    }

    setShowAddForm(false);
    setNewCode("");
    setNewTitle("");
    setNewAssessment("assignment");
    setNewNumAssignments(0);
    setNewGroupRequired(false);
    setNewGroupSize(undefined);
    setNewPrereqs("");

    setSubmittedCode(code);
    setLoading(true);
  };

  const deleteSubject = async (code: string) => {
    if (!profile?.id) {
      Alert.alert("Error", "You must be signed in to delete a subject.");
      return;
    }

    Alert.alert("Delete subject", `Delete ${code}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { data, error } = await supabase
            .from("subjects")
            .delete()
            .eq("code", code)
            .eq("created_by", profile.id)
            .select("code");

          if (error) {
            Alert.alert("Error", error.message ?? "Failed to delete subject");
            return;
          }

          if (!data || data.length === 0) {
            Alert.alert("Unable to delete", "This subject was not deleted. Check permissions and try again.");
            return;
          }

          setSubject((prev) => (prev?.code === code ? null : prev));
          setReviews((prev) => (subject?.code === code ? [] : prev));
          setFuzzyMatches((prev) => prev.filter((item) => item.code !== code));

          if (submittedCode === code) {
            setSubmittedCode("");
          }

          if (searchText.trim().toUpperCase() === code) {
            setSearchText("");
          }
        },
      },
    ]);
  };

  return (
    <ScreenShell title="Subject info" subtitle="Browse crowd-sourced subject reviews.">
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Subject info</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable accessibilityRole="button" onPress={() => setShowAddForm((s) => !s)} style={styles.headerIconButton}>
            <Ionicons name="add-outline" size={20} color={colors.text} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={submitSearch} style={styles.headerIconButton}>
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
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

      {showAddForm ? (
        <View style={styles.subjectCard}>
          <Text style={{ color: colors.text, fontWeight: "800", marginBottom: 8 }}>Add subject</Text>
          <Text style={{ color: colors.text, fontSize: 16, marginBottom: 4 }}>Subject code</Text>
          <TextInput value={newCode} onChangeText={setNewCode} placeholder="e.g. COMP1000" placeholderTextColor={colors.muted} style={[styles.searchInput, { marginBottom: 8 }]} autoCapitalize="characters" />
          <Text style={{ color: colors.text, fontSize: 16, marginBottom: 4 }}>Subject title</Text>
          <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="e.g.Introduction to Programming" placeholderTextColor={colors.muted} style={[styles.searchInput, { marginBottom: 8 }]} />
          <Text style={{ color: colors.text, fontSize: 16, marginBottom: 4 }}>Assessment type</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            {Object.entries(assessmentLabel).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setNewAssessment(key as Subject["assessmentType"])}
                style={{ padding: 8, backgroundColor: newAssessment === key ? colors.surface : colors.surfaceSoft, borderRadius: 8 }}
              >
                <Text style={{ color: colors.text }}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.text, fontSize: 16, marginBottom: 4 }}>Number of assignments</Text>
          <TextInput value={String(newNumAssignments)} onChangeText={(v) => setNewNumAssignments(Number(v) || 0)} placeholder="Number of assignments" placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.searchInput, { marginBottom: 8 }]} />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <Pressable onPress={() => setNewGroupRequired((g) => !g)} style={{ padding: 8, backgroundColor: newGroupRequired ? colors.surface : colors.surfaceSoft, borderRadius: 8 }}>
              <Text style={{ color: colors.text }}>{newGroupRequired ? "Group project: Yes" : "Group project: No"}</Text>
            </Pressable>
            {newGroupRequired ? (
              <TextInput value={newGroupSize ? String(newGroupSize) : ""} onChangeText={(v) => setNewGroupSize(Number(v) || undefined)} placeholder="Group size" placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.searchInput, { flex: 1 }]} />
            ) : null}
          </View>
          <Text style={{ color: colors.text, fontSize: 16, marginBottom: 4 }}>Prerequisites (optional)</Text>
          <TextInput value={newPrereqs} onChangeText={setNewPrereqs} placeholder="Prerequisites (comma separated)" placeholderTextColor={colors.muted} style={[styles.searchInput, { marginBottom: 12 }]} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable accessibilityRole="button" onPress={submitNewSubject} style={[styles.reviewPostButton, submittingNew && styles.reviewPostButtonDisabled]}>
              <Text style={styles.reviewPostButtonText}>{submittingNew ? "Adding..." : "Add subject"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setShowAddForm(false)} style={[styles.headerIconButton, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: colors.muted }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {fuzzyMatches.length > 0 ? (
        <View style={[styles.subjectCard, { marginTop: 12 }]}>
          <Text style={{ color: colors.text, fontWeight: "800", marginBottom: 8 }}>Search results</Text>
          {fuzzyMatches.map((m) => (
            <Pressable
              key={m.code}
              onPress={() => {
                setFuzzyMatches([]);
                setSearchText(m.code);
                setSubmittedCode(m.code);
                setLoading(true);
              }}
              style={({ pressed }) => [
                { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderBottomColor: colors.border, borderBottomWidth: 1 },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultCode}>{renderHighlighted(m.code, searchText)}</Text>
                  <Text style={styles.resultTitle}>{renderHighlighted(m.title, searchText)}</Text>
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultMetaSub}>{m.reviewCount ?? 0} reviews</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

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

            <View style={{ alignItems: "flex-end", gap: 8 }}>
              <View style={styles.ratingBlock}>
                <Text style={styles.reviewCount}>{subject.reviewCount} reviews</Text>
              </View>
              {profile?.id && subject.createdBy === profile.id ? (
                <Pressable accessibilityRole="button" onPress={() => deleteSubject(subject.code)} style={styles.headerIconButton}>
                  <Ionicons name="trash-outline" size={16} color={colors.muted} />
                </Pressable>
              ) : null}
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
          <Text style={styles.emptyStateTitle}>No matches for "{searchText.trim()}"</Text>
          <Text style={styles.emptyStateText}>Try the full subject code (e.g. COMP3308) or check spelling.</Text>
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
  resultCode: {
    color: colors.accentStrong,
    fontWeight: "800",
    marginBottom: 2,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 13,
  },
  resultMeta: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultMetaValue: {
    color: colors.text,
    fontWeight: "800",
    marginLeft: 6,
  },
  resultMetaSub: {
    color: colors.muted,
    fontSize: 12,
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