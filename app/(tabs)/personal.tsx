import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../src/theme/colors";

interface ColorOption {
  id: string;
  name: string;
  accent: string;
  bg: string;
  badgeBg: string;
}

interface ScheduleItem {
  id: string;
  day: string;
  dayKey?: string;
  dateKey?: string;
  dateString?: string;
  subject: string;
  type: string;
  time: string;
  location: string;
  accentColor: string;
  bgTint: string;
  badgeBg: string;
}

interface NoteTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
}

interface StudyNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  bgTint: string;
  borderColor: string;
  isPinned: boolean;
  attachments?: Array<{ type: "image" | "file" }>;
}

interface NoteColorOption {
  id: string;
  name: string;
  bg: string;
  border: string;
}

const DAYS = [
  { key: "Mon", label: "Mon", date: "17" },
  { key: "Tue", label: "Tue", date: "18" },
  { key: "Wed", label: "Wed", date: "19" },
  { key: "Thu", label: "Thu", date: "20" },
  { key: "Fri", label: "Fri", date: "21" },
  { key: "Sat", label: "Sat", date: "22" },
  { key: "Sun", label: "Sun", date: "23" },
];

const CLASS_TYPES = ["Lecture", "Lab", "Workshop", "Event", "Study Session", "Other"];

const CLASS_COLOR_PALETTE: ColorOption[] = [
  { id: "red", name: "Red", accent: "#FD0000", bg: "#FEF2F2", badgeBg: "#FEE2E2" },
  { id: "blue", name: "Blue", accent: "#2563EB", bg: "#EFF6FF", badgeBg: "#DBEAFE" },
  { id: "green", name: "Green", accent: "#059669", bg: "#ECFDF5", badgeBg: "#D1FAE5" },
  { id: "amber", name: "Amber", accent: "#D97706", bg: "#FFFBEB", badgeBg: "#FEF3C7" },
  { id: "purple", name: "Purple", accent: "#7C3AED", bg: "#F5F3FF", badgeBg: "#EDE9FE" },
  { id: "pink", name: "Pink", accent: "#DB2777", bg: "#FDF2F8", badgeBg: "#FCE7F3" },
];

const NOTE_COLOR_PALETTE: NoteColorOption[] = [
  { id: "white", name: "Classic White", bg: "#FFFFFF", border: "#E2E8F0" },
  { id: "cream", name: "Warm Yellow", bg: "#FEFCE8", border: "#FDE047" },
  { id: "mint", name: "Mint Green", bg: "#F0FDF4", border: "#BBF7D0" },
  { id: "blue", name: "Ice Blue", bg: "#F0F9FF", border: "#BAE6FD" },
  { id: "rose", name: "Soft Rose", bg: "#FFF1F2", border: "#FECDD3" },
  { id: "lavender", name: "Lavender", bg: "#F5F3FF", border: "#DDD6FE" },
];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: "1",
    day: "Mon",
    subject: "Database Systems",
    type: "Lecture & Lab",
    time: "10:00 AM - 12:00 PM",
    location: "Building D, Rm 302",
    accentColor: "#FD0000",
    bgTint: "#FEF2F2",
    badgeBg: "#FEE2E2",
  },
  {
    id: "2",
    day: "Mon",
    subject: "ICT Project Management",
    type: "Workshop",
    time: "2:00 PM - 4:00 PM",
    location: "Online Zoom",
    accentColor: "#2563EB",
    bgTint: "#EFF6FF",
    badgeBg: "#DBEAFE",
  },
  {
    id: "3",
    day: "Wed",
    subject: "Web Development",
    type: "Workshop",
    time: "11:30 AM - 1:30 PM",
    location: "Building A, Rm 104",
    accentColor: "#059669",
    bgTint: "#ECFDF5",
    badgeBg: "#D1FAE5",
  },
  {
    id: "4",
    day: "Thu",
    subject: "Cloud Computing",
    type: "Lab",
    time: "1:00 PM - 3:00 PM",
    location: "Building B, Rm 210",
    accentColor: "#D97706",
    bgTint: "#FFFBEB",
    badgeBg: "#FEF3C7",
  },
];

const INITIAL_TASKS: NoteTask[] = [
  { id: "1", title: "Review Sessions 5 – 10 lecture notes", completed: false, priority: "High" },
  { id: "2", title: "Make chapter summaries for Database normalization", completed: true, priority: "Medium" },
  { id: "3", title: "Complete practice exam questions 1 to 4", completed: false, priority: "High" },
  { id: "4", title: "Submit project milestone report by 10:00 AM", completed: false, priority: "High", dueDate: "Tomorrow, 10:00 AM" },
];

