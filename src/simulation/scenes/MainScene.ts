import * as Phaser from 'phaser';
import { useSimulationStore } from '../../store/useSimulationStore';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // We can load assets here later
  }

  create() {
    // Get configuration from our Zustand store
    const { warehouseConfig, agvs } = useSimulationStore.getState();
    const { width, height, layoutType } = warehouseConfig;

    // We set the world bounds according to the store, not just camera width
    // But for visualization scale, let's just use the config directly
    // and let the camera zoom/pan if it's too big, or scale it to fit.
    const boardWidth = width > 0 ? width : this.cameras.main.width;
    const boardHeight = height > 0 ? height : this.cameras.main.height;

    // Enable zooming and panning for the camera to view the whole warehouse
    this.cameras.main.setBounds(0, 0, boardWidth, boardHeight);
    
    // Auto scale to fit if board is larger than camera
    const zoomX = this.cameras.main.width / boardWidth;
    const zoomY = this.cameras.main.height / boardHeight;
    const minZoom = Math.min(zoomX, zoomY, 1) * 0.9; // 0.9 to give some margin
    this.cameras.main.setZoom(minZoom);
    this.cameras.main.centerOn(boardWidth / 2, boardHeight / 2);

    // Add grid background representing the floor
    this.add.grid(
      boardWidth / 2,
      boardHeight / 2,
      boardWidth,
      boardHeight,
      50,
      50,
      0x1e293b,
      1,
      0x334155,
      1
    );

    // Mock warehouse walls/boundaries
    const wallColor = 0x94a3b8;
    this.add.rectangle(boardWidth / 2, 10, boardWidth, 20, wallColor);
    this.add.rectangle(boardWidth / 2, boardHeight - 10, boardWidth, 20, wallColor);
    this.add.rectangle(10, boardHeight / 2, 20, boardHeight, wallColor);
    this.add.rectangle(boardWidth - 10, boardHeight / 2, 20, boardHeight, wallColor);

    // Mock shelves based on LayoutType
    const shelfColor = 0x475569;
    const rows = layoutType === 'dense' ? 8 : 4;
    const cols = layoutType === 'dense' ? 6 : 4;
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Just draw them spread out within the board
        const xPos = 150 + i * (boardWidth / (cols + 1));
        const yPos = 150 + j * (boardHeight / (rows + 1));
        if (xPos < boardWidth - 100 && yPos < boardHeight - 100) {
          this.add.rectangle(xPos, yPos, boardWidth / (cols * 2), boardHeight / (rows * 3), shelfColor);
        }
      }
    }

    // Mock text
    this.add.text(30, 30, `Phaser Warehouse: ${warehouseConfig.id || 'Simulation'}`, {
      fontSize: '24px',
      color: '#cbd5e1',
    }).setScale(1 / minZoom); // keep text readable regardless of zoom

    // Mock AGVs from store state
    agvs.forEach((agvState, index) => {
      const color = agvState.status === 'moving' ? 0x10b981 : agvState.status === 'charging' ? 0xf59e0b : 0x3b82f6;
      const agv = this.add.rectangle(50, 100 + (index * 50), 30, 30, color);
      
      if (agvState.status === 'moving') {
        this.tweens.add({
          targets: agv,
          x: boardWidth - 100,
          duration: 4000 + (index * 500),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Add dragging to move camera
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      this.cameras.main.scrollX -= (p.x - p.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (p.y - p.prevPosition.y) / this.cameras.main.zoom;
    });

    // Add scroll wheel to zoom
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      let zoom = this.cameras.main.zoom;
      zoom -= deltaY * 0.001;
      this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.1, 3));
    });
  }

  update() {
    // We could subscribe to the store here to update AGV positions in real-time
  }
}
