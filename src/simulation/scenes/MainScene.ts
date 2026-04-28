import * as Phaser from 'phaser';
import { useSimulationStore, type AGVData } from '../../store/useSimulationStore';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────
const CELL = 40;                // Grid cell size in pixels

const TILE_FLOOR   = 0;        // Base floor (unused/border)
const TILE_AISLE   = 1;        // Walkable path for AGVs
const TILE_RACK    = 2;        // Storage rack (non-walkable)
const TILE_WALL    = 3;        // Outer wall
const TILE_CHARGING = 4;       // Charging station

// Palette
const COL_BG       = 0x0c1222; // Deep navy background
const COL_GRID     = 0x162033; // Subtle grid lines
const COL_WALL     = 0x293548; // Outer wall
const COL_AISLE    = 0x1c2d45; // Aisle floor (slightly lighter)
const COL_TAPE     = 0xeab308; // Yellow guidance tape
const COL_RACK_A   = 0x374f6e; // Rack variant A (cool blue-grey)
const COL_RACK_B   = 0x2d5a4c; // Rack variant B (teal-green)
const COL_RACK_C   = 0x5a3d2d; // Rack variant C (warm brown)
const COL_RACK_BRD = 0x0f1b2d; // Rack border
const COL_CHARGING = 0x1e3a8a; // Charging station base (deep blue)
const COL_CHARGE_ICON = 0x60a5fa; // Icon color (bright blue)

// ────────────────────────────────────────────────────────────────
// SCENE
// ────────────────────────────────────────────────────────────────
export default class MainScene extends Phaser.Scene {
  private grid: number[][] = [];
  private cols = 0;
  private rows = 0;
  private inventoryLayer!: Phaser.GameObjects.Container;
  private slotCoordinates: Map<string, { x: number, y: number }> = new Map();
  private needsInventoryUpdate = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() { /* assets later */ }

  create() {
    const { warehouseConfig, agvs } = useSimulationStore.getState();
    const w = warehouseConfig.width > 0 ? warehouseConfig.width : this.cameras.main.width;
    const h = warehouseConfig.height > 0 ? warehouseConfig.height : this.cameras.main.height;

    // Snap to grid
    this.cols = Math.max(12, Math.floor(w / CELL));
    this.rows = Math.max(12, Math.floor(h / CELL));
    const totalW = this.cols * CELL;
    const totalH = this.rows * CELL;

    // Camera
    this.cameras.main.setBounds(0, 0, totalW, totalH);
    const fitZoom = Math.min(this.cameras.main.width / totalW, this.cameras.main.height / totalH, 1) * 0.95;
    this.cameras.main.setZoom(fitZoom);
    this.cameras.main.centerOn(totalW / 2, totalH / 2);

    this.buildGrid();
    this.renderGrid();
    this.spawnAGVs(agvs);
    this.setupControls();
  }

