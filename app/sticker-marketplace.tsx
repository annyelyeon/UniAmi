import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { VideoWatchPlayer } from "../components/VideoWatchPlayer";

interface StickerPack {
  id: string;
  title: string;
  creator: string;
  icon: string;
  priceAud: string;
  gems: number;
  category: string;
  description: string;
  stickers: StickerItem[];
}

interface StickerItem {
  id: string;
  emoji: string;
  name: string;
}

const CATEGORIES = [
  "All Packs",
  "Campus Life",
  "Exam Life",
  "Study Moods",
  "Tech & Code",
  "Cute / Kawaii",
  "Campus Art",
];

const PACKS: StickerPack[] = [
  {
    id: "campus-starter",
    title: "Campus Starter Pack",
    creator: "UniAmi Team",
    icon: "🎓",
    priceAud: "Free",
    gems: 0,
    category: "Campus Life",
    description: "Everyday campus essentials from lecture halls to O-Week celebrations.",
    stickers: [
      { id: "cs-1", emoji: "🎓", name: "Grad Cap" }, { id: "cs-2", emoji: "📚", name: "Textbooks" },
      { id: "cs-3", emoji: "🎒", name: "Backpack" }, { id: "cs-4", emoji: "🏫", name: "Lecture Hall" },
      { id: "cs-5", emoji: "📝", name: "Assignment" }, { id: "cs-6", emoji: "🚌", name: "Campus Shuttle" },
      { id: "cs-7", emoji: "🥪", name: "Lunch Break" }, { id: "cs-8", emoji: "☕", name: "Flat White" },
      { id: "cs-9", emoji: "🔔", name: "Due Date" }, { id: "cs-10", emoji: "🏆", name: "High Distinction" },
    ],
  },
  {
    id: "exam-week",
    title: "Exam Week Moods",
    creator: "Sarah (VU)",
    icon: "☕",
    priceAud: "$1.20 AUD",
    gems: 240,
    category: "Exam Life",
    description: "Surviving swotvac, caffeine overload, and late-night study sessions.",
    stickers: [
      { id: "ew-1", emoji: "☕", name: "Triple Shot" }, { id: "ew-2", emoji: "🥱", name: "Exhausted" },
      { id: "ew-3", emoji: "🤯", name: "Brain Fry" }, { id: "ew-4", emoji: "⏰", name: "3 AM Alarm" },
      { id: "ew-5", emoji: "⚡", name: "Energy Boost" }, { id: "ew-6", emoji: "📄", name: "Formula Sheet" },
      { id: "ew-7", emoji: "😭", name: "Panic Mode" }, { id: "ew-8", emoji: "🙏", name: "Pass Mark" },
      { id: "ew-9", emoji: "🎯", name: "Final Grade" }, { id: "ew-10", emoji: "🛌", name: "Post-Exam Sleep" },
    ],
  },
  {
    id: "tech-code",
    title: "Code & Bugs Pack",
    creator: "Alex (IT)",
    icon: "💻",
    priceAud: "$1.50 AUD",
    gems: 300,
    category: "Tech & Code",
    description: "For coders, debuggers, late-night git pushers, and tech innovators.",
    stickers: [
      { id: "tc-1", emoji: "💻", name: "Laptop" }, { id: "tc-2", emoji: "🐛", name: "Bug in Prod" },
      { id: "tc-3", emoji: "🚀", name: "Deploy Live" }, { id: "tc-4", emoji: "⌨️", name: "Mechanical Keys" },
      { id: "tc-5", emoji: "🐍", name: "Python Script" }, { id: "tc-6", emoji: "⚛️", name: "React Flow" },
      { id: "tc-7", emoji: "💾", name: "Ctrl + S" }, { id: "tc-8", emoji: "🤖", name: "AI Assistant" },
      { id: "tc-9", emoji: "📦", name: "npm Install" }, { id: "tc-10", emoji: "⚡", name: "Fast Build" },
    ],
  },
  {
    id: "cute-mascot",
    title: "Cute Mascot Expressions",
    creator: "Ami Studio",
    icon: "🦊",
    priceAud: "$1.20 AUD",
    gems: 240,
    category: "Cute / Kawaii",
    description: "Adorable mascot moments to express every mood in notes and chat.",
    stickers: [
      { id: "cm-1", emoji: "🦊", name: "Fox Smile" }, { id: "cm-2", emoji: "🐱", name: "Cozy Cat" },
      { id: "cm-3", emoji: "🐶", name: "Puppy Cheer" }, { id: "cm-4", emoji: "🐼", name: "Boba Panda" },
      { id: "cm-5", emoji: "🐰", name: "Bunny Hop" }, { id: "cm-6", emoji: "🐨", name: "Koala Snuggle" },
      { id: "cm-7", emoji: "🌸", name: "Blossom" }, { id: "cm-8", emoji: "✨", name: "Sparkles" },
      { id: "cm-9", emoji: "💖", name: "Heart Flutter" }, { id: "cm-10", emoji: "🍙", name: "Snack Time" },
    ],
  },
  {
    id: "study-moods",
    title: "Lo-Fi Study Moods",
    creator: "Chloe (Design)",
    icon: "🎧",
    priceAud: "$1.20 AUD",
    gems: 240,
    category: "Study Moods",
    description: "Relaxed beats, quiet library desks, rainy afternoons, and focus rituals.",
    stickers: [
      { id: "sm-1", emoji: "🎧", name: "Headphones" }, { id: "sm-2", emoji: "🌧️", name: "Rain Window" },
      { id: "sm-3", emoji: "🍵", name: "Matcha Tea" }, { id: "sm-4", emoji: "🕯️", name: "Cozy Candle" },
      { id: "sm-5", emoji: "📖", name: "Quiet Reading" }, { id: "sm-6", emoji: "✍️", name: "Notes" },
      { id: "sm-7", emoji: "🧠", name: "Deep Focus" }, { id: "sm-8", emoji: "💡", name: "Eureka" },
    ],
  },
  {
    id: "campus-art",
    title: "Creative Arts Guild",
    creator: "Liam (Arts)",
    icon: "🎨",
    priceAud: "$1.50 AUD",
    gems: 300,
    category: "Campus Art",
    description: "Vibrant sketches, theater masks, campus architecture, and artistic inspiration.",
    stickers: [
      { id: "ca-1", emoji: "🎨", name: "Palette" }, { id: "ca-2", emoji: "🖌️", name: "Brush Stroke" },
      { id: "ca-3", emoji: "📸", name: "Analog Lens" }, { id: "ca-4", emoji: "🎭", name: "Drama Club" },
      { id: "ca-5", emoji: "🏛️", name: "Campus Pillar" }, { id: "ca-6", emoji: "🌈", name: "Color Burst" },
      { id: "ca-7", emoji: "🖼️", name: "Exhibition" }, { id: "ca-8", emoji: "🎷", name: "Jazz Lounge" },
    ],
  },
];

