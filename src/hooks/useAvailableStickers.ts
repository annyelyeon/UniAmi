import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface AvailableStickerItem {
  id: string;
  packId: string;
  packTitle: string;
  name: string;
  imageUrl: string; // Emoji or custom image URL
}

export interface PackTabItem {
  id: string;
  title: string;
  coverIcon: string;
}

// Built-in starter sticker dictionary fallback
const STARTER_STICKERS: Record<string, { title: string; icon: string; items: { id: string; name: string; emoji: string }[] }> = {
  "campus-starter": {
    title: "Campus Starter Pack",
    icon: "🎓",
    items: [
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
  "exam-week": {
    title: "Exam Week Moods",
    icon: "☕",
    items: [
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
  "tech-code": {
    title: "Code & Bugs Pack",
    icon: "💻",
    items: [
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
  "cute-mascot": {
    title: "Cute Mascot Expressions",
    icon: "🦊",
    items: [
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
  "study-moods": {
    title: "Lo-Fi Study Moods",
    icon: "🎧",
    items: [
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
  "campus-art": {
    title: "Creative Arts Guild",
    icon: "🎨",
    items: [
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
};

export function useAvailableStickers() {
  const [availableStickers, setAvailableStickers] = useState<AvailableStickerItem[]>([]);
  const [packTabs, setPackTabs] = useState<PackTabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStickers = async () => {
    try {
      setIsLoading(true);

      // 1. Get owned IDs, created IDs, and local pack data
      const rawOwned = await AsyncStorage.getItem("@uni_ami_owned_packs");
      const rawCreated = await AsyncStorage.getItem("@uni_ami_created_packs");
      const rawLocalPacks = await AsyncStorage.getItem("@uni_ami_created_packs_data");

      const ownedIds: string[] = rawOwned ? JSON.parse(rawOwned) : ["campus-starter"];
      const createdIds: string[] = rawCreated ? JSON.parse(rawCreated) : [];
      const localPacks: any[] = rawLocalPacks ? JSON.parse(rawLocalPacks) : [];

      const activePackIds = Array.from(new Set([...ownedIds, ...createdIds, "campus-starter"]));

      const combinedStickers: AvailableStickerItem[] = [];
      const tabs: PackTabItem[] = [];

      // 2. Add Starter Packs
      for (const packId of activePackIds) {
        if (STARTER_STICKERS[packId]) {
          const pack = STARTER_STICKERS[packId];
          tabs.push({ id: packId, title: pack.title, coverIcon: pack.icon });
          pack.items.forEach((item) => {
            combinedStickers.push({
              id: item.id,
              packId,
              packTitle: pack.title,
              name: item.name,
              imageUrl: item.emoji,
            });
          });
        }
      }

      // 3. Add Local Student Created Packs
      for (const lp of localPacks) {
        if (activePackIds.includes(lp.id) && !tabs.some((t) => t.id === lp.id)) {
          tabs.push({
            id: lp.id,
            title: lp.title,
            coverIcon: lp.icon || "🎨",
          });

          const packStickers = lp.stickers || [];
          packStickers.forEach((s: any, idx: number) => {
            combinedStickers.push({
              id: s.id || `local-stk-${lp.id}-${idx}`,
              packId: lp.id,
              packTitle: lp.title,
              name: s.name || `Sticker ${idx + 1}`,
              imageUrl: s.image_url || s.imageUrl || s.emoji,
            });
          });
        }
      }

      // 4. Add Supabase Packs
      const { data: dbPacks } = await supabase
        .from("sticker_packs")
        .select("id, title, icon, sticker_items(id, name, image_url)")
        .in("id", activePackIds);

      if (dbPacks && dbPacks.length > 0) {
        dbPacks.forEach((p: any) => {
          if (!tabs.some((t) => t.id === p.id)) {
            tabs.push({
              id: p.id,
              title: p.title,
              coverIcon: p.icon || "🎨",
            });
          }
          if (Array.isArray(p.sticker_items)) {
            p.sticker_items.forEach((si: any) => {
              if (!combinedStickers.some((s) => s.id === si.id)) {
                combinedStickers.push({
                  id: si.id,
                  packId: p.id,
                  packTitle: p.title,
                  name: si.name,
                  imageUrl: si.image_url,
                });
              }
            });
          }
        });
      }

      setPackTabs(tabs);
      setAvailableStickers(combinedStickers);
    } catch (err) {
      console.warn("Error loading note stickers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStickers();
  }, []);

  return { availableStickers, packTabs, reloadStickers: loadStickers, isLoading };
}