  // ─── 1. BUILD GRID ──────────────────────────────────────────────
  private buildGrid() {
    const { cols, rows } = this;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(TILE_FLOOR));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Outer wall ring
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          this.grid[r][c] = TILE_WALL;
          continue;
        }
        // Perimeter aisle (ring just inside walls)
        if (r === 1 || r === rows - 2 || c === 1 || c === cols - 2) {
          this.grid[r][c] = TILE_AISLE;
          continue;
        }

        // Dedicated Charging Zone (bottom-left corner of core)
        // Let's place 5-8 stations
        if (r === rows - 3 && c >= 2 && c <= 9) {
          this.grid[r][c] = TILE_CHARGING;
          continue;
        }

        // Inner core (r >= 2, c >= 2)
        const cr = r - 2;
        const cc = c - 2;
        // Rack blocks: 2 cols wide, 4 rows tall; separated by 1-col and 1-row aisles
        const isRackCol = cc % 3 < 2;
        const isRackRow = cr % 5 < 4;
        this.grid[r][c] = (isRackCol && isRackRow) ? TILE_RACK : TILE_AISLE;
      }
    }
  }

  // ─── 2. RENDER ──────────────────────────────────────────────────
  private renderGrid() {
    const { cols, rows, grid } = this;
    const totalW = cols * CELL;
    const totalH = rows * CELL;

    this.add.rectangle(totalW / 2, totalH / 2, totalW, totalH, COL_BG);

    const gfxGrid = this.add.graphics();
    gfxGrid.lineStyle(1, COL_GRID, 0.4);
    for (let c = 0; c <= cols; c++) { gfxGrid.moveTo(c * CELL, 0); gfxGrid.lineTo(c * CELL, totalH); }
    for (let r = 0; r <= rows; r++) { gfxGrid.moveTo(0, r * CELL); gfxGrid.lineTo(totalW, r * CELL); }
    gfxGrid.strokePath();

    const gfxWall  = this.add.graphics();
    const gfxAisle = this.add.graphics();
    const gfxRack  = this.add.graphics();
    const gfxCharge = this.add.graphics();
    const gfxTape  = this.add.graphics();
    gfxTape.lineStyle(3, COL_TAPE, 0.65);

    const rackColors = [COL_RACK_A, COL_RACK_B, COL_RACK_C];
    let blockIndex = 0;
    const coloredBlocks = new Map<string, number>();

    this.inventoryLayer = this.add.container(0, 0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * CELL;
        const py = r * CELL;
        const tile = grid[r][c];

        if (tile === TILE_WALL) {
          gfxWall.fillStyle(COL_WALL, 1);
          gfxWall.fillRect(px, py, CELL, CELL);
        } else if (tile === TILE_AISLE) {
          gfxAisle.fillStyle(COL_AISLE, 1);
          gfxAisle.fillRect(px, py, CELL, CELL);
          const cx = px + CELL / 2;
          const cy = py + CELL / 2;
          if (r > 0         && grid[r - 1][c] === TILE_AISLE) { gfxTape.beginPath(); gfxTape.moveTo(cx, cy); gfxTape.lineTo(cx, py);        gfxTape.strokePath(); }
          if (r < rows - 1  && grid[r + 1][c] === TILE_AISLE) { gfxTape.beginPath(); gfxTape.moveTo(cx, cy); gfxTape.lineTo(cx, py + CELL); gfxTape.strokePath(); }
          if (c > 0          && grid[r][c - 1] === TILE_AISLE) { gfxTape.beginPath(); gfxTape.moveTo(cx, cy); gfxTape.lineTo(px, cy);        gfxTape.strokePath(); }
          if (c < cols - 1   && grid[r][c + 1] === TILE_AISLE) { gfxTape.beginPath(); gfxTape.moveTo(cx, cy); gfxTape.lineTo(px + CELL, cy); gfxTape.strokePath(); }
        } else if (tile === TILE_CHARGING) {
          // Drawing charging station
          gfxCharge.fillStyle(COL_CHARGING, 1);
          gfxCharge.fillRoundedRect(px + 4, py + 4, CELL - 8, CELL - 8, 4);
          gfxCharge.lineStyle(2, COL_CHARGE_ICON, 0.6);
          gfxCharge.strokeRoundedRect(px + 4, py + 4, CELL - 8, CELL - 8, 4);
          
          // Small lightning icon
          const cx = px + CELL / 2;
          const cy = py + CELL / 2;
          this.add.text(cx, cy, '⚡', { fontSize: '14px', color: '#60a5fa' }).setOrigin(0.5).setDepth(5);
        } else if (tile === TILE_RACK) {
          const cr = r - 2;
          const cc = c - 2;
          const blockR = Math.floor(cr / 5) * 5 + 2;
          const blockC = Math.floor(cc / 3) * 3 + 2;
          const blockKey = `${blockR},${blockC}`;

          let color: number;
          if (coloredBlocks.has(blockKey)) {
            color = coloredBlocks.get(blockKey)!;
          } else {
            color = rackColors[blockIndex % rackColors.length];
            coloredBlocks.set(blockKey, color);
            blockIndex++;
          }

          gfxRack.fillStyle(color, 1);
          gfxRack.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          gfxRack.fillStyle(color + 0x111111, 0.6);
          gfxRack.fillRect(px + 4, py + 4, CELL - 8, CELL - 8);
          gfxRack.lineStyle(1, COL_RACK_BRD, 0.8);
          gfxRack.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);

          const slotNum = (Math.floor(cr / 5)) * Math.ceil((cols - 4) / 3) + Math.floor(cc / 3) + 1;
          const slotId = `S${slotNum}`;
          this.slotCoordinates.set(slotId, { x: px + CELL / 2, y: py + CELL / 2 });

          if (cr % 5 === 0 && cc % 3 === 0) {
            this.add.text(px + CELL, py + CELL, slotId, {
              fontSize: '9px',
              fontFamily: 'monospace',
              color: '#8899aa',
            }).setOrigin(0.5).setDepth(5);
          }
        }
      }
    }

    this.updateInventoryVisuals();
    useSimulationStore.subscribe(() => {
      this.needsInventoryUpdate = true;
    });

    const { warehouseConfig } = useSimulationStore.getState();
    const zoom = this.cameras.main.zoom;
    this.add.text(CELL + 10, CELL + 10, `⚙ ${warehouseConfig.id || 'WAREHOUSE SIM'}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#10b981',
      backgroundColor: '#0c122288',
      padding: { x: 8, y: 4 },
    }).setScale(1 / zoom).setDepth(30);
  }

  private updateInventoryVisuals() {
    const { inventory } = useSimulationStore.getState();
    this.inventoryLayer.removeAll(true);
    inventory.forEach(item => {
      if (item.slotId && this.slotCoordinates.has(item.slotId)) {
        const coords = this.slotCoordinates.get(item.slotId)!;
        const pkg = this.add.rectangle(coords.x, coords.y, CELL * 0.6, CELL * 0.6, 0xd97706);
        pkg.setStrokeStyle(1, 0x78350f);
        const tape = this.add.rectangle(coords.x, coords.y, CELL * 0.6, 2, 0x92400e);
        this.inventoryLayer.add([pkg, tape]);
      }
    });
    this.needsInventoryUpdate = false;
  }

  private agvSprites: Map<string, { container: Phaser.GameObjects.Container, label: Phaser.GameObjects.Text }> = new Map();
  private needsAGVUpdate = false;

  // ─── 3. AGV SYSTEM ──────────────────────────────────────────────
  private spawnAGVs(agvs: AGVData[]) {
    const half = CELL / 2;
    const TL = { x: 1 * CELL + half, y: 1 * CELL + half };
    const TR = { x: (this.cols - 2) * CELL + half, y: 1 * CELL + half };
    const BR = { x: (this.cols - 2) * CELL + half, y: (this.rows - 2) * CELL + half };
    const BL = { x: 1 * CELL + half, y: (this.rows - 2) * CELL + half };

    const SPEED = 100;

    agvs.forEach((agv, i) => {
      const isCharging = agv.status === 'charging';
      const col = agv.status === 'moving' ? 0x10b981 : isCharging ? 0xf59e0b : 0x3b82f6;
      
      let sx: number, sy: number;
      
      if (isCharging) {
        // Place in charging zone (row = rows-3, col = 2..9)
        sx = (2 + i % 8) * CELL + half;
        sy = (this.rows - 3) * CELL + half;
      } else {
        // Stagger start along top aisle
        sx = TL.x + (i * 3 * CELL) % ((this.cols - 4) * CELL);
        sy = TL.y;
      }

      const ct = this.add.container(sx, sy);
      
      const body = this.add.rectangle(0, 0, 28, 28, col).setStrokeStyle(2, 0x0a0f1a);
      ct.add([
        this.add.rectangle(0, -13, 20, 5, 0x0a0f1a),
        this.add.rectangle(0,  13, 20, 5, 0x0a0f1a),
        body,
        this.add.rectangle(13, 0, 4, 14, 0x22d3ee),
        this.add.circle(-10, -10, 3, 0xef4444),
      ]);
      
      const id = agv.id.split('-')[1] || '??';
      const lbl = this.add.text(sx, sy - 22, id, {
        fontSize: '11px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: col === 0x10b981 ? '#059669' : col === 0xf59e0b ? '#d97706' : '#2563eb',
        padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(20);

      this.agvSprites.set(agv.id, { container: ct, label: lbl });

      // Default patrol if moving
      if (agv.status === 'moving') {
        this.startPatrol(agv.id, sx, TL, TR, BR, BL, SPEED);
      } else if (isCharging) {
        ct.setRotation(-Math.PI / 2); // Face the charger
      }
    });

    useSimulationStore.subscribe((state) => {
      this.syncAGVs(state.agvs);
    });
  }

  private startPatrol(id: string, sx: number, TL: any, TR: any, BR: any, BL: any, SPEED: number) {
    const sprite = this.agvSprites.get(id);
    if (!sprite) return;
    const { container: ct } = sprite;

    const dTR = Math.max(1, (TR.x - sx) / CELL);
    const dRB = (BR.y - TR.y) / CELL;
    const dBL = (BR.x - BL.x) / CELL;
    const dLT = (BL.y - TL.y) / CELL;
    const dBack = Math.max(1, (sx - TL.x) / CELL);

    this.tweens.chain({
      targets: ct,
      loop: -1,
      persist: true,
      tweens: [
        { x: TR.x, y: TR.y, duration: dTR * SPEED, onStart: () => ct.setRotation(0) },
        { x: BR.x, y: BR.y, duration: dRB * SPEED, onStart: () => ct.setRotation(Math.PI / 2) },
        { x: BL.x, y: BL.y, duration: dBL * SPEED, onStart: () => ct.setRotation(Math.PI) },
        { x: TL.x, y: TL.y, duration: dLT * SPEED, onStart: () => ct.setRotation(-Math.PI / 2) },
        { x: sx,   y: TL.y, duration: dBack * SPEED, onStart: () => ct.setRotation(0) },
      ],
    });
  }

  private syncAGVs(agvs: AGVData[]) {
    agvs.forEach(agv => {
      const sprite = this.agvSprites.get(agv.id);
      if (sprite) {
        const col = agv.status === 'moving' ? 0x10b981 : agv.status === 'charging' ? 0xf59e0b : 0x3b82f6;
        const body = sprite.container.list[2] as Phaser.GameObjects.Rectangle;
        if (body) body.setFillStyle(col);
        
        sprite.label.setBackgroundColor(col === 0x10b981 ? '#059669' : col === 0xf59e0b ? '#d97706' : '#2563eb');
        
        // Handle movement stop/start
        if (agv.status !== 'moving') {
          this.tweens.killTweensOf(sprite.container);
        } else if (!this.tweens.isTweening(sprite.container)) {
          // Restart patrol or move to target (simplified: just restart patrol for now)
          // In a real app, we'd move to agv.targetSlot
        }
      }
    });
  }

  private setupControls() {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      this.cameras.main.scrollX -= (p.x - p.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (p.y - p.prevPosition.y) / this.cameras.main.zoom;
    });
    this.input.on('wheel', (_p: any, _g: any, _dx: any, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, 0.15, 4));
    });
  }

  update() {
    if (this.needsInventoryUpdate) {
      this.updateInventoryVisuals();
    }
    // Update labels position
    this.agvSprites.forEach(sprite => {
      sprite.label.setPosition(sprite.container.x, sprite.container.y - 22);
    });
  }
}
