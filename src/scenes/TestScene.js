import { LAYERS } from '../core/Constants';
import BaseScene from './BaseScene';

export default class TestScene extends BaseScene {
    constructor() {
        super('TestScene');
    }

    setupScene() {
        const { width, height } = this.scale;

        // Simple pulsing square in the middle
        this.rect = this.add.rectangle(width / 2, height / 2, 400, 400, 0x00ff00);
        this.cameraManager.getLayer(LAYERS.MIDGROUND).add(this.rect);
    }

    update(time, delta) {
        super.update(time, delta);
        if (this.rect) {
            const scale = 1 + Math.sin(time / 1000) * 0.2;
            this.rect.setScale(scale);
            this.rect.rotation += 0.01;
        }
    }
}
