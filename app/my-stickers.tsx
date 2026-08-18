import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../src/lib/supabase";
import { colors } from "../src/theme/colors";

interface DisplayPack {
  id: string;
  title: string;
  creator: string;
  icon: string;
  category: string;
  stickerCount: number;
}

const STARTER_METADATA: Record<string, { title: string; creator: string; icon: string; category: string; count: number }> = {
  "campus-starter": {
    title: "Campus Starter Pack",
    creator: "UniAmi Team",
    icon: "🎓",
    category: "Campus Life",
    count: 10,
  },
  "exam-week": {
    title: "Exam Week Moods",
    creator: "UniAmi Team",
    icon: "☕",
    category: "Study & Focus",
    count: 10,
  },
  "tech-code": {
    title: "Code & Bugs Pack",
    creator: "UniAmi Team",
    icon: "💻",
    category: "Tech / Gaming",
    count: 10,
  },
  "cute-mascot": {
    title: "Cute Mascot Expressions",
    creator: "UniAmi Team",
    icon: "🦊",
    category: "Cute / Kawaii",
    count: 10,
  },
  "study-moods": {
    title: "Lo-Fi Study Moods",
    creator: "UniAmi Team",
    icon: "🎧",
    category: "Aesthetic / Lo-Fi",
    count: 8,
  },
  "campus-art": {
    title: "Creative Arts Guild",
    creator: "UniAmi Team",
    icon: "🎨",
    category: "Aesthetic / Lo-Fi",
    count: 8,
  },
};

export default function MyStickersScreen() {
  const [ownedPacks, setOwnedPacks] = useState<DisplayPack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOwnedPacks = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch active owned IDs & created IDs from storage
      const rawOwned = await AsyncStorage.getItem("@uni_ami_owned_packs");
      const rawCreated = await AsyncStorage.getItem("@uni_ami_created_packs");
      const rawLocalPacks = await AsyncStorage.getItem("@uni_ami_created_packs_data");

      const ownedIds: string[] = rawOwned ? JSON.parse(rawOwned) : ["campus-starter"];
      const createdIds: string[] = rawCreated ? JSON.parse(rawCreated) : [];
      const localPacks: any[] = rawLocalPacks ? JSON.parse(rawLocalPacks) : [];

      const activePackIds = Array.from(new Set([...ownedIds, ...createdIds, "campus-starter"]));

      const resultPacks: DisplayPack[] = [];
      const loadedIds = new Set<string>();

      // 2. Resolve default starter packs
      activePackIds.forEach((id) => {
        if (STARTER_METADATA[id]) {
          resultPacks.push({
            id,
            title: STARTER_METADATA[id].title,
            creator: STARTER_METADATA[id].creator,
            icon: STARTER_METADATA[id].icon,
            category: STARTER_METADATA[id].category,
            stickerCount: STARTER_METADATA[id].count,
          });
          loadedIds.add(id);
        }
      });

      // 3. Resolve locally published packs
      localPacks.forEach((lp) => {
        if (activePackIds.includes(lp.id) && !loadedIds.has(lp.id)) {
          resultPacks.push({
            id: lp.id,
            title: lp.title,
            creator: lp.creator_name || "Student Creator",
            icon: lp.icon || "🎨",
            category: lp.category || "Custom",
            stickerCount: Array.isArray(lp.stickers) ? lp.stickers.length : 3,
          });
          loadedIds.add(lp.id);
        }
      });

      // 4. Resolve custom packs from Supabase
      const missingIds = activePackIds.filter((id) => !loadedIds.has(id));
      if (missingIds.length > 0) {
        const { data: dbPacks } = await supabase
          .from("sticker_packs")
          .select("id, title, creator_name, icon, category, sticker_items(id)")
          .in("id", missingIds);

        if (dbPacks && dbPacks.length > 0) {
          dbPacks.forEach((dp: any) => {
            resultPacks.push({
              id: dp.id,
              title: dp.title,
              creator: dp.creator_name || "Student Creator",
              icon: dp.icon || "🎨",
              category: dp.category || "Campus Vibes",
              stickerCount: Array.isArray(dp.sticker_items) ? dp.sticker_items.length : 0,
            });
          });
        }
      }

      setOwnedPacks(resultPacks);
    } catch (e) {
      console.warn("Error fetching owned packs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchOwnedPacks();
    }, [fetchOwnedPacks])
  );

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

          {loading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color="#FD0000" />
            </View>
          ) : ownedPacks.length === 0 ? (
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
              {ownedPacks.map((pack) => {
                const isUrl = pack.icon?.startsWith("http");
                return (
                  <View key={pack.id} style={styles.packCard}>
                    <View style={styles.thumbnailBox}>
                      {isUrl ? (
                        <Image source={{ uri: pack.icon }} style={styles.packImageCover} />
                      ) : (
                        <Text style={styles.packEmoji}>{pack.icon}</Text>
                      )}
                      <View style={styles.itemCountBadge}>
                        <Text style={styles.itemCountText}>{pack.stickerCount} stickers</Text>
                      </View>
                    </View>

                    <View style={styles.cardMeta}>
                      <View style={styles.metaHeader}>
                        <Text style={styles.packTitle} numberOfLines={1}>
                          {pack.title}
                        </Text>
                        <View style={styles.unlockedPill}>
                          <Text style={styles.unlockedText}>Unlocked ✓</Text>
                        </View>
                      </View>

                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryText}>{pack.category}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
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
  centerLoader: {
    padding: 48,
    alignItems: "center",
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
    minWidth: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  thumbnailBox: {
    height: 150,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  packImageCover: {
    width: 90,
    height: 90,
    resizeMode: "contain",
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
    padding: 16,
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