import * as Phaser from 'phaser';
import { Facility, FacilityConfig } from '../entities/Facility';
import { FacilityType, GuestOutfit } from '../utils/Enums';
import { C, GYM_CENTER_X, GYM_CENTER_Y, GYM_W, GYM_H } from '../utils/Constants';

let gymCount = 0;

export function createGymConfig(overrides: Partial<FacilityConfig> = {}): FacilityConfig {
  gymCount++;
  return {
    id: `gym_${gymCount}`,
    name: 'Basic Gym',
    type: FacilityType.GYM,
    costToBuild: 150,
    revenuePerUse: 15,
    processingTimeMs: 5500,
    x: GYM_CENTER_X,
    y: GYM_CENTER_Y,
    width: GYM_W,
    height: GYM_H,
    outfit: GuestOutfit.GYM,
    ...overrides,
  };
}

export class GymFacility extends Facility {
  protected drawEnvironment(scene: Phaser.Scene): void {
    const lx = this.x - this.width  / 2;
    const ty = this.y - this.height / 2;
    const w  = this.width;
    const h  = this.height;

    const g = scene.add.graphics();
    g.setDepth(1);

    // ── Outer walls ──────────────────────────────────────────────────────────
    g.fillStyle(C.GYM_WALL);
    g.fillRect(lx - 8, ty - 8, w + 16, h + 16);

    // ── Rubber floor base ────────────────────────────────────────────────────
    g.fillStyle(C.GYM_FLOOR);
    g.fillRect(lx, ty, w, h);

    // Rubber tile grid
    const ts = 28;
    for (let tx2 = lx; tx2 < lx + w; tx2 += ts) {
      for (let ty2 = ty; ty2 < ty + h; ty2 += ts) {
        g.fillStyle(C.GYM_FLOOR_TILE, 0.5);
        g.fillRect(tx2 + 1, ty2 + 1, ts - 2, ts - 2);
      }
    }

    // Wall accent stripe (top)
    g.fillStyle(C.GYM_WALL_LIGHT);
    g.fillRect(lx, ty, w, 14);
    g.fillRect(lx, ty + h - 14, w, 14);

    // ── Treadmills (left wall area) ──────────────────────────────────────────
    const treadPositions = [
      { x: lx + 55,  y: ty + 90  },
      { x: lx + 55,  y: ty + 210 },
    ];
    for (const tp of treadPositions) {
      this.drawTreadmill(g, tp.x, tp.y);
    }

    // ── Bench press stations ─────────────────────────────────────────────────
    const benchPositions = [
      { x: lx + 210, y: ty + 110 },
      { x: lx + 210, y: ty + 270 },
    ];
    for (const bp of benchPositions) {
      this.drawBenchPress(g, bp.x, bp.y);
    }

    // ── Dumbbell rack ────────────────────────────────────────────────────────
    this.drawDumbbellRack(g, lx + 380, ty + 80);

    // ── Water cooler ─────────────────────────────────────────────────────────
    this.drawWaterCooler(g, lx + w - 40, ty + h - 60);

    // ── Facility name label ──────────────────────────────────────────────────
    scene.add.text(this.x, ty + 6, '⚡ BASIC GYM', {
      fontSize: '11px', fontFamily: 'Arial Black, sans-serif',
      color: '#aabbff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(3);
  }

  private drawTreadmill(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Frame
    g.fillStyle(C.TREAD_FRAME);
    g.fillRect(cx - 28, cy - 50, 56, 80);
    // Belt
    g.fillStyle(C.TREAD_BELT);
    g.fillRect(cx - 22, cy - 40, 44, 55);
    // Belt lines (conveyor)
    g.fillStyle(0x444444);
    for (let i = 0; i < 5; i++) {
      g.fillRect(cx - 22, cy - 40 + i * 12, 44, 3);
    }
    // Screen
    g.fillStyle(C.TREAD_SCREEN);
    g.fillRect(cx - 14, cy - 62, 28, 16);
    // Handlebar uprights
    g.fillStyle(C.CHROME);
    g.fillRect(cx - 18, cy - 76, 4, 28);
    g.fillRect(cx + 14, cy - 76, 4, 28);
    // Handlebar
    g.fillRect(cx - 18, cy - 76, 36, 5);
    // Base foot
    g.fillStyle(C.RUBBER_DARK);
    g.fillRect(cx - 32, cy + 30, 64, 8);
  }

  private drawBenchPress(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Uprights
    g.fillStyle(C.STEEL);
    g.fillRect(cx - 48, cy - 50, 6, 70);
    g.fillRect(cx + 42, cy - 50, 6, 70);
    // Weight bar
    g.fillStyle(C.CHROME);
    g.fillRect(cx - 55, cy - 46, 110, 5);
    // Plates (left side)
    g.fillStyle(C.WEIGHT_RED);
    g.fillRect(cx - 55, cy - 55, 10, 24);
    g.fillRect(cx - 44, cy - 52, 8, 18);
    // Plates (right side)
    g.fillRect(cx + 45, cy - 55, 10, 24);
    g.fillRect(cx + 37, cy - 52, 8, 18);
    // Bench body (frame)
    g.fillStyle(C.BENCH_WOOD);
    g.fillRect(cx - 40, cy - 14, 80, 14);
    g.fillRect(cx - 40, cy,      80,  8);
    // Bench pad
    g.fillStyle(C.BENCH_PAD);
    g.fillRect(cx - 36, cy - 22, 72, 14);
    // Legs
    g.fillStyle(C.STEEL);
    g.fillRect(cx - 36, cy + 8,  5, 20);
    g.fillRect(cx + 31, cy + 8,  5, 20);
    // Foot braces
    g.fillRect(cx - 40, cy + 26, 80, 5);
  }

  private drawDumbbellRack(g: Phaser.GameObjects.Graphics, lx: number, ty: number): void {
    const rackW = 80;
    const rackH = 200;

    // Shelf back panel
    g.fillStyle(C.BENCH_WOOD);
    g.fillRect(lx, ty, rackW, rackH);
    // Shelf surface highlights
    g.fillStyle(C.BENCH_WOOD + 0x111111);
    for (let i = 1; i < 4; i++) {
      g.fillRect(lx, ty + i * 48 - 4, rackW, 5);
    }

    // Draw dumbbell pairs (3 rows, sizes increasing)
    const sizes = [6, 8, 10];
    const colors = [C.WEIGHT_BLUE, C.WEIGHT_RED, C.WEIGHT_DARK];
    for (let row = 0; row < 3; row++) {
      const dy = ty + 20 + row * 60;
      const sz = sizes[row] ?? 8;
      const col = colors[row] ?? C.WEIGHT_DARK;
      // Left dumbbell
      g.fillStyle(col);
      g.fillCircle(lx + 14, dy, sz);
      g.fillRect(lx + 14 - sz, dy - 3, sz * 2 + 14, 6);
      g.fillCircle(lx + 14 + sz + 14, dy, sz);
      // Right dumbbell (smaller gap from right)
      g.fillCircle(lx + rackW - 14, dy, sz - 1);
      g.fillRect(lx + rackW - 14 - (sz - 1), dy - 3, (sz - 1) * 2 + 12, 6);
      g.fillCircle(lx + rackW - 14 + (sz - 1) + 12, dy, sz - 1);
    }

    // Frame rails
    g.fillStyle(C.STEEL);
    g.fillRect(lx - 4, ty, 6, rackH);
    g.fillRect(lx + rackW - 2, ty, 6, rackH);
    g.fillRect(lx - 4, ty + rackH, rackW + 8, 6);
  }

  private drawWaterCooler(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Body
    g.fillStyle(0xeceff1);
    g.fillRect(cx - 12, cy - 30, 24, 34);
    // Water bottle
    g.fillStyle(0xb3e5fc);
    g.fillCircle(cx, cy - 38, 12);
    g.fillRect(cx - 8, cy - 48, 16, 20);
    // Spigot
    g.fillStyle(0x78909c);
    g.fillRect(cx - 4, cy - 8, 8, 5);
    g.fillRect(cx - 2, cy - 3, 4, 6);
    // Base
    g.fillStyle(0x90a4ae);
    g.fillRect(cx - 14, cy + 4, 28, 6);
  }

  protected defineSlots(): void {
    const lx = this.x - this.width  / 2;
    const ty = this.y - this.height / 2;

    this.slots = [
      { id: 'treadmill_0', x: lx + 55,  y: ty + 50,  occupied: false },
      { id: 'treadmill_1', x: lx + 55,  y: ty + 170, occupied: false },
      { id: 'bench_0',     x: lx + 210, y: ty + 100, occupied: false },
      { id: 'bench_1',     x: lx + 210, y: ty + 260, occupied: false },
    ];
  }
}
