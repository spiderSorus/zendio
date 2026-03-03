import { LAYERS } from '../core/Constants';
import { CircleGraphic } from '../graphics/CircleGraphic';
import BaseScene from './BaseScene';

export default class NoiseScene extends BaseScene {
    constructor() {
        super('NoiseScene');
    }

    setupScene() {
        const { width, height } = this.scale;

        // Create a different pattern
        for (let i = 0; i < 20; i++) {
            this.graphics.push(new CircleGraphic(this, {
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 50 + 10,
                color: Phaser.Display.Color.RandomRGB().color,
                layer: LAYERS.MIDGROUND
            }));
        }
    }
}
