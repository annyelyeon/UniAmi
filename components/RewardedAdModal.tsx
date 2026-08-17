import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type RewardedAdModalProps = {
  visible: boolean;
  onRewardEarned: (amount: number) => void | Promise<void>;
  onClose: () => void;
};

const VIDEO_SOURCE = "/videos/videoad005.mp4";
const VIDEO_SECONDS = 30;

export function RewardedAdModal({ visible, onRewardEarned, onClose }: RewardedAdModalProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(VIDEO_SECONDS);

  useEffect(() => {
    if (!visible) return;

    setIsCompleted(false);
    setSecondsRemaining(VIDEO_SECONDS);
  }, [visible]);

  useEffect(() => {
    if (!visible || isCompleted) return;

    const interval = setInterval(() => {
      setSecondsRemaining((remaining) => Math.max(0, remaining - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, visible]);

  const completeReward = () => {
    setIsCompleted(true);
    setSecondsRemaining(0);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.sponsoredBadge}>⭐ SPONSORED • 0.05¢ AUD</Text>
            <Text style={styles.timerText}>
              {isCompleted ? "Complete" : `00:${String(secondsRemaining).padStart(2, "0")}`}
            </Text>
          </View>

          <View style={styles.videoFrame}>
            {Platform.OS === "web" ? (
              <video
                autoPlay
                playsInline
                muted
                controls={false}
                src={VIDEO_SOURCE}
                onEnded={completeReward}
                style={styles.video as any}
              />
            ) : (
              <View style={styles.nativeVideoMessage}>
                <Text style={styles.nativeVideoTitle}>Sponsored video</Text>
                <Text style={styles.nativeVideoCopy}>Video rewards are available in the web player.</Text>
              </View>
            )}
          </View>

          <Text style={styles.rewardCopy}>Finish the video to unlock your sticker reward.</Text>

          <Pressable
            disabled={!isCompleted}
            onPress={() => {
              void onRewardEarned(10);
              onClose();
            }}
            style={[styles.claimButton, !isCompleted && styles.claimButtonDisabled]}
          >
            <Text style={[styles.claimButtonText, !isCompleted && styles.claimButtonTextDisabled]}>
              {isCompleted ? "🎉 Claim +10 💎 & Close" : "Watching Video..."}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(15,23,42,0.58)",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sponsoredBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  videoFrame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  nativeVideoMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  nativeVideoTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  nativeVideoCopy: {
    color: "#CBD5E1",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  rewardCopy: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },
  claimButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FD0000",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  claimButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  claimButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  claimButtonTextDisabled: {
    color: "#64748B",
  },
});