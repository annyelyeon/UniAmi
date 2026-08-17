import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  count: number;
  priceAud: string;
  gems: number;
  category: string;
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
    count: 12,
    priceAud: "Free",
    gems: 0,
    category: "Campus Life",
  },
  {
    id: "exam-week",
    title: "Exam Week Moods",
    creator: "Sarah (VU)",
    icon: "☕",
    count: 18,
    priceAud: "$1.20 AUD",
    gems: 240,
    category: "Exam Life",
  },
  {
    id: "tech-code",
    title: "Code & Bugs Pack",
    creator: "Alex (IT)",
    icon: "💻",
    count: 15,
    priceAud: "$1.50 AUD",
    gems: 300,
    category: "Tech & Code",
  },
  {
    id: "cute-mascot",
    title: "Cute Mascot Expressions",
    creator: "Ami Studio",
    icon: "🦊",
    count: 16,
    priceAud: "$1.20 AUD",
    gems: 240,
    category: "Cute / Kawaii",
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
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const toastTimerRef = useRef<any>(null);

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
    showToast(`Redirecting to checkout for ${pack.title}...`);
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
    const matchesCategory =
      selectedCategory === "All Packs" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "Owned" ? ownedPackIds.includes(p.id) : true;

    return matchesCategory && matchesSearch && matchesTab;
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
                <View style={styles.cardPreview}>
                  <Text style={styles.packEmoji}>{pack.icon}</Text>
                  <View style={styles.stickerCountTag}>
                    <Text style={styles.stickerCountText}>{pack.count} stickers</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.packTitle}>{pack.title}</Text>
                  <View style={styles.creatorRow}>
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorBadgeText}>
                        {pack.creator.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.creatorText}>{pack.creator}</Text>
                  </View>

                  {isOwned ? (
                    <View style={styles.ownedButton}>
                      <Text style={styles.ownedButtonText}>Owned</Text>
                    </View>
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
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  ownedButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
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
});