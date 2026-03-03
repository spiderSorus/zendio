import Phaser from 'phaser';
import { CameraManager } from '../camera/CameraManager';
import { LAYERS, RESOLUTION } from '../core/Constants';
import { VideoExporter } from '../utils/VideoExporter';
import { globalAudio } from '../utils/WindchimeEngine';

/**
 * BaseScene: A template for generative scenes with layering and export built-in.
 */
export default class BaseScene extends Phaser.Scene {
    constructor(key) {
        super({ key });
        this.graphics = [];
    }

    create() {
        const { width, height } = RESOLUTION;
        
        this.cameraManager = new CameraManager(this);
        this.cameraManager.setupLayers(Object.values(LAYERS));
        
        this.videoExporter = new VideoExporter(this);

        // Scene specific setup FIRST (so their cameras are added first)
        this.setupScene();

        // UI Layer LAST (so its camera is on top)
        this.setupUI(width, height);

        // Audio Activation (ensure it's started if not already)
        this.input.once('pointerdown', () => {
            globalAudio.start();
        });
    }

    setupUI(width, height) {
        const uiLayer = this.cameraManager.getLayer(LAYERS.UI);
        
        // REC button
        const recBtn = this.add.text(width - 150, 50, '● REC', {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'monospace',
            backgroundColor: '#00000088',
            padding: 10
        }).setInteractive({ useHandCursor: true });

        recBtn.on('pointerdown', () => {
            this.videoExporter.startRecording();
            recBtn.setText('● RECORDING...');
            recBtn.setAlpha(0.5);
        });

        // Back button
        const backBtn = this.add.text(50, 50, '← MENU', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            backgroundColor: '#00000088',
            padding: 10
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Timer
        this.timerText = this.add.text(width / 2, 50, '00:00.00', {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'monospace',
            backgroundColor: '#00000088',
            padding: 10
        }).setOrigin(0.5, 0);
        this.timerText.setVisible(false);

        // Toggle Timer with 'T' key
        this.input.keyboard.on('keydown-T', () => {
            const newVisible = !this.timerText.visible;
            console.log(`Timer visibility toggled: ${newVisible}`);
            this.timerText.setVisible(newVisible);
        });

        uiLayer.add([recBtn, backBtn, this.timerText]);
    }

    /** Override this in child classes */
    setupScene() {}

    update(time, delta) {
        this.graphics.forEach(g => g.update(time, delta));
        // Update global audio engine
        globalAudio.update(time);

        // Update timer if visible
        if (this.timerText && this.timerText.visible) {
            const elapsed = time; // total time in ms
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const centiseconds = Math.floor((elapsed % 1000) / 10);
            
            this.timerText.setText(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
            );
        }
    }
}
