import * as Phaser from 'phaser';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  GUEST_SPAWN_INTERVAL_MS,
  MAX_GUESTS,
  TILE_SIZE,
} from '../utils/Constants';
import { Facility, GYM_TEMPLATE, POOL_TEMPLATE, FacilityData } from '../entities/Facility';
import { Guest } from '../entities/Guest';
import { UIManager } from '../ui/UIManager';
import { EconomyManager } from '../systems/EconomyManager';

let facilityCounter = 0;

export class MainScene extends Phaser.Scene {
  private facilities: Facility[] = [];
  private guests: Guest[] = [];
  private ui!: UIManager;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private poolCount: number = 0;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private camStartX: number = 0;
  private camStartY: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff);
    g.fillCircle(8, 8, 8);
    g.generateTexture('guest_texture', 16, 16);
    g.destroy();
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawWorld();
    this.buildInitialFacilities();

    this.ui = new UIManager((type) => {
      if (type === 'pool') this.tryBuildPool();
    });

    this.setupCamera();
    this.setupZoom();

    this.spawnTimer = this.time.addEvent({
      delay: GUEST_SPAWN_INTERVAL_MS,
      loop: true,
      callback: this.spawnGuest,
      callbackScope: this,
    });

    this.spawnGuest();
  }

  private drawWorld(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x3a7d44);
    bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    bg.lineStyle(1, 0x2d6636, 0.35);
    for (let x = 0; x <= WORLD_WIDTH; x += TILE_SIZE) {
      bg.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += TILE_SIZE) {
      bg.lineBetween(0, y, WORLD_WIDTH, y);
    }

    const path = this.add.graphics();
    path.fillStyle(0xc8a96e, 0.9);
    path.fillRect(WORLD_WIDTH / 2 - 30, 0, 60, WORLD_HEIGHT);
    path.fillRect(0, WORLD_HEIGHT / 2 - 30, WORLD_WIDTH, 60);

    const pool = this.add.graphics();
    pool.fillStyle(0x40c0e0, 0.25);
    pool.fillRect(120, 120, 200, 140);
    this.add.text(220, 190, 'Decorative\nPond', {
      fontSize: '10px', color: '#aaddff', align: 'center',
    }).setOrigin(0.5);
  }

  private buildInitialFacilities(): void {
    facilityCounter++;
    const gymData: FacilityData = {
      ...GYM_TEMPLATE,
      id: `facility_${facilityCounter}`,
      x: WORLD_WIDTH / 2 - 200,
      y: WORLD_HEIGHT / 2 - 150,
      currentCapacity: 0,
    };
    this.facilities.push(new Facility(this, gymData));

    facilityCounter++;
    const gym2Data: FacilityData = {
      ...GYM_TEMPLATE,
      id: `facility_${facilityCounter}`,
      x: WORLD_WIDTH / 2 + 200,
      y: WORLD_HEIGHT / 2 + 150,
      currentCapacity: 0,
    };
    this.facilities.push(new Facility(this, gym2Data));
  }

  private tryBuildPool(): void {
    const cost = POOL_TEMPLATE.costToBuild;
    const success = EconomyManager.getInstance().spendMoney(cost);
    if (!success) {
      console.warn('Not enough money to build pool');
      return;
    }

    this.poolCount++;
    facilityCounter++;
    const offsetX = (this.poolCount % 3) * 220 - 220;
    const offsetY = Math.floor(this.poolCount / 3) * 180;

    const poolData: FacilityData = {
      ...POOL_TEMPLATE,
      id: `facility_${facilityCounter}`,
      x: WORLD_WIDTH / 2 + offsetX,
      y: WORLD_HEIGHT / 2 - 300 + offsetY,
      currentCapacity: 0,
    };
    this.facilities.push(new Facility(this, poolData));
  }

  private spawnGuest(): void {
    if (this.guests.length >= MAX_GUESTS) return;

    const edge = Math.floor(Math.random() * 4);
    let spawnX = 0;
    let spawnY = 0;

    switch (edge) {
      case 0: spawnX = Math.random() * WORLD_WIDTH; spawnY = 0; break;
      case 1: spawnX = Math.random() * WORLD_WIDTH; spawnY = WORLD_HEIGHT; break;
      case 2: spawnX = 0; spawnY = Math.random() * WORLD_HEIGHT; break;
      default: spawnX = WORLD_WIDTH; spawnY = Math.random() * WORLD_HEIGHT; break;
    }

    const guest = new Guest(this, spawnX, spawnY, (g) => {
      this.removeGuest(g);
    });
    this.guests.push(guest);
    this.ui.updateGuestCount(this.guests.length);
  }

  private removeGuest(guest: Guest): void {
    const idx = this.guests.indexOf(guest);
    if (idx !== -1) {
      this.guests.splice(idx, 1);
      this.ui.updateGuestCount(this.guests.length);
    }
  }

  private setupCamera(): void {
    this.cameras.main.setScroll(
      WORLD_WIDTH / 2 - this.scale.width / 2,
      WORLD_HEIGHT / 2 - this.scale.height / 2,
    );

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.button === 1 || ptr.button === 2) {
        this.isDragging = true;
        this.dragStartX = ptr.x;
        this.dragStartY = ptr.y;
        this.camStartX = this.cameras.main.scrollX;
        this.camStartY = this.cameras.main.scrollY;
      }
    });

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const dx = ptr.x - this.dragStartX;
      const dy = ptr.y - this.dragStartY;
      this.cameras.main.setScroll(this.camStartX - dx, this.camStartY - dy);
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    const keys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key> | undefined;

    this.events.on('update', (_time: number, _delta: number) => {
      if (!keys) return;
      const speed = 6;
      if (keys['up']?.isDown) this.cameras.main.scrollY -= speed;
      if (keys['down']?.isDown) this.cameras.main.scrollY += speed;
      if (keys['left']?.isDown) this.cameras.main.scrollX -= speed;
      if (keys['right']?.isDown) this.cameras.main.scrollX += speed;
    });
  }

  private setupZoom(): void {
    this.input.on('wheel', (_ptr: Phaser.Input.Pointer, _objs: unknown[], _dx: number, dy: number) => {
      const zoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(zoom - dy * 0.001, 0.4, 2);
      this.cameras.main.setZoom(newZoom);
    });
  }

  update(_time: number, delta: number): void {
    for (const guest of this.guests) {
      guest.update(delta, this.facilities);
    }
  }

  shutdown(): void {
    this.ui.destroy();
    this.spawnTimer.destroy();
    for (const guest of this.guests) guest.destroyFully();
    for (const facility of this.facilities) facility.destroy();
    this.guests = [];
    this.facilities = [];
    EconomyManager.getInstance().reset();
  }
}
