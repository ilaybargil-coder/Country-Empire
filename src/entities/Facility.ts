import * as Phaser from 'phaser';
import { FacilityType, GuestOutfit } from '../utils/Enums';

export interface FacilitySlot {
  id: string;
  x: number;
  y: number;
  occupied: boolean;
}

export interface FacilityConfig {
  id: string;
  name: string;
  type: FacilityType;
  costToBuild: number;
  revenuePerUse: number;
  processingTimeMs: number;
  x: number;
  y: number;
  width: number;
  height: number;
  outfit: GuestOutfit;
}

export abstract class Facility {
  readonly id: string;
  readonly name: string;
  readonly type: FacilityType;
  readonly costToBuild: number;
  readonly revenuePerUse: number;
  readonly processingTimeMs: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly outfit: GuestOutfit;

  protected slots: FacilitySlot[] = [];

  constructor(scene: Phaser.Scene, cfg: FacilityConfig) {
    this.id               = cfg.id;
    this.name             = cfg.name;
    this.type             = cfg.type;
    this.costToBuild      = cfg.costToBuild;
    this.revenuePerUse    = cfg.revenuePerUse;
    this.processingTimeMs = cfg.processingTimeMs;
    this.x                = cfg.x;
    this.y                = cfg.y;
    this.width            = cfg.width;
    this.height           = cfg.height;
    this.outfit           = cfg.outfit;

    this.drawEnvironment(scene);
    this.defineSlots();
  }

  protected abstract drawEnvironment(scene: Phaser.Scene): void;
  protected abstract defineSlots(): void;

  reserveSlot(): FacilitySlot | null {
    const free = this.slots.find(s => !s.occupied);
    if (!free) return null;
    free.occupied = true;
    return free;
  }

  releaseSlot(slotId: string): void {
    const s = this.slots.find(s => s.id === slotId);
    if (s) s.occupied = false;
  }

  isFull(): boolean {
    return this.slots.every(s => s.occupied);
  }

  get maxCapacity(): number { return this.slots.length; }

  destroy(): void { /* children override if needed */ }
}
