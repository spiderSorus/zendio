import Phaser from 'phaser';
import BaseScene from './BaseScene';
import { LAYERS, RESOLUTION, LOOP_DURATION } from '../core/Constants';
import { WatercolorGraphic, HardShapeGraphic } from '../graphics/LetGoGraphics';
import { getLoopSin, getLoopCos, getLoopProgress } from '../utils/Loop';
import { createNoise2D } from 'simplex-noise';

export default class RedwoodsScene extends BaseScene {
    constructor() {
        super('RedwoodsScene');
        // Narrow world for seamless tiling every 32 seconds
        this.worldW = 3000;
        this.worldH = RESOLUTION.HEIGHT;
        this.noise = createNoise2D(() => 0.42);
    }

    setupScene() {
        this.cameras.main.centerOn(0, 0);
        this.cameras.main.setZoom(1.0);
        this.cameras.main.setBackgroundColor(0xe0f5e0); 

        const layerCount = 24;
        const redwoodPalette = [0x3d2b21, 0x4e382c, 0x2c1e16];
        
        for (let i = 0; i < layerCount; i++) {
            const pFactor = 0.02 + (i / (layerCount - 1)) * 0.95; 
            const colorProgress = i / (layerCount - 1);
            
            const baseR = Phaser.Math.Linear(150, 61, colorProgress);
            const baseG = Phaser.Math.Linear(180, 43, colorProgress);
            const baseB = Phaser.Math.Linear(150, 33, colorProgress);
            const trunkBaseColor = Phaser.Display.Color.GetColor(baseR, baseG, baseB);

            const trunkLayerName = `forest_layer_${i}`;
            const layer = this.cameraManager.getLayer(trunkLayerName);
            const trunkCam = this.cameraManager.getCamera(trunkLayerName);
            trunkCam.parallaxFactor = pFactor;

            // EXACTLY ONE TREE PER LAYER
            const noiseX = this.noise(i * 0.5, 0); 
            const finalX = noiseX * (this.worldW / 2);
            
            const w = Phaser.Math.Between(150, 450); 
            const h = this.worldH * 4; 

            const trunk = new HardShapeGraphic(this, {
                x: finalX, y: 0,
                width: w,
                height: h,
                color: trunkBaseColor,
                // Front trees (high i) are 40% opaque, others fade in distance
                alpha: i < 10 ? (0.5 + (colorProgress * 0.5)) : 0.4, 
                shape: 'rect',
                parallax: pFactor,
                layer: trunkLayerName,
                depth: i * 50
            });
            this.graphics.push(trunk);

            if (i > 6) {
                const contrast = i < 14 ? 10 : 20;
                this.generateBark(finalX, w, h, trunkBaseColor, pFactor, trunkLayerName, i * 50 + 10, contrast);
            }

            // Move Text to Layer 21 (Near the front)
            if (i === 21) {
                this.setupWipeText(pFactor);
            }
        }

        this.cameraManager.sortCameras();
        this.setupFog();
    }

    setupWipeText(pFactor) {
        const textLayer = this.cameraManager.getLayer(LAYERS.CONDENSING_TEXT);
        const textCam = this.cameraManager.getCamera(LAYERS.CONDENSING_TEXT);
        textCam.centerOn(0, 0);
        textCam.parallaxFactor = pFactor; 
        textCam.setPostPipeline('AquarellePipeline');
        this.textPipeline = textCam.getPostPipeline('AquarellePipeline');

        this.wipePhrases = [
            "listen to your body",
            "feel the bottoms of your feet",
            "feel your breath",
            "let life come to you"
        ];

        this.wipeText = this.add.text(0, 0, this.wipePhrases[0], {
            fontSize: '80px',
            fontFamily: 'Caveat', 
            color: '#1a1a1a', 
            align: 'center',
            wordWrap: { width: RESOLUTION.WIDTH * 0.8 },
            shadow: {
                offsetX: 0, offsetY: 0,
                color: '#ffffff', 
                blur: 40,
                fill: true
            }
        }).setOrigin(0.5); 

        textLayer.add(this.wipeText);
        textLayer.setDepth(1100); 
    }

    setupFog() {
        const { width, height } = RESOLUTION;
        const fogConfigs = [
            { p: 0.1, alpha: 0.4, depth: 5 },
            { p: 0.4, alpha: 0.3, depth: 100 },
            { p: 0.7, alpha: 0.2, depth: 1000 },
            { p: 0.9, alpha: 0.1, depth: 1200 }
        ];
        fogConfigs.forEach((cfg, i) => {
            const layerName = `fog_layer_${i}`;
            const layer = this.cameraManager.getLayer(layerName);
            const cam = this.cameraManager.getCamera(layerName);
            cam.parallaxFactor = cfg.p;
            cam.setPostPipeline('SmokyFogPipeline');
            const pipeline = cam.getPostPipeline('SmokyFogPipeline');
            if (pipeline) pipeline.alpha = cfg.alpha;
            const rect = this.add.rectangle(0, 0, width * 2, height * 2, 0xecf8ec, 1.0);
            rect.setScrollFactor(0); 
            layer.add(rect);
            layer.setDepth(cfg.depth);
        });
        this.cameraManager.sortCameras();
    }

