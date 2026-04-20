import * as Phaser from 'phaser';
import { GuestState, GuestMood, GuestOutfit, WalkPose } from '../utils/Enums';
import { Facility, FacilitySlot } from './Facility';
import { EconomyManager } from '../systems/EconomyManager';
import { MoodManager } from '../systems/MoodManager';
import {
  GUEST_SPEED_NORMAL, GUEST_SPEED_TIRED,
  WORLD_WIDTH, WORLD_HEIGHT, PATH_Y,
  SKIN_TONES, HAIR_COLORS, OUTFIT_PALETTES, C,
} from '../utils/Constants';

let guestSeq = 0;

// ─── Character visual (humanoid pixel-art drawn with Graphics) ────────────────
class GuestVisual {
  readonly container: Phaser.GameObjects.Container;
  private g:    Phaser.GameObjects.Graphics;
  private moodG: Phaser.GameObjects.Graphics;

  private skinColor:  number;
  private hairColor:  number;
  private shirtColor: number;
  private shortsColor: number;
  private swimColor:  number;

  mood:   GuestMood   = GuestMood.HAPPY;
  outfit: GuestOutfit = GuestOutfit.GYM;

  constructor(scene: Phaser.Scene, x: number, y: number, variantIndex: number) {
    const skinIdx  = variantIndex % SKIN_TONES.length;
    const hairIdx  = variantIndex % HAIR_COLORS.length;
    const outfitIdx = variantIndex % OUTFIT_PALETTES.length;

    this.skinColor   = SKIN_TONES[skinIdx];
    this.hairColor   = HAIR_COLORS[hairIdx];
    this.shirtColor  = OUTFIT_PALETTES[outfitIdx].shirt;
    this.shortsColor = OUTFIT_PALETTES[outfitIdx].shorts;
    this.swimColor   = variantIndex % 2 === 0 ? C.SWIM_BLUE : C.SWIM_PINK;

    this.g     = scene.add.graphics();
    this.moodG = scene.add.graphics();

    this.container = scene.add.container(x, y);
    this.container.add([this.g, this.moodG]);
    this.container.setDepth(10);

    // Hit-area for click events
    const hitRect = new Phaser.Geom.Rectangle(-11, -18, 22, 36);
    this.container.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);

