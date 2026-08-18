import React, { useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NotePlacedSticker } from "../src/types/noteStickers";

interface Props {
  sticker: NotePlacedSticker;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: NotePlacedSticker) => void;
  onDelete: (id: string) => void;
}

const BASE_SIZE = 110; // Comfortable base dimensions for artwork details
const MIN_SCALE = 0.6; // ~66px minimum
const MAX_SCALE = 3.0; // ~330px maximum expanded detail view
const MIN_ROTATION = -45;
const MAX_ROTATION = 45;

export const DraggableNoteSticker: React.FC<Props> = ({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [pos, setPos] = useState({ x: sticker.x, y: sticker.y });
  const [scale, setScale] = useState(sticker.scale || 1.2);
  const [rotation, setRotation] = useState(sticker.rotation || 0);

  // Position drag gesture (Body Pan)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
      },
      onPanResponderMove: (_, gesture) => {
        setPos((prev) => ({
          x: sticker.x + gesture.dx,
          y: sticker.y + gesture.dy,
        }));
      },
      onPanResponderRelease: (_, gesture) => {
        const nextX = sticker.x + gesture.dx;
        const nextY = sticker.y + gesture.dy;
        setPos({ x: nextX, y: nextY });
        onUpdate({
          ...sticker,
          x: nextX,
          y: nextY,
          scale,
          rotation,
        });
      },
    })
  ).current;

  // Bottom-Right Corner Resize Handle Drag Gesture
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        // Dragging diagonally expands/shrinks scale
        const delta = (gesture.dx + gesture.dy) / 120;
        const newScale = Math.min(Math.max((sticker.scale || 1.2) + delta, MIN_SCALE), MAX_SCALE);
        setScale(newScale);

        // Subtle tilt angle feedback
        const newRotation = Math.min(Math.max((sticker.rotation || 0) + gesture.dx / 4, MIN_ROTATION), MAX_ROTATION);
        setRotation(newRotation);
      },
      onPanResponderRelease: () => {
        onUpdate({
          ...sticker,
          x: pos.x,
          y: pos.y,
          scale,
          rotation,
        });
      },
    })
  ).current;

  const currentSize = BASE_SIZE * scale;
  const isImage = sticker.imageUrl?.startsWith("http");

  return (
    <View
      style={[
        styles.wrapper,
        {
          left: pos.x,
          top: pos.y,
          width: currentSize,
          height: currentSize,
          zIndex: isSelected ? 999 : sticker.zIndex || 10,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Visual Bounding Box when Selected */}
      <View
        style={[
          styles.innerBox,
          isSelected && styles.selectedBorder,
        ]}
      >
        {isImage ? (
          <Image
            source={{ uri: sticker.imageUrl }}
            style={styles.stickerImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.stickerEmoji, { fontSize: currentSize * 0.7 }]}>
            {sticker.imageUrl}
          </Text>
        )}

        {/* Delete Handle (Top-Right) */}
        {isSelected && (
          <Pressable
            onPress={() => onDelete(sticker.id)}
            style={styles.deleteHandle}
          >
            <Text style={styles.handleText}>✕</Text>
          </Pressable>
        )}

        {/* Miuu Note Resize & Scale Corner Handle (Bottom-Right) */}
        {isSelected && (
          <View
            style={styles.resizeHandle}
            {...resizeResponder.panHandlers}
          >
            <Text style={styles.resizeIcon}>⤡</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    cursor: "grab",
    userSelect: "none",
  },
  innerBox: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  selectedBorder: {
    borderWidth: 1.5,
    borderColor: "#4F46E5",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "rgba(238, 242, 255, 0.2)",
  },
  stickerImage: {
    width: "100%",
    height: "100%",
  },
  stickerEmoji: {
    textAlign: "center",
  },
  deleteHandle: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    cursor: "pointer",
    zIndex: 1000,
  },
  handleText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "900",
  },
  resizeHandle: {
    position: "absolute",
    bottom: -10,
    right: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 5px rgba(79, 70, 229, 0.3)",
    cursor: "nwse-resize",
    zIndex: 1000,
  },
  resizeIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
