import * as Phaser from 'phaser';
import { Facility, FacilityConfig } from '../entities/Facility';
import { FacilityType, GuestOutfit } from '../utils/Enums';
import { C, POOL_CENTER_X, POOL_CENTER_Y, POOL_W, POOL_H } from '../utils/Constants';

let poolCount = 0;

export function createPoolConfig(overrides: Partial<FacilityConfig> = {}): FacilityConfig {
  poolCount++;
  return {
    id: `pool_${poolCount}`,
    name: 'Swimming Pool',
    type: FacilityType.POOL,
    costToBuild: 300,
    revenuePerUse: 25,
    processingTimeMs: 7000,
    x: POOL_CENTER_X,
    y: POOL_CENTER_Y,
    width: POOL_W,
    height: POOL_H,
    outfit: GuestOutfit.SWIM,
    ...overrides,
  };
}

export class PoolFacility extends Facility {
  private waterGraphics!: Phaser.GameObjects.Graphics;
  private shimmerTween!: Phaser.Tweens.Tween;

  protected drawEnvironment(scene: Phaser.Scene): void {
    const lx = this.x - this.width  / 2;
    const ty = this.y - this.height / 2;
    const w  = this.width;
    const h  = this.height;

    const g = scene.add.graphics();
    g.setDepth(1);

    // ── Tile surround ────────────────────────────────────────────────────────
    g.fillStyle(C.POOL_SURROUND);
    g.fillRect(lx - 24, ty - 24, w + 48, h + 48);

    // Tile grid lines
    g.lineStyle(1, C.POOL_TILE_LINE, 0.7);
    const ts = 24;
    for (let tx2 = lx - 24; tx2 <= lx + w + 24; tx2 += ts) {
      g.lineBetween(tx2, ty - 24, tx2, ty + h + 24);
    }
    for (let ty2 = ty - 24; ty2 <= ty + h + 24; ty2 += ts) {
      g.lineBetween(lx - 24, ty2, lx + w + 24, ty2);
    }

    // ── Pool water bg (deep) ─────────────────────────────────────────────────
    g.fillStyle(C.POOL_WATER_DEEP);
    g.fillRect(lx, ty, w, h);

    // Water mid layer
    g.fillStyle(C.POOL_WATER_MID);
    g.fillRect(lx, ty, w, h - 30);

    // ── Lane dividers ────────────────────────────────────────────────────────
    const laneCount = 4;
    const laneW = w / laneCount;
    g.lineStyle(2, 0xffffff, 0.5);
    for (let i = 1; i < laneCount; i++) {
      g.lineBetween(lx + i * laneW, ty + 10, lx + i * laneW, ty + h - 10);
    }

    // ── Animated shimmer layer (separate graphics, tweened) ──────────────────
    this.waterGraphics = scene.add.graphics();
    this.waterGraphics.setDepth(2);
    this.waterGraphics.setAlpha(0.18);
    this.drawWaterShimmer(lx, ty, w, h);

    this.shimmerTween = scene.tweens.add({
      targets: this.waterGraphics,
      alpha: { from: 0.12, to: 0.32 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Pool rim border ──────────────────────────────────────────────────────
    g.lineStyle(4, 0xb0bec5, 1);
    g.strokeRect(lx, ty, w, h);

    // ── Metal ladder ─────────────────────────────────────────────────────────
    this.drawLadder(g, lx + 24, ty + h - 10);

    // ── Lifeguard chair ──────────────────────────────────────────────────────
    this.drawLifeguardChair(g, lx + w - 30, ty - 10);

    // ── Pool sign ────────────────────────────────────────────────────────────
    scene.add.text(this.x, ty - 16, '🏊 SWIMMING POOL', {
      fontSize: '11px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff', stroke: '#006064', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(3);
  }

  private drawWaterShimmer(lx: number, ty: number, w: number, h: number): void {
    const g = this.waterGraphics;
    g.clear();
    g.fillStyle(C.POOL_WATER_TOP);
    // Diagonal shimmer streaks
    for (let i = 0; i < 14; i++) {
      const sx = lx + (i * 38) % w;
      const sy = ty + (i * 29) % h;
      g.fillRect(sx, sy, 6, 60);
      g.fillRect(sx + 14, sy + 10, 3, 40);
    }
    // Top ripple highlights
    g.fillStyle(0xffffff);
    for (let i = 0; i < 8; i++) {
      const sx = lx + (i * 62 + 10) % w;
      g.fillRect(sx, ty + 8, 20, 2);
    }
  }

  private drawLadder(g: Phaser.GameObjects.Graphics, cx: number, topY: number): void {
    const steps = 4;
    const stepH = 16;
    const railW = 3;
    const rungW = 22;
    const railH = steps * stepH + 30;

    g.fillStyle(C.LADDER_RAIL);
    g.fillRect(cx - rungW / 2 - railW, topY - railH, railW, railH + 15);
    g.fillRect(cx + rungW / 2,         topY - railH, railW, railH + 15);

    g.fillStyle(C.LADDER_STEP);
    for (let i = 0; i < steps; i++) {
      g.fillRect(cx - rungW / 2, topY - railH + 28 + i * stepH, rungW, railW + 1);
    }

    // Curved top handles
    g.fillStyle(C.CHROME);
    g.fillRect(cx - rungW / 2 - railW, topY - railH - 10, railW, 14);
    g.fillRect(cx + rungW / 2,         topY - railH - 10, railW, 14);
  }

  private drawLifeguardChair(g: Phaser.GameObjects.Graphics, cx: number, baseY: number): void {
    // Tall legs
    g.fillStyle(C.LIFEGUARD_WOOD);
    g.fillRect(cx - 22, baseY, 7,  90);
    g.fillRect(cx + 15, baseY, 7,  90);

    // Cross braces
    g.fillRect(cx - 22, baseY + 30, 44, 5);
    g.fillRect(cx - 22, baseY + 60, 44, 5);

    // Seat platform
    g.fillStyle(C.LIFEGUARD_WOOD + 0x111111);
    g.fillRect(cx - 28, baseY - 14, 56, 8);

    // Seat cushion
    g.fillStyle(C.LIFEGUARD_SEAT);
    g.fillRect(cx - 24, baseY - 22, 48, 10);

    // Chair back
    g.fillStyle(C.LIFEGUARD_WOOD);
    g.fillRect(cx - 24, baseY - 54, 48, 34);

    // Umbrella pole
    g.fillStyle(C.CHROME);
    g.fillRect(cx - 2,  baseY - 100, 4, 50);

    // Umbrella canopy (red/white stripes)
    for (let i = 0; i < 3; i++) {
      g.fillStyle(i % 2 === 0 ? 0xef5350 : 0xfafafa);
      g.fillRect(cx - 32 + i * 22, baseY - 104, 22, 8);
    }
  }

  protected defineSlots(): void {
    const lx     = this.x - this.width  / 2;
    const ty     = this.y - this.height / 2;
    const laneW  = this.width / 4;
    const slotY  = ty + this.height / 2;

    this.slots = [0, 1, 2, 3].map(i => ({
      id:       `lane_${i}`,
      x:        lx + laneW * i + laneW / 2,
      y:        slotY,
      occupied: false,
    }));
  }

  override destroy(): void {
    this.shimmerTween.stop();
    this.waterGraphics.destroy();
  }
}
