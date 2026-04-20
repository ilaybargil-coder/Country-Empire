import * as Phaser from 'phaser';
import { GuestState } from '../utils/Enums';
import { GUEST_SPEED, WORLD_WIDTH, WORLD_HEIGHT, GUEST_COLORS } from '../utils/Constants';
import { Facility } from './Facility';
import { EconomyManager } from '../systems/EconomyManager';

let guestCounter = 0;

export class Guest extends Phaser.Physics.Arcade.Sprite {
  readonly guestId: string;

  private guestState: GuestState = GuestState.SPAWN;
  private targetFacility: Facility | null = null;
  private _circle: Phaser.GameObjects.Arc;
  private decideTimer: number = 0;
  private readonly decideInterval: number = 500;
  private leaveTargetX: number = 0;
  private leaveTargetY: number = 0;
  private onDestroyCallback: (guest: Guest) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onDestroy: (guest: Guest) => void,
  ) {
    super(scene, x, y, 'guest_texture');
    guestCounter++;
    this.guestId = `guest_${guestCounter}`;
    this.onDestroyCallback = onDestroy;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    this.setVisible(false);

    const colorIndex = guestCounter % GUEST_COLORS.length;
    this._circle = scene.add.circle(x, y, 8, GUEST_COLORS[colorIndex]);
    this._circle.setDepth(10);

    this.transitionTo(GuestState.SPAWN);
  }

  private transitionTo(newState: GuestState): void {
    this.guestState = newState;
  }

  update(delta: number, facilities: Facility[]): void {
    this._circle.setPosition(this.x, this.y);

    switch (this.guestState) {
      case GuestState.SPAWN:
        this.handleSpawn();
        break;
      case GuestState.DECIDE:
        this.handleDecide(delta, facilities);
        break;
      case GuestState.MOVE_TO_FACILITY:
        this.handleMoveToFacility();
        break;
      case GuestState.USING_FACILITY:
        break;
      case GuestState.PAYING:
        this.handlePaying();
        break;
      case GuestState.LEAVING:
        this.handleLeaving();
        break;
    }
  }

  private handleSpawn(): void {
    this.decideTimer = 0;
    this.transitionTo(GuestState.DECIDE);
  }

  private handleDecide(delta: number, facilities: Facility[]): void {
    this.decideTimer += delta;
    if (this.decideTimer < this.decideInterval) return;
    this.decideTimer = 0;

    const available = facilities.filter(f => !f.isFull());
    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    if (!chosen.reserve()) return;

    this.targetFacility = chosen;
    this.transitionTo(GuestState.MOVE_TO_FACILITY);
    const self = this as unknown as Phaser.GameObjects.GameObject;
    this.scene.physics.moveToObject(self, { x: chosen.x, y: chosen.y }, GUEST_SPEED);
  }

  private handleMoveToFacility(): void {
    if (!this.targetFacility) {
      this.transitionTo(GuestState.DECIDE);
      return;
    }

    const dx = this.targetFacility.x - this.x;
    const dy = this.targetFacility.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 12) {
      this.setVelocity(0, 0);
      this.transitionTo(GuestState.USING_FACILITY);
      this.startUsingFacility();
    }
  }

  private startUsingFacility(): void {
    if (!this.targetFacility) return;

    this.scene.time.delayedCall(this.targetFacility.processingTimeMs, () => {
      this.transitionTo(GuestState.PAYING);
    });
  }

  private handlePaying(): void {
    if (this.targetFacility) {
      EconomyManager.getInstance().addMoney(this.targetFacility.revenuePerUse);
      this.targetFacility.release();
      this.targetFacility = null;
    }
    this.startLeaving();
  }

  private startLeaving(): void {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: this.leaveTargetX = Math.random() * WORLD_WIDTH; this.leaveTargetY = -50; break;
      case 1: this.leaveTargetX = Math.random() * WORLD_WIDTH; this.leaveTargetY = WORLD_HEIGHT + 50; break;
      case 2: this.leaveTargetX = -50; this.leaveTargetY = Math.random() * WORLD_HEIGHT; break;
      default: this.leaveTargetX = WORLD_WIDTH + 50; this.leaveTargetY = Math.random() * WORLD_HEIGHT; break;
    }
    const self = this as unknown as Phaser.GameObjects.GameObject;
    this.scene.physics.moveToObject(self, { x: this.leaveTargetX, y: this.leaveTargetY }, GUEST_SPEED);
    this.transitionTo(GuestState.LEAVING);
  }

  private handleLeaving(): void {
    const dx = this.leaveTargetX - this.x;
    const dy = this.leaveTargetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30) {
      this.onDestroyCallback(this);
      this._circle.destroy();
      this.destroy();
    }
  }

  getGuestState(): GuestState {
    return this.guestState;
  }

  destroyFully(): void {
    if (this.targetFacility) {
      this.targetFacility.release();
      this.targetFacility = null;
    }
    this._circle.destroy();
    this.destroy();
  }
}
