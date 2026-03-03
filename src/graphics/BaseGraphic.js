import Phaser from 'phaser';

export class BaseGraphic {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.gameObject = this.create(config);

        if (config.depth !== undefined) {
            this.gameObject.setDepth(config.depth);
        }

        if (config.alpha !== undefined && this.gameObject.setAlpha) {
            this.gameObject.setAlpha(config.alpha);
        }

        if (config.layer) {
            const layer = this.scene.cameraManager.getLayer(config.layer);
            if (layer) {
                layer.add(this.gameObject);
            }
        }
    }

    /**
     * @abstract
     * Create and return the Phaser GameObject here.
     */
    create(config) {
        throw new Error("BaseGraphic.create() must be implemented.");
    }

    update(time, delta) {
        if (!this.gameObject) return;
        this.onUpdate(time, delta);
    }

    onUpdate(time, delta) {
        // Optional override
    }

    destroy() {
        if (this.gameObject) this.gameObject.destroy();
        this.gameObject = null;
    }
}
