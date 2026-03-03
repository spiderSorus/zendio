import Phaser from 'phaser';
import { globalAudio } from '../utils/WindchimeEngine';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.scenes = [];
        this.selectedIndex = 0;
    }

    init() {
        const sceneModules = import.meta.glob('./*Scene.js', { eager: true });
        
        this.scenes = Object.keys(sceneModules)
            .map(path => {
                const match = path.match(/([^\/]+)Scene\.js$/);
                if (match) {
                    const name = match[1] + 'Scene';
                    return { name, key: name };
                }
                return null;
            })
            .filter(s => s && s.name !== 'MenuScene' && s.name !== 'BaseScene')
            .reverse();
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
        
        this.add.text(width / 2, 300, 'ZENDIO', {
            fontSize: '140px',
            fill: '#00ffff',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.menuContainer = this.add.container(width / 2, height / 2 + 100);
        this.updateMenu();

        this.input.keyboard.on('keydown-UP', () => this.scrollMenu(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.scrollMenu(1));
        this.input.keyboard.on('keydown-ENTER', () => this.selectScene());
        this.input.on('wheel', (p, go, dx, dy) => this.scrollMenu(dy > 0 ? 1 : -1));

        this.input.once('pointerdown', () => {
            globalAudio.start();
        });

        this.add.text(width / 2, height - 200, 'UP/DOWN TO SCROLL
ENTER TO START', {
            fontSize: '40px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);
    }

    scrollMenu(direction) {
        if (this.scenes.length === 0) return;
        this.selectedIndex = (this.selectedIndex + direction + this.scenes.length) % this.scenes.length;
        this.updateMenu();
    }

    updateMenu() {
        if (!this.menuContainer) return;
        this.menuContainer.removeAll(true);
        
        if (this.scenes.length === 0) {
            this.add.text(0, 0, 'NO SCENES FOUND', {
                fontSize: '60px',
                fill: '#ff0000',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setParentContainer(this.menuContainer);
            return;
        }

        const visibleItems = 5;
        const halfVisible = Math.floor(visibleItems / 2);

        for (let i = -halfVisible; i <= halfVisible; i++) {
            const index = (this.selectedIndex + i + this.scenes.length) % this.scenes.length;
            const scene = this.scenes[index];
            if (!scene) continue;
            
            const y = i * 150;
            const isSelected = i === 0;

            const text = this.add.text(0, y, scene.name.toUpperCase(), {
                fontSize: isSelected ? '80px' : '50px',
                fill: isSelected ? '#ffffff' : '#555555',
                fontFamily: 'monospace',
                backgroundColor: isSelected ? '#00ffff22' : 'transparent',
                padding: 10
            }).setOrigin(0.5);

            this.menuContainer.add(text);
        }
    }

    selectScene() {
        if (this.scenes.length === 0) return;
        const selected = this.scenes[this.selectedIndex];
        this.scene.start(selected.key);
    }

    update(time, delta) {
        globalAudio.update(this.time.now);
    }
}
