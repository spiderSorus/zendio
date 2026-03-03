import Phaser from 'phaser';
import BaseScene from './BaseScene';
import { LAYERS, RESOLUTION, LOOP_DURATION } from '../core/Constants';
import { ComplexityBackground } from '../utils/LetGoGenerator';
import { getLoopSin, getLoopCos } from '../utils/Loop';

export default class LetGoScene extends BaseScene {
    constructor() {
        super('LetGoScene');
        this.worldW = 5000;
        this.worldH = 5000;
        this.driftX = 0;
        this.driftY = 0;
    }

    setupScene() {
        const { width, height } = RESOLUTION;
        
        // Initial drift direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3;
        this.driftX = Math.cos(angle) * speed;
        this.driftY = Math.sin(angle) * speed;

        // Reset main camera
        this.cameras.main.centerOn(0, 0);
        this.cameras.main.setZoom(1.0);

        // Background Color management
        this.cameras.main.setBackgroundColor(0x00bbff);

        // Generate Complexity Background
        const bgResult = ComplexityBackground(this, {
            worldWidth: this.worldW,
            worldHeight: this.worldH
        });

        this.cameraConfigs = bgResult.cameraConfigs;

        // Configure cameras based on generated configs
        this.cameraConfigs.forEach(cfg => {
            const cam = this.cameraManager.getCamera(cfg.layer);
            if (cam) {
                cam.parallaxFactor = cfg.parallaxFactor || 1.0;
                
                // Apply Effects
                const effects = Array.isArray(cfg.effect) ? cfg.effect : [cfg.effect];
                effects.forEach(eff => {
                    if (eff === 'watercolor') {
                        cam.setPostPipeline('AquarellePipeline');
                        const pipeline = cam.getPostPipeline('AquarellePipeline');
                        if (pipeline && cfg.effectConfig) {
                            if (cfg.effectConfig.amplitude !== undefined) pipeline.amplitude = cfg.effectConfig.amplitude;
                            if (cfg.effectConfig.frequency !== undefined) pipeline.frequency = cfg.effectConfig.frequency;
                            if (cfg.effectConfig.scale !== undefined) pipeline.scale = cfg.effectConfig.scale;
                        }
                    } else if (eff === 'rainbow') {
                        cam.setPostPipeline('RainbowPipeline');
                    }
                });
            }
        });
    }

    update(time, delta) {
        const t = time * 0.001;
        
        // Seamless-ish drift (loopable if we wrap correctly)
        // For a perfectly seamless loop of the drift, we'd need to drive it with getLoopSin/Cos
        // But for "let go" it's more about the listless movement.
        // Let's make it truly loopable by using getLoopSin/Cos for the drift too.
        
        const driftProgressX = getLoopSin(time, LOOP_DURATION) * 200;
        const driftProgressY = getLoopCos(time, LOOP_DURATION) * 200;
        
        this.cameras.main.scrollX = driftProgressX;
        this.cameras.main.scrollY = driftProgressY;

        // Run Parallax System
        this.parallaxSystem();

        // Sync Aux Cameras
        const mainCam = this.cameras.main;
        this.cameraConfigs.forEach(cfg => {
            const cam = this.cameraManager.getCamera(cfg.layer);
            if (cam) {
                cam.setScroll(mainCam.scrollX, mainCam.scrollY);
                cam.setZoom(mainCam.zoom);
                cam.setRotation(mainCam.rotation);
            }
        });

        // Update graphics
        super.update(time, delta);
    }

    parallaxSystem() {
        const cam = this.cameras.main;
        const worldW = this.worldW;
        const worldH = this.worldH;

        this.graphics.forEach(gfx => {
            if (!gfx.gameObject || !gfx.config.parallax) return;

            const factor = gfx.config.parallax;
            const basePos = { x: gfx.config.x, y: gfx.config.y };

            // Apply parallax scroll
            let rx = basePos.x + cam.scrollX * (1.0 - factor);
            let ry = basePos.y + cam.scrollY * (1.0 - factor);

            // Wrap around camera center
            const centerX = cam.scrollX + cam.width / 2;
            const centerY = cam.scrollY + cam.height / 2;

            let dx = rx - centerX;
            let dy = ry - centerY;

            dx = ((dx + worldW / 2) % worldW);
            if (dx < 0) dx += worldW;
            dx -= worldW / 2;

            dy = ((dy + worldH / 2) % worldH);
            if (dy < 0) dy += worldH;
            dy -= worldH / 2;

            const finalX = centerX + dx;
            const finalY = centerY + dy;

            gfx.gameObject.x = finalX;
            gfx.gameObject.y = finalY;
        });
    }
}
