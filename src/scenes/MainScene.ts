import * as Phaser from 'phaser';
import {
  WORLD_WIDTH, WORLD_HEIGHT, GAME_WIDTH, GAME_HEIGHT,
  GUEST_SPAWN_INTERVAL_MS, MAX_GUESTS, TILE_SIZE,
  GYM_CENTER_X, GYM_CENTER_Y, GYM_W, GYM_H,
  POOL_CENTER_X, POOL_CENTER_Y, POOL_W, POOL_H,
  PATH_Y, PATH_HEIGHT, C,
} from '../utils/Constants';
import { Facility } from '../entities/Facility';
import { GymFacility,  createGymConfig  } from '../facilities/GymFacility';
import { PoolFacility, createPoolConfig } from '../facilities/PoolFacility';
import { Guest } from '../entities/Guest';
import { EconomyManager } from '../systems/EconomyManager';
import { MoodManager } from '../systems/MoodManager';
import { UIManager } from '../ui/UIManager';
import { FacilityType } from '../utils/Enums';

export class MainScene extends Phaser.Scene {
  private facilities:  Facility[] = [];
  private guests:      Guest[]    = [];
  private ui!:         UIManager;
  private moodMgr!:    MoodManager;
  private spawnTimer!: Phaser.Time.TimerEvent;

  private isDragging = false;
  private dragStart  = { x: 0, y: 0 };
  private camStart   = { x: 0, y: 0 };

  constructor() { super({ key: 'MainScene' }); }

  preload(): void {
    // 1×1 white pixel used as physics-body texture (invisible)
    const pg = this.add.graphics();
    pg.fillStyle(0xffffff, 0);
    pg.fillRect(0, 0, 2, 2);
    pg.generateTexture('guest_phys', 2, 2);
    pg.destroy();
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.moodMgr = new MoodManager();

    this.drawWorld();
    this.placeFacilities();

    this.ui = new UIManager(
      EconomyManager.getInstance(),
      (type) => this.buildFacility(type),
      () => this.guests.length,
    );

    this.events.on('guest_clicked', (g: Guest) => this.ui.showInspector(g));

    this.setupCamera();
    this.setupZoom();

    this.spawnTimer = this.time.addEvent({
      delay: GUEST_SPAWN_INTERVAL_MS,
      loop:  true,
      callback: this.spawnGuest,
      callbackScope: this,
    });
    this.spawnGuest();
    this.spawnGuest();
  }

  // ─── World drawing ──────────────────────────────────────────────────────────
  private drawWorld(): void {
    const g = this.add.graphics();
    g.setDepth(0);

    // Grass base
    g.fillStyle(C.GRASS);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Grass tile darker variation
    g.fillStyle(C.GRASS_DARK, 0.25);
    for (let tx = 0; tx < WORLD_WIDTH; tx += TILE_SIZE * 2) {
      for (let ty = 0; ty < WORLD_HEIGHT; ty += TILE_SIZE * 2) {
        g.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      }
    }

    // ── Main horizontal path ──────────────────────────────────────────────────
    g.fillStyle(C.PATH);
    g.fillRect(0, PATH_Y - PATH_HEIGHT / 2, WORLD_WIDTH, PATH_HEIGHT);
    // Path darker border
    g.fillStyle(C.PATH_DARK);
    g.fillRect(0, PATH_Y - PATH_HEIGHT / 2,      WORLD_WIDTH, 6);
    g.fillRect(0, PATH_Y + PATH_HEIGHT / 2 - 6,  WORLD_WIDTH, 6);
    // Path cobble pattern
    g.fillStyle(C.PATH_DARK, 0.35);
    for (let px = 0; px < WORLD_WIDTH; px += 48) {
      g.fillRect(px + 1, PATH_Y - PATH_HEIGHT / 2 + 6, 46, PATH_HEIGHT - 12);
    }

    // ── Vertical connector paths (gym & pool entrances) ───────────────────────
    const gymLX  = GYM_CENTER_X  - GYM_W  / 2;
    const gymRX  = GYM_CENTER_X  + GYM_W  / 2;
    const poolLX = POOL_CENTER_X - POOL_W / 2;
    const poolRX = POOL_CENTER_X + POOL_W / 2;

    g.fillStyle(C.PATH);
    g.fillRect(gymLX,  0,          GYM_W,  WORLD_HEIGHT);
    g.fillRect(poolLX, 0,          POOL_W, WORLD_HEIGHT);

    // Re-draw grass over the path rectangles but leave the building footprints
    // (buildings draw their own floors, this gives a corridor effect)

    // ── Decorative bushes ─────────────────────────────────────────────────────
    const bushPositions = [
      // Along path edges
      { x: 200,  y: PATH_Y - 80 }, { x: 400,  y: PATH_Y - 80 },
      { x: 600,  y: PATH_Y - 80 }, { x: 1900, y: PATH_Y - 80 },
      { x: 2100, y: PATH_Y - 80 }, { x: 2300, y: PATH_Y - 80 },
      { x: 200,  y: PATH_Y + 80 }, { x: 400,  y: PATH_Y + 80 },
      { x: 2100, y: PATH_Y + 80 }, { x: 2300, y: PATH_Y + 80 },
      // Between buildings
      { x: GYM_CENTER_X + GYM_W / 2 + 60, y: GYM_CENTER_Y - 80 },
      { x: GYM_CENTER_X + GYM_W / 2 + 60, y: GYM_CENTER_Y + 80 },
    ];
    for (const bp of bushPositions) {
      this.drawBush(g, bp.x, bp.y);
    }

    // ── Trees (corners) ───────────────────────────────────────────────────────
    for (const tp of [
      { x: 100, y: 100 }, { x: WORLD_WIDTH - 100, y: 100 },
      { x: 100, y: WORLD_HEIGHT - 100 }, { x: WORLD_WIDTH - 100, y: WORLD_HEIGHT - 100 },
      { x: 500, y: 280 }, { x: WORLD_WIDTH - 500, y: 280 },
    ]) {
      this.drawTree(g, tp.x, tp.y);
    }
  }

