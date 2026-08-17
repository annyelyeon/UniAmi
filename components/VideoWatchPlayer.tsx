import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type VideoWatchPlayerProps = {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: (amount: number) => void | Promise<void>;
};

const REQUIRED_SECONDS = 6;
const VIDEO_SOURCE = "/videos/videoad005.mp4";

export function VideoWatchPlayer({ visible, onClose, onRewardEarned }: VideoWatchPlayerProps) {
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [hasWatchedEnough, setHasWatchedEnough] = useState(false);
  const completedRef = useRef(false);
  const claimedRef = useRef(false);
  const lastSecondRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    completedRef.current = false;
    claimedRef.current = false;
    lastSecondRef.current = 0;
    setSecondsWatched(0);
    setHasWatchedEnough(false);
  }, [visible]);

  const markComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setHasWatchedEnough(true);
    setSecondsWatched(REQUIRED_SECONDS);
  };

  const handleTimeUpdate = (event: any) => {
    const nextSecond = Math.min(REQUIRED_SECONDS, Math.floor(event.currentTarget.currentTime));
    if (nextSecond === lastSecondRef.current) return;

    lastSecondRef.current = nextSecond;
    setSecondsWatched(nextSecond);
    if (nextSecond >= REQUIRED_SECONDS) markComplete();
  };

  const handleClaim = () => {
    if (!hasWatchedEnough || claimedRef.current) return;

    claimedRef.current = true;
    void onRewardEarned(10);
    onClose();
  };

  if (!visible) return null;

  const secondsRemaining = Math.max(0, REQUIRED_SECONDS - secondsWatched);

  return (
    <View style={styles.overlay}>
      <View style={styles.playerWrapper}>
        <View style={styles.playerHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.playBadge}>
              <Text style={styles.playBadgeIcon}>▶</Text>
            </View>
            <View>
              <Text style={styles.videoTitle}>UniAmi Campus Feature Video</Text>
              <Text style={styles.videoSubtitle}>UniAmi Official</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.videoContainer}>
          {Platform.OS === "web" ? (
            <video
              src={VIDEO_SOURCE}
              autoPlay
              controls
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onEnded={markComplete}
              style={styles.video as any}
            />
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackText}>Video playback is available on the web player.</Text>
            </View>
          )}
        </View>

        <View style={styles.rewardBar}>
          <View style={styles.rewardInfo}>
            <Text style={styles.diamondIcon}>💎</Text>
            <View style={styles.rewardCopy}>
              <Text style={styles.rewardTitle}>{hasWatchedEnough ? "Reward Ready" : "Watch & Earn"}</Text>
              <Text style={styles.rewardSubtitle}>
                {hasWatchedEnough
                  ? "You unlocked 10 Diamonds."
                  : `Watch ${secondsRemaining}s more to claim +10 💎`}
              </Text>
            </View>
          </View>

          <Pressable
            disabled={!hasWatchedEnough}
            onPress={handleClaim}
            style={[styles.claimButton, hasWatchedEnough ? styles.claimButtonActive : styles.claimButtonDisabled]}
          >
            <Text style={styles.claimButtonText}>
              {hasWatchedEnough ? "🎉 Claim +10 💎" : `Watch (${secondsWatched}/${REQUIRED_SECONDS}s)`}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 999999,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  playerWrapper: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FD0000",
    alignItems: "center",
    justifyContent: "center",
  },
  playBadgeIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  videoTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  videoSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
  },
  videoContainer: {
    width: "100%",
    height: 320,
    backgroundColor: "#000000",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backgroundColor: "#000000",
  },
  fallbackBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fallbackText: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
  },
  rewardBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    gap: 12,
  },
  rewardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  diamondIcon: {
    fontSize: 22,
  },
  rewardCopy: {
    flex: 1,
  },
  rewardTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
  },
  rewardSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
  },
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  claimButtonActive: {
    backgroundColor: "#FD0000",
  },
  claimButtonDisabled: {
    backgroundColor: "#475569",
  },
  claimButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
