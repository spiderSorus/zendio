import { LAYERS } from '../core/Constants';
import { CircleGraphic } from '../graphics/CircleGraphic';
import BaseScene from './BaseScene';

export default class MainScene extends BaseScene {
    constructor() {
        super('MainScene');
    }

    setupScene() {
        const { width, height } = this.scale;

        this.graphics.push(new CircleGraphic(this, {
            x: width * 0.3,
            y: height * 0.4,
            radius: 300,
            color: 0x330033,
            layer: LAYERS.BACKGROUND
        }));

        for (let i = 0; i < 12; i++) {
            this.graphics.push(new CircleGraphic(this, {
                x: width * 0.2 + (i * 80),
                y: height * 0.5,
                radius: 60,
                color: 0xff00ff,
                alpha: 0.8,
                layer: LAYERS.MIDGROUND
            }));
        }

        this.graphics.push(new CircleGraphic(this, {
            x: width * 0.7,
            y: height * 0.6,
            radius: 120,
            color: 0xffffff,
            alpha: 0.5,
            layer: LAYERS.FOREGROUND
        }));
    }
}
