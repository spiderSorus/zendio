import Phaser from 'phaser';
import { CameraManager } from '../camera/CameraManager';
import { LAYERS, RESOLUTION } from '../core/Constants';
import { VideoExporter } from '../utils/VideoExporter';

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
        
        // Center the main camera on (0,0)
        this.cameras.main.centerOn(0, 0);

        this.cameraManager = new CameraManager(this);
        this.cameraManager.setupLayers(Object.values(LAYERS));
        
        this.videoExporter = new VideoExporter(this);

        // Scene specific setup FIRST (so their cameras are added first)
        this.setupScene();

        // UI Layer LAST (so its camera is on top)
        this.setupUI(width, height);
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

        // Return to Menu with ESC key
        this.input.keyboard.on('keydown-ESC', () => {
            console.log('BaseScene: Returning to MenuScene');
            this.scene.start('MenuScene');
        });

        // Cleanup graphics on scene shutdown
        this.events.once('shutdown', () => {
            this.graphics = [];
        });

        // Start Recording with 'R' key
        this.input.keyboard.on('keydown-R', () => {
            if (!this.videoExporter.isRecording) {
                console.log('BaseScene: Starting Recording via R key');
                this.videoExporter.startRecording();
                recBtn.setText('● RECORDING...');
                recBtn.setAlpha(0.5);
            }
        });

        uiLayer.add([recBtn, this.timerText]);
    }

    /** Override this in child classes */
    setupScene() {}

    update(time, delta) {
        this.graphics.forEach(gfx => {
            if (gfx.update) gfx.update(time, delta);
        });

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
