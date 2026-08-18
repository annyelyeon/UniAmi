import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../src/lib/supabase";

const CATEGORIES = [
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

const PACK_ICONS = ["🎨", "💡", "☕", "🦊", "🎧", "🚀", "🌸", "🍕", "💻", "🔥"];

interface StickerDraft {
  id: string;
  name: string;
  image_url: string;
  isCustomImage?: boolean;
}

export default function SubmitPackScreen() {
  const router = useRouter();

  // 1. Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Aesthetic / Lo-Fi");
  const [selectedIcon, setSelectedIcon] = useState("🎨");
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);

  // 2. Pricing State ($1.00 - $3.00 AUD)
  const [priceAud, setPriceAud] = useState<number>(1.2);

  // 3. Asset Upload State
  const [stickers, setStickers] = useState<StickerDraft[]>([]);
  const [newStickerName, setNewStickerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-calculated Student Cut (83.33%) & Platform Fee (16.67%)
  const studentPayout = (priceAud * 0.8333).toFixed(2);
  const platformCut = (priceAud - Number(studentPayout)).toFixed(2);
  const gemsEquivalent = Math.round(priceAud * 200);

  // Helper for binary upload
  const decodeBase64 = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  // Cover Image Picker
  const handlePickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `cover_${Date.now()}.png`;
        let publicUrl = asset.uri;

        if (asset.base64) {
          const { error: uploadError } = await supabase.storage
            .from("sticker-uploads")
            .upload(fileName, decodeBase64(asset.base64), {
              contentType: "image/png",
            });

          if (!uploadError) {
            const { data } = supabase.storage
              .from("sticker-uploads")
              .getPublicUrl(fileName);
            publicUrl = data.publicUrl;
          }
        }

        setCustomCoverUrl(publicUrl);
      }
    } catch (err) {
      console.warn("Cover upload error:", err);
    }
  };

  // Sticker Asset Image Upload
  const handlePickCustomSticker = async () => {
    try {
      if (stickers.length >= 20) {
        setErrorMsg("Maximum 20 stickers allowed per pack.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `sticker_${Date.now()}.png`;
        let publicUrl = asset.uri;

        if (asset.base64) {
          const { error: uploadError } = await supabase.storage
            .from("sticker-uploads")
            .upload(fileName, decodeBase64(asset.base64), {
              contentType: "image/png",
            });

          if (!uploadError) {
            const { data } = supabase.storage
              .from("sticker-uploads")
              .getPublicUrl(fileName);
            publicUrl = data.publicUrl;
          }
        }

        setStickers([
          ...stickers,
          {
            id: Date.now().toString(),
            name: newStickerName.trim() || `Sticker ${stickers.length + 1}`,
            image_url: publicUrl,
            isCustomImage: true,
          },
        ]);
        setNewStickerName("");
        setErrorMsg(null);
      }
    } catch (err) {
      console.warn("Custom sticker upload error:", err);
      setErrorMsg("Failed to upload image file.");
    }
  };

  const handleRemoveSticker = (id: string) => {
    setStickers(stickers.filter((s) => s.id !== id));
  };

  // Publish Action
  const handlePublishPack = async () => {
    if (!title.trim()) {
      setErrorMsg("Please enter a Title for your sticker pack.");
      return;
    }
    if (stickers.length < 3) {
      setErrorMsg("Please add at least 3 custom stickers to your pack.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Retrieve registered student nickname
      let creatorName = "Student Creator";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();

        creatorName =
          profile?.nickname ||
          user.user_metadata?.nickname ||
          user.user_metadata?.full_name ||
          (user.email?.split("@")[0] ? user.email.split("@")[0].split(".")[0] : "Student Creator");
      }

      const packId = `pack-${Date.now()}`;
      const coverIcon = customCoverUrl || selectedIcon;

      // 1. Insert into sticker_packs table
      const { error: packErr } = await supabase.from("sticker_packs").insert({
        id: packId,
        creator_id: user?.id || null,
        creator_name: creatorName,
        title: title.trim(),
        category,
        description: description.trim() || "Student created sticker pack.",
        icon: coverIcon,
        price_aud: priceAud,
        gems_price: gemsEquivalent,
        status: "approved",
      });

      if (packErr) console.error("Pack insert notice:", packErr);

      // 2. Insert items into sticker_items table
      const itemsPayload = stickers.map((s) => ({
        pack_id: packId,
        image_url: s.image_url,
        name: s.name,
      }));

      const { error: itemsErr } = await supabase
        .from("sticker_items")
        .insert(itemsPayload);
      if (itemsErr) console.error("Items insert notice:", itemsErr);

      // 3. Save full pack object & ID to local storage
      const newPackData = {
        id: packId,
        creator_id: user?.id || "student-creator",
        creator_name: creatorName,
        title: title.trim(),
        category,
        description: description.trim() || "Student created sticker pack.",
        icon: coverIcon,
        price_aud: priceAud,
        gems_price: gemsEquivalent,
        status: "approved",
        stickers: stickers.map((s) => ({
          id: s.id,
          name: s.name,
          image_url: s.image_url,
        })),
      };

      // Save ID list
      const savedCreated = await AsyncStorage.getItem("@uni_ami_created_packs");
      const createdPacks: string[] = savedCreated ? JSON.parse(savedCreated) : [];
      if (!createdPacks.includes(packId)) createdPacks.push(packId);
      await AsyncStorage.setItem("@uni_ami_created_packs", JSON.stringify(createdPacks));

      // Save Full Objects list
      const savedFull = await AsyncStorage.getItem("@uni_ami_created_packs_data");
      const fullList = savedFull ? JSON.parse(savedFull) : [];
      fullList.unshift(newPackData);
      await AsyncStorage.setItem("@uni_ami_created_packs_data", JSON.stringify(fullList));

      // 4. Auto-unlock pack for the creator
      const savedOwned = await AsyncStorage.getItem("@uni_ami_owned_packs");
      const owned = savedOwned ? JSON.parse(savedOwned) : ["campus-starter"];
      if (!owned.includes(packId)) {
        owned.push(packId);
        await AsyncStorage.setItem("@uni_ami_owned_packs", JSON.stringify(owned));
      }

      setIsSubmitting(false);
      router.replace("/creator-studio");
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMsg("Failed to publish sticker pack.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/creator-studio")}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.title}>Submit Sticker Pack</Text>
            <View style={styles.creatorPill}>
              <Text style={styles.creatorPillText}>CREATOR STUDIO</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Publish your custom illustrations to the student marketplace and earn revenue from every download.
          </Text>
        </View>
      </View>

      {/* Main Form Container */}
      <View style={styles.formCard}>
        {/* Section 1: Cover Selection */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionNumber}>01</Text>
            <Text style={styles.sectionHeading}>PACK COVER ICON / ARTWORK</Text>
          </View>

          <View style={styles.coverRow}>
            <Pressable
              onPress={handlePickCover}
              style={[styles.customCoverBox, customCoverUrl && styles.customCoverBoxActive]}
            >
              {customCoverUrl ? (
                <Image source={{ uri: customCoverUrl }} style={styles.coverImgPreview} />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 20 }}>📁</Text>
                  <Text style={styles.uploadCoverText}>Upload Art</Text>
                </View>
              )}
            </Pressable>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PACK_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => {
                    setSelectedIcon(icon);
                    setCustomCoverUrl(null);
                  }}
                  style={[
                    styles.iconChoice,
                    !customCoverUrl && selectedIcon === icon && styles.iconChoiceActive,
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{icon}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          {customCoverUrl && (
            <Pressable onPress={() => setCustomCoverUrl(null)} style={styles.resetCoverBtn}>
              <Text style={styles.resetCoverText}>✕ Remove custom artwork and use icon</Text>
            </Pressable>
          )}
        </View>

        {/* Section 2: Pack Details */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionNumber}>02</Text>
            <Text style={styles.sectionHeading}>PACK DETAILS</Text>
          </View>

          <Text style={styles.inputLabel}>PACK TITLE *</Text>
          <TextInput
            placeholder="e.g. Lo-Fi Study Essentials, Midterm Survival"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            style={styles.textInput}
          />

          <Text style={styles.inputLabel}>CATEGORY *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.catPill, category === cat && styles.catPillActive]}
              >
                <Text
                  style={[
                    styles.catPillText,
                    category === cat && styles.catPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            placeholder="Tell students about the theme, vibe, or style of your stickers..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* Section 3: Pricing & Revenue Breakdown */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionNumber}>03</Text>
            <Text style={styles.sectionHeading}>SET PRICE & EARNINGS</Text>
          </View>

          <View style={styles.priceRow}>
            {[1.0, 1.2, 1.5, 2.0, 3.0].map((price) => (
              <Pressable
                key={price}
                onPress={() => setPriceAud(price)}
                style={[
                  styles.pricePill,
                  priceAud === price && styles.pricePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.pricePillText,
                    priceAud === price && styles.pricePillTextActive,
                  ]}
                >
                  ${price.toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.calcBox}>
            <View style={styles.calcHeader}>
              <Text style={styles.calcHeading}>Guaranteed Creator Earnings (83.33% Cut)</Text>
              <View style={styles.cutPill}>
                <Text style={styles.cutPillText}>83.33% YOU KEEP</Text>
              </View>
            </View>

            <View style={styles.calcDivider} />

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Payout (Direct Cash / Apple Pay):</Text>
              <Text style={styles.calcValueGreen}>+ ${studentPayout} AUD / download</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Payout (Ad-Funded Diamond Gems):</Text>
              <Text style={styles.calcValueGreen}>+ ${studentPayout} AUD / unlock</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Marketplace Diamond Gems Cost:</Text>
              <Text style={styles.calcValuePurple}>💎 {gemsEquivalent} Gems</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Platform & Ad-Ops Fee (16.67%):</Text>
              <Text style={styles.calcValueMuted}>${platformCut} AUD</Text>
            </View>

            <View style={styles.adNoticeBox}>
              <Text style={styles.adNoticeText}>
                ✨ <Text style={{ fontWeight: "800", color: "#166534" }}>Universal Payout Guarantee:</Text> When students watch ads to earn Diamond Gems and unlock your pack for free, your account still receives the full <Text style={{ fontWeight: "900", color: "#15803D" }}>+${studentPayout} AUD</Text> payout funded by ad revenue.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Sticker Asset Uploads */}
        <View style={[styles.sectionBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={styles.stickersHeader}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionNumber}>04</Text>
              <Text style={styles.sectionHeading}>PACK STICKERS ({stickers.length}/20)</Text>
            </View>
            <View style={[styles.countBadge, stickers.length >= 3 ? styles.countBadgeValid : styles.countBadgePending]}>
              <Text style={[styles.countBadgeText, stickers.length >= 3 ? styles.countBadgeTextValid : styles.countBadgeTextPending]}>
                {stickers.length >= 3 ? "✓ Minimum Met" : `Need ${3 - stickers.length} more`}
              </Text>
            </View>
          </View>

          {stickers.length === 0 ? (
            <View style={styles.emptyStickerBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🎨</Text>
              <Text style={styles.emptyStickerTitle}>No custom stickers added yet</Text>
              <Text style={styles.emptyStickerSub}>
                Upload high-contrast transparent PNG illustrations created on Procreate, ibisPaint, or Canva.
              </Text>
            </View>
          ) : (
            <View style={styles.stickersGrid}>
              {stickers.map((s) => (
                <View key={s.id} style={styles.stickerThumb}>
                  <Image source={{ uri: s.image_url }} style={styles.customStickerImg} />
                  <Text style={styles.stickerThumbName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveSticker(s.id)}
                    style={styles.deleteStickerBtn}
                  >
                    <Text style={styles.deleteStickerText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Upload Input Card */}
          <View style={styles.addStickerBox}>
            <Text style={styles.inputLabel}>STICKER LABEL</Text>
            <TextInput
              placeholder="e.g. Matcha Chill, Triple Espresso"
              placeholderTextColor="#94A3B8"
              value={newStickerName}
              onChangeText={setNewStickerName}
              style={[styles.textInput, { marginBottom: 12 }]}
            />

            <Pressable onPress={handlePickCustomSticker} style={styles.uploadImageBtn}>
              <Text style={styles.uploadImageBtnText}>📁 Upload Sticker File (PNG / WebP)</Text>
            </Pressable>
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handlePublishPack}
          disabled={isSubmitting || stickers.length < 3}
          style={[
            styles.submitBtn,
            (isSubmitting || stickers.length < 3) && { opacity: 0.6 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {stickers.length < 3
                ? `Add ${3 - stickers.length} More Stickers to Publish`
                : "Publish Sticker Pack & Start Earning 🚀"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 14,
  },
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
    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerTitleGroup: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  creatorPill: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creatorPillText: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.05)",
  },
  sectionBlock: {
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FD0000",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  coverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customCoverBox: {
    width: 88,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    cursor: "pointer",
  },
  customCoverBoxActive: {
    borderStyle: "solid",
    borderColor: "#FD0000",
    backgroundColor: "#FFFFFF",
  },
  coverImgPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadCoverText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4F46E5",
    marginTop: 2,
  },
  resetCoverBtn: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  resetCoverText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "700",
  },
  iconChoice: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    cursor: "pointer",
  },
  iconChoiceActive: {
    borderColor: "#FD0000",
    backgroundColor: "#FFF5F5",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    cursor: "pointer",
  },
  catPillActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  catPillTextActive: {
    color: "#FFFFFF",
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pricePill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    cursor: "pointer",
  },
  pricePillActive: {
    backgroundColor: "#FD0000",
    borderColor: "#FD0000",
    boxShadow: "0 4px 10px rgba(253, 0, 0, 0.25)",
  },
  pricePillText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  pricePillTextActive: {
    color: "#FFFFFF",
  },
  calcBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 18,
    padding: 18,
  },
  calcHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calcHeading: {
    fontSize: 13,
    fontWeight: "900",
    color: "#166534",
  },
  cutPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  cutPillText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "900",
  },
  calcDivider: {
    height: 1,
    backgroundColor: "#DCFCE7",
    marginVertical: 10,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  calcValueGreen: {
    fontSize: 14,
    fontWeight: "900",
    color: "#15803D",
  },
  calcValueMuted: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  calcValuePurple: {
    fontSize: 12,
    fontWeight: "900",
    color: "#4F46E5",
  },
  stickersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  countBadgeValid: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  countBadgePending: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  countBadgeTextValid: {
    color: "#166534",
  },
  countBadgeTextPending: {
    color: "#B45309",
  },
  emptyStickerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStickerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  emptyStickerSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 400,
  },
  stickersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  stickerThumb: {
    width: 82,
    height: 86,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 6,
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  customStickerImg: {
    width: 42,
    height: 42,
    resizeMode: "contain",
  },
  stickerThumbName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
    marginTop: 4,
  },
  deleteStickerBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteStickerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#DC2626",
  },
  addStickerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    marginBottom: 20,
  },
  uploadImageBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
  },
  uploadImageBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  submitBtn: {
    backgroundColor: "#FD0000",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(253, 0, 0, 0.25)",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  adNoticeBox: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  adNoticeText: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 16,
  },
});