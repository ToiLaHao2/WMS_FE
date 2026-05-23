import * as Phaser from 'phaser';
import { type AGVData } from '../../store/useSimulationStore';
import { CELL } from './GridRenderer';

export class AGVRenderer {
  private scene: Phaser.Scene;
  private agvSprites: Map<string, { container: Phaser.GameObjects.Container, label: Phaser.GameObjects.Text }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnAGVs(agvs: AGVData[], _cols: number, _rows: number) {
    const half = CELL / 2;


    agvs.forEach((agv) => {
      const isCharging = agv.status === 'charging';
      const col = agv.status === 'moving' ? 0x10b981 : isCharging ? 0xf59e0b : 0x3b82f6;

      // Use AGV's grid coordinates to place them on the map
      let sx = agv.x * CELL + half;
      let sy = agv.y * CELL + half;

      const ct = this.scene.add.container(sx, sy);

      const body = this.scene.add.rectangle(0, 0, 28, 28, col).setStrokeStyle(2, 0x0a0f1a);
      
      // Hộp hàng thu nhỏ trên lưng AGV (mặc định ẩn)
      const carryBox = this.scene.add.rectangle(0, 0, 16, 16, 0x8b5a2b).setStrokeStyle(1, 0x5c3a21);
      carryBox.setVisible(agv.isCarrying === true);

      ct.add([
        this.scene.add.rectangle(0, -13, 20, 5, 0x0a0f1a),
        this.scene.add.rectangle(0, 13, 20, 5, 0x0a0f1a),
        body,
        this.scene.add.rectangle(13, 0, 4, 14, 0x22d3ee),
        this.scene.add.circle(-10, -10, 3, 0xef4444),
        carryBox // Hộp hàng được add vào cuối cùng để nổi lên trên
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

      // Nếu đang sạc thì quay đầu xe
      if (isCharging) {
        ct.setRotation(-Math.PI / 2);
      }
    });
  }

  public syncAGVs(agvs: AGVData[]) {
    const half = CELL / 2;

    agvs.forEach(agv => {
      const sprite = this.agvSprites.get(agv.id);
      if (sprite) {
        // Cập nhật màu sắc theo trạng thái
        const col = agv.status === 'moving' ? 0x10b981 : agv.status === 'charging' ? 0xf59e0b : 0x3b82f6;
        const body = sprite.container.list[2] as Phaser.GameObjects.Rectangle;
        if (body) body.setFillStyle(col);

        // Cập nhật hiển thị hộp hàng trên lưng AGV
        const carryBox = sprite.container.list[5] as Phaser.GameObjects.Rectangle;
        if (carryBox) {
          carryBox.setVisible(agv.isCarrying === true);
        }

        sprite.label.setBackgroundColor(col === 0x10b981 ? '#059669' : col === 0xf59e0b ? '#d97706' : '#2563eb');

        // Cập nhật tọa độ di chuyển mượt mà (real-time từ Kafka/WebSocket)
        const targetX = agv.x * CELL + half;
        const targetY = agv.y * CELL + half;

        // Nếu tọa độ thay đổi, tạo tween để xe chạy tới đó
        if (sprite.container.x !== targetX || sprite.container.y !== targetY) {
          // Xoay xe hướng tới đích
          const angle = Phaser.Math.Angle.Between(sprite.container.x, sprite.container.y, targetX, targetY);
          sprite.container.setRotation(angle);

          this.scene.tweens.add({
            targets: sprite.container,
            x: targetX,
            y: targetY,
            duration: 400, // Tốc độ di chuyển giữa 2 ô (có thể tinh chỉnh theo tốc độ Kafka bắn)
            ease: 'Linear'
          });
        }
      }
    });
  }

  public updatePositions() {
    this.agvSprites.forEach(sprite => {
      sprite.label.setPosition(sprite.container.x, sprite.container.y - 22);
    });
  }

  // Đã xóa hàm startPatrol vì giờ chạy bằng real-time data
}
