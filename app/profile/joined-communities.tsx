import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "../../src/components/ScreenShell";
import { supabase } from "../../src/lib/supabase";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";
import { router } from "expo-router";

export default function JoinedCommunitiesScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("community_memberships")
        .select("community_id( id, name, type, member_count )")
        .eq("user_id", profile.id);

      if (error) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((row: any) => row.community_id);
      setCommunities(mapped);
      setLoading(false);
    };

    void load();
  }, [profile?.id]);

  return (
    <ScreenShell title="Clubs & Groups" subtitle="Communities you're a member of.">
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : communities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>You're not a member of any clubs or groups yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {communities.map((c) => (
            <Pressable key={c.id} style={styles.row} onPress={() => router.push(`/community/board/${c.id}`)}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name="people-outline" size={18} color={colors.accent} />
                </View>
                <View>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.meta}>{c.type} • { (c.member_count ?? 0).toLocaleString() } members</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    paddingVertical: 28,
  },
  loadingText: { color: colors.muted, fontSize: 14 },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  emptyStateText: { color: colors.muted, fontSize: 14, textAlign: "center" },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft },
  name: { color: colors.text, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12 },
});
