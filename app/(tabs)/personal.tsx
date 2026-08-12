import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { colors } from "../../src/theme/colors";
import type { Note, TimetableEntry } from "../../src/types/models";

const weekDays: Array<TimetableEntry["day"]> = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const timetableEntries: TimetableEntry[] = [
  { subjectCode: "COMP3308", day: "Mon", colorTag: "#FED7AA" },
  { subjectCode: "BUSS1001", day: "Wed", colorTag: "#BFDBFE" },
  { subjectCode: "DESN2002", day: "Fri", colorTag: "#FBCFE8" },
];

const notes: Note[] = [
  {
    title: "Assignment check-in",
    body: "Draft the COMP3308 outline before Thursday so the group can split tasks early.",
    categoryIcon: "alarm-outline",
  },
  {
    title: "Weekly reminder",
    body: "Reserve a study block on Wednesday afternoon for lecture recap and practice questions.",
    categoryIcon: "flame-outline",
  },
  {
    title: "Revision sticker note",
    body: "Use this as a quick highlight for exam prep and motivation.",
    categoryIcon: "happy-outline",
    attachedStickerPack: "Campus Boost",
  },
];

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

timetableEntries.forEach((entry) => {
  entryGrid[entry.day].push(entry);
});

export default function PersonalScreen() {
  return (
    <ScreenShell title="My calendar" subtitle="Weekly timetable and quick notes.">
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My calendar</Text>
        <Pressable accessibilityRole="button" style={styles.headerIconButton}>
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>

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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notes</Text>
      </View>

      <View style={styles.notesList}>
        {notes.map((note) => (
          <View key={note.title} style={styles.noteCard}>
            {note.categoryIcon ? (
              <View style={styles.noteBadge}>
                <Ionicons name={note.categoryIcon as keyof typeof Ionicons.glyphMap} size={14} color={colors.brandRed} />
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