    this.draw(WalkPose.STAND);
    this.drawMood();
  }

  // ── Body drawing ────────────────────────────────────────────────────────────
  draw(pose: WalkPose): void {
    const g   = this.g;
    const sk  = this.skinColor;
    const hr  = this.hairColor;
    const isSwim = this.outfit === GuestOutfit.SWIM;
    const shirt  = isSwim ? this.swimColor : this.shirtColor;
    const shorts = isSwim ? this.swimColor : this.shortsColor;

    g.clear();

    if (pose === WalkPose.SWIM0 || pose === WalkPose.SWIM1) {
      this.drawSwimPose(g, sk, hr, shirt, shorts, pose === WalkPose.SWIM1);
      return;
    }

    const lLegOff = (pose === WalkPose.WALK0) ? -3 : (pose === WalkPose.WALK1) ?  3 : 0;
    const rLegOff = -lLegOff;
    const lArmY   = (pose === WalkPose.LIFT1) ? -10 : 0;
    const rArmY   = (pose === WalkPose.LIFT1) ? -10 : 0;
    const hunch   = (pose === WalkPose.STAND && this.outfit === GuestOutfit.GYM) ? 0 : 0;

    // Hair
    g.fillStyle(hr);
    g.fillRect(-5, -18 + hunch, 10, 5);
    // Head
    g.fillStyle(sk);
    g.fillRect(-5, -13 + hunch, 10, 9);
    // Eyes
    g.fillStyle(0x222222);
    g.fillRect(-3, -10 + hunch, 2, 2);
    g.fillRect(1,  -10 + hunch, 2, 2);
    // Neck
    g.fillStyle(sk);
    g.fillRect(-2, -4 + hunch, 4, 3);
    // Torso / shirt
    g.fillStyle(shirt);
    g.fillRect(-5, -1 + hunch, 10, 9);
    // Arms
    g.fillStyle(sk);
    g.fillRect(-8, -1 + hunch + lArmY, 3, 9);
    g.fillRect( 5, -1 + hunch + rArmY, 3, 9);
    // Shorts
    g.fillStyle(shorts);
    g.fillRect(-5, 8 + hunch, 10, 6);
    // Legs
    g.fillStyle(sk);
    g.fillRect(-5, 14 + lLegOff, 4, 5);
    g.fillRect( 1, 14 + rLegOff, 4, 5);
    // Shoes
    g.fillStyle(0x1a1a1a);
    g.fillRect(-6, 19 + lLegOff, 5, 3);
    g.fillRect( 1, 19 + rLegOff, 5, 3);
  }

  private drawSwimPose(
    g: Phaser.GameObjects.Graphics,
    sk: number, hr: number, shirt: number, shorts: number,
    alt: boolean,
  ): void {
    // Horizontal swimmer (rotated 90° visually)
    g.fillStyle(hr);
    g.fillRect(-16, -5, 9, 4);
    g.fillStyle(sk);
    g.fillRect(-16, -1, 9, 8);   // head
    g.fillStyle(0x222222);
    g.fillRect(-14, 1, 2, 2);    // eye
    g.fillStyle(sk);
    g.fillRect(-7, 1, 14, 6);    // torso/arm area
    g.fillStyle(shirt);
    g.fillRect(-7, 1, 8, 6);     // shirt
    g.fillStyle(shorts);
    g.fillRect( 1, 1, 8, 6);     // shorts
    g.fillStyle(sk);
    g.fillRect( 9, 1, 9, 6);     // legs
    // Arms
    g.fillStyle(sk);
    if (alt) {
      g.fillRect(-20, -4, 5, 4); // back arm pulled back
      g.fillRect( 18, -1, 6, 4); // front arm extended
    } else {
      g.fillRect(-20, 2, 5, 4);  // back arm below
      g.fillRect( 18, -4, 6, 4); // front arm up
    }
  }

  // ── Mood bubble drawing ─────────────────────────────────────────────────────
  drawMood(): void {
    const mg = this.moodG;
    mg.clear();

    const fc = { x: 0, y: -30 };
    const moodColor =
      this.mood === GuestMood.HAPPY   ? C.MOOD_HAPPY :
      this.mood === GuestMood.NEUTRAL ? C.MOOD_NEUTRAL : C.MOOD_SAD;

    // White bubble
    mg.fillStyle(0xffffff, 0.92);
    mg.fillCircle(fc.x, fc.y, 10);
    mg.lineStyle(1.5, 0xbbbbbb);
    mg.strokeCircle(fc.x, fc.y, 10);

    // Coloured face
    mg.fillStyle(moodColor);
    mg.fillCircle(fc.x, fc.y, 8);

    // Eyes (white dots)
    mg.fillStyle(0xffffff);
    mg.fillCircle(fc.x - 2.5, fc.y - 2.5, 1.5);
    mg.fillCircle(fc.x + 2.5, fc.y - 2.5, 1.5);

    // Mouth (pixel art lines)
    mg.fillStyle(0xffffff);
    if (this.mood === GuestMood.HAPPY) {
      mg.fillRect(fc.x - 3, fc.y + 1,  1.5, 1.5);
      mg.fillRect(fc.x - 1.5, fc.y + 2.5, 3, 1.5);
      mg.fillRect(fc.x + 1.5, fc.y + 1,  1.5, 1.5);
    } else if (this.mood === GuestMood.SAD) {
      mg.fillRect(fc.x - 3,   fc.y + 2.5, 1.5, 1.5);
      mg.fillRect(fc.x - 1.5, fc.y + 1,   3,   1.5);
      mg.fillRect(fc.x + 1.5, fc.y + 2.5, 1.5, 1.5);
    } else {
      mg.fillRect(fc.x - 3, fc.y + 2, 6, 1.5);
    }
  }

  setMood(mood: GuestMood): void {
    if (this.mood === mood) return;
    this.mood = mood;
    this.drawMood();
  }

  setOutfit(outfit: GuestOutfit): void {
    if (this.outfit === outfit) return;
    this.outfit = outfit;
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setDepth(d: number): void {
    this.container.setDepth(d);
  }

  destroy(): void {
    this.container.destroy(true);
  }
}

// ─── Main Guest class ─────────────────────────────────────────────────────────
export class Guest extends Phaser.Physics.Arcade.Sprite {
  readonly guestId:   string;
  readonly guestName: string;

  private guestState: GuestState = GuestState.SPAWN;
  private visual:     GuestVisual;

  private targetFacility: Facility   | null = null;
  private targetSlot:     FacilitySlot | null = null;

  private waypoints:      Array<{x: number; y: number}> = [];
  private waypointIdx:    number = 0;

  private moodManager:    MoodManager;
  private onDestroyCallback: (g: Guest) => void;

  private decideTimer:    number = 0;
  private readonly DECIDE_INTERVAL = 600;

  // Walk-bob tween property (tweened numerically, applied in update)
  public bobY:  number = 0;
  public swimX: number = 0;

  private walkTween: Phaser.Tweens.Tween | null = null;
  private animTimer: Phaser.Time.TimerEvent | null = null;
  private walkPose:  WalkPose = WalkPose.STAND;

  private speed:     number;
  private readonly variantIndex: number;

