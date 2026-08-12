import { useLocalSearchParams } from "expo-router";

import { ScreenShell } from "../src/components/ScreenShell";

export default function StickerCheckoutScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();

  return (
    <ScreenShell
      title="Sticker checkout"
      subtitle={`Placeholder checkout screen for pack ${packId ?? "selected pack"}.`}
    />
  );
}