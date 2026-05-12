import * as Phaser from 'phaser';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────
export const CELL = 40;                // Grid cell size in pixels

// Grid values (must match backend)
export const GRID_AISLE = 0;
export const GRID_STORAGE = 1;
export const GRID_BLOCKED = 2;
export const GRID_CHARGING = 3;
export const GRID_INBOUND = 4;
export const GRID_OUTBOUND = 5;

// Palette
export const COL_BG = 0x0c1222; // Deep navy background
export const COL_GRID = 0x162033; // Subtle grid lines
export const COL_WALL = 0x1e3a8a; // Dark Blue (Tường bao xanh dương đậm)
export const COL_AISLE = 0x1c2d45; // Aisle floor (slightly lighter)
export const COL_TAPE = 0xeab308; // Yellow guidance tape
export const COL_RACK_A = 0x374f6e; // Rack variant A (cool blue-grey)
export const COL_RACK_B = 0x2d5a4c; // Rack variant B (teal-green)
export const COL_RACK_C = 0x5a3d2d; // Rack variant C (warm brown)
export const COL_RACK_BRD = 0x0f1b2d; // Rack border
export const COL_CHARGING = 0x1e3a8a; // Charging station base (deep blue)
export const COL_CHARGE_ICON = 0x60a5fa; // Icon color (bright blue)
export const COL_INBOUND = 0xef4444; // Red for IN
export const COL_OUTBOUND = 0x10b981; // Green for OUT

