import { useLocalSearchParams } from "expo-router";

import { ScreenShell } from "../src/components/ScreenShell";

export default function StickerAdUnlockScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();

  return (
    <ScreenShell
      title="Ad unlock"
      subtitle={`Placeholder ad unlock screen for pack ${packId ?? "selected pack"}.`}
    />
  );
}