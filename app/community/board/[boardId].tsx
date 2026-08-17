import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenShell } from "../../../src/components/ScreenShell";
import CommunityPosts from "../../../src/components/CommunityPosts";
import { supabase } from "../../../src/lib/supabase";
import { Text } from "react-native";

export default function BoardDetailScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const [communityName, setCommunityName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!boardId) return;
      const { data } = await supabase.from("communities").select("name").eq("id", boardId).limit(1).maybeSingle();
      setCommunityName((data as any)?.name ?? null);
    };

    void load();
  }, [boardId]);

  return (
    <ScreenShell title={communityName ?? "Board"} subtitle={communityName ? `Posts for ${communityName}` : undefined}>
      {boardId ? <CommunityPosts communityId={boardId} /> : <Text>Loading...</Text>}
    </ScreenShell>
  );
}