const INITIAL_NOTES: StudyNote[] = [
  {
    id: "1",
    title: "SQL & Normalization",
    content: "1NF: Atomic values.\n2NF: No partial dependency.\n3NF: No transitive dependency.",
    updatedAt: "Today, 8:40 AM",
    bgTint: "#FEF9C3",
    borderColor: "#FDE047",
    isPinned: true,
  },
  {
    id: "2",
    title: "ICT Architecture Stack",
    content: "Frontend: React Native / Expo\nBackend: Supabase PostgreSQL\nAI: Edge Function LLM Pipeline",
    updatedAt: "Yesterday",
    bgTint: "#E0F2FE",
    borderColor: "#7DD3FC",
    isPinned: true,
  },
  {
    id: "3",
    title: "Library Book Deadlines",
    content: "Return Database Concepts (7th Ed) by Friday 4 PM at campus library.",
    updatedAt: "Aug 15",
    bgTint: "#FFFFFF",
    borderColor: "#E5E7EB",
    isPinned: false,
  },
];

const NOTES_STORAGE_KEY = "@uni_ami_study_notes";
const SCHEDULE_STORAGE_KEY = "@uni_ami_schedule";
const TODOS_STORAGE_KEY = "@uni_ami_daily_todos";

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateKey(date: Date) {
  return formatLocalDateKey(date);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekStart(date: Date, offset: number = 0) {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  const mondayOffset = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - mondayOffset + offset * 7);
  return base;
}

function formatDisplayDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatLongDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function formatRangeLabel(startKey: string, endKey: string) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const startText = start.toLocaleDateString([], { day: "numeric", month: "short" });
  const endText = end.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  return `${startText} – ${endText}`;
}

