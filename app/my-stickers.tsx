import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../src/theme/colors";

interface OwnedStickerPack {
  id: string;
  title: string;
  category: string;
  itemCount: number;
  previewEmoji: string;
  previewColor: string;
}

const INITIAL_PACKS: OwnedStickerPack[] = [
  {
    id: "pack-1",
    title: "Campus Starter Pack",
    category: "Campus Life",
    itemCount: 12,
    previewEmoji: "🎓",
    previewColor: "#FEF2F2",
  },
  {
    id: "pack-2",
    title: "Exam Week Moods",
    category: "Exam Life",
    itemCount: 18,
    previewEmoji: "☕",
    previewColor: "#FFF7ED",
  },
  {
    id: "pack-3",
    title: "Night Shift & Coding",
    category: "Tech & Code",
    itemCount: 16,
    previewEmoji: "💻",
    previewColor: "#EFF6FF",
  },
  {
    id: "pack-4",
    title: "Uni Cats & Coffee",
    category: "Cute / Kawaii",
    itemCount: 20,
    previewEmoji: "🐱",
    previewColor: "#FDF2F8",
  },
  {
    id: "pack-5",
    title: "Deadline Panic Reactions",
    category: "Study Moods",
    itemCount: 14,
    previewEmoji: "🔥",
    previewColor: "#FEF2F2",
  },
  {
    id: "pack-6",
    title: "Campus Doodles & Art",
    category: "Campus Art",
    itemCount: 22,
    previewEmoji: "🎨",
    previewColor: "#F5F3FF",
  },
];

const OWNED_PACKS_STORAGE_KEY = "uniami_owned_packs";

const getOwnedPackIds = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(OWNED_PACKS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
};

export default function MyStickersScreen() {
  const [ownedPacks, setOwnedPacks] = useState<OwnedStickerPack[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadOwnedPacks = async () => {
        const ownedIds = await getOwnedPackIds();

        const packs = INITIAL_PACKS.filter((pack) => ownedIds.includes(pack.id));
        setOwnedPacks(packs);
      };

      void loadOwnedPacks();
    }, [])
  );

  const gallery = useMemo(() => {
    return ownedPacks.length > 0 ? ownedPacks : [];
  }, [ownedPacks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.mainWrapper}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/(tabs)/profile")}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>

            <View style={styles.headerTitles}>
              <Text style={styles.pageTitle}>My Stickers</Text>
              <Text style={styles.pageSubtitle}>Your unlocked sticker packs and campus collectibles</Text>
            </View>
          </View>

          {gallery.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateEmoji}>✨</Text>
              <Text style={styles.emptyStateTitle}>No sticker packs unlocked yet</Text>
              <Text style={styles.emptyStateText}>
                Explore the marketplace and collect your favourite campus designs.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/sticker-marketplace")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Browse Sticker Marketplace</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {gallery.map((pack) => (
                <View key={pack.id} style={styles.packCard}>
                  <View style={[styles.thumbnailBox, { backgroundColor: pack.previewColor }]}>
                    <Text style={styles.packEmoji}>{pack.previewEmoji}</Text>
                    <View style={styles.itemCountBadge}>
                      <Text style={styles.itemCountText}>{pack.itemCount} stickers</Text>
                    </View>
                  </View>

                  <View style={styles.cardMeta}>
                    <View style={styles.metaHeader}>
                      <Text style={styles.packTitle} numberOfLines={2}>{pack.title}</Text>
                      <View style={styles.unlockedPill}>
                        <Text style={styles.unlockedText}>Unlocked ✓</Text>
                      </View>
                    </View>

                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryText}>{pack.category}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 960,
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  headerTitles: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    marginTop: 2,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  emptyStateEmoji: {
    fontSize: 42,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#FD0000",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  packCard: {
    width: "48.5%",
    flexBasis: "48.5%",
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  thumbnailBox: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  packEmoji: {
    fontSize: 54,
  },
  itemCountBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  itemCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardMeta: {
    padding: 12,
    gap: 10,
  },
  metaHeader: {
    gap: 8,
  },
  packTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  unlockedPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unlockedText: {
    color: colors.brandRed,
    fontSize: 11,
    fontWeight: "800",
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF7ED",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
});
