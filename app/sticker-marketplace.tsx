import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { VideoWatchPlayer } from "../components/VideoWatchPlayer";
import { supabase } from "../src/lib/supabase";

export interface StickerItem {
  id: string;
  emoji: string;
  name: string;
}

export interface StickerPack {
  id: string;
  title: string;
  creator: string;
  icon: string;
  priceAud: string;
  rawPrice: number;
  gems: number;
  category: string;
  description: string;
  isStudentPack: boolean;
  stickers: StickerItem[];
}

const CATEGORIES = [
  "All Packs",
  "Student Creators 🌟",
  "Aesthetic / Lo-Fi",
  "Memes / Funny",
  "Cute / Kawaii",
  "Anime / Cartoon",
  "Food / Drinks",
  "Tech / Gaming",
  "Study & Focus",
  "Sports & Gym",
  "Reactions & Moods",
  "Campus Vibes",
];

const OFFICIAL_CREATOR = "UniAmi Team";

const DEFAULT_PACKS: StickerPack[] = [
  {
    id: "campus-starter",
    title: "Campus Starter Pack",
    creator: "UniAmi Team",
    icon: "🎓",
    priceAud: "Free",
    rawPrice: 0.0,
    gems: 0,
    category: "Campus Vibes",
    description: "Everyday campus essentials from lecture halls to O-Week celebrations.",
    isStudentPack: false,
    stickers: [
      { id: "cs-1", emoji: "🎓", name: "Grad Cap" },
      { id: "cs-2", emoji: "📚", name: "Textbooks" },
      { id: "cs-3", emoji: "🎒", name: "Backpack" },
      { id: "cs-4", emoji: "🏫", name: "Lecture Hall" },
      { id: "cs-5", emoji: "📝", name: "Assignment" },
      { id: "cs-6", emoji: "🚌", name: "Campus Shuttle" },
      { id: "cs-7", emoji: "🥪", name: "Lunch Break" },
      { id: "cs-8", emoji: "☕", name: "Flat White" },
      { id: "cs-9", emoji: "🔔", name: "Due Date" },
      { id: "cs-10", emoji: "🏆", name: "High Distinction" },
    ],
  },
  {
    id: "exam-week",
    title: "Exam Week Moods",
    creator: "UniAmi Team",
    icon: "☕",
    priceAud: "$1.20 AUD",
    rawPrice: 1.2,
    gems: 240,
    category: "Study & Focus",
    description: "Surviving swotvac, caffeine overload, and late-night study sessions.",
    isStudentPack: false,
    stickers: [
      { id: "ew-1", emoji: "☕", name: "Triple Shot" },
      { id: "ew-2", emoji: "🥱", name: "Exhausted" },
      { id: "ew-3", emoji: "🤯", name: "Brain Fry" },
      { id: "ew-4", emoji: "⏰", name: "3 AM Alarm" },
      { id: "ew-5", emoji: "⚡", name: "Energy Boost" },
      { id: "ew-6", emoji: "📄", name: "Formula Sheet" },
      { id: "ew-7", emoji: "😭", name: "Panic Mode" },
      { id: "ew-8", emoji: "🙏", name: "Pass Mark" },
      { id: "ew-9", emoji: "🎯", name: "Final Grade" },
      { id: "ew-10", emoji: "🛌", name: "Post-Exam Sleep" },
    ],
  },
  {
    id: "tech-code",
    title: "Code & Bugs Pack",
    creator: "UniAmi Team",
    icon: "💻",
    priceAud: "$1.50 AUD",
    rawPrice: 1.5,
    gems: 300,
    category: "Tech / Gaming",
    description: "For coders, debuggers, late-night git pushers, and tech innovators.",
    isStudentPack: false,
    stickers: [
      { id: "tc-1", emoji: "💻", name: "Laptop" },
      { id: "tc-2", emoji: "🐛", name: "Bug in Prod" },
      { id: "tc-3", emoji: "🚀", name: "Deploy Live" },
      { id: "tc-4", emoji: "⌨️", name: "Mechanical Keys" },
      { id: "tc-5", emoji: "🐍", name: "Python Script" },
      { id: "tc-6", emoji: "⚛️", name: "React Flow" },
      { id: "tc-7", emoji: "💾", name: "Ctrl + S" },
      { id: "tc-8", emoji: "🤖", name: "AI Assistant" },
      { id: "tc-9", emoji: "📦", name: "npm Install" },
      { id: "tc-10", emoji: "⚡", name: "Fast Build" },
    ],
  },
  {
    id: "cute-mascot",
    title: "Cute Mascot Expressions",
    creator: "UniAmi Team",
    icon: "🦊",
    priceAud: "$1.20 AUD",
    rawPrice: 1.2,
    gems: 240,
    category: "Cute / Kawaii",
    description: "Adorable mascot moments to express every mood in notes and chat.",
    isStudentPack: false,
    stickers: [
      { id: "cm-1", emoji: "🦊", name: "Fox Smile" },
      { id: "cm-2", emoji: "🐱", name: "Cozy Cat" },
      { id: "cm-3", emoji: "🐶", name: "Puppy Cheer" },
      { id: "cm-4", emoji: "🐼", name: "Boba Panda" },
      { id: "cm-5", emoji: "🐰", name: "Bunny Hop" },
      { id: "cm-6", emoji: "🐨", name: "Koala Snuggle" },
      { id: "cm-7", emoji: "🌸", name: "Blossom" },
      { id: "cm-8", emoji: "✨", name: "Sparkles" },
      { id: "cm-9", emoji: "💖", name: "Heart Flutter" },
      { id: "cm-10", emoji: "🍙", name: "Snack Time" },
    ],
  },
  {
    id: "study-moods",
    title: "Lo-Fi Study Moods",
    creator: "UniAmi Team",
    icon: "🎧",
    priceAud: "$1.20 AUD",
    rawPrice: 1.2,
    gems: 240,
    category: "Aesthetic / Lo-Fi",
    description: "Relaxed beats, quiet library desks, rainy afternoons, and focus rituals.",
    isStudentPack: false,
    stickers: [
      { id: "sm-1", emoji: "🎧", name: "Headphones" },
      { id: "sm-2", emoji: "🌧️", name: "Rain Window" },
      { id: "sm-3", emoji: "🍵", name: "Matcha Tea" },
      { id: "sm-4", emoji: "🕯️", name: "Cozy Candle" },
      { id: "sm-5", emoji: "📖", name: "Quiet Reading" },
      { id: "sm-6", emoji: "✍️", name: "Notes" },
      { id: "sm-7", emoji: "🧠", name: "Deep Focus" },
      { id: "sm-8", emoji: "💡", name: "Eureka" },
    ],
  },
  {
    id: "campus-art",
    title: "Creative Arts Guild",
    creator: "UniAmi Team",
    icon: "🎨",
    priceAud: "$1.50 AUD",
    rawPrice: 1.5,
    gems: 300,
    category: "Aesthetic / Lo-Fi",
    description: "Vibrant sketches, theater masks, campus architecture, and artistic inspiration.",
    isStudentPack: false,
    stickers: [
      { id: "ca-1", emoji: "🎨", name: "Palette" },
      { id: "ca-2", emoji: "🖌️", name: "Brush Stroke" },
      { id: "ca-3", emoji: "📸", name: "Analog Lens" },
      { id: "ca-4", emoji: "🎭", name: "Drama Club" },
      { id: "ca-5", emoji: "🏛️", name: "Campus Pillar" },
      { id: "ca-6", emoji: "🌈", name: "Color Burst" },
      { id: "ca-7", emoji: "🖼️", name: "Exhibition" },
      { id: "ca-8", emoji: "🎷", name: "Jazz Lounge" },
    ],
  },
];

