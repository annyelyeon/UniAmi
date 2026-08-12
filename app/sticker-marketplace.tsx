import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../src/components/ScreenShell";
import { colors } from "../src/theme/colors";
import type { StickerPack, User } from "../src/types/models";

const currentUser: User = {
  id: "user-current",
  nickname: "Ava Chen",
  verifiedUniversityEmail: "ava.chen@student.uni.edu.au",
  university: "UniAmi University",
  campus: "City",
  faculty: "Information Technology",
  year: 2,
  isPremium: true,
  premiumStatus: "premium",
  postCount: 14,
  stickerPacksOwned: 4,
  joinedClubs: ["IT Society", "Hiking Club", "Chess Club"],
  createdAt: "2026-01-10T08:30:00Z",
  updatedAt: "2026-08-11T09:15:00Z",
};

const mockCreator = {
  id: "user-sticker-creator",
  nickname: "Mia",
};

const stickerPacks: StickerPack[] = [
  { id: "campus-starter", name: "Campus starter pack", stickerCount: 12, priceAUD: null, creatorId: null, isFree: true },
  { id: "exam-week-moods", name: "Exam week moods", stickerCount: 18, priceAUD: null, creatorId: null, isFree: true },
  { id: "uni-cats", name: "Uni cats", stickerCount: 20, priceAUD: 1.99, creatorId: mockCreator.id, isFree: false },
  { id: "deadline-panic", name: "Deadline panic", stickerCount: 16, priceAUD: 2.49, creatorId: mockCreator.id, isFree: false },
];

const sectionLabels = {
  free: "Free packs",
  student: "By students",
};

export default function StickerMarketplaceScreen() {
  const [ownedPackIds, setOwnedPackIds] = useState<string[]>([]);

  const ownedPacks = useMemo(() => new Set(ownedPackIds), [ownedPackIds]);

  const ownPack = (packId: string) => {
    setOwnedPackIds((current) =>
      current.includes(packId) ? current : [...current, packId],
    );
  };

  return (
    <ScreenShell title="Sticker marketplace" subtitle="Browse packs for posts and notes.">
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sticker marketplace</Text>
        <View style={styles.headerSpacer} />
      </View>

      <SectionLabel label={sectionLabels.free} />
      <View style={styles.packList}>
        {stickerPacks
          .filter((pack) => pack.isFree)
          .map((pack) => (
            <StickerPackCard
              key={pack.id}
              pack={pack}
              owned={ownedPacks.has(pack.id)}
              onOwn={() => ownPack(pack.id)}
            />
          ))}
      </View>

      <SectionLabel label={sectionLabels.student} />
      <View style={styles.packList}>
        {stickerPacks
          .filter((pack) => !pack.isFree)
          .map((pack) => (
            <StickerPackCard
              key={pack.id}
              pack={pack}
              owned={ownedPacks.has(pack.id)}
              onOwn={() => ownPack(pack.id)}
            />
          ))}
      </View>
    </ScreenShell>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function StickerPackCard({
  pack,
  owned,
  onOwn,
}: {
  pack: StickerPack;
  owned: boolean;
  onOwn: () => void;
}) {
  const isCreatorPack = !pack.isFree;
  const byNickname = isCreatorPack ? mockCreator.nickname : null;
  const showPremiumIncluded = isCreatorPack && currentUser.isPremium;

  return (
    <View style={styles.packCard}>
      <View style={styles.packLeft}>
        <View
          style={[
            styles.thumb,
            pack.isFree ? styles.thumbFree : styles.thumbPaid,
          ]}
        >
          <Ionicons
            name={pack.isFree ? "happy-outline" : "sparkles-outline"}
            size={26}
            color={pack.isFree ? colors.accentStrong : colors.brandRed}
          />
        </View>

        <View style={styles.packMeta}>
          <Text style={styles.packName}>{pack.name}</Text>
          {!pack.isFree && byNickname ? (
            <Text style={styles.packCreator}>by {byNickname}</Text>
          ) : null}
          <Text style={styles.packCount}>{pack.stickerCount} stickers</Text>
        </View>
      </View>

      <View style={styles.packRight}>
        {owned ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedBadgeText}>Owned</Text>
          </View>
        ) : pack.isFree ? (
          <Pressable accessibilityRole="button" onPress={onOwn} style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Free</Text>
          </Pressable>
        ) : showPremiumIncluded ? (
          <Pressable accessibilityRole="button" onPress={onOwn} style={styles.includedBadge}>
            <Text style={styles.includedText}>Included with Premium</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/sticker-checkout", params: { packId: pack.id } })}
              style={styles.priceBadge}
            >
              <Text style={styles.priceText}>${pack.priceAUD?.toFixed(2)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/sticker-ad-unlock", params: { packId: pack.id } })}
              style={styles.adLinkRow}
            >
              <Ionicons name="play-outline" size={14} color={colors.accent} />
              <Text style={styles.adLinkText}>or watch ad</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 40,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingTop: 4,
  },
  packList: {
    gap: 12,
  },
  packCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  packLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbFree: {
    backgroundColor: "#DCFCE7",
  },
  thumbPaid: {
    backgroundColor: "#FEE2E2",
  },
  packMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  packName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  packCreator: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  packCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  packRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  freeBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  freeBadgeText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
  },
  ownedBadge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ownedBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  priceBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  priceText: {
    color: colors.brandRed,
    fontSize: 12,
    fontWeight: "800",
  },
  includedBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  includedText: {
    color: colors.brandRed,
    fontSize: 12,
    fontWeight: "800",
  },
  adLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  adLinkText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
});import { ScreenShell } from "../src/components/ScreenShell";

export default function StickerMarketplaceScreen() {
  return (
    <ScreenShell
      title="Sticker Marketplace"
      subtitle="Placeholder route for the marketplace experience."
    />
  );
}