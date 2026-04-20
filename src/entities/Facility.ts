import * as Phaser from 'phaser';
import { FacilityType } from '../utils/Enums';
import { FACILITY_COLORS } from '../utils/Constants';

export interface FacilityData {
  id: string;
  name: string;
  type: FacilityType;
  costToBuild: number;
  revenuePerUse: number;
  processingTimeMs: number;
  currentCapacity: number;
  maxCapacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Facility {
  readonly id: string;
  readonly name: string;
  readonly type: FacilityType;
  readonly costToBuild: number;
  readonly revenuePerUse: number;
  readonly processingTimeMs: number;
  readonly maxCapacity: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  private _currentCapacity: number = 0;
  private _rect: Phaser.GameObjects.Rectangle;
  private _label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, data: FacilityData) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.costToBuild = data.costToBuild;
    this.revenuePerUse = data.revenuePerUse;
    this.processingTimeMs = data.processingTimeMs;
    this.maxCapacity = data.maxCapacity;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;

    const color = FACILITY_COLORS[data.type === FacilityType.GYM ? 'gym' : 'pool'];
    this._rect = scene.add.rectangle(data.x, data.y, data.width, data.height, color, 0.9);
    this._rect.setStrokeStyle(2, 0xffffff, 0.6);

    this._label = scene.add.text(data.x, data.y - data.height / 2 - 10, data.name, {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1);
  }

  get currentCapacity(): number {
    return this._currentCapacity;
  }

  reserve(): boolean {
    if (this._currentCapacity >= this.maxCapacity) return false;
    this._currentCapacity++;
    this.updateVisual();
    return true;
  }

  release(): void {
    if (this._currentCapacity > 0) {
      this._currentCapacity--;
      this.updateVisual();
    }
  }

  isFull(): boolean {
    return this._currentCapacity >= this.maxCapacity;
  }

  destroy(): void {
    this._rect.destroy();
    this._label.destroy();
  }

  private updateVisual(): void {
    const pct = this._currentCapacity / this.maxCapacity;
    const alpha = 0.7 + pct * 0.3;
    this._rect.setAlpha(alpha);
  }
}

export const GYM_TEMPLATE: Omit<FacilityData, 'id' | 'x' | 'y'> = {
  name: 'Basic Gym',
  type: FacilityType.GYM,
  costToBuild: 0,
  revenuePerUse: 15,
  processingTimeMs: 5000,
  currentCapacity: 0,
  maxCapacity: 3,
  width: 100,
  height: 70,
};

export const POOL_TEMPLATE: Omit<FacilityData, 'id' | 'x' | 'y'> = {
  name: 'Swimming Pool',
  type: FacilityType.POOL,
  costToBuild: 200,
  revenuePerUse: 25,
  processingTimeMs: 7000,
  currentCapacity: 0,
  maxCapacity: 4,
  width: 140,
  height: 90,
};
