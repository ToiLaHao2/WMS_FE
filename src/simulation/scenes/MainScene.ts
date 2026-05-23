import * as Phaser from 'phaser';
import { useSimulationStore, type LayoutGrid } from '../../store/useSimulationStore';
import { GridRenderer, CELL, GRID_AISLE, GRID_BLOCKED, GRID_STORAGE } from '../renderers/GridRenderer';
import { AGVRenderer } from '../renderers/AGVRenderer';
import { PackageRenderer } from '../renderers/PackageRenderer';

// ────────────────────────────────────────────────────────────────
// SCENE
// ────────────────────────────────────────────────────────────────
export default class MainScene extends Phaser.Scene {
  private grid: number[][] = [];
  private cols = 0;
  private rows = 0;
  
  private gridRenderer!: GridRenderer;
  private agvRenderer!: AGVRenderer;
  private packageRenderer!: PackageRenderer;
  private inventoryLayer!: Phaser.GameObjects.Container;
  private needsInventoryUpdate = false;
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() { /* assets later */ }

  create() {
    const { warehouseConfig, agvs, layoutGrid, slots, inboundQueue } = useSimulationStore.getState();
    
    // Cleanup subscriptions on shutdown
    this.events.once('shutdown', () => {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = [];
    });
    
    // Use width/height directly as cols/rows
    this.cols = warehouseConfig.width;
    this.rows = warehouseConfig.height;
    const totalW = this.cols * CELL;
    const totalH = this.rows * CELL;

    // Camera
    this.cameras.main.setBounds(0, 0, totalW, totalH);
    const fitZoom = Math.min(this.cameras.main.width / totalW, this.cameras.main.height / totalH, 1) * 0.95;
    this.cameras.main.setZoom(fitZoom);
    this.cameras.main.centerOn(totalW / 2, totalH / 2);

    // Initialize Renderers
    this.gridRenderer = new GridRenderer(this);
    this.agvRenderer = new AGVRenderer(this);
    this.packageRenderer = new PackageRenderer(this);

    this.buildGrid(layoutGrid);
    this.gridRenderer.render(this.grid, this.cols, this.rows, slots);
    this.agvRenderer.spawnAGVs(agvs, this.cols, this.rows);
    this.packageRenderer.syncPackages(inboundQueue);
    
    // Setup Inventory visuals
    this.inventoryLayer = this.add.container(0, 0);
    this.updateInventoryVisuals();
    
    // UI Label
    this.add.text(CELL + 10, CELL + 10, `⚙ ${warehouseConfig.code || warehouseConfig.id || 'WAREHOUSE SIM'}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#10b981',
      backgroundColor: '#0c122288',
      padding: { x: 8, y: 4 },
    }).setScale(1 / fitZoom).setDepth(30);

    // Subscriptions
    const unsubInv = useSimulationStore.subscribe((state, prevState) => {
      if (state.inventory !== prevState.inventory) {
        this.needsInventoryUpdate = true;
      }
    });
    const unsubAgv = useSimulationStore.subscribe((state, prevState) => {
      if (state.agvs !== prevState.agvs) {
        this.agvRenderer.syncAGVs(state.agvs);
      }
    });
    // Subscribe to slot status changes — live update kệ trống/có hàng
    const unsubSlots = useSimulationStore.subscribe((state, prevState) => {
      if (state.slots !== prevState.slots) {
        this.gridRenderer.updateSlotStatuses(state.slots);
      }
    });
    // Subscribe to inbound queue
    const unsubInbound = useSimulationStore.subscribe((state, prevState) => {
      if (state.inboundQueue !== prevState.inboundQueue) {
        this.packageRenderer.syncPackages(state.inboundQueue);
      }
    });
    this.unsubscribers.push(unsubInv, unsubAgv, unsubSlots, unsubInbound);

    this.setupControls();
  }

  // ─── 1. BUILD GRID ──────────────────────────────────────────────
  private buildGrid(layoutGrid: LayoutGrid | null) {
    const { cols, rows } = this;

    if (layoutGrid && layoutGrid.length > 0) {
      // Trust the backend layout data
      this.grid = layoutGrid;
      // Sync rows/cols if they differ from config for any reason
      this.rows = layoutGrid.length;
      this.cols = layoutGrid[0].length;
    } else {
      // Fallback: generate locally
      this.grid = Array.from({ length: rows }, () => Array(cols).fill(GRID_AISLE));
      // ... (giữ nguyên logic fallback)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
            this.grid[r][c] = GRID_BLOCKED;
            continue;
          }
          if (r >= 2 && r < rows - 2 && c >= 2 && c < cols - 2) {
            const cr = r - 2;
            const cc = c - 2;
            const isRackCol = cc % 3 < 2;
            const isRackRow = cr % 5 < 4;
            if (isRackCol && isRackRow) {
              this.grid[r][c] = GRID_STORAGE;
            }
          }
        }
      }
    }
  }

  private updateInventoryVisuals() {
    const { inventory } = useSimulationStore.getState();
    this.inventoryLayer.removeAll(true);
    inventory.forEach(item => {
      if (item.slotId && this.gridRenderer.slotCoordinates.has(item.slotId)) {
        const coords = this.gridRenderer.slotCoordinates.get(item.slotId)!;
        const pkg = this.add.rectangle(coords.x, coords.y, CELL * 0.6, CELL * 0.6, 0xd97706);
        pkg.setStrokeStyle(1, 0x78350f);
        const tape = this.add.rectangle(coords.x, coords.y, CELL * 0.6, 2, 0x92400e);
        this.inventoryLayer.add([pkg, tape]);
      }
    });
    this.needsInventoryUpdate = false;
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
    this.agvRenderer.updatePositions();
  }
}
