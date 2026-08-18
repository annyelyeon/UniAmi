import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DraggableNoteSticker } from "../components/DraggableNoteSticker";
import { AvailableStickerItem, useAvailableStickers } from "../src/hooks/useAvailableStickers";
import { createPlacedSticker, NotePlacedSticker } from "../src/types/noteStickers";

type PaperTheme = {
  id: string;
  value: string;
  label: string;
  textColor: string;
};

type NoteAttachment = {
  id: string;
  name: string;
  type: "image" | "file";
  uri: string;
  size?: string;
};

type NoteRecord = {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  updatedAt: string;
  attachments: NoteAttachment[];
  stickers: NotePlacedSticker[];
  checklist: ChecklistItem[];
};

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

type RichTextActions = {
  executeCommand: (command: string, value?: string) => void;
  applyTextColor: (color: string) => void;
  insertChecklist: () => void;
};

const STORAGE_KEY = "@uni_ami_study_notes";
const DEFAULT_COLOR = "#FEFCE8";

const PAPER_THEMES: PaperTheme[] = [
  { id: "cream", value: "#FEFCE8", label: "Cream", textColor: "#111827" },
  { id: "ice", value: "#F0F9FF", label: "Ice Blue", textColor: "#111827" },
  { id: "rose", value: "#FFF1F2", label: "Soft Rose", textColor: "#111827" },
  { id: "mint", value: "#F0FDF4", label: "Mint", textColor: "#111827" },
  { id: "white", value: "#FFFFFF", label: "White", textColor: "#111827" },
  { id: "slate", value: "#1E293B", label: "Dark Slate", textColor: "#F8FAFC" },
];



const formatTime = (value: string) => {
  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
};

const formatFileSize = (size?: number) => {
  if (!size) return undefined;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function VisualRichEditor({
  content,
  textColor,
  onChangeContent,
  onActionsReady,
  onFocusEditor,
}: {
  content: string;
  textColor: string;
  onChangeContent: (html: string) => void;
  onActionsReady: (actions: RichTextActions) => void;
  onFocusEditor?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !editorRef.current || editorRef.current.innerHTML === content) return;
    editorRef.current.innerHTML = content;
  }, [content]);

  const syncContent = () => {
    if (editorRef.current) onChangeContent(editorRef.current.innerHTML);
  };

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    if (!selectionRef.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(selectionRef.current);
  };

  const executeCommand = (command: string, value?: string) => {
    if (Platform.OS !== "web") return;
    restoreSelection();
    document.execCommand(command, false, value);
    syncContent();
  };

  const applyTextColor = (color: string) => {
    if (Platform.OS !== "web") return;
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, color);
    syncContent();
  };

  const insertChecklist = () => {
    if (Platform.OS !== "web") return;

    restoreSelection();
    const uniqueId = `todo-span-${Date.now()}`;
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const startElement = range?.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as HTMLElement)
      : range?.startContainer.parentElement;
    const block = startElement?.closest("div, p, h1, h2, h3, h4, h5, h6, li");
    const rangeBeforeCursor = range && block ? range.cloneRange() : null;

    if (rangeBeforeCursor && range) {
      rangeBeforeCursor.selectNodeContents(block!);
      rangeBeforeCursor.setEnd(range.startContainer, range.startOffset);
    }

    const startsAtBlockBoundary = !rangeBeforeCursor?.toString().trim();
    const lineBreakBefore = startsAtBlockBoundary ? "" : "<div><br /></div>";
    const checklistItem =
      `<div class="note-todo-row" style="display:flex;width:100%;align-items:center;gap:10px;margin:6px 0;clear:both;"><input type="checkbox" contenteditable="false" style="width:18px;height:18px;cursor:pointer;accent-color:#FD0000;margin:0;flex-shrink:0;" /><span id="${uniqueId}" class="todo-text" style="outline:none;flex:1;min-width:60px;line-height:22px;">&#8203;</span></div>`;
    document.execCommand("insertHTML", false, `${lineBreakBefore}${checklistItem}`);

    const textSpan = document.getElementById(uniqueId);
    if (textSpan) {
      const textSelection = window.getSelection();
      const textRange = document.createRange();
      textRange.selectNodeContents(textSpan);
      textRange.collapse(false);
      textSelection?.removeAllRanges();
      textSelection?.addRange(textRange);
      textSpan.removeAttribute("id");
    }

    syncContent();
  };

  useEffect(() => {
    onActionsReady({ executeCommand, applyTextColor, insertChecklist });
  });

  if (Platform.OS !== "web") {
    return (
      <TextInput
        value={content}
        onChangeText={onChangeContent}
        onFocus={onFocusEditor}
        multiline
        placeholder="Start typing your notes, lecture summaries, or ideas..."
        placeholderTextColor={textColor === "#F8FAFC" ? "#CBD5E1" : "#64748B"}
        textAlignVertical="top"
        style={[styles.noteBody, { color: textColor }]}
      />
    );
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Start typing your lecture summaries, ideas, or to-dos..."
      onInput={syncContent}
      onFocus={() => {
        rememberSelection();
        onFocusEditor?.();
      }}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
      onChange={(event: any) => {
        const checkbox = event.target as HTMLInputElement;
        if (checkbox.type !== "checkbox") return;

        const label = checkbox.nextElementSibling as HTMLElement | null;
        if (label) {
          label.style.textDecoration = checkbox.checked ? "line-through" : "none";
          label.style.opacity = checkbox.checked ? "0.6" : "1";
        }
        checkbox.toggleAttribute("checked", checkbox.checked);
        syncContent();
      }}
      style={{
        minHeight: "260px",
        outline: "none",
        fontSize: "15px",
        lineHeight: "24px",
        color: textColor,
        fontFamily: "inherit",
        padding: "16px",
      }}
    />
  );
}