  private drawBush(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    g.fillStyle(C.BUSH_DARK);
    g.fillCircle(cx - 8, cy + 6, 14);
    g.fillCircle(cx + 8, cy + 6, 14);
    g.fillStyle(C.BUSH);
    g.fillCircle(cx - 8, cy,     14);
    g.fillCircle(cx + 8, cy,     14);
    g.fillCircle(cx,     cy - 6, 14);
  }

  private drawTree(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Trunk
    g.fillStyle(0x5d4037);
    g.fillRect(cx - 6, cy + 10, 12, 30);
    // Canopy layers
    g.fillStyle(0x2e7d32);
    g.fillCircle(cx, cy + 10, 30);
    g.fillStyle(0x388e3c);
    g.fillCircle(cx, cy - 4, 26);
    g.fillStyle(0x43a047);
    g.fillCircle(cx, cy - 14, 20);
  }

  // ─── Facility placement ─────────────────────────────────────────────────────
  private placeFacilities(): void {
    this.facilities.push(new GymFacility(this,  createGymConfig()));
    this.facilities.push(new PoolFacility(this, createPoolConfig()));
  }

  private buildFacility(type: FacilityType): void {
    const eco = EconomyManager.getInstance();
    if (type === FacilityType.GYM) {
      const cfg = createGymConfig({
        x: GYM_CENTER_X  + (this.facilities.filter(f => f.type === FacilityType.GYM).length  * 60),
        y: GYM_CENTER_Y  + 50,
      });
      if (!eco.spendMoney(cfg.costToBuild)) return;
      this.facilities.push(new GymFacility(this, cfg));
      eco.addReputation(0.5);
    } else if (type === FacilityType.POOL) {
      const cfg = createPoolConfig({
        x: POOL_CENTER_X + (this.facilities.filter(f => f.type === FacilityType.POOL).length * 60),
        y: POOL_CENTER_Y + 50,
      });
      if (!eco.spendMoney(cfg.costToBuild)) return;
      this.facilities.push(new PoolFacility(this, cfg));
      eco.addReputation(1);
    }
  }

  // ─── NPC spawning ───────────────────────────────────────────────────────────
  private spawnGuest(): void {
    if (this.guests.length >= MAX_GUESTS) return;

    const edge = Math.floor(Math.random() * 4);
    let sx: number, sy: number;
    switch (edge) {
      case 0:  sx = Math.random() * WORLD_WIDTH; sy = -20;              break;
      case 1:  sx = Math.random() * WORLD_WIDTH; sy = WORLD_HEIGHT + 20; break;
      case 2:  sx = -20;               sy = Math.random() * WORLD_HEIGHT; break;
      default: sx = WORLD_WIDTH + 20;  sy = Math.random() * WORLD_HEIGHT; break;
    }

    const guest = new Guest(this, sx, sy, this.moodMgr, (g) => this.removeGuest(g));
    this.guests.push(guest);
    this.ui.updateGuestCount(this.guests.length);
  }

  private removeGuest(guest: Guest): void {
    const i = this.guests.indexOf(guest);
    if (i !== -1) this.guests.splice(i, 1);
    this.ui.updateGuestCount(this.guests.length);
  }

  // ─── Camera ─────────────────────────────────────────────────────────────────
  private setupCamera(): void {
    this.cameras.main.setScroll(
      WORLD_WIDTH  / 2 - GAME_WIDTH  / 2,
      WORLD_HEIGHT / 2 - GAME_HEIGHT / 2,
    );

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.button !== 1 && ptr.button !== 2) return;
      this.isDragging  = true;
      this.dragStart   = { x: ptr.x, y: ptr.y };
      this.camStart    = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      this.cameras.main.setScroll(
        this.camStart.x - (ptr.x - this.dragStart.x),
        this.camStart.y - (ptr.y - this.dragStart.y),
      );
    });
    this.input.on('pointerup', () => { this.isDragging = false; });

    const keys = this.input.keyboard?.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key> | undefined;

    this.events.on('update', () => {
      if (!keys) return;
      const spd = 7;
      if (keys['up']?.isDown)    this.cameras.main.scrollY -= spd;
      if (keys['down']?.isDown)  this.cameras.main.scrollY += spd;
      if (keys['left']?.isDown)  this.cameras.main.scrollX -= spd;
      if (keys['right']?.isDown) this.cameras.main.scrollX += spd;
    });
  }

  private setupZoom(): void {
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown[], _dx: number, dy: number) => {
      const z = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.0008, 0.35, 2.2);
      this.cameras.main.setZoom(z);
    });
  }

  update(_time: number, delta: number): void {
    for (const g of this.guests) g.update(delta, this.facilities);
  }

  shutdown(): void {
    this.spawnTimer.destroy();
    for (const g of this.guests)   g.destroyFully();
    for (const f of this.facilities) f.destroy();
    this.guests     = [];
    this.facilities = [];
    this.ui.destroy();
    EconomyManager.getInstance().reset();
  }
}
