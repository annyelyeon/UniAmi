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

import { ScreenShell } from "../../src/components/ScreenShell";
import { useAuth } from "../../src/context/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";
import type { Note, TimetableEntry } from "../../src/types/models";

const weekDays: Array<TimetableEntry["day"]> = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const dayLabels: Record<TimetableEntry["day"], string> = {
  Mon: "Mon",
  Tue: "Tue",
  Wed: "Wed",
  Thu: "Thu",
  Fri: "Fri",
};

const entryGrid: Record<TimetableEntry["day"], TimetableEntry[]> = {
  Mon: [],
  Tue: [],
  Wed: [],
  Thu: [],
  Fri: [],
};

type TimetableEntryRow = {
  subject_code: string;
  day: TimetableEntry["day"];
  color_tag: string;
};

type NoteRow = {
  id: string;
  title: string;
  body: string;
  category_icon: string | null;
  attached_sticker_pack: string | null;
  created_at: string;
};

async function fetchPersonalData(userId: string) {
  const [{ data: timetableData, error: timetableError }, { data: notesData, error: notesError }] =
    await Promise.all([
      supabase
        .from("timetable_entries")
        .select("subject_code, day, color_tag")
        .eq("user_id", userId)
        .order("day", { ascending: true }),
      supabase
        .from("notes")
        .select("id, title, body, category_icon, attached_sticker_pack, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  const timetableEntries =
    (timetableData as TimetableEntryRow[] | null | undefined)?.map((entry) => ({
      subjectCode: entry.subject_code,
      day: entry.day,
      colorTag: entry.color_tag,
    })) ?? [];

  const notes =
    (notesData as NoteRow[] | null | undefined)?.map((note) => ({
      title: note.title,
      body: note.body,
      categoryIcon: note.category_icon ?? undefined,
      attachedStickerPack: note.attached_sticker_pack ?? undefined,
    })) ?? [];

  return {
    timetableEntries,
    notes,
    error: timetableError ?? notesError ?? null,
  };
}

export default function PersonalScreen() {
  const { profile } = useAuth();
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    const loadPersonalData = async () => {
      if (!profile?.id) {
        setTimetableEntries([]);
        setNotes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fetchPersonalData(profile.id);
      setTimetableEntries(result.timetableEntries);
      setNotes(result.notes);
      setLoading(false);
    };

    loadPersonalData();
  }, [profile?.id]);

  const submitNote = async () => {
    const title = noteTitle.trim();
    const body = noteBody.trim();

    if (!title || !body || !profile) {
      return;
    }

    setSubmittingNote(true);

    const { error } = await supabase.from("notes").insert({
      user_id: profile.id,
      title,
      body,
    });

    setSubmittingNote(false);

    if (error) {
      return;
    }

    setNoteTitle("");
    setNoteBody("");
    setShowNoteForm(false);

    if (profile?.id) {
      const result = await fetchPersonalData(profile.id);
      setTimetableEntries(result.timetableEntries);
      setNotes(result.notes);
    }
  };

  const entryGrid: Record<TimetableEntry["day"], TimetableEntry[]> = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
  };

  timetableEntries.forEach((entry) => {
    entryGrid[entry.day].push(entry);
  });

  return (
    <ScreenShell title="My calendar" subtitle="Weekly timetable and quick notes.">
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My calendar</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowNoteForm((value) => !value)}
          style={styles.headerIconButton}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.weekGrid}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekColumn}>
                <Text style={styles.dayLabel}>{dayLabels[day]}</Text>
                <View style={styles.chipStack}>
                  {entryGrid[day].length > 0 ? (
                    entryGrid[day].map((entry) => (
                      <View
                        key={`${entry.day}-${entry.subjectCode}`}
                        style={[styles.classChip, { backgroundColor: entry.colorTag }]}
                      >
                        <Text style={styles.classChipText}>{entry.subjectCode}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptySlot} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notes</Text>
      </View>

      {showNoteForm ? (
        <View style={styles.noteFormCard}>
          <TextInput
            value={noteTitle}
            onChangeText={setNoteTitle}
            placeholder="Note title"
            placeholderTextColor={colors.muted}
            style={styles.noteFormInput}
          />
          <TextInput
            value={noteBody}
            onChangeText={setNoteBody}
            placeholder="Note body"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.noteFormInput, styles.noteFormBody]}
          />
          <View style={styles.noteFormActions}>
            <Text style={styles.noteFormHint}>Adding a note to your personal space.</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!noteTitle.trim() || !noteBody.trim() || submittingNote || !profile}
              onPress={submitNote}
              style={({ pressed }) => [
                styles.noteFormButton,
                (!noteTitle.trim() || !noteBody.trim() || submittingNote || !profile) &&
                  styles.noteFormButtonDisabled,
                pressed && !(!noteTitle.trim() || !noteBody.trim() || submittingNote || !profile)
                  ? styles.cardPressed
                  : null,
              ]}
            >
              <Text style={styles.noteFormButtonText}>{submittingNote ? "Saving..." : "Add note"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {notes.length > 0 ? (
        <View style={styles.notesList}>
          {notes.map((note, index) => (
            <View key={`${note.title}-${index}`} style={styles.noteCard}>
              {note.categoryIcon ? (
                <View style={styles.noteBadge}>
                  <Ionicons
                    name={note.categoryIcon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={colors.brandRed}
                  />
                </View>
              ) : null}

              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteBody}>{note.body}</Text>

              {note.attachedStickerPack ? (
                <View style={styles.stickerRow}>
                  <Ionicons name="happy-outline" size={14} color={colors.accent} />
                  <Text style={styles.stickerText}>from {note.attachedStickerPack} pack</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No notes yet</Text>
        </View>
      )}
    </ScreenShell>
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionHeader: {
    paddingTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  weekGrid: {
    flexDirection: "row",
    gap: 8,
  },
  weekColumn: {
    flex: 1,
    gap: 8,
  },
  dayLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  chipStack: {
    minHeight: 84,
    gap: 8,
  },
  classChip: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  classChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySlot: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    minHeight: 44,
  },
  notesList: {
    gap: 12,
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
    paddingVertical: 24,
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  noteFormCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  noteFormInput: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  noteFormBody: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  noteFormActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  noteFormHint: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
  },
  noteFormButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  noteFormButtonDisabled: {
    opacity: 0.45,
  },
  noteFormButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  noteBadge: {
    alignSelf: "flex-end",
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  noteTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  noteBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  stickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  stickerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
});