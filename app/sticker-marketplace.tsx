import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";
import { RewardedAdModal } from "../components/RewardedAdModal";

interface StickerPack {
  id: string;
  title: string;
  category: string;
  creator: string;
  creatorAvatar: string;
  itemCount: number;
  price: string;
  isFree: boolean;
  isOwned: boolean;
  isTrending?: boolean;
  previewEmoji: string;
  previewColor: string;
}

const INITIAL_PACKS: StickerPack[] = [
  {
    id: "pack-1",
    title: "Campus Starter Pack",
    category: "Campus Life",
    creator: "UniAmi Team",
    creatorAvatar: "UA",
    itemCount: 12,
    price: "Free",
    isFree: true,
    isOwned: true,
    isTrending: true,
    previewEmoji: "🎓",
    previewColor: "#FEF2F2",
  },
  {
    id: "pack-2",
    title: "Exam Week Moods",
    category: "Exam Life",
    creator: "Sarah (VU)",
    creatorAvatar: "SV",
    itemCount: 18,
    price: "Free",
    isFree: true,
    isOwned: false,
    isTrending: true,
    previewEmoji: "☕",
    previewColor: "#FFF7ED",
  },
  {
    id: "pack-3",
    title: "Night Shift & Coding",
    category: "Tech & Code",
    creator: "Dev Club",
    creatorAvatar: "DC",
    itemCount: 16,
    price: "$1.99",
    isFree: false,
    isOwned: false,
    isTrending: true,
    previewEmoji: "💻",
    previewColor: "#EFF6FF",
  },
  {
    id: "pack-4",
    title: "Uni Cats & Coffee",
    category: "Cute / Kawaii",
    creator: "Mia K.",
    creatorAvatar: "MK",
    itemCount: 20,
    price: "$2.49",
    isFree: false,
    isOwned: false,
    isTrending: false,
    previewEmoji: "🐱",
    previewColor: "#FDF2F8",
  },
  {
    id: "pack-5",
    title: "Deadline Panic Reactions",
    category: "Study Moods",
    creator: "Liam (RMIT)",
    creatorAvatar: "LR",
    itemCount: 14,
    price: "$1.49",
    isFree: false,
    isOwned: false,
    isTrending: true,
    previewEmoji: "🔥",
    previewColor: "#FEF2F2",
  },
  {
    id: "pack-6",
    title: "Campus Doodles & Art",
    category: "Campus Art",
    creator: "Art Society",
    creatorAvatar: "AS",
    itemCount: 22,
    price: "$2.99",
    isFree: false,
    isOwned: false,
    isTrending: false,
    previewEmoji: "🎨",
    previewColor: "#F5F3FF",
  },
];

const CATEGORIES = [
  "All Packs",
  "Campus Life",
  "Exam Life",
  "Study Moods",
  "Tech & Code",
  "Cute / Kawaii",
  "Campus Art",
];

const OWNED_PACKS_STORAGE_KEY = "uniami_owned_packs";
const DIAMONDS_STORAGE_KEY = "@uni_ami_diamonds";

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

const persistOwnedPackIds = async (packIds: string[]) => {
  await AsyncStorage.setItem(OWNED_PACKS_STORAGE_KEY, JSON.stringify(packIds));
};

