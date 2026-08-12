import { useLocalSearchParams } from "expo-router";

import { ScreenShell } from "../../../src/components/ScreenShell";

export default function BoardDetailScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();

  return (
    <ScreenShell
      title="Board"
      subtitle={`Placeholder board detail screen for ${boardId ?? "selected board"}.`}
    />
  );
}