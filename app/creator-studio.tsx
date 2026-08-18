import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
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
import { supabase } from "../src/lib/supabase";

interface PackStat {
  id: string;
  title: string;
  category: string;
  icon: string;
  price_aud: number;
  status: string;
  salesCount: number;
  grossRevenue: number;
  creatorCut: number;
  cashSalesCount: number;
  gemSalesCount: number;
}

export default function CreatorStudioScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Core Financial & Sales Metrics
  const [grossRevenueTotal, setGrossRevenueTotal] = useState<number>(0);
  const [netEarningsTotal, setNetEarningsTotal] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [totalUnitsSold, setTotalUnitsSold] = useState<number>(0);

  // Gem vs Cash breakdown
  const [cashPurchasesCount, setCashPurchasesCount] = useState<number>(0);
  const [cashPurchasesAud, setCashPurchasesAud] = useState<number>(0);
  const [gemPurchasesCount, setGemPurchasesCount] = useState<number>(0);
  const [gemPurchasesAud, setGemPurchasesAud] = useState<number>(0);

  const [myPacks, setMyPacks] = useState<PackStat[]>([]);

  const loadCreatorStats = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Get current logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const savedCreated = await AsyncStorage.getItem("@uni_ami_created_packs");
      const localCreatedIds: string[] = savedCreated ? JSON.parse(savedCreated) : [];

      const savedFull = await AsyncStorage.getItem("@uni_ami_created_packs_data");
      const localPacksData: any[] = savedFull ? JSON.parse(savedFull) : [];

      // 2. Fetch from Supabase
      let packsList: any[] = [];
      try {
        let packsQuery = supabase.from("sticker_packs").select("*");
        if (user?.id) {
          packsQuery = packsQuery.or(`creator_id.eq.${user.id},creator_name.neq.UniAmi Team`);
        } else if (localCreatedIds.length > 0) {
          packsQuery = packsQuery.in("id", localCreatedIds);
        } else {
          packsQuery = packsQuery.neq("creator_name", "UniAmi Team");
        }

        const { data: dbPacks } = await packsQuery;
        if (dbPacks && dbPacks.length > 0) {
          packsList = dbPacks;
        }
      } catch (err) {
        console.warn("Supabase fetch notice:", err);
      }

      // Merge Supabase packs with local backup packs (no duplicates)
      const existingIds = new Set(packsList.map((p) => p.id));
      for (const lp of localPacksData) {
        if (!existingIds.has(lp.id)) {
          packsList.push(lp);
          existingIds.add(lp.id);
        }
      }

      const packIds = packsList.map((p) => p.id);

      // 3. Query all purchases for these packs
      let purchasesList: any[] = [];
      if (packIds.length > 0) {
        const { data: purchasesData } = await supabase
          .from("sticker_purchases")
          .select("*")
          .in("pack_id", packIds);

        purchasesList = purchasesData || [];
      }

      // 4. Query completed payouts to calculate net available balance
      let totalWithdrawn = 0;
      const { data: payoutsData } = await supabase
        .from("creator_payouts")
        .select("amount_aud")
        .eq("status", "completed");

      if (payoutsData) {
        totalWithdrawn = payoutsData.reduce(
          (sum, item) => sum + (Number(item.amount_aud) || 0),
          0
        );
      }

      // 5. Aggregate metrics
      let grossSum = 0;
      let netSum = 0;
      let cashCount = 0;
      let cashAud = 0;
      let gemCount = 0;
      let gemAud = 0;

      const processedPacks: PackStat[] = packsList.map((pack) => {
        const matchingPurchases = purchasesList.filter((p) => p.pack_id === pack.id);
        const count = matchingPurchases.length;

        let packGross = 0;
        let packCut = 0;
        let packCashCount = 0;
        let packGemCount = 0;

        matchingPurchases.forEach((p) => {
          const rawPrice = Number(p.price_aud) || Number(pack.price_aud) || 0;
          const cut = Number(p.creator_cut_aud) || (rawPrice * 0.8333);

          packGross += rawPrice;
          packCut += cut;

          if (p.payment_method === "diamonds_ad_revenue") {
            packGemCount += 1;
            gemCount += 1;
            gemAud += cut;
          } else {
            packCashCount += 1;
            cashCount += 1;
            cashAud += cut;
          }
        });

        grossSum += packGross;
        netSum += packCut;

        return {
          id: pack.id,
          title: pack.title,
          category: pack.category || "General",
          icon: pack.icon || "🎨",
          price_aud: Number(pack.price_aud) || 0,
          status: pack.status || "approved",
          salesCount: count,
          grossRevenue: packGross,
          creatorCut: packCut,
          cashSalesCount: packCashCount,
          gemSalesCount: packGemCount,
        };
      });

      // Sort packs by top performing (highest sales count first)
      processedPacks.sort((a, b) => b.salesCount - a.salesCount);

      const netAvailable = Math.max(netSum - totalWithdrawn, 0);

      setGrossRevenueTotal(grossSum);
      setNetEarningsTotal(netSum);
      setAvailableBalance(netAvailable);
      setTotalUnitsSold(purchasesList.length);

      setCashPurchasesCount(cashCount);
      setCashPurchasesAud(cashAud);
      setGemPurchasesCount(gemCount);
      setGemPurchasesAud(gemAud);

      setMyPacks(processedPacks);
    } catch (e) {
      console.warn("Error calculating creator dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCreatorStats();
    }, [loadCreatorStats])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.replace("/sticker-marketplace")}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.pageTitle}>Creator Studio</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>ANALYTICS LIVE</Text>
              </View>
            </View>
            <Text style={styles.pageSubtitle}>
              Real-time sales performance, revenue breakdown & payout withdrawal
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/submit-pack")}
          style={styles.submitNewBtn}
        >
          <Text style={styles.submitNewBtnText}>+ Create New Pack</Text>
        </Pressable>
      </View>

      {/* Revenue Policy Guarantee Notice */}
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeIcon}>💰</Text>
        <Text style={styles.noticeText}>
          <Text style={{ fontWeight: "900", color: "#0F172A" }}>83.33% Creator Share Active:</Text>{" "}
          You earn <Text style={{ fontWeight: "900", color: "#15803D" }}>83.33%</Text> ($1.00 on a $1.20 pack) for both direct card/Apple Pay orders and ad-supported Diamond unlocks.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#FD0000" />
        </View>
      ) : (
        <>
          {/* Section 1: Financial & Available Overview Cards */}
          <View style={styles.metricsGrid}>
            {/* Gross Revenue vs Net Earnings */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>GROSS REVENUE</Text>
              <Text style={styles.metricValue}>${grossRevenueTotal.toFixed(2)} AUD</Text>
              <View style={styles.subPillRow}>
                <Text style={styles.subPillText}>Total student payments volume</Text>
              </View>
            </View>

            {/* Net Creator Earnings (83.33%) */}
            <View style={[styles.metricCard, styles.netEarningsCard]}>
              <Text style={[styles.metricLabel, { color: "#15803D" }]}>
                NET CREATOR EARNINGS (83.33%)
              </Text>
              <Text style={[styles.metricValue, { color: "#15803D" }]}>
                ${netEarningsTotal.toFixed(2)} AUD
              </Text>
              <View style={styles.subPillRow}>
                <Text style={styles.subPillText}>Your total lifetime payout</Text>
              </View>
            </View>

            {/* Available to Withdraw */}
            <View style={[styles.metricCard, styles.balanceCard]}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>READY</Text>
                </View>
              </View>
              <Text style={styles.balanceValue}>${availableBalance.toFixed(2)} AUD</Text>
              <Pressable
                onPress={() => router.push("/withdraw-earnings")}
                style={[
                  styles.withdrawActionBtn,
                  availableBalance < 5 && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.withdrawActionBtnText}>
                  {availableBalance >= 5 ? "Withdraw Payout 💸" : "Min $5.00 to Withdraw"}
                </Text>
              </Pressable>
            </View>

            {/* Total Units Sold */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL UNITS SOLD</Text>
              <Text style={styles.metricValue}>{totalUnitsSold}</Text>
              <View style={styles.subPillRow}>
                <Text style={styles.subPillText}>{myPacks.length} active published packs</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Gem vs Cash Purchases Breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Gem vs. Cash Sales Distribution</Text>
              <Text style={styles.breakdownSubtitle}>
                Tracks how students unlocked your sticker packs
              </Text>
            </View>

            <View style={styles.breakdownGrid}>
              {/* Direct Cash / Card Box */}
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownItemTop}>
                  <Text style={styles.methodIcon}>💳</Text>
                  <View>
                    <Text style={styles.methodTitle}>Direct Cash / Card</Text>
                    <Text style={styles.methodCount}>{cashPurchasesCount} purchases</Text>
                  </View>
                </View>
                <Text style={styles.methodRevenue}>+${cashPurchasesAud.toFixed(2)} AUD</Text>
              </View>

              {/* Ad-Funded Diamond Gems Box */}
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownItemTop}>
                  <Text style={styles.methodIcon}>💎</Text>
                  <View>
                    <Text style={styles.methodTitle}>Ad-Funded Diamond Gems</Text>
                    <Text style={styles.methodCount}>{gemPurchasesCount} unlocks</Text>
                  </View>
                </View>
                <Text style={styles.methodRevenue}>+${gemPurchasesAud.toFixed(2)} AUD</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Top Performing Packs */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Performing Packs ({myPacks.length})</Text>
          </View>

          {myPacks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
              <Text style={styles.emptyTitle}>No sticker packs published yet</Text>
              <Text style={styles.emptySubtitle}>
                Publish your custom PNG/SVG illustrations to start earning 83.33% from every download.
              </Text>
              <Pressable
                onPress={() => router.push("/submit-pack")}
                style={styles.firstPackBtn}
              >
                <Text style={styles.firstPackBtnText}>Submit Your First Pack Now</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.packTable}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>PACK</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: "center" }]}>SALES</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: "center" }]}>BREAKDOWN</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: "right" }]}>EARNINGS</Text>
              </View>

              {/* Pack Rows */}
              {myPacks.map((pack, idx) => {
                const isCoverUrl = pack.icon?.startsWith("http");

                return (
                  <View key={pack.id} style={styles.packTableRow}>
                    <View style={[styles.packInfo, { flex: 2 }]}>
                      <View style={styles.rankPill}>
                        <Text style={styles.rankPillText}>#{idx + 1}</Text>
                      </View>

                      <View style={styles.packIconBox}>
                        {isCoverUrl ? (
                          <Image source={{ uri: pack.icon }} style={styles.tableCoverImg} />
                        ) : (
                          <Text style={{ fontSize: 24 }}>{pack.icon}</Text>
                        )}
                      </View>

                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.packTitleText} numberOfLines={1}>
                          {pack.title}
                        </Text>
                        <Text style={styles.packCategoryText}>
                          {pack.category} • ${pack.price_aud.toFixed(2)} AUD
                        </Text>
                      </View>
                    </View>

                    {/* Sales Units */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={styles.packUnitsText}>{pack.salesCount}</Text>
                      <Text style={styles.packUnitsSub}>units</Text>
                    </View>

                    {/* Cash vs Gems breakdown */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={styles.distributionText}>
                        💳 {pack.cashSalesCount} • 💎 {pack.gemSalesCount}
                      </Text>
                    </View>

                    {/* Net Creator Cut */}
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text style={styles.packEarnedText}>
                        ${pack.creatorCut.toFixed(2)}
                      </Text>
                      <Text style={styles.packEarnedSub}>83.33% Cut</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  content: { padding: 24, maxWidth: 1080, width: "100%", alignSelf: "center" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    cursor: "pointer",
  },
  backBtnText: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  titleBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageTitle: { fontSize: 24, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5 },
  liveBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  liveBadgeText: { color: "#166534", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  pageSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  submitNewBtn: {
    backgroundColor: "#FD0000",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(253, 0, 0, 0.25)",
  },
  submitNewBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  noticeIcon: { fontSize: 22 },
  noticeText: { fontSize: 13, color: "#374151", flex: 1, lineHeight: 18 },
  loaderBox: { padding: 48, alignItems: "center" },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 230,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
  },
  netEarningsCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  balanceCard: {
    borderColor: "#FD0000",
    backgroundColor: "#FFFDFD",
  },
  metricLabel: { fontSize: 11, fontWeight: "900", color: "#64748B", letterSpacing: 0.5, marginBottom: 8 },
  metricValue: { fontSize: 28, fontWeight: "900", color: "#0F172A", marginBottom: 4 },
  subPillRow: { marginTop: 4 },
  subPillText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { fontSize: 11, fontWeight: "900", color: "#FD0000", letterSpacing: 0.5 },
  readyBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readyBadgeText: { color: "#166534", fontSize: 9, fontWeight: "900" },
  balanceValue: { fontSize: 28, fontWeight: "900", color: "#FD0000", marginVertical: 4 },
  withdrawActionBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 8,
    cursor: "pointer",
  },
  withdrawActionBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  breakdownCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 28,
  },
  breakdownHeader: { marginBottom: 16 },
  breakdownTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  breakdownSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  breakdownItem: {
    flex: 1,
    minWidth: 260,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownItemTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  methodIcon: { fontSize: 26 },
  methodTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  methodCount: { fontSize: 11, color: "#64748B", marginTop: 1 },
  methodRevenue: { fontSize: 15, fontWeight: "900", color: "#15803D" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: "#0F172A", marginBottom: 6 },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 440,
    marginBottom: 20,
    lineHeight: 18,
  },
  firstPackBtn: {
    backgroundColor: "#FD0000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  firstPackBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  packTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  packTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  packInfo: { flexDirection: "row", alignItems: "center" },
  rankPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankPillText: { fontSize: 10, fontWeight: "900", color: "#475569" },
  packIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tableCoverImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  packTitleText: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  packCategoryText: { fontSize: 11, color: "#64748B", marginTop: 2, fontWeight: "600" },
  packUnitsText: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  packUnitsSub: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },
  distributionText: { fontSize: 12, fontWeight: "800", color: "#475569" },
  packEarnedText: { fontSize: 15, fontWeight: "900", color: "#15803D" },
  packEarnedSub: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },
});