export default function StickerMarketplaceScreen() {
  const { profile, refreshProfile } = useAuth();
  const [packs, setPacks] = useState<StickerPack[]>(INITIAL_PACKS);
  const [selectedCategory, setSelectedCategory] = useState("All Packs");
  const [activeTab, setActiveTab] = useState<"featured" | "trending" | "owned">("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [diamonds, setDiamonds] = useState(0);

  const gemBalance = profile?.gemsBalance ?? 0;

  useEffect(() => {
    const loadDiamonds = async () => {
      try {
        const stored = await AsyncStorage.getItem(DIAMONDS_STORAGE_KEY);
        const parsed = stored ? Number(JSON.parse(stored)) : NaN;
        setDiamonds(Number.isFinite(parsed) && parsed >= 0 ? parsed : gemBalance);
      } catch {
        setDiamonds(gemBalance);
      }
    };

    void loadDiamonds();
  }, [gemBalance]);

  const filteredPacks = useMemo(() => {
    return packs.filter((pack) => {
      const matchesCategory =
        selectedCategory === "All Packs" || pack.category === selectedCategory;
      const matchesSearch =
        pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pack.creator.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab =
        activeTab === "trending"
          ? pack.isTrending
          : activeTab === "owned"
          ? pack.isOwned
          : true;

      return matchesCategory && matchesSearch && matchesTab;
    });
  }, [packs, selectedCategory, searchQuery, activeTab]);

  useFocusEffect(
    useCallback(() => {
      const refreshOwnedPacks = async () => {
        const ownedIds = await getOwnedPackIds();
        setPacks(
          INITIAL_PACKS.map((pack) => ({
            ...pack,
            isOwned: pack.isOwned || ownedIds.includes(pack.id),
          }))
        );
      };

      void refreshOwnedPacks();
      void refreshProfile();
    }, [refreshProfile])
  );

  const handleAction = (pack: StickerPack) => {
    if (pack.isOwned) return;

    if (pack.isFree) {
      setPacks((prev) => {
        const nextPacks = prev.map((item) =>
          item.id === pack.id ? { ...item, isOwned: true } : item
        );

        const ownedIds = nextPacks
          .filter((item) => item.isOwned)
          .map((item) => item.id);

        void persistOwnedPackIds(ownedIds);
        return nextPacks;
      });
      return;
    }

    router.push({
      pathname: "/sticker-checkout",
      params: {
        packId: pack.id,
        title: pack.title,
        price: pack.price,
      },
    });
  };

  const handleRewardEarned = async (amount: number) => {
    const nextBalance = diamonds + amount;
    setDiamonds(nextBalance);
    await AsyncStorage.setItem(DIAMONDS_STORAGE_KEY, JSON.stringify(nextBalance));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainWrapper}>
          {/* Header Section */}
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/home")}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>

            <View style={styles.headerTitles}>
              <Text style={styles.pageTitle}>Sticker Marketplace</Text>
              <Text style={styles.pageSubtitle}>
                Discover, collect, and unlock student-created sticker packs.
              </Text>
            </View>
          </View>

          <View style={styles.topRow}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search sticker packs, creators, or topics..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearch}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsAdOpen(true)}
              style={styles.gemBalancePill}
            >
              <Text style={styles.gemBalanceText}>{diamonds} 💎</Text>
              <Text style={styles.gemEarnText}>Earn +10 💎</Text>
            </Pressable>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section Sub-Header & Tabs */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Packs</Text>
            <View style={styles.tabToggleGroup}>
              <Pressable
                onPress={() => setActiveTab("featured")}
                style={[styles.tabButton, activeTab === "featured" && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "featured" && styles.tabButtonTextActive,
                  ]}
                >
                  Recommended
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("trending")}
                style={[styles.tabButton, activeTab === "trending" && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "trending" && styles.tabButtonTextActive,
                  ]}
                >
                  Trending
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("owned")}
                style={[styles.tabButton, activeTab === "owned" && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "owned" && styles.tabButtonTextActive,
                  ]}
                >
                  Owned
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sticker Pack Card Grid */}
          <View style={styles.gridContainer}>
            {filteredPacks.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateEmoji}>{activeTab === "owned" ? "🎁" : "📦"}</Text>
                <Text style={styles.emptyStateTitle}>
                  {activeTab === "owned" ? "No owned sticker packs yet" : "No sticker packs found"}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {activeTab === "owned"
                    ? "No owned sticker packs yet. Browse packs to add them to your collection."
                    : "Try selecting another category or clear your search query."}
                </Text>
              </View>
            ) : (
              filteredPacks.map((pack) => (
                <View key={pack.id} style={styles.packCard}>
                  {/* Visual Pack Thumbnail Box */}
                  <View
                    style={[
                      styles.thumbnailBox,
                      { backgroundColor: pack.previewColor },
                    ]}
                  >
                    <Text style={styles.packEmoji}>{pack.previewEmoji}</Text>
                    <View style={styles.itemCountBadge}>
                      <Text style={styles.itemCountText}>
                        {pack.itemCount} stickers
                      </Text>
                    </View>
                  </View>

                  {/* Card Content & Details */}
                  <View style={styles.cardContent}>
                    <Text style={styles.packTitle} numberOfLines={1}>
                      {pack.title}
                    </Text>

                    <View style={styles.creatorRow}>
                      <View style={styles.creatorAvatar}>
                        <Text style={styles.avatarText}>{pack.creatorAvatar}</Text>
                      </View>
                      <Text style={styles.creatorName} numberOfLines={1}>
                        {pack.creator}
                      </Text>
                    </View>

                    <View style={styles.purchaseActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleAction(pack)}
                        disabled={pack.isOwned}
                        style={[
                          styles.actionButton,
                          styles.primaryAction,
                          pack.isOwned && styles.actionOwned,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            pack.isOwned && styles.actionOwnedText,
                          ]}
                        >
                          {pack.isOwned ? "Owned" : "Buy $1.20 AUD"}
                        </Text>
                      </Pressable>

                      {!pack.isOwned ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            router.push({
                              pathname: "/sticker-checkout",
                              params: {
                                packId: pack.id,
                                title: pack.title,
                                price: "1.20",
                                paymentMode: "gems",
                              },
                            });
                          }}
                          style={[styles.secondaryAction]}
                        >
                          <Text style={styles.secondaryActionText}>Unlock with 240 💎</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {isAdOpen && (
        <RewardedAdModal
          visible={isAdOpen}
          onRewardEarned={handleRewardEarned}
          onClose={() => setIsAdOpen(false)}
        />
      )}
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  clearSearch: {
    padding: 4,
  },
  clearSearchText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: "#FD0000",
    borderColor: "#FD0000",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  tabToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#EAE6DF",
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  tabButtonTextActive: {
    color: "#FD0000",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },
  packCard: {
    width: "48.5%",
    flexBasis: "48.5%",
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  thumbnailBox: {
    height: 140,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  packEmoji: {
    fontSize: 54,
  },
  itemCountBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardContent: {
    gap: 8,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FD0000",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  creatorName: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
    flex: 1,
  },
  gemBalancePill: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 110,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  gemBalanceText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  gemEarnText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  purchaseActions: {
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryAction: {
    backgroundColor: colors.accent,
  },
  secondaryAction: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#F9B4B4",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  actionPaid: {
    backgroundColor: "#FD0000",
  },
  actionFree: {
    backgroundColor: "#059669",
  },
  actionOwned: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryActionText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  actionOwnedText: {
    color: "#6B7280",
  },
  emptyStateCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 36,
    alignItems: "center",
    gap: 8,
  },
  emptyStateEmoji: {
    fontSize: 44,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
});