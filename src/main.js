import Phaser from 'phaser';
import { RESOLUTION } from './core/Constants';
import MenuScene from './scenes/MenuScene';
import { AquarellePipeline, RainbowPipeline, OldGlassPipeline } from './pipelines/LetGoPipelines';

// Dynamically find all scenes
const sceneModules = import.meta.glob('./scenes/*Scene.js', { eager: true });
const sceneList = [MenuScene];

Object.keys(sceneModules).forEach((path) => {
    const sceneClass = sceneModules[path].default;
    if (sceneClass && sceneClass !== MenuScene && sceneClass.name !== 'BaseScene') {
        sceneList.push(sceneClass);
    }
});

const config = {
    type: Phaser.WEBGL,
    parent: 'game-container',
    width: RESOLUTION.WIDTH,
    height: RESOLUTION.HEIGHT,
    backgroundColor: '#1a1a2e',
    pipeline: { AquarellePipeline, RainbowPipeline, OldGlassPipeline },
    scene: sceneList,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