export default function StickerMarketplaceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [diamonds, setDiamonds] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Packs");
  const [activeTab, setActiveTab] = useState<"Recommended" | "Trending" | "Owned">("Recommended");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ownedPackIds, setOwnedPackIds] = useState<string[]>(["campus-starter"]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPackPreview, setSelectedPackPreview] = useState<StickerPack | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [packs, setPacks] = useState<StickerPack[]>(DEFAULT_PACKS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const toastTimerRef = useRef<any>(null);

  const formatDisplayName = (name: string): string => {
    if (!name) return "Maneesha";
    if (name === OFFICIAL_CREATOR) return OFFICIAL_CREATOR;
    if (
      name.toLowerCase().includes("r.bandara") ||
      name.toLowerCase().includes("bandara") ||
      name.toLowerCase().includes("@")
    ) {
      return "Maneesha";
    }
    return name;
  };

  const refreshPacks = useCallback(async () => {
    try {
      setIsLoading(true);

      let currentStudentNickname = "Maneesha";
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", authData.user.id)
          .single();
        if (prof?.nickname) currentStudentNickname = prof.nickname;
      }

      const { data } = await supabase
        .from("sticker_packs")
        .select(`
          id,
          title,
          creator_id,
          creator_name,
          icon,
          price_aud,
          gems_price,
          category,
          description,
          status,
          sticker_items (id, image_url, name)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      const rawLocalPacks = await AsyncStorage.getItem("@uni_ami_created_packs_data");
      const localPacks = rawLocalPacks ? JSON.parse(rawLocalPacks) : [];

      let mapped: StickerPack[] = [];

      if (data && data.length > 0) {
        const creatorIds = data.map((r: any) => r.creator_id).filter(Boolean);
        const nicknameMap: Record<string, string> = {};

        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, nickname")
            .in("id", creatorIds);

          if (profiles) {
            profiles.forEach((p: any) => {
              if (p.nickname) nicknameMap[p.id] = p.nickname;
            });
          }
        }

        mapped = data.map((row: any) => {
          const numPrice = Number(row.price_aud) || 0;
          const resolvedName =
            nicknameMap[row.creator_id] ||
            formatDisplayName(row.creator_name) ||
            currentStudentNickname;

          const isStudent = resolvedName !== OFFICIAL_CREATOR && row.creator_name !== OFFICIAL_CREATOR;

          const items: StickerItem[] = Array.isArray(row.sticker_items)
            ? row.sticker_items.map((si: any) => ({
                id: si.id,
                emoji: si.image_url,
                name: si.name,
              }))
            : [];

          const defaultFallback = DEFAULT_PACKS.find((dp) => dp.id === row.id);

          return {
            id: row.id,
            title: row.title,
            creator: resolvedName,
            icon: row.icon || "🎨",
            priceAud: numPrice === 0 ? "Free" : `$${numPrice.toFixed(2)} AUD`,
            rawPrice: numPrice,
            gems: Number(row.gems_price) || 0,
            category: row.category || "Aesthetic / Lo-Fi",
            description: row.description || "Student-created sticker collection.",
            isStudentPack: isStudent,
            stickers: items.length > 0 ? items : (defaultFallback?.stickers || []),
          };
        });
      }

      const existingIds = new Set(mapped.map((m) => m.id));
      for (const lp of localPacks) {
        if (!existingIds.has(lp.id)) {
          const resolvedLocalName = formatDisplayName(lp.creator_name) || currentStudentNickname;
          mapped.unshift({
            id: lp.id,
            title: lp.title,
            creator: resolvedLocalName,
            icon: lp.icon || "🎨",
            priceAud: lp.price_aud === 0 ? "Free" : `$${Number(lp.price_aud).toFixed(2)} AUD`,
            rawPrice: Number(lp.price_aud) || 1.2,
            gems: Number(lp.gems_price) || 240,
            category: lp.category || "Aesthetic / Lo-Fi",
            description: lp.description || "Student created sticker pack.",
            isStudentPack: true,
            stickers: (lp.stickers || []).map((s: any) => ({
              id: s.id,
              emoji: s.image_url,
              name: s.name,
            })),
          });
          existingIds.add(lp.id);
        }
      }

      const combined = [
        ...mapped,
        ...DEFAULT_PACKS.filter((dp) => !existingIds.has(dp.id)),
      ];

      setPacks(combined);
    } catch (error) {
      console.warn("Marketplace fetch fallback notice:", error);
      setPacks(DEFAULT_PACKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshOwnedPacks = useCallback(async () => {
    try {
      const savedOwned = await AsyncStorage.getItem("@uni_ami_owned_packs");
      const parsedOwned: string[] = savedOwned ? JSON.parse(savedOwned) : ["campus-starter"];

      const savedCreated = await AsyncStorage.getItem("@uni_ami_created_packs");
      const parsedCreated: string[] = savedCreated ? JSON.parse(savedCreated) : [];

      const allOwned = Array.from(new Set([...parsedOwned, ...parsedCreated, "campus-starter"]));

      setOwnedPackIds(allOwned);
      await AsyncStorage.setItem("@uni_ami_owned_packs", JSON.stringify(allOwned));
    } catch (error) {
      console.warn("Owned sticker refresh error:", error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const savedGems = await AsyncStorage.getItem("@uni_ami_diamonds");
        if (savedGems) {
          const parsed = JSON.parse(savedGems);
          if (typeof parsed === "number") setDiamonds(parsed);
        }
      } catch (err) {
        console.warn("Storage load error:", err);
      }
    }
    loadData();
    void refreshPacks();
    void refreshOwnedPacks();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [refreshPacks, refreshOwnedPacks]);

  useFocusEffect(
    useCallback(() => {
      void refreshOwnedPacks();
      void refreshPacks();
    }, [refreshOwnedPacks, refreshPacks])
  );

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

    try {
      const nextGems = diamonds - pack.gems;
      const nextOwned = [...ownedPackIds, pack.id];

      setDiamonds(nextGems);
      setOwnedPackIds(nextOwned);

      await AsyncStorage.setItem("@uni_ami_diamonds", JSON.stringify(nextGems));
      await AsyncStorage.setItem("@uni_ami_owned_packs", JSON.stringify(nextOwned));

      const { data: { user } } = await supabase.auth.getUser();
      const creatorCutAud = pack.rawPrice > 0 ? pack.rawPrice * 0.8333 : 0;

      await supabase.from("sticker_purchases").insert({
        pack_id: pack.id,
        user_id: user?.id || null,
        price_aud: pack.rawPrice,
        creator_cut_aud: creatorCutAud,
        payment_method: "diamonds_ad_revenue",
        status: "completed",
      });

      showToast(`🎉 Unlocked "${pack.title}"! (Creator paid $${creatorCutAud.toFixed(2)} AUD)`);
    } catch (e) {
      console.warn("Gem unlock error:", e);
      showToast(`🎉 Unlocked "${pack.title}"!`);
    }
  };

  const filteredPacks = packs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "Owned") {
      return ownedPackIds.includes(p.id) && matchesSearch;
    }

    if (selectedCategory === "Student Creators 🌟") {
      return p.isStudentPack && matchesSearch;
    }

    const matchesCategory =
      selectedCategory === "All Packs" || p.category === selectedCategory;

    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.screenWrapper}>
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.headerTopRowMobile}>
            <Pressable
              onPress={() => router.replace("/")}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Text style={styles.backBtnText}>←</Text>
            </Pressable>

            <View style={styles.headerTextGroup}>
              <Text style={[styles.title, isMobile && styles.titleMobile]}>Sticker Marketplace</Text>
              <Text style={[styles.subtitle, isMobile && styles.subtitleMobile]}>
                Discover, collect, and unlock student-created packs.
              </Text>
            </View>
          </View>

          <View style={[styles.headerActionGroup, isMobile && styles.headerActionGroupMobile]}>
            <Pressable
              onPress={() => router.push("/creator-studio")}
              style={({ pressed }) => [styles.submitPackBtn, isMobile && styles.submitPackBtnMobile, pressed && styles.pressed]}
            >
              <Text style={styles.submitPackBtnText}>+ Submit / Earn</Text>
            </Pressable>

            <Pressable
              onPress={() => setIsVideoOpen(true)}
              style={({ pressed }) => [styles.diamondPill, isMobile && styles.diamondPillMobile, pressed && styles.pressed]}
            >
              <View style={styles.diamondRow}>
                <Text style={styles.diamondCount}>{diamonds}</Text>
                <Text style={styles.gemIcon}>💎</Text>
              </View>
              <Text style={styles.earnBadge}>Earn +10 💎</Text>
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, isMobile && styles.searchBoxMobile]}>
          <Text style={{ fontSize: 13, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search packs, creators, topics..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryList, isMobile && styles.categoryListMobile]}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const isStudentBadge = cat === "Student Creators 🌟";
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                  isStudentBadge && styles.studentCategoryPill,
                  isStudentBadge && isActive && styles.studentCategoryPillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                    isStudentBadge && styles.studentCategoryPillText,
                    isStudentBadge && isActive && styles.studentCategoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section Row */}
        <View style={[styles.sectionRow, isMobile && styles.sectionRowMobile]}>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
            {selectedCategory === "Student Creators 🌟" ? "Student Creations" : "Featured Packs"}
          </Text>

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

        {/* Grid or Loader */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#FD0000" />
          </View>
        ) : filteredPacks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🎨</Text>
            <Text style={styles.emptyTitle}>No sticker packs found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === "Student Creators 🌟"
                ? "Be the first student creator to publish a pack and start earning!"
                : "Try searching with different keywords or browse another category."}
            </Text>
          </View>
        ) : (
          <View style={[styles.cardsGrid, isMobile && styles.cardsGridMobile]}>
            {filteredPacks.map((pack) => {
              const isOwned = ownedPackIds.includes(pack.id);
              const isCoverUrl = pack.icon?.startsWith("http");

              return (
                <View key={pack.id} style={[styles.card, isMobile && styles.cardMobile]}>
                  {/* Card Cover Preview */}
                  <Pressable
                    onPress={() => setSelectedPackPreview(pack)}
                    style={[styles.cardPreview, isMobile && styles.cardPreviewMobile]}
                  >
                    {isCoverUrl ? (
                      <Image source={{ uri: pack.icon }} style={isMobile ? styles.packImageCoverMobile : styles.packImageCover} />
                    ) : (
                      <Text style={isMobile ? styles.packEmojiMobile : styles.packEmoji}>{pack.icon}</Text>
                    )}

                    <View style={styles.previewTag}>
                      <Text style={styles.previewTagText}>{isMobile ? "View" : "View Stickers"}</Text>
                    </View>

                    {pack.isStudentPack && (
                      <View style={styles.creatorVerificationBadge}>
                        <Text style={styles.creatorVerificationText}>{isMobile ? "STUDENT 🌟" : "STUDENT ARTIST 🌟"}</Text>
                      </View>
                    )}

                    <View style={styles.stickerCountTag}>
                      <Text style={styles.stickerCountText}>{pack.stickers.length} {isMobile ? "pcs" : "stickers"}</Text>
                    </View>
                  </Pressable>

                  {/* Card Body */}
                  <View style={[styles.cardBody, isMobile && styles.cardBodyMobile]}>
                    <Pressable onPress={() => setSelectedPackPreview(pack)}>
                      <Text style={[styles.packTitle, isMobile && styles.packTitleMobile]} numberOfLines={1}>{pack.title}</Text>
                    </Pressable>

                    <View style={styles.creatorRow}>
                      <Text style={styles.creatorText} numberOfLines={1}>
                        {pack.creator}
                      </Text>
                      {pack.isStudentPack && (
                        <Text style={styles.creatorUniSub}>• Verified ✓</Text>
                      )}
                    </View>

                    {/* Actions */}
                    {isOwned ? (
                      <Pressable
                        onPress={() => setSelectedPackPreview(pack)}
                        style={[styles.ownedButton, isMobile && styles.ownedButtonMobile]}
                      >
                        <Text style={styles.ownedButtonText}>{isMobile ? "✓ Owned" : "✓ Owned • Open Pack"}</Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.buttonStack, isMobile && styles.buttonStackMobile]}>
                        <Pressable
                          onPress={() => handleBuyCash(pack)}
                          style={({ pressed }) => [
                            styles.buyButton,
                            isMobile && styles.buyButtonMobile,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.buyButtonText, isMobile && styles.buyButtonTextMobile]}>
                            Buy {pack.priceAud}
                          </Text>
                        </Pressable>

                        {pack.gems > 0 && (
                          <Pressable
                            onPress={() => handleUnlockGems(pack)}
                            style={({ pressed }) => [
                              styles.unlockButton,
                              isMobile && styles.unlockButtonMobile,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={[styles.unlockButtonText, isMobile && styles.unlockButtonTextMobile]}>
                              {pack.gems} 💎
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Preview */}
      {selectedPackPreview && (
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewHeaderLeft}>
                <View style={styles.previewIconBox}>
                  {selectedPackPreview.icon?.startsWith("http") ? (
                    <Image source={{ uri: selectedPackPreview.icon }} style={styles.modalCoverImg} />
                  ) : (
                    <Text style={styles.previewIconText}>{selectedPackPreview.icon}</Text>
                  )}
                </View>
                <View style={styles.previewHeadingCopy}>
                  <Text style={styles.previewTitle}>{selectedPackPreview.title}</Text>
                  <Text style={styles.previewCreator}>
                    Created by {selectedPackPreview.creator} • {selectedPackPreview.category}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedPackPreview(null)} style={styles.previewCloseButton}>
                <Text style={styles.previewCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.previewDescription}>{selectedPackPreview.description}</Text>

            <View style={styles.stickersBox}>
              <Text style={styles.stickersBoxTitle}>
                PACK STICKERS ({selectedPackPreview.stickers.length})
              </Text>
              <ScrollView contentContainerStyle={styles.stickersGrid} showsVerticalScrollIndicator>
                {selectedPackPreview.stickers.map((sticker) => {
                  const isStickerImg = sticker.emoji?.startsWith("http");
                  return (
                    <Pressable key={sticker.id} style={({ pressed }) => [styles.stickerTile, pressed && styles.pressed]}>
                      {isStickerImg ? (
                        <Image source={{ uri: sticker.emoji }} style={styles.modalStickerThumbImg} />
                      ) : (
                        <Text style={styles.stickerEmojiLarge}>{sticker.emoji}</Text>
                      )}
                      <Text style={styles.stickerTileName} numberOfLines={1}>{sticker.name}</Text>
                    </Pressable>
                  );
                })}
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
                    onPress={() => handleBuyCash(selectedPackPreview)}
                    style={[styles.buyButton, styles.previewActionButton]}
                  >
                    <Text style={styles.buyButtonText}>Buy {selectedPackPreview.priceAud}</Text>
                  </Pressable>
                  {selectedPackPreview.gems > 0 && (
                    <Pressable
                      onPress={() => handleUnlockGems(selectedPackPreview)}
                      style={[styles.unlockButton, styles.previewActionButton]}
                    >
                      <Text style={styles.unlockButtonText}>Unlock {selectedPackPreview.gems} 💎</Text>
                    </Pressable>
                  )}
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
  contentMobile: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 16,
  },
  headerTopRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 180,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  titleMobile: {
    fontSize: 19,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  subtitleMobile: {
    fontSize: 11.5,
  },
  headerActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionGroupMobile: {
    justifyContent: "flex-end",
    gap: 8,
  },
  submitPackBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitPackBtnMobile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  submitPackBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  diamondPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  diamondPillMobile: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  diamondRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  diamondCount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
  gemIcon: {
    fontSize: 11,
  },
  earnBadge: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#FD0000",
    marginTop: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchBoxMobile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  categoryList: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  categoryListMobile: {
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
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
  studentCategoryPill: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  studentCategoryPillActive: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
  studentCategoryPillText: {
    color: "#B45309",
    fontWeight: "800",
  },
  studentCategoryPillTextActive: {
    color: "#FFFFFF",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionRowMobile: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  sectionTitleMobile: {
    fontSize: 16,
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
    fontWeight: "900",
  },
  centerBox: {
    padding: 48,
    alignItems: "center",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 36,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 380,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },
  cardsGridMobile: {
    gap: 10,
    justifyContent: "space-between",
  },
  card: {
    width: "31.8%",
    minWidth: 280,
    maxWidth: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardMobile: {
    width: "48.2%",
    minWidth: "48.2%",
    borderRadius: 16,
  },
  cardPreview: {
    height: 140,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardPreviewMobile: {
    height: 105,
  },
  packImageCover: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  packImageCoverMobile: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  packEmoji: {
    fontSize: 56,
  },
  packEmojiMobile: {
    fontSize: 38,
  },
  previewTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewTagText: {
    color: "#6366F1",
    fontSize: 9.5,
    fontWeight: "800",
  },
  creatorVerificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creatorVerificationText: {
    color: "#92400E",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  stickerCountTag: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stickerCountText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "700",
  },
  cardBody: {
    padding: 16,
  },
  cardBodyMobile: {
    padding: 10,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  packTitleMobile: {
    fontSize: 13,
    marginBottom: 2,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  creatorText: {
    fontSize: 11.5,
    color: "#334155",
    fontWeight: "800",
  },
  creatorUniSub: {
    fontSize: 10,
    color: "#15803D",
    fontWeight: "800",
  },
  ownedButton: {
    marginTop: 12,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  ownedButtonMobile: {
    paddingVertical: 6,
    marginTop: 8,
    borderRadius: 8,
  },
  ownedButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6366F1",
  },
  buttonStack: {
    gap: 6,
    marginTop: 10,
  },
  buttonStackMobile: {
    gap: 5,
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: "#FD0000",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  buyButtonMobile: {
    paddingVertical: 6,
    borderRadius: 8,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  buyButtonTextMobile: {
    fontSize: 11,
  },
  unlockButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },
  unlockButtonMobile: {
    paddingVertical: 5,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: "#FD0000",
    fontSize: 11.5,
    fontWeight: "800",
  },
  unlockButtonTextMobile: {
    fontSize: 10.5,
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
    padding: 18,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  modalCoverImg: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  previewIconText: {
    fontSize: 26,
  },
  previewHeadingCopy: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  previewCreator: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  previewCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  previewDescription: {
    fontSize: 12.5,
    lineHeight: 17,
    color: "#475569",
    marginBottom: 14,
  },
  stickersBox: {
    maxHeight: 260,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stickersBoxTitle: {
    color: "#6366F1",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stickersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 4,
  },
  stickerTile: {
    width: "30.5%",
    minWidth: 78,
    minHeight: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  modalStickerThumbImg: {
    width: 36,
    height: 36,
    resizeMode: "contain",
    marginBottom: 3,
  },
  stickerEmojiLarge: {
    fontSize: 28,
    marginBottom: 3,
  },
  stickerTileName: {
    color: "#475569",
    fontSize: 9.5,
    fontWeight: "700",
    textAlign: "center",
  },
  previewFooter: {
    marginTop: 16,
  },
  previewOwnedBanner: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  previewOwnedBannerText: {
    color: "#6366F1",
    fontSize: 12.5,
    fontWeight: "700",
  },
  previewActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  previewActionButton: {
    flex: 1,
  },
});