export class GridRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  public slotCoordinates: Map<string, { x: number, y: number }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public clear() {
    this.graphics.forEach(g => g.destroy());
    this.texts.forEach(t => t.destroy());
    this.graphics = [];
    this.texts = [];
    this.slotCoordinates.clear();
  }

  public render(grid: number[][], cols: number, rows: number) {
    this.clear();
    const totalW = cols * CELL;
    const totalH = rows * CELL;

    // Background
    const bg = this.scene.add.rectangle(totalW / 2, totalH / 2, totalW, totalH, COL_BG);
    bg.setDepth(0);

    const gfxGrid = this.scene.add.graphics();
    gfxGrid.lineStyle(1, COL_GRID, 0.4);
    for (let c = 0; c <= cols; c++) { gfxGrid.moveTo(c * CELL, 0); gfxGrid.lineTo(c * CELL, totalH); }
    for (let r = 0; r <= rows; r++) { gfxGrid.moveTo(0, r * CELL); gfxGrid.lineTo(totalW, r * CELL); }
    gfxGrid.strokePath();
    this.graphics.push(gfxGrid);

    const gfxWall = this.scene.add.graphics();
    const gfxAisle = this.scene.add.graphics();
    const gfxRack = this.scene.add.graphics();
    const gfxCharge = this.scene.add.graphics();
    const gfxDock = this.scene.add.graphics();
    const gfxTape = this.scene.add.graphics();
    gfxTape.lineStyle(3, COL_TAPE, 0.65);

    this.graphics.push(gfxWall, gfxAisle, gfxRack, gfxCharge, gfxDock, gfxTape);

    const rackColors = [COL_RACK_A, COL_RACK_B, COL_RACK_C];
    let blockIndex = 0;
    const coloredBlocks = new Map<string, number>();

    // Calculate Bounding Boxes for Racks and Charging to draw Smart Paths
    let minRackR = rows, maxRackR = 0, minRackC = cols, maxRackC = 0;
    let chargeRow = -1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === GRID_STORAGE) {
          if (r < minRackR) minRackR = r;
          if (r > maxRackR) maxRackR = r;
          if (c < minRackC) minRackC = c;
          if (c > maxRackC) maxRackC = c;
        } else if (grid[r][c] === GRID_CHARGING) {
          chargeRow = r;
        }
      }
    }

    // --- Generate NavMesh Path Graph ---
    const isRackCol = (col: number) => {
      for (let r = 0; r < rows; r++) if (grid[r][col] === GRID_STORAGE) return true;
      return false;
    };
    const isRackRow = (row: number) => {
      for (let c = 0; c < cols; c++) if (grid[row][c] === GRID_STORAGE) return true;
      return false;
    };

    const horizontalPathRows = new Set<number>();
    horizontalPathRows.add(1); // Top Highway
    horizontalPathRows.add(maxRackR + 1); // Bottom Highway
    for (let r = minRackR; r <= maxRackR; r++) {
      if (!isRackRow(r)) horizontalPathRows.add(r); // Intermediate cross-aisles
    }

    const verticalPathCols = new Set<number>();
    for (let c = minRackC - 1; c <= maxRackC + 1; c++) {
      if (!isRackCol(c)) verticalPathCols.add(c); // Main vertical aisles
    }

    const dockCols = new Set<number>();
    const chargeCols = new Set<number>();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === GRID_INBOUND || grid[r][c] === GRID_OUTBOUND) {
          dockCols.add(c);
        }
        if (grid[r][c] === GRID_CHARGING) {
          chargeCols.add(c);
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * CELL;
        const py = r * CELL;
        const tile = grid[r][c];

        // --- Graph-based Highway Routing ---
        const isHPath = horizontalPathRows.has(r) && c >= minRackC - 1 && c <= maxRackC + 1;

        let isVPath = false;
        if (verticalPathCols.has(c) && r >= 1 && r <= maxRackR + 1) isVPath = true;
        if (dockCols.has(c) && r >= maxRackR + 1 && r < rows - 1) isVPath = true;
        if (chargeCols.has(c) && r >= maxRackR + 1 && r < chargeRow) isVPath = true;

        if (tile === GRID_BLOCKED) {
          gfxWall.fillStyle(COL_WALL, 1);
          gfxWall.fillRect(px, py, CELL, CELL);
        } else if (tile === GRID_AISLE) {
          gfxAisle.fillStyle(COL_AISLE, 1);
          gfxAisle.fillRect(px, py, CELL, CELL);
        }

        // Draw NavMesh paths (even on EMPTY tiles if they are branches)
        if (tile === GRID_AISLE || tile === 0) { // 0 is GRID_EMPTY
          if (isHPath || isVPath) {
            const cx = px + CELL / 2;
            const cy = py + CELL / 2;

            // Draw Dotted Line segments (5 evenly spaced dots per cell)
            gfxTape.fillStyle(COL_TAPE, 0.8);
            const offsets = [-16, -8, 0, 8, 16]; // 40px cell divided by 5 gives 8px spacing

            // Determine endpoints to cut off redundant "stubs"
            const isLeftEnd = isHPath && c === minRackC - 1;
            const isRightEnd = isHPath && c === maxRackC + 1;
            
            // A vertical path is a "Top End" (shouldn't go further up) if it's at r=1 (Top Highway)
            // OR if it's a branch starting at the Bottom Highway and there's no vertical aisle above it.
            const isTopEnd = isVPath && (r === 1 || (r === maxRackR + 1 && !verticalPathCols.has(c)));
            
            // A vertical path is a "Bottom End" (shouldn't go further down) if it's an aisle ending at the Bottom Highway
            // with no docks or chargers below it.
            const isBottomEnd = isVPath && r === maxRackR + 1 && !dockCols.has(c) && !chargeCols.has(c);

            if (isHPath) {
              offsets.forEach(offset => {
                if (isLeftEnd && offset < 0) return; // Cut off left stub
                if (isRightEnd && offset > 0) return; // Cut off right stub
                gfxTape.fillCircle(cx + offset, cy, 1.5);
              });
            }
            if (isVPath) {
              offsets.forEach(offset => {
                if (isTopEnd && offset < 0) return; // Cut off top stub
                if (isBottomEnd && offset > 0) return; // Cut off bottom stub

                // Avoid drawing the center dot twice at intersections
                if (offset === 0 && isHPath) return;

                gfxTape.fillCircle(cx, cy + offset, 1.5);
              });
            }
          }
        } else if (tile === GRID_CHARGING) {
          // Drawing charging station
          gfxCharge.fillStyle(COL_CHARGING, 1);
          gfxCharge.fillRoundedRect(px + 4, py + 4, CELL - 8, CELL - 8, 4);
          gfxCharge.lineStyle(2, COL_CHARGE_ICON, 0.6);
          gfxCharge.strokeRoundedRect(px + 4, py + 4, CELL - 8, CELL - 8, 4);

          // Lightning icon
          const cx = px + CELL / 2;
          const cy = py + CELL / 2;
          const icon = this.scene.add.text(cx, cy, '⚡', { fontSize: '14px', color: '#60a5fa' }).setOrigin(0.5).setDepth(5);
          this.texts.push(icon);
        } else if (tile === GRID_STORAGE) {
          // Rack coloring by block
          const cr = r - 2;
          const cc = c - 2;
          const blockR = Math.floor(Math.max(0, cr) / 5) * 5 + 2;
          const blockC = Math.floor(Math.max(0, cc) / 3) * 3 + 2;
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

          // Slot label
          const slotCode = `R${r}-C${c}`;
          this.slotCoordinates.set(slotCode, { x: px + CELL / 2, y: py + CELL / 2 });

          // Show label on first cell of each block
          if (Math.max(0, cr) % 5 === 0 && Math.max(0, cc) % 3 === 0) {
            const txt = this.scene.add.text(px + CELL, py + CELL, slotCode, {
              fontSize: '8px',
              fontFamily: 'monospace',
              color: '#8899aa',
            }).setOrigin(0.5).setDepth(5);
            this.texts.push(txt);
          }
        } else if (tile === GRID_INBOUND || tile === GRID_OUTBOUND) {
          const isIN = tile === GRID_INBOUND;
          gfxDock.fillStyle(isIN ? COL_INBOUND : COL_OUTBOUND, 0.2);
          gfxDock.fillRect(px, py, CELL, CELL);
          gfxDock.lineStyle(1, isIN ? COL_INBOUND : COL_OUTBOUND, 0.8);
          gfxDock.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);

          // Striped pattern
          gfxDock.lineStyle(2, isIN ? COL_INBOUND : COL_OUTBOUND, 0.3);
          gfxDock.beginPath();
          gfxDock.moveTo(px, py + CELL);
          gfxDock.lineTo(px + CELL, py);
          gfxDock.strokePath();

          // Label at the beginning of the dock block
          const isStartOfDock = c === 0 || grid[r][c - 1] !== tile;
          if (r === rows - 2 && isStartOfDock) {
            const txt = this.scene.add.text(px + CELL, py - 10, isIN ? 'INBOUND DOCK' : 'OUTBOUND DOCK', {
              fontSize: '12px',
              fontFamily: 'monospace',
              fontStyle: 'bold',
              color: isIN ? '#ef4444' : '#10b981',
            }).setOrigin(0, 0.5).setDepth(5);
            this.texts.push(txt);
          }
        }
      }
    }
  }
}