export default function StickerMarketplaceScreen() {
  const router = useRouter();
  const [diamonds, setDiamonds] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Packs");
  const [activeTab, setActiveTab] = useState<"Recommended" | "Trending" | "Owned">("Recommended");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ownedPackIds, setOwnedPackIds] = useState<string[]>(["campus-starter"]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPackPreview, setSelectedPackPreview] = useState<StickerPack | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const toastTimerRef = useRef<any>(null);

  const refreshOwnedPacks = useCallback(async () => {
    try {
      const savedOwned = await AsyncStorage.getItem("@uni_ami_owned_packs");
      const parsedOwned = savedOwned ? JSON.parse(savedOwned) : [];
      if (Array.isArray(parsedOwned)) {
        setOwnedPackIds(parsedOwned.filter((id): id is string => typeof id === "string"));
      }
    } catch (error) {
      console.warn("Owned sticker refresh error:", error);
    }
  }, []);

  // 1. Safe storage loader
  useEffect(() => {
    async function loadData() {
      try {
        const savedGems = await AsyncStorage.getItem("@uni_ami_diamonds");
        if (savedGems) {
          const parsed = JSON.parse(savedGems);
          if (typeof parsed === "number") setDiamonds(parsed);
        }

        const savedOwned = await AsyncStorage.getItem("@uni_ami_owned_packs");
        if (savedOwned) {
          const parsedOwned = JSON.parse(savedOwned);
          if (Array.isArray(parsedOwned)) {
            setOwnedPackIds(parsedOwned.filter((id): id is string => typeof id === "string"));
          }
        }
      } catch (err) {
        console.warn("Storage load error:", err);
      }
    }
    loadData();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshOwnedPacks();
    }, [refreshOwnedPacks])
  );

  useEffect(() => {
    void refreshOwnedPacks();
  }, [activeTab, refreshOwnedPacks]);

  // 2. Non-blocking in-app notification toast
  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleEarnDiamonds = (amount: number) => {
    setDiamonds((currentBalance) => {
      const nextBalance = currentBalance + amount;
      void AsyncStorage.setItem("@uni_ami_diamonds", JSON.stringify(nextBalance));
      return nextBalance;
    });
    showToast("🎉 +10 Diamonds added to your balance!");
  };

  const handleBuyCash = (pack: StickerPack) => {
    if (selectedPackPreview) setSelectedPackPreview(null);
    router.push({
      pathname: "/sticker-checkout",
      params: {
        id: pack.id,
        packId: pack.id,
        title: pack.title,
        price: pack.priceAud,
        icon: pack.icon,
        creator: pack.creator,
        category: pack.category,
        gems: String(pack.gems),
      },
    });
  };

  const handleUnlockGems = async (pack: StickerPack) => {
    if (diamonds < pack.gems) {
      showToast(`Need ${pack.gems} 💎 (You have ${diamonds} 💎). Click 'Earn +10 💎'!`);
      return;
    }

    const nextGems = diamonds - pack.gems;
    const nextOwned = [...ownedPackIds, pack.id];

    setDiamonds(nextGems);
    setOwnedPackIds(nextOwned);

    await AsyncStorage.setItem("@uni_ami_diamonds", JSON.stringify(nextGems));
    await AsyncStorage.setItem("@uni_ami_owned_packs", JSON.stringify(nextOwned));

    showToast(`🎉 Unlocked "${pack.title}"!`);
  };

  const filteredPacks = PACKS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "Owned") {
      return ownedPackIds.includes(p.id) && matchesSearch;
    }

    const matchesCategory =
      selectedCategory === "All Packs" || p.category === selectedCategory;

    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.screenWrapper}>
      {/* Floating Non-blocking Toast Banner */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>

          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Sticker Marketplace</Text>
            <Text style={styles.subtitle}>
              Discover, collect, and unlock student-created sticker packs.
            </Text>
          </View>

          {/* Clickable Earn Diamonds Pill */}
          <Pressable
            onPress={() => setIsVideoOpen(true)}
            style={({ pressed }) => [styles.diamondPill, pressed && styles.pressed]}
          >
            <View style={styles.diamondRow}>
              <Text style={styles.diamondCount}>{diamonds}</Text>
              <Text style={styles.gemIcon}>💎</Text>
            </View>
            <Text style={styles.earnBadge}>Earn +10 💎</Text>
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search sticker packs, creators, or topics..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section Title & Sub-tabs */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Featured Packs</Text>

          <View style={styles.tabsContainer}>
            {(["Recommended", "Trending", "Owned"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && styles.tabButtonTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Pack Cards Grid */}
        <View style={styles.cardsGrid}>
          {filteredPacks.map((pack) => {
            const isOwned = ownedPackIds.includes(pack.id);
            return (
              <View key={pack.id} style={styles.card}>
                <Pressable onPress={() => setSelectedPackPreview(pack)} style={styles.cardPreview}>
                  <Text style={styles.packEmoji}>{pack.icon}</Text>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagText}>View Stickers</Text>
                  </View>
                  <View style={styles.stickerCountTag}>
                    <Text style={styles.stickerCountText}>{pack.stickers.length} stickers</Text>
                  </View>
                </Pressable>

                <View style={styles.cardBody}>
                  <Pressable onPress={() => setSelectedPackPreview(pack)}>
                    <Text style={styles.packTitle}>{pack.title}</Text>
                  </Pressable>
                  <View style={styles.creatorRow}>
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorBadgeText}>
                        {pack.creator.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.creatorText}>{pack.creator}</Text>
                  </View>

                  {isOwned ? (
                    <Pressable onPress={() => setSelectedPackPreview(pack)} style={styles.ownedButton}>
                      <Text style={styles.ownedButtonText}>✓ Owned • Open Pack</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.buttonStack}>
                      <Pressable
                        onPress={() => handleBuyCash(pack)}
                        style={({ pressed }) => [
                          styles.buyButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.buyButtonText}>
                          Buy {pack.priceAud}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleUnlockGems(pack)}
                        style={({ pressed }) => [
                          styles.unlockButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.unlockButtonText}>
                          Unlock with {pack.gems} 💎
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {selectedPackPreview && (
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewHeaderLeft}>
                <View style={styles.previewIconBox}>
                  <Text style={styles.previewIconText}>{selectedPackPreview.icon}</Text>
                </View>
                <View style={styles.previewHeadingCopy}>
                  <Text style={styles.previewTitle}>{selectedPackPreview.title}</Text>
                  <Text style={styles.previewCreator}>Created by {selectedPackPreview.creator} • {selectedPackPreview.category}</Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedPackPreview(null)} style={styles.previewCloseButton}>
                <Text style={styles.previewCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.previewDescription}>{selectedPackPreview.description}</Text>

            <View style={styles.stickersBox}>
              <Text style={styles.stickersBoxTitle}>PACK STICKERS ({selectedPackPreview.stickers.length})</Text>
              <ScrollView contentContainerStyle={styles.stickersGrid} showsVerticalScrollIndicator>
                {selectedPackPreview.stickers.map((sticker) => (
                  <Pressable key={sticker.id} style={({ pressed }) => [styles.stickerTile, pressed && styles.pressed]}>
                    <Text style={styles.stickerEmojiLarge}>{sticker.emoji}</Text>
                    <Text style={styles.stickerTileName} numberOfLines={1}>{sticker.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.previewFooter}>
              {ownedPackIds.includes(selectedPackPreview.id) ? (
                <View style={styles.previewOwnedBanner}>
                  <Text style={styles.previewOwnedBannerText}>✨ Available in your notes and chat</Text>
                </View>
              ) : (
                <View style={styles.previewActionRow}>
                  <Pressable
                    onPress={() => {
                      handleBuyCash(selectedPackPreview);
                    }}
                    style={[styles.buyButton, styles.previewActionButton]}
                  >
                    <Text style={styles.buyButtonText}>Buy {selectedPackPreview.priceAud}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleUnlockGems(selectedPackPreview)} style={[styles.unlockButton, styles.previewActionButton]}>
                    <Text style={styles.unlockButtonText}>Unlock {selectedPackPreview.gems} 💎</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {isVideoOpen && (
        <VideoWatchPlayer
          visible={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          onRewardEarned={handleEarnDiamonds}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: "#FAF7F2",
    position: "relative",
  },
  toastContainer: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    cursor: "pointer",
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerTextGroup: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  diamondPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  diamondRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  diamondCount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  gemIcon: {
    fontSize: 13,
  },
  earnBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FD0000",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  categoryList: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  categoryPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    cursor: "pointer",
  },
  categoryPillActive: {
    backgroundColor: "#FD0000",
    borderColor: "#FD0000",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    cursor: "pointer",
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#FD0000",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 280,
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardPreview: {
    height: 140,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
  },
  previewTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewTagText: {
    color: "#6366F1",
    fontSize: 10,
    fontWeight: "800",
  },
  packEmoji: {
    fontSize: 56,
  },
  stickerCountTag: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stickerCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cardBody: {
    padding: 16,
  },
  packTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    cursor: "pointer",
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FD0000",
    alignItems: "center",
    justifyContent: "center",
  },
  creatorBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  creatorText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  ownedButton: {
    marginTop: 14,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  ownedButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
  },
  buttonStack: {
    gap: 8,
    marginTop: 12,
  },
  buyButton: {
    backgroundColor: "#FD0000",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    cursor: "pointer",
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  unlockButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    cursor: "pointer",
  },
  unlockButtonText: {
    color: "#FD0000",
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  previewOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(15,23,42,0.72)",
    zIndex: 999999,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "86%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  previewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  previewIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  previewIconText: {
    fontSize: 30,
  },
  previewHeadingCopy: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  previewCreator: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  previewCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  previewDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    marginBottom: 16,
  },
  stickersBox: {
    maxHeight: 280,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stickersBoxTitle: {
    color: "#6366F1",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  stickersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 4,
  },
  stickerTile: {
    width: "30%",
    minWidth: 88,
    minHeight: 86,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  stickerEmojiLarge: {
    fontSize: 32,
    marginBottom: 4,
  },
  stickerTileName: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  previewFooter: {
    marginTop: 18,
  },
  previewOwnedBanner: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  previewOwnedBannerText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "700",
  },
  previewActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewActionButton: {
    flex: 1,
  },
});