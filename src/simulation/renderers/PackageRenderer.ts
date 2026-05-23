import * as Phaser from 'phaser';
import { type InboundPackage } from '../../store/types';
import { CELL } from './GridRenderer';

export class PackageRenderer {
  private scene: Phaser.Scene;
  private packageSprites: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public syncPackages(queue: InboundPackage[]) {
    const currentIds = new Set(queue.map(p => p.id));

    // Xoá các package không còn trong queue (đã được AGV nhặt)
    this.packageSprites.forEach((container, id) => {
      if (!currentIds.has(id)) {
        container.destroy();
        this.packageSprites.delete(id);
      }
    });

    // Thêm các package mới
    queue.forEach(pkg => {
      if (!this.packageSprites.has(pkg.id)) {
        const half = CELL / 2;
        const px = pkg.x * CELL + half;
        const py = pkg.y * CELL + half;

        const container = this.scene.add.container(px, py);
        
        // Vẽ hộp hàng màu nâu (bằng gỗ/carton)
        const box = this.scene.add.rectangle(0, 0, CELL - 10, CELL - 10, 0x8b5a2b);
        box.setStrokeStyle(2, 0x5c3a21); // Viền hộp sậm màu hơn
        
        // Vẽ băng dính dán trên hộp
        const tape = this.scene.add.rectangle(0, 0, CELL - 10, 6, 0xc19a6b);
        
        // Vẽ icon/nhãn nhỏ
        const icon = this.scene.add.text(0, 0, '📦', { fontSize: '12px' }).setOrigin(0.5);

        container.add([box, tape, icon]);
        container.setDepth(4); // Nằm trên Grid nhưng dưới AGV (AGV depth ~20)

        this.packageSprites.set(pkg.id, container);
      }
    });
  }

  public clear() {
    this.packageSprites.forEach(c => c.destroy());
    this.packageSprites.clear();
  }
}
