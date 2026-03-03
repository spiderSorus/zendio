import { BaseGraphic } from './BaseGraphic';
import { getLoopSin, getLoopCos } from '../utils/Loop';
import { LOOP_DURATION } from '../core/Constants';

export class WatercolorGraphic extends BaseGraphic {
    create(config) {
        const radius = config.radius || 32;
        const width = config.width || radius * 2;
        const height = config.height || radius * 2;
        const color = config.color !== undefined ? config.color : 0xffffff;
        const layers = config.layers || 5;
        const shape = config.shape || 'circle';
        
        const container = this.scene.add.container(0, 0);
        this.blobs = [];

        for (let i = 0; i < layers; i++) {
            const jitterScale = (1 + (Math.random() * 0.4 - 0.2));
            const alpha = 0.4 + (Math.random() * 0.4);
            let blob;

            if (shape === 'rect') {
                blob = this.scene.add.rectangle(
                    (Math.random() * 20 - 10),
                    (Math.random() * 20 - 10),
                    width * jitterScale,
                    height * jitterScale,
                    color,
                    alpha
                );
            } else if (shape === 'oval') {
                blob = this.scene.add.ellipse(
                    (Math.random() * 20 - 10),
                    (Math.random() * 20 - 10),
                    width * jitterScale,
                    height * jitterScale,
                    color,
                    alpha
                );
            } else {
                blob = this.scene.add.circle(
                    (Math.random() * 10 - 5),
                    (Math.random() * 10 - 5),
                    radius * jitterScale,
                    color,
                    alpha
                );
            }
            
            container.add(blob);
            this.blobs.push({
                obj: blob,
                baseW: width * jitterScale,
                baseH: height * jitterScale,
                baseR: radius * jitterScale,
                shape: shape,
                seed: Math.random() * LOOP_DURATION, // Use LOOP_DURATION for seed phase
                offsetX: blob.x,
                offsetY: blob.y
            });
        }

        return container;
    }

    onUpdate(time, delta) {
        if (!this.gameObject) return;

        this.blobs.forEach(blob => {
            // Use getLoopSin with seed offset for seamless wobble
            const wobble = getLoopSin(time + blob.seed, LOOP_DURATION) * 2;
            
            if (blob.shape === 'rect' || blob.shape === 'oval') {
                blob.obj.setSize(blob.baseW + wobble, blob.baseH + wobble);
            } else {
                blob.obj.setRadius(blob.baseR + wobble);
            }

            blob.obj.x = blob.offsetX + getLoopCos(time * 0.5 + blob.seed, LOOP_DURATION) * 3;
            blob.obj.y = blob.offsetY + getLoopSin(time * 0.5 + blob.seed, LOOP_DURATION) * 3;
        });
    }

    setAtmosphere(color, intensity) {
        if (!this.blobs) return;
        this.blobs.forEach(blob => {
            if (blob.obj && blob.obj.setTint) {
                if (color === null || intensity <= 0) {
                    blob.obj.clearTint();
                } else {
                    blob.obj.setTint(color);
                }
            }
        });
    }
}

export class HardShapeGraphic extends BaseGraphic {
    create(config) {
        const width = config.width || 20;
        const height = config.height || 200;
        const color = config.color || 0xffffff;
        const alpha = config.alpha ?? 1.0;
        const shape = config.shape || 'rect';
        
        let obj;
        if (shape === 'rect') {
            obj = this.scene.add.rectangle(0, 0, width, height, color, alpha);
        } else if (shape === 'circle') {
            obj = this.scene.add.circle(0, 0, width / 2, color, alpha);
        } else if (shape === 'ellipse') {
            obj = this.scene.add.ellipse(0, 0, width, height, color, alpha);
        } else {
            obj = this.scene.add.rectangle(0, 0, width, height, color, alpha);
        }

        return obj;
    }

    setAtmosphere(color, intensity) {
        if (this.gameObject && this.gameObject.setTintFill) {
            if (color === null || intensity <= 0) {
                this.gameObject.clearTint();
            } else {
                this.gameObject.setTintFill(color);
                this.gameObject.setFillAlpha(intensity);
            }
        }
    }
}

export class CloudTextGraphic extends BaseGraphic {
    create(config) {
        const style = {
            fontSize: config.fontSize || '64px',
            fontFamily: config.fontFamily || 'Arial',
            color: config.color || '#ffffff',
            align: 'center'
        };
        const textStr = config.text || 'let go';
        const container = this.scene.add.container(0, 0);
        this.layers = [];

        const layerCount = 6;
        for (let i = 0; i < layerCount; i++) {
            const t = this.scene.add.text(
                (Math.random() * 10 - 5),
                (Math.random() * 10 - 5),
                textStr,
                style
            );
            t.setOrigin(0.5);
            
            const scale = 1 + (i * 0.05);
            t.setScale(scale);
            t.setAlpha((config.alpha || 0.6) * (1 - (i / layerCount) * 0.8));
            
            t.x += (Math.random() * 20 - 10) * (i / layerCount);
            t.y += (Math.random() * 20 - 10) * (i / layerCount);

            container.add(t);
            this.layers.push({
                obj: t,
                baseX: t.x,
                baseY: t.y,
                seed: Math.random() * LOOP_DURATION,
                speedMult: 0.5 + Math.random() * 0.5
            });
        }

        return container;
    }

    onUpdate(time, delta) {
        if (!this.gameObject) return;

        this.layers.forEach(layer => {
            const wobbleX = getLoopSin(time * layer.speedMult + layer.seed, LOOP_DURATION) * 4;
            const wobbleY = getLoopCos(time * layer.speedMult * 0.8 + layer.seed, LOOP_DURATION) * 4;
            layer.obj.x = layer.baseX + wobbleX;
            layer.obj.y = layer.baseY + wobbleY;
        });
    }
}

export class TextGraphic extends BaseGraphic {
    create(config) {
        const style = {
            fontSize: config.fontSize || '32px',
            fontFamily: config.fontFamily || 'Arial',
            color: config.color || '#ffffff',
            align: 'center'
        };
        const text = this.scene.add.text(0, 0, config.text || '', style);
        text.setOrigin(0.5);
        return text;
    }

    onUpdate(time, delta) {
        if (this.config.scale !== undefined) {
            this.gameObject.setScale(this.config.scale);
        }
    }
}
