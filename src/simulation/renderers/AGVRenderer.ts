import * as Phaser from 'phaser';
import { type AGVData } from '../../store/useSimulationStore';
import { CELL } from './GridRenderer';

export class AGVRenderer {
  private scene: Phaser.Scene;
  private agvSprites: Map<string, { container: Phaser.GameObjects.Container, label: Phaser.GameObjects.Text }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnAGVs(agvs: AGVData[], cols: number, rows: number) {
    const half = CELL / 2;
    const TL = { x: 1 * CELL + half, y: 1 * CELL + half };
    const TR = { x: (cols - 2) * CELL + half, y: 1 * CELL + half };
    const BR = { x: (cols - 2) * CELL + half, y: (rows - 2) * CELL + half };
    const BL = { x: 1 * CELL + half, y: (rows - 2) * CELL + half };

    const SPEED = 100;

    agvs.forEach((agv) => {
      const isCharging = agv.status === 'charging';
      const col = agv.status === 'moving' ? 0x10b981 : isCharging ? 0xf59e0b : 0x3b82f6;
      
      // Use AGV's grid coordinates to place them on the map
      let sx = agv.x * CELL + half;
      let sy = agv.y * CELL + half;

      const ct = this.scene.add.container(sx, sy);
      
      const body = this.scene.add.rectangle(0, 0, 28, 28, col).setStrokeStyle(2, 0x0a0f1a);
      ct.add([
        this.scene.add.rectangle(0, -13, 20, 5, 0x0a0f1a),
        this.scene.add.rectangle(0,  13, 20, 5, 0x0a0f1a),
        body,
        this.scene.add.rectangle(13, 0, 4, 14, 0x22d3ee),
        this.scene.add.circle(-10, -10, 3, 0xef4444),
      ]);
      
      const id = agv.id.split('-')[1] || '??';
      const lbl = this.scene.add.text(sx, sy - 22, id, {
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
        ct.setRotation(-Math.PI / 2);
      }
    });
  }

  public syncAGVs(agvs: AGVData[]) {
    agvs.forEach(agv => {
      const sprite = this.agvSprites.get(agv.id);
      if (sprite) {
        const col = agv.status === 'moving' ? 0x10b981 : agv.status === 'charging' ? 0xf59e0b : 0x3b82f6;
        const body = sprite.container.list[2] as Phaser.GameObjects.Rectangle;
        if (body) body.setFillStyle(col);
        
        sprite.label.setBackgroundColor(col === 0x10b981 ? '#059669' : col === 0xf59e0b ? '#d97706' : '#2563eb');
        
        if (agv.status !== 'moving') {
          this.scene.tweens.killTweensOf(sprite.container);
        }
      }
    });
  }

  public updatePositions() {
    this.agvSprites.forEach(sprite => {
      sprite.label.setPosition(sprite.container.x, sprite.container.y - 22);
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

    this.scene.tweens.chain({
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
}