    generateBark(trunkX, trunkW, trunkH, baseColor, pFactor, layerName, baseDepth, contrast) {
        const columns = Math.max(2, Math.floor(trunkW / 80));
        const rowHeight = 1200;
        const colorObj = Phaser.Display.Color.IntegerToColor(baseColor);
        
        for (let c = 0; c < columns; c++) {
            const columnX = trunkX - (trunkW / 2) + (c + 0.5) * (trunkW / columns);
            for (let y = -this.worldH * 1.5; y < this.worldH * 1.5; y += rowHeight) {
                if (Math.random() > 0.7) continue;
                const jitterX = (Math.random() * 20 - 10);
                const jitterY = (Math.random() * rowHeight * 0.4) - (rowHeight * 0.2);
                const angle = (Math.random() * 4 - 2); 
                const bh = Phaser.Math.Between(rowHeight * 0.8, rowHeight * 1.5); 
                const bw = Phaser.Math.Between(trunkW * 0.03, trunkW * 0.07); 
                const types = ['brighten', 'darken'];
                types.forEach((type, i) => {
                    const barkColor = Phaser.Display.Color.ObjectToColor(colorObj)[type](contrast).color;
                    const offsetX = (i === 0) ? -bw/2 : bw/2;
                    const bark = new WatercolorGraphic(this, {
                        x: columnX + jitterX + offsetX, y: y + jitterY, width: bw, height: bh,
                        color: barkColor, alpha: 0.4, shape: 'rect', layers: 2,
                        parallax: pFactor, layer: layerName, depth: baseDepth + c * 5 + i
                    });
                    if (bark.gameObject) bark.gameObject.setAngle(angle);
                    this.graphics.push(bark);
                });
            }
        }
    }

    update(time, delta) {
        const progress = getLoopProgress(time, LOOP_DURATION);
        const scrollX = progress * this.worldW;
        this.cameras.main.scrollX = scrollX;
        this.cameras.main.scrollY = 0;

        if (this.wipeText) {
            const phaseProgress = (progress * 4) % 1.0;
            const phaseIndex = Math.floor(progress * 4);
            if (this.wipeText.text !== this.wipePhrases[phaseIndex]) {
                const newPhrase = this.wipePhrases[phaseIndex];
                this.wipeText.setText(newPhrase);
                console.log(`[Redwoods] Phrase: "${newPhrase}", Font: ${this.wipeText.style.fontFamily}`);
            }
            let alpha = 1.0;
            let effectFactor = 0.0;
            if (phaseProgress < 0.3) {
                alpha = phaseProgress / 0.3;
                effectFactor = 1.0 - alpha;
            } else if (phaseProgress > 0.7) {
                alpha = (1.0 - phaseProgress) / 0.3;
                effectFactor = 1.0 - alpha;
            }
            this.wipeText.setAlpha(alpha);
            if (this.textPipeline) {
                this.textPipeline.amplitude = 0.05 * effectFactor;
                this.textPipeline.scale = effectFactor;
                this.textPipeline.frequency = 8.0;
            }
        }

        this.parallaxSystem();

        const mainCam = this.cameras.main;
        this.cameraManager.cameras.forEach((cam, name) => {
            if (name !== 'main' && name !== LAYERS.CONDENSING_TEXT) {
                cam.setScroll(mainCam.scrollX, mainCam.scrollY);
                cam.setZoom(mainCam.zoom);
                cam.setRotation(mainCam.rotation);
            }
        });

        super.update(time, delta);
    }

    parallaxSystem() {
        const cam = this.cameras.main;
        const worldW = this.worldW;
        this.graphics.forEach(gfx => {
            if (!gfx.gameObject || !gfx.config.parallax) return;
            const factor = gfx.config.parallax;
            const basePos = { x: gfx.config.x, y: gfx.config.y };
            let rx = basePos.x + cam.scrollX * (1.0 - factor);
            const centerX = cam.scrollX;
            let dx = rx - centerX;
            dx = ((dx + worldW / 2) % worldW);
            if (dx < 0) dx += worldW;
            dx -= worldW / 2;
            gfx.gameObject.x = centerX + dx;
            gfx.gameObject.y = basePos.y;
        });
    }
}
