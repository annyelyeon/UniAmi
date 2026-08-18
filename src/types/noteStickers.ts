export interface NotePlacedSticker {
  id: string;          // e.g. "placed-1723948201-9823"
  stickerId: string;   // reference to the original sticker ID
  imageUrl: string;    // emoji string ("✨") or Supabase public image URL
  name?: string;       // optional friendly label (e.g. "Coffee Cat")
  x: number;           // X position in pixels on canvas
  y: number;           // Y position in pixels on canvas
  scale: number;       // scale factor (clamped between 0.5x and 2.0x)
  rotation: number;    // angle in degrees (clamped between -45° and +45°)
  zIndex: number;      // stacking layer order
}

// Local AsyncStorage representation of a note with its placed stickers
export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  placed_stickers: NotePlacedSticker[];
}


/**
 * Miuu Note Interaction & Sizing Constants
 */
export const STICKER_CANVAS_CONFIG = {
  DEFAULT_SIZE: 72,          // Base sticker bounding box width & height in px
  MIN_SCALE: 0.5,            // Minimum shrink (36px) — prevents losing tiny stickers
  MAX_SCALE: 2.0,            // Maximum expand (144px) — prevents cluttering text
  DEFAULT_SCALE: 1.0,        // Default initial scale
  MIN_ROTATION_DEG: -45,     // -45° cute tilt limit
  MAX_ROTATION_DEG: 45,      // +45° cute tilt limit
  DEFAULT_ROTATION_DEG: 0,   // Placed flat
} as const;

/**
 * Helper to clamp values safely within Miuu Note ranges
 */
export function clampStickerScale(scale: number): number {
  return Math.min(
    Math.max(scale, STICKER_CANVAS_CONFIG.MIN_SCALE),
    STICKER_CANVAS_CONFIG.MAX_SCALE
  );
}

export function clampStickerRotation(deg: number): number {
  return Math.min(
    Math.max(deg, STICKER_CANVAS_CONFIG.MIN_ROTATION_DEG),
    STICKER_CANVAS_CONFIG.MAX_ROTATION_DEG
  );
}

/**
 * Helper factory to create a new placed sticker instance
 */
export function createPlacedSticker(
  stickerId: string,
  imageUrl: string,
  spawnX: number = 80,
  spawnY: number = 120,
  currentHighestZIndex: number = 1,
  name?: string
): NotePlacedSticker {
  return {
    id: `placed-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    stickerId,
    imageUrl,
    name,
    x: spawnX,
    y: spawnY,
    scale: STICKER_CANVAS_CONFIG.DEFAULT_SCALE,
    rotation: STICKER_CANVAS_CONFIG.DEFAULT_ROTATION_DEG,
    zIndex: currentHighestZIndex + 1,
  };
}