function formatNoteDate(rawDate?: string): string {
  if (!rawDate) return "Just now";
  if (rawDate.includes("Today") || rawDate.includes("Yesterday")) return rawDate;

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return rawDate;

  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function formatNotePreview(html: string = ""): string {
  if (!html) return "No content yet...";

  return html
    .replace(/<style[^>]*>.*<\/style>/gm, "")
    .replace(/<br\s*[/]?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<input[^>]*checkbox[^>]*>/gi, "▫ ")
    .replace(/<[^>]+>/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getNoteCardAppearance(note: StudyNote, index: number) {
  const palette = [
    { bg: "#FEF9C3", border: "#FACC15" },
    { bg: "#E0F2FE", border: "#38BDF8" },
    { bg: "#FFE4E6", border: "#FB7185" },
    { bg: "#DCFCE7", border: "#4ADE80" },
  ];

  const fallback = palette[index % palette.length];
  const normalized = String(note.bgTint || "").toLowerCase();

  if (
    normalized === "#ffffff" ||
    normalized === "#fefce8" ||
    normalized === "#f0f9ff" ||
    normalized === "#fff1f2" ||
    normalized === "#f0fdf4"
  ) {
    return fallback;
  }

  return {
    bg: note.bgTint || fallback.bg,
    border: note.borderColor || fallback.border,
  };
}

export default function PersonalScreen() {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDateKey, setActiveDateKey] = useState(toDateKey(new Date()));
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [todosByDate, setTodosByDate] = useState<Record<string, NoteTask[]>>({});
  const [newTaskInput, setNewTaskInput] = useState("");
  const [notes, setNotes] = useState<StudyNote[]>(INITIAL_NOTES);
  const [isLoaded, setIsLoaded] = useState(false);

  const weekDates = DAYS.map((day, index) => {
    const date = addDays(getWeekStart(new Date(), weekOffset), index);
    return {
      ...day,
      dateKey: toDateKey(date),
      dayNumber: date.getDate(),
    };
  });

  const currentWeekStart = weekDates[0]?.dateKey ?? toDateKey(new Date());
  const currentWeekEnd = weekDates[weekDates.length - 1]?.dateKey ?? toDateKey(new Date());
  const weekRangeText = formatRangeLabel(currentWeekStart, currentWeekEnd);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadPersistedData = async () => {
        setIsLoaded(false);
        try {
          const [savedNotes, savedSchedule, savedTodos] = await Promise.all([
            AsyncStorage.getItem(NOTES_STORAGE_KEY),
            AsyncStorage.getItem(SCHEDULE_STORAGE_KEY),
            AsyncStorage.getItem(TODOS_STORAGE_KEY),
          ]);
          if (!isActive) return;

          const parsedNotes = savedNotes ? JSON.parse(savedNotes) : null;
          const parsedSchedule = savedSchedule ? JSON.parse(savedSchedule) : null;
          const parsedTodos = savedTodos ? JSON.parse(savedTodos) : null;

          setNotes(Array.isArray(parsedNotes) && parsedNotes.length ? parsedNotes : INITIAL_NOTES);
          setSchedule(Array.isArray(parsedSchedule) && parsedSchedule.length ? parsedSchedule : INITIAL_SCHEDULE);
          setTodosByDate(parsedTodos && typeof parsedTodos === "object" ? parsedTodos : {});
        } catch {
          if (!isActive) return;
          setNotes(INITIAL_NOTES);
          setSchedule(INITIAL_SCHEDULE);
          setTodosByDate({});
        } finally {
          if (isActive) setIsLoaded(true);
        }
      };

      void loadPersistedData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  }, [isLoaded, schedule]);

  useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todosByDate));
  }, [isLoaded, todosByDate]);

  useEffect(() => {
    if (!activeDateKey) return;

    const match = weekDates.find((day) => day.dateKey === activeDateKey);
    if (match) setSelectedDay(match.key);
  }, [activeDateKey, weekDates]);

  // Add Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState("Mon");
  const [modalSubject, setModalSubject] = useState("");
  const [modalType, setModalType] = useState("Lecture");
  const [modalColor, setModalColor] = useState<ColorOption>(CLASS_COLOR_PALETTE[0]);
  const [modalTime, setModalTime] = useState("");
  const [modalLocation, setModalLocation] = useState("");

  // Notes Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitleInput, setNoteTitleInput] = useState("");
  const [noteContentInput, setNoteContentInput] = useState("");
  const [noteColorChoice, setNoteColorChoice] = useState<NoteColorOption>(NOTE_COLOR_PALETTE[0]);
  const [noteIsPinned, setNoteIsPinned] = useState(false);

  // Daily To-Do Handlers
  const toggleTask = async (id: string) => {
    if (!isLoaded) return;
    const updatedTodos = {
      ...todosByDate,
      [activeDateKey]: (todosByDate[activeDateKey] ?? []).map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    };
    setTodosByDate(updatedTodos);
    await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(updatedTodos));
  };

  const addTask = async () => {
    if (!isLoaded || !newTaskInput.trim()) return;
    const newTask: NoteTask = {
      id: Date.now().toString(),
      title: newTaskInput.trim(),
      completed: false,
      priority: "Medium",
    };

    const updatedTodos = {
      ...todosByDate,
      [activeDateKey]: [newTask, ...(todosByDate[activeDateKey] ?? [])],
    };
    setTodosByDate(updatedTodos);
    await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(updatedTodos));
    setNewTaskInput("");
  };

  // Class Modal Handlers
  const handleOpenAddClassModal = () => {
    setModalDay(selectedDay);
    setModalSubject("");
    setModalType("Lecture");
    setModalColor(CLASS_COLOR_PALETTE[0]);
    setModalTime("");
    setModalLocation("");
    setIsClassModalOpen(true);
  };

  const handleColorWheelClick = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "🎨 Unlock Custom Color Wheel\n\nUnlock unlimited custom colors, HEX palettes, and custom calendar themes with UniAmi Premium!\n\nWould you like to explore Premium?"
      );
      if (confirmed) {
        setIsClassModalOpen(false);
        router.push("/premium-upsell");
      }
    } else {
      Alert.alert(
        "🎨 Unlock Custom Color Wheel",
        "Unlock unlimited custom colors, HEX palettes, and custom calendar themes with UniAmi Premium!",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Explore Premium ✨",
            onPress: () => {
              setIsClassModalOpen(false);
              router.push("/premium-upsell");
            },
          },
        ]
      );
    }
  };

  const handleSaveClass = async () => {
    if (!isLoaded || !modalSubject.trim()) return;

    const targetWeekStart = getWeekStart(new Date(), weekOffset);
    const targetIndex = DAYS.findIndex((day) => day.key === modalDay);
    const targetDate = addDays(targetWeekStart, targetIndex);
    const targetDateKey = toDateKey(targetDate);

    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      day: modalDay,
      dayKey: modalDay,
      dateKey: targetDateKey,
      dateString: targetDateKey,
      subject: modalSubject.trim(),
      type: modalType,
      time: modalTime.trim() || "TBA",
      location: modalLocation.trim() || "Campus",
      accentColor: modalColor.accent,
      bgTint: modalColor.bg,
      badgeBg: modalColor.badgeBg,
    };

    const updatedSchedule = [...schedule, newItem];
    setSchedule(updatedSchedule);
    await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));
    setSelectedDay(modalDay);
    setActiveDateKey(targetDateKey);
    setModalSubject("");
    setModalTime("");
    setModalLocation("");
    setIsClassModalOpen(false);
  };

  const deleteScheduleItem = async (id: string) => {
    if (!isLoaded) return;
    const updatedSchedule = schedule.filter((item) => item.id !== id);
    setSchedule(updatedSchedule);
    await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updatedSchedule));
  };

  // Notes Sidebar Handlers
  const handleOpenNewNoteScreen = () => {
    router.push("/note-editor");
  };

  const handleOpenExistingNoteScreen = (note: StudyNote) => {
    router.push({
      pathname: "/note-editor",
      params: {
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.bgTint,
        isPinned: String(note.isPinned),
      },
    });
  };

  const handleOpenNewNoteModal = () => {
    setEditingNoteId(null);
    setNoteTitleInput("");
    setNoteContentInput("");
    setNoteColorChoice(NOTE_COLOR_PALETTE[0]);
    setNoteIsPinned(false);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNoteModal = (note: StudyNote) => {
    setEditingNoteId(note.id);
    setNoteTitleInput(note.title);
    setNoteContentInput(note.content);
    const matchedColor =
      NOTE_COLOR_PALETTE.find((c) => c.bg === note.bgTint) || NOTE_COLOR_PALETTE[0];
    setNoteColorChoice(matchedColor);
    setNoteIsPinned(note.isPinned);
    setIsNoteModalOpen(true);
  };

  const persistNotes = async (nextNotes: StudyNote[]) => {
    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(nextNotes));
      setNotes(nextNotes);
    } catch {
      // ignore storage errors and keep in-memory state
      setNotes(nextNotes);
    }
  };

  const togglePinNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const currentPinnedCount = notes.filter((n) => n.isPinned).length;

    if (!target.isPinned && currentPinnedCount >= 3) {
      if (Platform.OS === "web") {
        window.alert("Maximum 3 pinned notes reached. Please unpin a note first.");
      } else {
        Alert.alert("Pin Limit Reached", "You can pin up to 3 notes to the top.");
      }
      return;
    }

    const updated = notes
      .map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

    await persistNotes(updated);
  };

  const handleSaveNote = () => {
    if (!noteTitleInput.trim() && !noteContentInput.trim()) return;

    const currentPinnedCount = notes.filter(
      (n) => n.isPinned && n.id !== editingNoteId
    ).length;

    let willBePinned = noteIsPinned;
    if (willBePinned && currentPinnedCount >= 3) {
      willBePinned = false;
    }

    const title = noteTitleInput.trim() || "Untitled Note";
    const content = noteContentInput.trim();

    if (editingNoteId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNoteId
            ? {
                ...n,
                title,
                content,
                bgTint: noteColorChoice.bg,
                borderColor: noteColorChoice.border,
                isPinned: willBePinned,
                updatedAt: "Just now",
              }
            : n
        )
      );
    } else {
      const newNote: StudyNote = {
        id: Date.now().toString(),
        title,
        content,
        updatedAt: "Just now",
        bgTint: noteColorChoice.bg,
        borderColor: noteColorChoice.border,
        isPinned: willBePinned,
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    setIsNoteModalOpen(false);
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    await persistNotes(updated);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const activeTodoList = todosByDate[activeDateKey] ?? [];
  const activeTaskCount = activeTodoList.filter((task) => task.completed).length;
  const activeDaySchedule = schedule.filter(
    (item) =>
      item.dateString === activeDateKey ||
      item.dateKey === activeDateKey ||
      item.dayKey === selectedDay ||
      item.day === selectedDay,
  );

  const goToPreviousWeek = () => {
    const nextOffset = weekOffset - 1;
    setWeekOffset(nextOffset);
    const weekStart = getWeekStart(new Date(), nextOffset);
    const targetIndex = DAYS.findIndex((d) => d.key === selectedDay);
    setActiveDateKey(toDateKey(addDays(weekStart, targetIndex)));
  };

  const goToNextWeek = () => {
    const nextOffset = weekOffset + 1;
    setWeekOffset(nextOffset);
    const weekStart = getWeekStart(new Date(), nextOffset);
    const targetIndex = DAYS.findIndex((d) => d.key === selectedDay);
    setActiveDateKey(toDateKey(addDays(weekStart, targetIndex)));
  };

  const jumpToCurrentWeek = () => {
    setWeekOffset(0);
    setActiveDateKey(toDateKey(new Date()));
    setSelectedDay("Mon");
  };

  const handleDateNavigator = (direction: "prev" | "next") => {
    const current = parseDateKey(activeDateKey);
    const step = direction === "prev" ? -1 : 1;
    const next = addDays(current, step);

    setActiveDateKey(toDateKey(next));
    const dayIndex = (next.getDay() + 6) % 7;
    const nextDay = DAYS[dayIndex] ?? DAYS[0];
    setSelectedDay(nextDay.key);
    const currentWeekStart = getWeekStart(new Date(), 0);
    const nextWeekStart = getWeekStart(next);
    const nextOffset = Math.round(
      (nextWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    setWeekOffset(nextOffset);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Workspace Hero Header */}
        <View style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>WORKSPACE</Text>
            </View>
            <View style={styles.statusDotRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Active Semester</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>My Schedule & Notes</Text>
          <Text style={styles.headerSubtitle}>
            Track your weekly timetable, daily to-dos, and quick study notebook.
          </Text>
        </View>

        {/* 2-Column Responsive Workspace */}
        <View style={styles.workspaceRow}>
          
          {/* LEFT MAIN COLUMN: Timetable & To-Do List */}
          <View style={styles.mainColumn}>
            
            {/* Timetable Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Weekly Timetable</Text>
              <Pressable onPress={handleOpenAddClassModal} style={styles.addClassButton}>
                <Text style={styles.addClassButtonText}>+ Add Class</Text>
              </Pressable>
            </View>

            {/* Day Selector Pills */}
            <View style={styles.weekHeaderRow}>
              <Pressable onPress={goToPreviousWeek} style={styles.navButton}>
                <Text style={styles.navButtonText}>‹</Text>
              </Pressable>

              <Text style={styles.weekRangeText}>{weekRangeText}</Text>

              {weekOffset !== 0 && (
                <Pressable onPress={jumpToCurrentWeek} style={styles.thisWeekButton}>
                  <Text style={styles.thisWeekText}>This Week</Text>
                </Pressable>
              )}

              <Pressable onPress={goToNextWeek} style={styles.navButton}>
                <Text style={styles.navButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.daysRow}>
              {weekDates.map((d) => {
                const isSelected = d.dateKey === activeDateKey;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => {
                      setSelectedDay(d.key);
                      setActiveDateKey(d.dateKey);
                    }}
                    style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  >
                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                      {d.dayNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Selected Day Classes */}
            <ScrollView
              {...(Platform.OS === "web" ? { className: "uniAmiScroll" } : {})}
              style={styles.scheduleScrollView}
              contentContainerStyle={styles.scheduleList}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {activeDaySchedule.length > 0 ? (
                activeDaySchedule.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.scheduleCard,
                      { backgroundColor: "#FFFFFF", borderLeftColor: item.accentColor },
                    ]}
                  >
                    <View style={styles.scheduleCardHeader}>
                      <View style={styles.scheduleTitleGroup}>
                        <Text style={styles.scheduleSubject}>{item.subject}</Text>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: item.badgeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color: item.accentColor },
                            ]}
                          >
                            {item.type}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => deleteScheduleItem(item.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>✕</Text>
                      </Pressable>
                    </View>
                    <View style={styles.scheduleDetailsRow}>
                      <Text style={styles.scheduleDetailText}>⏰ {item.time}</Text>
                      <Text style={styles.scheduleDetailText}>📍 {item.location}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No classes scheduled for {selectedDay}.</Text>
                  <Text style={styles.emptySubtext}>Tap "+ Add Class" to add an event.</Text>
                </View>
              )}
            </ScrollView>

            {/* Daily To-Do List Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>Daily To-Do List</Text>
              <Text style={styles.taskCountBadge}>
                {activeTaskCount}/{activeTodoList.length} Completed
              </Text>
            </View>

            <View style={styles.todoNavigatorRow}>
              <Pressable onPress={() => handleDateNavigator("prev")} style={styles.navButton}>
                <Text style={styles.navButtonText}>‹</Text>
              </Pressable>

              <View style={styles.dateDisplayWrap}>
                <Text style={styles.dateDisplayText}>{formatLongDate(activeDateKey)}</Text>
                {activeDateKey === toDateKey(new Date()) && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                )}
              </View>

              <Pressable onPress={() => handleDateNavigator("next")} style={styles.navButton}>
                <Text style={styles.navButtonText}>›</Text>
              </Pressable>
            </View>

            {/* Add Task Input */}
            <View style={styles.inputContainer}>
              <TextInput
                value={newTaskInput}
                onChangeText={setNewTaskInput}
                placeholder="Add new daily to-do item..."
                placeholderTextColor="#94A3B8"
                style={styles.taskInput}
                onSubmitEditing={addTask}
              />
              <Pressable
                onPress={addTask}
                disabled={!newTaskInput.trim()}
                style={[
                  styles.addButton,
                  newTaskInput.trim() ? styles.addButtonActive : styles.addButtonDisabled,
                ]}
              >
                <Text style={[styles.addButtonText, !newTaskInput.trim() && styles.addButtonTextDisabled]}>
                  Add
                </Text>
              </Pressable>
            </View>

            {/* Task Cards */}
            <ScrollView
              {...(Platform.OS === "web" ? { className: "uniAmiScroll" } : {})}
              style={styles.tasksScrollView}
              contentContainerStyle={styles.taskList}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {activeTodoList.length > 0 ? activeTodoList.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => toggleTask(task.id)}
                  style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                >
                  <View style={[styles.checkbox, task.completed && styles.checkboxActive]}>
                    {task.completed && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.dueDate && (
                      <Text style={styles.taskDueDate}>🗓 {task.dueDate}</Text>
                    )}
                  </View>
                  {task.priority && !task.completed && (
                    <View
                      style={[
                        styles.priorityBadge,
                        task.priority === "High" ? styles.priorityHigh : styles.priorityMedium,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          task.priority === "High" ? styles.priorityTextHigh : styles.priorityTextMedium,
                        ]}
                      >
                        {task.priority}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No to-dos for {formatDisplayDate(activeDateKey)}.</Text>
                  <Text style={styles.emptySubtext}>Add a task for this date to keep your plan on track.</Text>
                </View>
              )}
            </ScrollView>

          </View>

          {/* RIGHT SIDEBAR: Gemini & Samsung Notes-Style Notebook */}
          <View style={styles.sidebarColumn}>
            
            <View style={styles.sidebarHeader}>
              <View>
                <Text style={styles.sidebarTitle}>Notebook</Text>
                <Text style={styles.sidebarSubtitle}>
                  {notes.filter((n) => n.isPinned).length}/3 Pinned to top
                </Text>
              </View>
              <Pressable onPress={handleOpenNewNoteScreen} style={styles.addNoteSidebarButton}>
                <Text style={styles.addNoteSidebarButtonText}>+ New Note</Text>
              </Pressable>
            </View>

            {/* Notes List inside Sidebar */}
            <ScrollView
              {...(Platform.OS === "web" ? { className: "uniAmiScroll" } : {})}
              style={styles.sidebarNotesScrollView}
              contentContainerStyle={styles.sidebarNotesList}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {sortedNotes.length > 0 ? (
                sortedNotes.map((note, index) => {
                  const theme = getNoteCardAppearance(note, index);

                  return (
                    <Pressable
                      key={note.id}
                      onPress={() => handleOpenExistingNoteScreen(note)}
                      style={[
                        styles.sidebarNoteCard,
                        { backgroundColor: theme.bg, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.sidebarNoteHeader}>
                        <View style={styles.noteTitleRow}>
                          {note.isPinned && <Text style={styles.pinIndicator}>📌</Text>}
                          <Text numberOfLines={1} style={styles.sidebarNoteTitle}>
                            {note.title}
                          </Text>
                        </View>
                        <View style={styles.sidebarNoteActions}>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              togglePinNote(note.id);
                            }}
                            style={styles.actionIconBtn}
                          >
                            <Text style={styles.actionIconText}>{note.isPinned ? "Unpin" : "Pin"}</Text>
                          </Pressable>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            style={styles.actionIconBtn}
                          >
                            <Text style={styles.deleteIconText}>✕</Text>
                          </Pressable>
                        </View>
                      </View>

                      <Text numberOfLines={3} style={styles.sidebarNoteBody}>
                        {formatNotePreview(note.content)}
                      </Text>

                      <View style={styles.sidebarNoteFooter}>
                        <View style={styles.badgeGroup}>
                          {note.content.includes("type=\"checkbox\"") && <Text style={styles.miniTag}>☑️ Tasks</Text>}
                          {note.attachments?.some((attachment) => attachment.type === "image") && <Text style={styles.miniTag}>🖼️ Photo</Text>}
                          {note.attachments?.some((attachment) => attachment.type === "file") && <Text style={styles.miniTag}>📎 Files</Text>}
                        </View>
                        <Text style={styles.sidebarNoteTime}>{formatNoteDate(note.updatedAt)}</Text>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptySidebarCard}>
                  <Text style={styles.emptySidebarText}>No notes yet</Text>
                  <Text style={styles.emptySidebarSubtext}>Tap "+ New Note" to jot down thoughts.</Text>
                </View>
              )}
            </ScrollView>

          </View>

        </View>

      </ScrollView>

      {Platform.OS === "web" && (
        <style>{`
          .uniAmiScroll::-webkit-scrollbar { width: 6px; }
          .uniAmiScroll::-webkit-scrollbar-track { background: transparent; }
          .uniAmiScroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 999px; }
          .uniAmiScroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
          .uniAmiScroll { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
        `}</style>
      )}

      {/* Add Class / Event Modal */}
      <Modal visible={isClassModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Add New Class / Event</Text>
            
            {/* Day Selector */}
            <Text style={styles.fieldLabel}>Day of Week</Text>
            <View style={styles.modalDaysRow}>
              {DAYS.map((d) => (
                <Pressable
                  key={d.key}
                  onPress={() => setModalDay(d.key)}
                  style={[
                    styles.modalDayPill,
                    modalDay === d.key && styles.modalDayPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalDayLabel,
                      modalDay === d.key && styles.modalDayLabelActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Subject */}
            <Text style={styles.fieldLabel}>Subject / Event Name</Text>
            <TextInput
              value={modalSubject}
              onChangeText={setModalSubject}
              placeholder="e.g., Return Library book / Business Workshop"
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
            />

            {/* Class Type */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typePillsRow}>
              {CLASS_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setModalType(t)}
                  style={[
                    styles.typePill,
                    modalType === t && styles.typePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      modalType === t && styles.typePillTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom Color Swatches & Color Wheel */}
            <Text style={styles.fieldLabel}>Card Color Theme</Text>
            <View style={styles.colorPickerRow}>
              {CLASS_COLOR_PALETTE.map((c) => {
                const isSelected = modalColor.id === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setModalColor(c)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.accent },
                      isSelected && styles.colorSwatchActive,
                    ]}
                  >
                    {isSelected && <Text style={styles.colorCheckIcon}>✓</Text>}
                  </Pressable>
                );
              })}

              {/* Premium Color Wheel Button */}
              <Pressable
                onPress={handleColorWheelClick}
                style={styles.colorWheelButton}
              >
                <Text style={styles.colorWheelEmoji}>🎨</Text>
              </Pressable>
            </View>

            {/* Time */}
            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              value={modalTime}
              onChangeText={setModalTime}
              placeholder="e.g., 10:00 AM - 12:00 PM"
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
            />

            {/* Location */}
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              value={modalLocation}
              onChangeText={setModalLocation}
              placeholder="e.g., Building D, Rm 302 or Zoom"
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
            />

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setIsClassModalOpen(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveClass}
                disabled={!modalSubject.trim()}
                style={[
                  styles.modalSaveButton,
                  !modalSubject.trim() && styles.modalSaveButtonDisabled,
                ]}
              >
                <Text style={styles.modalSaveText}>Save Class</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Samsung Notes Editor Modal */}
      <Modal visible={isNoteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.noteEditorCard, { backgroundColor: noteColorChoice.bg }]}>
            <View style={styles.noteEditorHeader}>
              <Text style={styles.noteEditorTitle}>
                {editingNoteId ? "Edit Note" : "New Note"}
              </Text>
              <Pressable
                onPress={() => setNoteIsPinned(!noteIsPinned)}
                style={[
                  styles.pinToggleButton,
                  noteIsPinned && styles.pinToggleButtonActive,
                ]}
              >
                <Text style={styles.pinToggleText}>
                  {noteIsPinned ? "📌 Pinned" : "📍 Pin Note"}
                </Text>
              </Pressable>
            </View>

            {/* Note Title Input */}
            <TextInput
              value={noteTitleInput}
              onChangeText={setNoteTitleInput}
              placeholder="Note Title..."
              placeholderTextColor="#9CA3AF"
              style={styles.noteTitleInputField}
            />

            {/* Note Color Picker Bar */}
            <View style={styles.noteColorPickerRow}>
              {NOTE_COLOR_PALETTE.map((c) => {
                const isSelected = noteColorChoice.id === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setNoteColorChoice(c)}
                    style={[
                      styles.noteColorSwatch,
                      { backgroundColor: c.bg, borderColor: c.border },
                      isSelected && styles.noteColorSwatchActive,
                    ]}
                  >
                    {isSelected && <Text style={styles.noteColorCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>

            {/* Note Body Multi-line Input */}
            <TextInput
              value={noteContentInput}
              onChangeText={setNoteContentInput}
              placeholder="Start typing your lecture summaries, formulas, or thoughts..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              style={styles.noteContentInputField}
            />

            {/* Note Modal Actions */}
            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setIsNoteModalOpen(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveNote}
                disabled={!noteTitleInput.trim() && !noteContentInput.trim()}
                style={[
                  styles.modalSaveButton,
                  !noteTitleInput.trim() &&
                    !noteContentInput.trim() &&
                    styles.modalSaveButtonDisabled,
                ]}
              >
                <Text style={styles.modalSaveText}>Save Note</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  container: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 60,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: "#FD0000",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },

  /* 2-Column Workspace */
  workspaceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    alignItems: "flex-start",
  },
  mainColumn: {
    flex: 1,
    minWidth: 320,
  },
  sidebarColumn: {
    width: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    alignSelf: "stretch",
    maxHeight: 510,
  },

  /* Sidebar Styles */
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  sidebarTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  sidebarSubtitle: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  addNoteSidebarButton: {
    backgroundColor: "#FD0000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addNoteSidebarButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  sidebarNotesList: {
    gap: 10,
  },
  sidebarNotesScrollView: {
    maxHeight: 420,
    paddingRight: 4,
    paddingBottom: 4,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    transform: [{ translateZ: 0 }],
  } as any,
  sidebarNoteCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    gap: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sidebarNoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  pinIndicator: {
    fontSize: 11,
  },
  sidebarNoteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  sidebarNoteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionIconBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  actionIconText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
  },
  deleteIconText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  sidebarNoteBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "500",
    whiteSpace: "pre-line",
  } as any,
  sidebarNoteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  badgeGroup: {
    flexDirection: "row",
    gap: 6,
  },
  miniTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  sidebarNoteTime: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  emptySidebarCard: {
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 16,
  },
  emptySidebarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  emptySidebarSubtext: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
  },

  /* Left Column Timetable & Tasks */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  addClassButton: {
    backgroundColor: "#FD0000",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addClassButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  taskCountBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FD0000",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  weekHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  weekRangeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.text,
    fontWeight: "700",
  },
  thisWeekButton: {
    position: "absolute",
    right: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  thisWeekText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FD0000",
  },
  todoNavigatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  dateDisplayWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateDisplayText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  todayBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FD0000",
  },
  dayPill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dayPillActive: {
    backgroundColor: "#FD0000",
    borderColor: "#FD0000",
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  dayLabelActive: {
    color: "#FFFFFF",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  dayNumberActive: {
    color: "#FFFFFF",
  },
  scheduleList: {
    gap: 10,
    marginBottom: 12,
  },
  scheduleScrollView: {
    maxHeight: 170,
    paddingRight: 4,
    paddingBottom: 4,
    marginBottom: 10,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    transform: [{ translateZ: 0 }],
  } as any,
  scheduleCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderLeftWidth: 5,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduleTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
  },
  scheduleDetailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  scheduleDetailText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.muted,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 8,
  },
  taskInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonActive: {
    backgroundColor: "#FD0000",
  },
  addButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  addButtonTextDisabled: {
    color: "#94A3B8",
  },
  taskList: {
    gap: 8,
  },
  tasksScrollView: {
    maxHeight: 220,
    paddingRight: 4,
    paddingBottom: 4,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    transform: [{ translateZ: 0 }],
  } as any,
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.75,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#FD0000",
    borderColor: "#FD0000",
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: colors.muted,
  },
  taskDueDate: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityHigh: {
    backgroundColor: "#FEE2E2",
  },
  priorityMedium: {
    backgroundColor: "#FEF3C7",
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  priorityTextHigh: {
    color: "#DC2626",
  },
  priorityTextMedium: {
    color: "#D97706",
  },

  /* Modals Common */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  modalDaysRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  modalDayPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalDayPillActive: {
    backgroundColor: "#111827",
  },
  modalDayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  modalDayLabelActive: {
    color: "#FFFFFF",
  },
  typePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  typePillActive: {
    backgroundColor: "#111827",
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  typePillTextActive: {
    color: "#FFFFFF",
  },
  colorPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 2.5,
    borderColor: "#111827",
    transform: [{ scale: 1.15 }],
  },
  colorCheckIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  colorWheelButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FAF7F2",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  colorWheelEmoji: {
    fontSize: 15,
  },
  modalInput: {
    backgroundColor: "#FAF7F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  modalSaveButton: {
    backgroundColor: "#FD0000",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  /* Note Editor Modal */
  noteEditorCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  noteEditorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noteEditorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  pinToggleButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pinToggleButtonActive: {
    backgroundColor: "#FEF3C7",
  },
  pinToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  noteTitleInputField: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    marginBottom: 10,
  },
  noteColorPickerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  noteColorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  noteColorSwatchActive: {
    borderColor: "#111827",
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  noteColorCheck: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111827",
  },
  noteContentInputField: {
    height: 140,
    fontSize: 14,
    lineHeight: 20,
    color: "#1F2937",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
});