export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;
export const WORLD_WIDTH  = 2560;
export const WORLD_HEIGHT = 1440;
export const TILE_SIZE = 32;

export const GUEST_SPEED_NORMAL = 85;
export const GUEST_SPEED_TIRED  = 50;
export const GUEST_SPAWN_INTERVAL_MS = 3200;
export const MAX_GUESTS = 14;

export const STARTING_MONEY      = 12450;
export const STARTING_REPUTATION = 3;

// ─── World geometry ──────────────────────────────────────────────────────────
export const WORLD_CENTER_X = WORLD_WIDTH  / 2;   // 1280
export const WORLD_CENTER_Y = WORLD_HEIGHT / 2;   // 720

export const PATH_Y       = WORLD_CENTER_Y;        // horizontal main path y
export const PATH_HEIGHT  = 80;

export const GYM_CENTER_X = WORLD_CENTER_X - 380;
export const GYM_CENTER_Y = WORLD_CENTER_Y;
export const GYM_W = 440;
export const GYM_H = 380;

export const POOL_CENTER_X = WORLD_CENTER_X + 380;
export const POOL_CENTER_Y = WORLD_CENTER_Y;
export const POOL_W = 500;
export const POOL_H = 380;

// ─── Colour palette ───────────────────────────────────────────────────────────
export const C = {
  // Environment
  GRASS:            0x4a9e5c,
  GRASS_DARK:       0x3a8049,
  PATH:             0xd6cab0,
  PATH_DARK:        0xbdad90,
  BUSH:             0x2e8b30,
  BUSH_DARK:        0x1f6622,

  // Gym
  GYM_FLOOR:        0x1c1c2e,
  GYM_FLOOR_TILE:   0x222236,
  GYM_WALL:         0x35355c,
  GYM_WALL_LIGHT:   0x45458a,
  STEEL:            0x607d8b,
  CHROME:           0x9bb0bb,
  RUBBER_DARK:      0x1a1a1a,
  RUBBER_MID:       0x282828,
  BENCH_WOOD:       0x6d4c41,
  BENCH_PAD:        0x4a148c,
  WEIGHT_DARK:      0x1e1e1e,
  WEIGHT_RED:       0xb71c1c,
  WEIGHT_BLUE:      0x0d47a1,
  TREAD_FRAME:      0x2c2c2c,
  TREAD_BELT:       0x3d3d3d,
  TREAD_SCREEN:     0x1a73e8,

  // Pool
  POOL_SURROUND:    0xfafafa,
  POOL_TILE_LINE:   0xdddddd,
  POOL_WATER_TOP:   0x26c6da,
  POOL_WATER_MID:   0x00acc1,
  POOL_WATER_DEEP:  0x00838f,
  POOL_LANE:        0xffffff,
  LADDER_RAIL:      0xbdbdbd,
  LADDER_STEP:      0xe0e0e0,
  LIFEGUARD_WOOD:   0x8d6e63,
  LIFEGUARD_SEAT:   0xd32f2f,

  // Characters
  SKIN_A:   0xffcc99,
  SKIN_B:   0xd4a574,
  SKIN_C:   0x8d5524,
  HAIR_BLK: 0x2c1810,
  HAIR_BRN: 0x6d4c41,
  HAIR_BLD: 0xf9a825,
  HAIR_RED: 0xc62828,

  // Outfits (gym)
  SHIRT_BLUE:   0x1565c0,
  SHIRT_RED:    0xc62828,
  SHIRT_GREEN:  0x2e7d32,
  SHIRT_PURPLE: 0x6a1b9a,
  SHORTS_DARK:  0x212121,
  SHORTS_GREY:  0x455a64,

  // Outfits (swim)
  SWIM_BLUE:    0x0d47a1,
  SWIM_PINK:    0xad1457,
  SWIM_TEAL:    0x006064,

  // Mood
  MOOD_HAPPY:   0x66bb6a,
  MOOD_NEUTRAL: 0xffa726,
  MOOD_SAD:     0xef5350,
} as const;

export const SKIN_TONES  = [C.SKIN_A, C.SKIN_B, C.SKIN_C] as const;
export const HAIR_COLORS = [C.HAIR_BLK, C.HAIR_BRN, C.HAIR_BLD, C.HAIR_RED] as const;

export const OUTFIT_PALETTES = [
  { shirt: C.SHIRT_BLUE,   shorts: C.SHORTS_DARK },
  { shirt: C.SHIRT_RED,    shorts: C.SHORTS_GREY },
  { shirt: C.SHIRT_GREEN,  shorts: C.SHORTS_DARK },
  { shirt: C.SHIRT_PURPLE, shorts: C.SHORTS_GREY },
] as const;
