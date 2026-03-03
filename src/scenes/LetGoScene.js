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

    preload() {
        this.load.audio('bg_audio', 'audio/windchimes.wav');
    }

    setupScene() {
        const { width, height } = RESOLUTION;
        
        // Initial drift direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3;
        this.driftX = Math.cos(angle) * speed;
        this.driftY = Math.sin(angle) * speed;

        this.input.once('pointerdown', () => {
            if (!this.sound.get('bg_audio')) {
                const music = this.sound.add('bg_audio', { loop: true });
                music.play();
            }
        });

        this.events.on('recording-start', () => {
            const music = this.sound.get('bg_audio');
            if (music) {
                music.stop();
                music.play();
            }
        });

        this.cameras.main.centerOn(0, 0);
        this.cameras.main.setZoom(1.0);
        this.cameras.main.setBackgroundColor(0x00bbff);

        const bgResult = ComplexityBackground(this, {
            worldWidth: this.worldW,
            worldHeight: this.worldH
        });

        this.cameraConfigs = bgResult.cameraConfigs;

        this.cameraConfigs.forEach(cfg => {
            const cam = this.cameraManager.getCamera(cfg.layer);
            if (cam) {
                cam.parallaxFactor = cfg.parallaxFactor || 1.0;
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

        // Setup Condensing Text
        this.condensingTextLayer = this.cameraManager.getLayer(LAYERS.CONDENSING_TEXT);
        this.condensingTextCam = this.cameraManager.getCamera(LAYERS.CONDENSING_TEXT);
        this.condensingTextCam.parallaxFactor = 0.4; 
        
        this.condensingTextCam.setPostPipeline('AquarellePipeline');
        this.condensingPipeline = this.condensingTextCam.getPostPipeline('AquarellePipeline');

        // Container for all letters
        this.textContainer = this.add.container(0, 0);
        this.condensingTextLayer.add(this.textContainer);
        this.condensingTextLayer.setDepth(1000); 

        this.phases = [
            { start: 0, end: 8000, text: 'Soft breath in' },
            { start: 8000, end: 16000, text: 'Then out' },
            { start: 16000, end: 24000, text: 'Leaves dancing on the breeze' },
            { start: 24000, end: 32000, text: 'Stillness finds you now' }
        ];

        this.currentText = '';
        this.letterObjects = [];

        this.cameraManager.sortCameras();
    }

    updateTextLetters(newText) {
        if (this.currentText === newText) return;
        this.currentText = newText;

        // Clear old letters
        this.letterObjects.forEach(group => {
            group.main.destroy();
            group.shadows.forEach(s => s.destroy());
        });
        this.letterObjects = [];

        if (!newText) return;

        let totalWidth = 0;
        const charData = [];
        const rainbowColors = [0xff0000, 0xffa500, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0x8b00ff];

        for (let i = 0; i < newText.length; i++) {
            const char = newText[i];
            
            if (char === ' ') {
                totalWidth += 30; 
                continue;
            }

            const colorRatio = i / Math.max(1, newText.length - 1);
            const colorIndex = colorRatio * (rainbowColors.length - 1);
            const lowIndex = Math.floor(colorIndex);
            const highIndex = Math.ceil(colorIndex);
            const frac = colorIndex - lowIndex;
            
            const color1 = Phaser.Display.Color.IntegerToColor(rainbowColors[lowIndex]);
            const color2 = Phaser.Display.Color.IntegerToColor(rainbowColors[highIndex]);
            const interpolated = Phaser.Display.Color.Interpolate.ColorWithColor(color1, color2, 100, frac * 100);
            const colorStr = Phaser.Display.Color.ObjectToColor(interpolated).rgba;

            const shadows = [];
            const glows = [
                { blur: 10, alpha: 0.8, scale: 1.02, thickness: 4 },
                { blur: 30, alpha: 0.5, scale: 1.05, thickness: 8 },
                { blur: 60, alpha: 0.3, scale: 1.10, thickness: 12 }
            ];

            glows.forEach(config => {
                const s = this.add.text(0, 0, char, {
                    fontSize: '80px',
                    fontFamily: 'Caveat',
                    fill: colorStr,
                    stroke: colorStr,
                    strokeThickness: config.thickness,
                    shadow: {
                        offsetX: 0, offsetY: 0,
                        color: colorStr,
                        blur: config.blur,
                        stroke: true, fill: true
                    }
                }).setOrigin(0.5).setAlpha(config.alpha).setScale(config.scale);
                shadows.push(s);
            });

            const main = this.add.text(0, 0, char, {
                fontSize: '80px',
                fontFamily: 'Caveat',
                color: '#ffffff'
            }).setOrigin(0.5);

            const charWidth = main.width;
            charData.push({ main, shadows, width: charWidth, offsetBefore: totalWidth });
            totalWidth += charWidth;
        }

        const startX = -totalWidth / 2;

        charData.forEach(data => {
            const x = startX + data.offsetBefore + (data.width / 2);
            data.main.x = x;
            data.shadows.forEach(s => {
                s.x = x;
                this.textContainer.add(s);
            });
            this.textContainer.add(data.main);
            this.letterObjects.push({ main: data.main, shadows: data.shadows });
        });
    }

    update(time, delta) {
        const loopTime = time % LOOP_DURATION;

        const currentPhase = this.phases.find(p => loopTime >= p.start && loopTime < p.end);
        if (currentPhase) {
            this.updateTextLetters(currentPhase.text);
            
            const phaseProgress = (loopTime - currentPhase.start) / (currentPhase.end - currentPhase.start);
            
            let alpha = 1.0;
            let effectFactor = 0.0;

            if (phaseProgress < 0.3) {
                alpha = phaseProgress / 0.3; 
                effectFactor = 1.0 - alpha; 
            } else if (phaseProgress > 0.7) {
                alpha = (1.0 - phaseProgress) / 0.3; 
                effectFactor = 1.0 - alpha; 
            }
            
            this.letterObjects.forEach(group => {
                group.main.setAlpha(alpha);
                group.shadows.forEach((s, i) => {
                    const baseAlpha = [0.8, 0.5, 0.3][i];
                    s.setAlpha(alpha * baseAlpha);
                });
            });

            if (this.condensingPipeline) {
                this.condensingPipeline.amplitude = 0.05 * effectFactor; 
                this.condensingPipeline.scale = effectFactor; 
                this.condensingPipeline.frequency = 8.0; 
            }
        } else {
            this.updateTextLetters('');
        }

        const driftProgressX = getLoopSin(time, LOOP_DURATION) * 200;
        const driftProgressY = (getLoopSin(time + LOOP_DURATION / 4, LOOP_DURATION) - 1.0) * 200;
        this.cameras.main.scrollX = driftProgressX;
        this.cameras.main.scrollY = driftProgressY;

        this.parallaxSystem();

        const mainCam = this.cameras.main;
        if (this.condensingTextCam) {
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
            gfx.gameObject.x = centerX + dx;
            gfx.gameObject.y = centerY + dy;
        });
    }
}