export default function NoteEditorScreen() {
  const params = useLocalSearchParams<{ id?: string; title?: string; content?: string; color?: string; isPinned?: string }>();
  const [noteId, setNoteId] = useState(() => String(params.id ?? Date.now().toString()));
  const [title, setTitle] = useState(() => {
    const initialTitle = String(params.title ?? "");
    return initialTitle === "Untitled Note" ? "" : initialTitle;
  });
  const [body, setBody] = useState(String(params.content ?? ""));
  const [paperTheme, setPaperTheme] = useState(String(params.color ?? DEFAULT_COLOR));
  const [isPinned, setIsPinned] = useState(String(params.isPinned ?? "false") === "true");
  const [placedStickers, setPlacedStickers] = useState<NotePlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const checklistInputRefs = useRef<{ [key: string]: TextInput | null }>({});
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [selectedPackTab, setSelectedPackTab] = useState<string>("all");
  const { availableStickers, packTabs, reloadStickers } = useAvailableStickers();
  const [statusText, setStatusText] = useState("Autosaved");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const statusRef = useRef(statusText);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const richTextActionsRef = useRef<RichTextActions | null>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [showTextColors, setShowTextColors] = useState(false);

  const activeTheme = useMemo(
    () => PAPER_THEMES.find((theme) => theme.value === paperTheme) ?? PAPER_THEMES[0],
    [paperTheme],
  );

  useEffect(() => {
    statusRef.current = statusText;
  }, [statusText]);

  useEffect(() => {
    const hydrateNote = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setIsLoaded(true);
          return;
        }

        const parsed: NoteRecord[] = JSON.parse(raw);
        const match = parsed.find((note) => note.id === noteId);

        if (match) {
          setTitle(match.title === "Untitled Note" ? "" : match.title || "");
          setBody(match.content || "");
          setPaperTheme(match.color || DEFAULT_COLOR);
          setIsPinned(Boolean(match.isPinned));
          setAttachments(
            (match.attachments || []).filter(
              (attachment): attachment is NoteAttachment =>
                (attachment.type === "image" || attachment.type === "file") && Boolean(attachment.uri),
            ),
          );
          setPlacedStickers(match.stickers || []);
          setChecklist(match.checklist || []);
        }
      } catch {
        // ignore parsing errors and continue with defaults
      } finally {
        setIsLoaded(true);
      }
    };

    void hydrateNote();
  }, [noteId]);

  useEffect(() => {
    if (!isLoaded) return;

    const timeout = setTimeout(() => {
      void persistCurrentNote();
    }, 180);

    return () => clearTimeout(timeout);
  }, [title, body, paperTheme, isPinned, placedStickers, attachments, checklist, isLoaded]);

  const persistCurrentNote = async () => {
    const finalTitle = title.trim() || "Untitled Note";
    const note: NoteRecord = {
      id: noteId,
      title: finalTitle,
      content: body,
      color: paperTheme,
      isPinned,
      updatedAt: new Date().toISOString(),
      attachments,
      stickers: placedStickers,
      checklist,
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const notes: NoteRecord[] = raw ? JSON.parse(raw) : [];
      const nextNotes = [...notes.filter((item) => item.id !== noteId), note].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
      setStatusText("Autosaved");
    } catch {
      setStatusText("Save failed");
    }
  };

  const handleSaveAndBack = async () => {
    await persistCurrentNote();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/personal");
    }
  };

  const handlePlaceStickerOnNote = (stickerItem: AvailableStickerItem) => {
    const newSticker = createPlacedSticker(
      stickerItem.id,
      stickerItem.imageUrl,
      140,
      180,
      placedStickers.length + 1,
      stickerItem.name
    );
    setPlacedStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setStatusText("Autosaved");
    setIsStickerDrawerOpen(false);
  };

  useEffect(() => {
    if (isStickerDrawerOpen) {
      void reloadStickers();
    }
  }, [isStickerDrawerOpen]);

  const visibleStickers =
    selectedPackTab === "all"
      ? availableStickers
      : availableStickers.filter((s) => s.packId === selectedPackTab);

  const addAttachment = (attachment: NoteAttachment) => {
    setAttachments((prev) => [attachment, ...prev]);
    setStatusText("Autosaved");
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const uri = event.target?.result;
        if (typeof uri !== "string") return;

        addAttachment({
          id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.type.startsWith("image/") ? "image" : "file",
          uri,
          size: formatFileSize(file.size),
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const openAttachmentPicker = async () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      result.assets.forEach((asset) => {
        addAttachment({
          id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: asset.name,
          type: asset.mimeType?.startsWith("image/") ? "image" : "file",
          uri: asset.uri,
          size: formatFileSize(asset.size),
        });
      });
    } catch {
      setStatusText("Attachment failed");
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    setStatusText("Autosaved");
  };

  const handleDeleteSticker = (id: string) => {
    setPlacedStickers((prev) => prev.filter((sticker) => sticker.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
    setStatusText("Autosaved");
  };

  const handleUpdateSticker = (updated: NotePlacedSticker) => {
    setPlacedStickers((prev) => prev.map((sticker) => (sticker.id === updated.id ? updated : sticker)));
    setStatusText("Autosaved");
  };

  // Enter key on a checklist row -> inserts a new checkbox line and focuses it
  const handleAddChecklistItemAfter = (index: number) => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: "",
      checked: false,
    };
    const updated = [...checklist];
    updated.splice(index + 1, 0, newItem);
    setChecklist(updated);

    setTimeout(() => {
      checklistInputRefs.current[newItem.id]?.focus();
    }, 50);
  };

  // Backspace on an empty checklist row -> removes it and focuses the previous line
  const handleDeleteChecklistItem = (index: number, currentText: string) => {
    if (currentText === "" && checklist.length > 1) {
      const prevItem = checklist[index - 1];
      const updated = checklist.filter((_, idx) => idx !== index);
      setChecklist(updated);
      if (prevItem) {
        setTimeout(() => {
          checklistInputRefs.current[prevItem.id]?.focus();
        }, 50);
      }
    }
  };

  const addChecklistSection = () => {
    if (checklist.length === 0) {
      setChecklist([{ id: `item-${Date.now()}`, text: "", checked: false }]);
    }
  };

  const applyRichTextCommand = (command: string, value?: string) => {
    richTextActionsRef.current?.executeCommand(command, value);
    setActiveFormats((current) => ({ ...current, [command]: !current[command] }));
    setStatusText("Autosaved");
  };

  const applyTextColor = (color: string) => {
    richTextActionsRef.current?.applyTextColor(color);
    setShowTextColors(false);
    setStatusText("Autosaved");
  };

  const webSelectionGuard = Platform.OS === "web"
    ? { onMouseDown: (event: any) => event.preventDefault() }
    : {};

  const togglePin = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const notes: NoteRecord[] = raw ? JSON.parse(raw) : [];

    if (!isPinned && notes.filter((note) => note.isPinned && note.id !== noteId).length >= 3) {
      Alert.alert("Maximum 3 pinned notes reached.", "Unpin a note first.");
      return;
    }

    setIsPinned((prev) => !prev);
    setStatusText("Autosaved");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable onPress={handleSaveAndBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusText}</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={togglePin} style={styles.pinButton}>
              <Text style={styles.pinButtonText}>{isPinned ? "📌 Pinned" : "📌 Pin to Top"}</Text>
            </Pressable>

            <Pressable onPress={() => setIsStickerDrawerOpen(true)} style={styles.themeButton}>
              <Text style={styles.themeButtonText}>🎨 Theme</Text>
            </Pressable>

            <Pressable onPress={handleSaveAndBack} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.canvasSheet, { backgroundColor: paperTheme }]}> 
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Untitled Note"
              placeholderTextColor="#94A3B8"
              style={[styles.noteTitleInput, { color: activeTheme.textColor }]}
            />

            <View style={styles.paletteRow}>
              {PAPER_THEMES.map((theme) => {
                const active = theme.value === paperTheme;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setPaperTheme(theme.value)}
                    style={[
                      styles.swatch,
                      { backgroundColor: theme.value, borderColor: active ? "#FD0000" : "#E2E8F0" },
                    ]}
                  >
                    {active && <Text style={styles.swatchCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>

            <View
            {...(Platform.OS === "web" ? {
              onDragOver: (event: any) => {
                event.preventDefault();
                setIsDraggingOver(true);
              },
              onDragLeave: () => setIsDraggingOver(false),
              onDrop: (event: any) => {
                event.preventDefault();
                setIsDraggingOver(false);
                processFiles(event.dataTransfer?.files ?? null);
              },
            } : {})}
            style={[styles.canvasShell, isDraggingOver && styles.canvasShellDragging]}
          >
            {isDraggingOver && (
              <View pointerEvents="none" style={styles.dropBanner}>
                <Text style={styles.dropBannerText}>📁 Drop photos or documents to attach</Text>
              </View>
            )}

            <ScrollView style={styles.canvasScroll} contentContainerStyle={styles.canvasContent} keyboardShouldPersistTaps="handled">
              {checklist.length > 0 && (
              <View style={styles.checklistSection}>
                {checklist.map((item, index) => (
                  <View key={item.id} style={styles.checkItemRow}>
                    <Pressable
                      onPress={() => {
                        setChecklist((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, checked: !it.checked } : it
                          )
                        );
                      }}
                      style={[styles.checkboxBox, item.checked && styles.checkboxBoxActive]}
                    >
                      {item.checked && <Text style={styles.checkMark}>✓</Text>}
                    </Pressable>

                    <TextInput
                      ref={(ref) => (checklistInputRefs.current[item.id] = ref)}
                      value={item.text}
                      onChangeText={(val) => {
                        setChecklist((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, text: val } : it))
                        );
                      }}
                      placeholder="List item..."
                      placeholderTextColor="#94A3B8"
                      style={[
                        styles.checkItemInput,
                        item.checked && styles.checkItemInputChecked,
                      ]}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => handleAddChecklistItemAfter(index)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Enter") {
                          if (Platform.OS === "web") {
                            (nativeEvent as any).preventDefault?.();
                          }
                          handleAddChecklistItemAfter(index);
                        } else if (nativeEvent.key === "Backspace") {
                          handleDeleteChecklistItem(index, item.text);
                        }
                      }}
                    />
                  </View>
                ))}
              </View>
              )}

              <VisualRichEditor
                content={body}
                textColor={activeTheme.textColor}
                onChangeContent={setBody}
                onFocusEditor={() => setSelectedStickerId(null)}
                onActionsReady={(actions) => {
                  richTextActionsRef.current = actions;
                }}
              />
            </ScrollView>

            <View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, styles.stickerCanvas]}>
              {placedStickers.map((sticker) => (
                <DraggableNoteSticker
                  key={sticker.id}
                  sticker={sticker}
                  isSelected={selectedStickerId === sticker.id}
                  onSelect={() => setSelectedStickerId(sticker.id)}
                  onUpdate={handleUpdateSticker}
                  onDelete={handleDeleteSticker}
                />
              ))}
            </View>
            </View>

            <View style={styles.attachmentsContainer}>
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentWrapper}>
                  {attachment.type === "image" ? (
                    <View style={styles.imageCard}>
                      <Image source={{ uri: attachment.uri }} style={styles.previewImage} resizeMode="cover" />
                      <Pressable onPress={() => removeAttachment(attachment.id)} style={styles.removeAttachBadge}>
                        <Text style={styles.removeAttachText}>✕</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.fileCard}>
                      <Text style={styles.fileIcon}>{attachment.name.toLowerCase().endsWith(".pdf") ? "📄" : "📝"}</Text>
                      <View style={styles.fileInfo}>
                        <Text numberOfLines={1} style={styles.fileName}>{attachment.name}</Text>
                        {attachment.size && <Text style={styles.fileSize}>{attachment.size}</Text>}
                      </View>
                      <Pressable onPress={() => removeAttachment(attachment.id)} style={styles.removeFileButton}>
                        <Text style={styles.removeFileText}>✕</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
            <Pressable {...webSelectionGuard} onPress={() => applyRichTextCommand("bold")} style={[styles.toolbarButton, activeFormats.bold && styles.toolbarButtonActive]}>
              <Text style={[styles.toolbarIcon, styles.boldToolbarIcon]}>B</Text>
              <Text style={styles.toolbarLabel}>Bold</Text>
            </Pressable>

            <Pressable {...webSelectionGuard} onPress={() => applyRichTextCommand("italic")} style={[styles.toolbarButton, activeFormats.italic && styles.toolbarButtonActive]}>
              <Text style={[styles.toolbarIcon, styles.italicToolbarIcon]}>I</Text>
              <Text style={styles.toolbarLabel}>Italic</Text>
            </Pressable>

            <Pressable {...webSelectionGuard} onPress={() => applyRichTextCommand("formatBlock", "<h2>")} style={[styles.toolbarButton, activeFormats.formatBlock && styles.toolbarButtonActive]}>
              <Text style={styles.toolbarIcon}>H</Text>
              <Text style={styles.toolbarLabel}>Heading</Text>
            </Pressable>

            <Pressable {...webSelectionGuard} onPress={() => applyRichTextCommand("hiliteColor", "#FEF08A")} style={[styles.toolbarButton, activeFormats.hiliteColor && styles.toolbarButtonActive]}>
              <Text style={styles.toolbarIcon}>🖍</Text>
              <Text style={styles.toolbarLabel}>Highlight</Text>
            </Pressable>

            <View style={styles.colorControl}>
              <Pressable {...webSelectionGuard} onPress={() => setShowTextColors((visible) => !visible)} style={[styles.toolbarButton, showTextColors && styles.toolbarButtonActive]}>
                <Text style={styles.toolbarIcon}>🎨</Text>
                <Text style={styles.toolbarLabel}>Color</Text>
              </Pressable>

              {showTextColors && (
                <View style={styles.textColorPopover}>
                  {["#0F172A", "#FD0000", "#2563EB", "#059669", "#D97706"].map((color) => (
                    <Pressable
                      key={color}
                      {...webSelectionGuard}
                      onPress={() => applyTextColor(color)}
                      style={[styles.textColorDot, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              )}
            </View>

            <Pressable {...webSelectionGuard} onPress={addChecklistSection} style={styles.toolbarButton}>
              <Text style={styles.toolbarIcon}>☑️</Text>
              <Text style={styles.toolbarLabel}>Checklist</Text>
            </Pressable>

            <Pressable onPress={() => setIsStickerDrawerOpen(true)} style={styles.toolbarButton}>
              <Text style={styles.toolbarIcon}>🏷</Text>
              <Text style={styles.toolbarLabel}>Stickers</Text>
            </Pressable>

            <Pressable onPress={openAttachmentPicker} style={styles.toolbarButton}>
              <Text style={styles.toolbarIcon}>📎</Text>
              <Text style={styles.toolbarLabel}>Attach</Text>
            </Pressable>

        </View>

        {Platform.OS === "web" && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(event) => {
              processFiles(event.target.files);
              event.target.value = "";
            }}
          />
        )}
      </View>

      {isStickerDrawerOpen && (
        <View style={styles.drawerOverlay}>
          <View style={styles.whatsappSheet}>
            {/* 1. Header Bar with Close Button */}
            <View style={styles.sheetHeader}>
              <View style={styles.dragPill} />
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>
                  {selectedPackTab === "all"
                    ? "All Stickers"
                    : packTabs.find((t) => t.id === selectedPackTab)?.title || "Stickers"}
                </Text>
                <Pressable
                  onPress={() => setIsStickerDrawerOpen(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* 2. WhatsApp-Style Pack Icon Tabs */}
            <View style={styles.packTabBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.packTabScroll}
              >
                {/* 'All' Tab */}
                <Pressable
                  onPress={() => setSelectedPackTab("all")}
                  style={[
                    styles.packTabIconBtn,
                    selectedPackTab === "all" && styles.packTabIconBtnActive,
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>⭐</Text>
                </Pressable>

                {/* Individual Pack Icons */}
                {packTabs.map((tab) => {
                  const isActive = selectedPackTab === tab.id;
                  const isImgUrl = tab.coverIcon?.startsWith("http");

                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setSelectedPackTab(tab.id)}
                      style={[
                        styles.packTabIconBtn,
                        isActive && styles.packTabIconBtnActive,
                      ]}
                    >
                      {isImgUrl ? (
                        <Image
                          source={{ uri: tab.coverIcon }}
                          style={styles.packTabImg}
                        />
                      ) : (
                        <Text style={{ fontSize: 18 }}>
                          {tab.coverIcon || "🎨"}
                        </Text>
                      )}
                      {isActive && <View style={styles.activeIndicator} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Compact Sticker Grid with Fixed Height & Scroll */}
            <ScrollView
              style={styles.stickerScrollArea}
              contentContainerStyle={styles.compactStickerGrid}
              showsVerticalScrollIndicator={true}
            >
              {visibleStickers.length === 0 ? (
                <View style={styles.emptyDrawer}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>📦</Text>
                  <Text style={styles.emptyDrawerText}>No stickers in this pack</Text>
                </View>
              ) : (
                visibleStickers.map((sticker) => {
                  const isUrl = sticker.imageUrl?.startsWith("http");
                  return (
                    <Pressable
                      key={sticker.id}
                      onPress={() => {
                        handlePlaceStickerOnNote(sticker);
                        setIsStickerDrawerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.compactStickerTile,
                        pressed && styles.tilePressed,
                      ]}
                    >
                      {isUrl ? (
                        <Image
                          source={{ uri: sticker.imageUrl }}
                          style={styles.compactStickerImg}
                        />
                      ) : (
                        <Text style={styles.compactStickerEmoji}>
                          {sticker.imageUrl}
                        </Text>
                      )}
                      <Text style={styles.compactStickerLabel} numberOfLines={1}>
                        {sticker.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {/* 4. Footer Link to Marketplace */}
            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => {
                  setIsStickerDrawerOpen(false);
                  router.push("/sticker-marketplace");
                }}
                style={styles.getMoreBtn}
              >
                <Text style={styles.getMoreBtnText}>+ Get More Stickers in Marketplace</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  page: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  topBar: {
    width: "94%",
    maxWidth: 1000,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinButton: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pinButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  themeButton: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  themeButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  doneButton: {
    backgroundColor: "#FD0000",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  content: {
    paddingBottom: 110,
    alignItems: "center",
  },
  canvasSheet: {
    width: "94%",
    maxWidth: 1000,
    minHeight: 520,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    position: "relative",
  },
  noteTitleInput: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    paddingVertical: 6,
    width: "100%",
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchCheck: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 12,
  },
  canvasShell: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    minHeight: 400,
    overflow: "hidden",
  },
  canvasScroll: {
    flex: 1,
  },
  canvasContent: {
    padding: 24,
    paddingBottom: 80,
  },
  canvasShellDragging: {
    borderColor: "#FD0000",
    borderStyle: "dashed",
    backgroundColor: "rgba(253, 0, 0, 0.04)",
  },
  dropBanner: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    zIndex: 20,
    backgroundColor: "#FD0000",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dropBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stickerCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  noteBody: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 260,
    padding: 16,
  },
  attachmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  attachmentWrapper: {
    position: "relative",
  },
  imageCard: {
    width: 140,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
    gap: 8,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
    maxWidth: 160,
  },
  fileSize: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
  },
  removeAttachBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeFileButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  removeAttachText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  removeFileText: {
    color: "#0F172A",
    fontSize: 9,
    fontWeight: "800",
  },
  bottomBar: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    width: "94%",
    maxWidth: 1000,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toolbarButton: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
  },
  toolbarButtonActive: {
    backgroundColor: "#FEE2E2",
  },
  toolbarIcon: {
    fontSize: 16,
    color: "#0F172A",
  },
  boldToolbarIcon: {
    fontWeight: "900",
  },
  italicToolbarIcon: {
    fontStyle: "italic",
  },
  toolbarLabel: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    color: "#0F172A",
  },
  colorControl: {
    flex: 1,
    position: "relative",
  },
  textColorPopover: {
    position: "absolute",
    bottom: 56,
    left: "50%",
    transform: [{ translateX: -75 }],
    flexDirection: "row",
    gap: 8,
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  textColorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.14)",
  },
  /* Fixed Bottom Modal & Sheet */
  drawerOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 999999,
  },
  whatsappSheet: {
    width: "100%",
    maxWidth: 680,
    height: 380,
    maxHeight: "65%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.15)",
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginBottom: 8,
  },
  sheetHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },

  /* WhatsApp Style Horizontal Pack Tabs */
  packTabBar: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 6,
  },
  packTabScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  packTabIconBtn: {
    width: 44,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
  },
  packTabIconBtnActive: {
    borderColor: "#0F172A",
    backgroundColor: "#F1F5F9",
  },
  packTabImg: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -6,
    width: 16,
    height: 3,
    backgroundColor: "#FD0000",
    borderRadius: 2,
  },

  /* Scrollable Compact Grid */
  stickerScrollArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  compactStickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 10,
    justifyContent: "flex-start",
  },
  compactStickerTile: {
    width: 68,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  tilePressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: "#FFF5F5",
    borderColor: "#FD0000",
  },
  compactStickerImg: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  compactStickerEmoji: {
    fontSize: 28,
  },
  compactStickerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  emptyDrawer: {
    width: "100%",
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDrawerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },

  /* Footer */
  sheetFooter: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  getMoreBtn: {
    backgroundColor: "#FD0000",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    cursor: "pointer",
  },
  getMoreBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  checklistSection: {
    marginBottom: 16,
  },
  checkItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
  },
  checkboxBoxActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  checkItemInput: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingVertical: 4,
  },
  checkItemInputChecked: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },
});
