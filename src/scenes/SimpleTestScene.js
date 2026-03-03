import { LAYERS, RESOLUTION } from '../core/Constants';
import BaseScene from './BaseScene';

export default class SimpleTestScene extends BaseScene {
    constructor() {
        super('SimpleTestScene');
    }

    setupScene() {
        const midLayer = this.cameraManager.getLayer(LAYERS.MIDGROUND);

        const testText = this.add.text(0, 0, 'test', {
            fontSize: '120px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        midLayer.add(testText);
    }
}
