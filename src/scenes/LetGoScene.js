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

        // 1. Generate Complexity Background
        const bgResult = ComplexityBackground(this, {
            worldWidth: this.worldW,
            worldHeight: this.worldH
        });

        this.cameraConfigs = bgResult.cameraConfigs;

        // Configure background cameras
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

        // 2. Setup Condensing Text
        this.condensingTextLayer = this.cameraManager.getLayer(LAYERS.CONDENSING_TEXT);
        this.condensingTextCam = this.cameraManager.getCamera(LAYERS.CONDENSING_TEXT);
        
        this.condensingText = this.add.text(0, 0, '', {
            fontSize: '80px',
            fontFamily: 'Sedgwick Ave Display',
            color: '#ffffff', // Back to white for better contrast troubleshooting
            align: 'center',
            wordWrap: { width: width * 0.8 },
            stroke: '#000000', // Added stroke for extra visibility
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.condensingTextLayer.add(this.condensingText);
        this.condensingTextLayer.setDepth(1000); 

        // Define the phases
        this.phases = [
            { start: 0, end: 8000, text: 'Soft breath in, then out' },
            { start: 8000, end: 16000, text: 'Leaves dancing on the breeze' },
            { start: 16000, end: 24000, text: 'Stillness finds you now' }
        ];

        // 3. Final camera sort
        this.cameraManager.sortCameras();
    }

    update(time, delta) {
        const loopTime = time % LOOP_DURATION;

        // Static Text based on phase
        const currentPhase = this.phases.find(p => loopTime >= p.start && loopTime < p.end);
        if (currentPhase) {
            this.condensingText.setText(currentPhase.text);
            this.condensingText.setAlpha(1.0);
        } else {
            this.condensingText.setAlpha(0);
        }

        const driftProgressX = getLoopSin(time, LOOP_DURATION) * 200;
        const driftProgressY = getLoopCos(time, LOOP_DURATION) * 200;
        
        this.cameras.main.scrollX = driftProgressX;
        this.cameras.main.scrollY = driftProgressY;

        this.parallaxSystem();

        const mainCam = this.cameras.main;

        // Sync Condensing Text Camera
        if (this.condensingTextCam) {
            this.condensingTextCam.setScroll(mainCam.scrollX, mainCam.scrollY);
            this.condensingTextCam.setZoom(mainCam.zoom);
            this.condensingTextCam.setRotation(mainCam.rotation);
        }

        this.cameraConfigs.forEach(cfg => {
            const cam = this.cameraManager.getCamera(cfg.layer);
            if (cam) {
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
        const worldH = this.worldH;

        this.graphics.forEach(gfx => {
            if (!gfx.gameObject || !gfx.config.parallax) return;

            const factor = gfx.config.parallax;
            const basePos = { x: gfx.config.x, y: gfx.config.y };

            let rx = basePos.x + cam.scrollX * (1.0 - factor);
            let ry = basePos.y + cam.scrollY * (1.0 - factor);

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