  private static NAMES = [
    'Alex', 'Sam', 'Jordan', 'Riley', 'Casey',
    'Morgan', 'Taylor', 'Drew', 'Avery', 'Quinn',
  ];

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    moodManager: MoodManager,
    onDestroy: (g: Guest) => void,
  ) {
    super(scene, x, y, 'guest_phys');
    guestSeq++;
    this.guestId   = `guest_${guestSeq}`;
    this.guestName = Guest.NAMES[guestSeq % Guest.NAMES.length] ?? 'Guest';
    this.speed     = GUEST_SPEED_NORMAL;
    this.moodManager = moodManager;
    this.onDestroyCallback = onDestroy;
    this.variantIndex = guestSeq;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setVisible(false);
    this.setCollideWorldBounds(false);

    this.visual = new GuestVisual(scene, x, y, this.variantIndex);

    // Enable click
    this.visual.container.on('pointerdown', () => {
      scene.events.emit('guest_clicked', this);
    });

    this.transitionTo(GuestState.SPAWN);
  }

  // ── State machine ────────────────────────────────────────────────────────────
  private transitionTo(state: GuestState): void {
    this.guestState = state;
  }

  getGuestState(): GuestState { return this.guestState; }
  getVisual():     GuestVisual { return this.visual; }

  update(delta: number, facilities: Facility[]): void {
    this.visual.setPosition(this.x, this.y + this.bobY);

    switch (this.guestState) {
      case GuestState.SPAWN:      this.handleSpawn(); break;
      case GuestState.DECIDE:     this.handleDecide(delta, facilities); break;
      case GuestState.WALKING_TO_PATH:
      case GuestState.WALKING_TO_SLOT: this.checkWaypoints(); break;
      case GuestState.USING_FACILITY:  break;
      case GuestState.PAYING:     this.handlePaying(); break;
      case GuestState.LEAVING:    this.checkLeaving(); break;
    }
  }

  private handleSpawn(): void {
    this.moodManager.startWaiting(this.guestId);
    this.decideTimer = 0;
    this.transitionTo(GuestState.DECIDE);
  }

  private handleDecide(delta: number, facilities: Facility[]): void {
    this.decideTimer += delta;
    if (this.decideTimer < this.DECIDE_INTERVAL) return;
    this.decideTimer = 0;

    const available = facilities.filter(f => !f.isFull());
    if (available.length === 0) {
      const mood = this.moodManager.getMood(this.guestId);
      this.visual.setMood(mood);
      return;
    }

    const facility = available[Math.floor(Math.random() * available.length)];
    const slot     = facility.reserveSlot();
    if (!slot) return;

    this.targetFacility = facility;
    this.targetSlot     = slot;
    this.moodManager.stopWaiting(this.guestId);
    this.visual.setMood(GuestMood.HAPPY);
    this.visual.setOutfit(facility.outfit);

    this.startJourneyTo(slot.x, slot.y);
  }

  private startJourneyTo(destX: number, destY: number): void {
    const pathJunctionX = destX;
    this.waypoints = [
      { x: pathJunctionX, y: PATH_Y },
      { x: destX,         y: destY  },
    ];
    this.waypointIdx = 0;
    this.transitionTo(GuestState.WALKING_TO_PATH);
    this.startWalkAnim();
    this.moveToWaypoint();
  }

  private moveToWaypoint(): void {
    const wp = this.waypoints[this.waypointIdx];
    if (!wp) return;
    this.scene.physics.moveToObject(
      this as unknown as Phaser.GameObjects.GameObject,
      wp,
      this.speed,
    );
  }

  private checkWaypoints(): void {
    const wp = this.waypoints[this.waypointIdx];
    if (!wp) return;

    const dx = wp.x - this.x;
    const dy = wp.y - this.y;
    if (Math.sqrt(dx * dx + dy * dy) < 14) {
      this.waypointIdx++;
      if (this.waypointIdx < this.waypoints.length) {
        if (this.waypointIdx === 1) this.transitionTo(GuestState.WALKING_TO_SLOT);
        this.moveToWaypoint();
      } else {
        this.setVelocity(0, 0);
        this.stopWalkAnim();
        this.arriveAtSlot();
      }
    }
  }

  private arriveAtSlot(): void {
    if (!this.targetFacility) return;
    this.transitionTo(GuestState.USING_FACILITY);
    this.startFacilityAnimation();

    this.scene.time.delayedCall(this.targetFacility.processingTimeMs, () => {
      this.transitionTo(GuestState.PAYING);
    });
  }

  private startFacilityAnimation(): void {
    if (!this.targetFacility) return;
    const isPool = this.targetFacility.outfit === GuestOutfit.SWIM;

    if (isPool) {
      this.visual.draw(WalkPose.SWIM0);
      let frame = false;
      this.animTimer = this.scene.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
          frame = !frame;
          this.visual.draw(frame ? WalkPose.SWIM0 : WalkPose.SWIM1);
        },
      });
      // Swim float left-right
      this.walkTween = this.scene.tweens.add({
        targets: this,
        swimX: { from: -8, to: 8 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          this.visual.setPosition(this.x + this.swimX, this.y + this.bobY);
        },
      });
    } else {
      this.visual.draw(WalkPose.LIFT0);
      let frame = false;
      this.animTimer = this.scene.time.addEvent({
        delay: 800,
        loop: true,
        callback: () => {
          frame = !frame;
          this.visual.draw(frame ? WalkPose.LIFT0 : WalkPose.LIFT1);
        },
      });
    }
  }

  private handlePaying(): void {
    this.stopAllAnims();
    if (this.targetFacility && this.targetSlot) {
      EconomyManager.getInstance().addMoney(this.targetFacility.revenuePerUse);
      this.targetFacility.releaseSlot(this.targetSlot.id);
    }
    this.targetFacility = null;
    this.targetSlot     = null;
    this.speed = GUEST_SPEED_TIRED;
    this.startLeaving();
  }

  private startLeaving(): void {
    const edge = Math.floor(Math.random() * 4);
    let lx: number, ly: number;
    switch (edge) {
      case 0:  lx = Math.random() * WORLD_WIDTH; ly = -60;              break;
      case 1:  lx = Math.random() * WORLD_WIDTH; ly = WORLD_HEIGHT + 60; break;
      case 2:  lx = -60;               ly = Math.random() * WORLD_HEIGHT; break;
      default: lx = WORLD_WIDTH + 60;  ly = Math.random() * WORLD_HEIGHT; break;
    }
    this.waypoints  = [{ x: lx, y: PATH_Y }, { x: lx, y: ly }];
    this.waypointIdx = 0;
    this.transitionTo(GuestState.LEAVING);
    this.startWalkAnim();
    this.moveToWaypoint();
  }

  private checkLeaving(): void {
    const wp = this.waypoints[this.waypointIdx];
    if (!wp) return;
    const dx = wp.x - this.x;
    const dy = wp.y - this.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      this.waypointIdx++;
      if (this.waypointIdx < this.waypoints.length) {
        this.moveToWaypoint();
      } else {
        this.onDestroyCallback(this);
        this.destroyFully();
      }
    }
  }

  // ── Walk animation ───────────────────────────────────────────────────────────
  private startWalkAnim(): void {
    this.stopAllAnims();
    this.walkPose = WalkPose.WALK0;
    this.visual.draw(WalkPose.WALK0);

    this.walkTween = this.scene.tweens.add({
      targets: this,
      bobY: { from: 0, to: -3 },
      duration: 180,
      yoyo: true,
      repeat: -1,
    });

    this.animTimer = this.scene.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        this.walkPose = this.walkPose === WalkPose.WALK0 ? WalkPose.WALK1 : WalkPose.WALK0;
        this.visual.draw(this.walkPose);
      },
    });
  }

  private stopWalkAnim(): void {
    if (this.walkTween)  { this.walkTween.stop();  this.walkTween  = null; }
    if (this.animTimer)  { this.animTimer.destroy(); this.animTimer = null; }
    this.bobY  = 0;
    this.swimX = 0;
    this.visual.draw(WalkPose.STAND);
  }

  private stopAllAnims(): void {
    this.stopWalkAnim();
  }

  // ── Public info for UI inspector ─────────────────────────────────────────────
  getInfo(): { name: string; state: string; mood: string; facility: string } {
    const stateLabels: Record<GuestState, string> = {
      [GuestState.SPAWN]:            'Arriving',
      [GuestState.DECIDE]:           'Looking Around',
      [GuestState.WALKING_TO_PATH]:  'Walking',
      [GuestState.WALKING_TO_SLOT]:  'Heading to Facility',
      [GuestState.USING_FACILITY]:   this.targetFacility?.outfit === GuestOutfit.SWIM ? 'Swimming' : 'Working Out',
      [GuestState.PAYING]:           'Paying',
      [GuestState.LEAVING]:          'Heading Home',
    };
    return {
      name:     this.guestName,
      state:    stateLabels[this.guestState] ?? this.guestState,
      mood:     this.visual.mood,
      facility: this.targetFacility?.name ?? '—',
    };
  }

  destroyFully(): void {
    this.stopAllAnims();
    if (this.targetFacility && this.targetSlot) {
      this.targetFacility.releaseSlot(this.targetSlot.id);
    }
    this.moodManager.remove(this.guestId);
    this.visual.destroy();
    this.destroy();
  }
}
