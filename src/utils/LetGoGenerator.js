import Phaser from 'phaser';
import { WatercolorGraphic, HardShapeGraphic, CloudTextGraphic } from '../graphics/LetGoGraphics';

export const generateBackgroundRectangles = (scene, config, layerConfig) => {
    const worldW = config.worldWidth || 5000;
    const worldH = config.worldHeight || 5000;
    const minX = config.minX ?? -worldW/2;
    const minY = config.minY ?? -worldH/2;

    const {
        count = 100,
        parallax = 0.5,
        zIndex = 0,
        layerName = null,
        widthRange = [50, 150],
        heightRange = [1000, 3000],
        color = 0xffffff,
        alpha = 0.2,
        renderType = 'watercolor',
        shape = 'rect',
        forceSquare = false
    } = layerConfig;

    for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(minX, minX + worldW);
        const y = Phaser.Math.Between(minY, minY + worldH);
        const w = Phaser.Math.Between(widthRange[0], widthRange[1]);
        const h = forceSquare ? w : Phaser.Math.Between(heightRange[0], heightRange[1]);
        
        const renderConfig = {
            x, y,
            width: w,
            height: h,
            color: color,
            alpha: alpha,
            shape: shape,
            parallax: parallax,
            layer: layerName,
            depth: zIndex
        };

        let gfx;
        if (renderType === 'watercolor') {
            gfx = new WatercolorGraphic(scene, { ...renderConfig, layers: 6 });
        } else if (renderType === 'hard_shape') {
            gfx = new HardShapeGraphic(scene, renderConfig);
        }

        if (gfx) {
            scene.graphics.push(gfx);
        }
    }
};

export const ComplexityBackground = (scene, config = {}) => {
    const worldW = config.worldWidth || 5000;
    const worldH = config.worldHeight || 5000;
    const areaScale = (worldW * worldH) / (5000 * 5000);

    // 1. Define all layer templates
    const layerTemplates = [
        { shape: 'circle', color: 0x000000, renderType: 'hard_shape', s: 75, a: 0.5, effect: 'rainbow', count: 100 },
        { shape: 'circle', color: 0x000000, renderType: 'hard_shape', s: 112, a: 0.5, effect: 'rainbow', count: 100 },
        { shape: 'circle', color: 0x000000, renderType: 'hard_shape', s: 150, a: 0.5, effect: 'rainbow', count: 100 },
        { shape: 'circle', color: 0x000000, renderType: 'hard_shape', s: 187, a: 0.5, effect: 'rainbow', count: 100 },
        { shape: 'rect', color: 0xffffff, renderType: 'watercolor', s: 112, a: 0.6, effect: 'watercolor', count: 30, forceSquare: true },
        { shape: 'rect', color: 0xffffff, renderType: 'watercolor', s: 150, a: 0.6, effect: 'watercolor', count: 30, forceSquare: true },
        { shape: 'rect', color: 0xffffff, renderType: 'watercolor', s: 225, a: 0.6, effect: 'watercolor', count: 30, forceSquare: true },
        { shape: 'rect', color: 0xffffff, renderType: 'watercolor', s: 300, a: 0.6, effect: 'watercolor', count: 30, forceSquare: true },
        { shape: 'oval', color: 0xffffff, renderType: 'watercolor', s: 150, a: 0.35, effect: 'watercolor', count: 30, hasText: true }
    ];

    // 2. Shuffle the templates
    Phaser.Utils.Array.Shuffle(layerTemplates);

    // 3. Generate layers with staggered parallax
    const cameraConfigs = [];
    const fonts = ['Sedgwick Ave Display', 'serif', 'sans-serif', 'monospace', 'cursive'];

    layerTemplates.forEach((t, i) => {
        const layerName = `bg_shuffled_${i+1}`;
        const pFactor = 0.1 + (i * 0.08); // Spread parallax from 0.1 to 0.74

        // Decrease alpha as we get to "higher" layers (higher i)
        // Layer 0 (i=0) keeps 100% of t.a, Layer 8 (i=8) gets ~30%
        const alphaScale = 1.0 - (i * 0.08);
        const finalAlpha = t.a * alphaScale;

        generateBackgroundRectangles(scene, config, {
            count: Math.round(t.count * areaScale),
            parallax: pFactor,
            zIndex: 10 + i,
            layerName: layerName,
            widthRange: [t.s, t.s * 1.5],
            heightRange: [t.s, t.s * 1.5],
            color: t.color,
            alpha: finalAlpha,
            renderType: t.renderType,
            shape: t.shape,
            forceSquare: t.forceSquare || false
        });

        if (t.hasText) {
            const textCount = Math.round(25 * areaScale);
            for (let j = 0; j < textCount; j++) {
                const x = Phaser.Math.Between(-worldW/2, worldW/2);
                const y = Phaser.Math.Between(-worldH/2, worldH/2);
                const fontSize = Phaser.Math.Between(40, 150);
                const font = Phaser.Utils.Array.GetRandom(fonts);

                const gfx = new CloudTextGraphic(scene, {
                    x, y,
                    text: 'let go', 
                    fontSize: `${fontSize}px`, 
                    fontFamily: font, 
                    color: '#ffffff',
                    alpha: 0.4,
                    parallax: pFactor,
                    layer: layerName,
                    depth: 15
                });
                scene.graphics.push(gfx);
            }
        }

        cameraConfigs.push({
            name: `Camera ${i+1}`,
            layer: layerName,
            effect: t.effect,
            effectConfig: t.hasText ? { amplitude: 0.007, scale: 0.5 } : null,
            type: 'BACKGROUND',
            parallaxFactor: pFactor
        });
    });

    return {
        backgroundColor: 0x00bbff,
        cameraConfigs: cameraConfigs
    };
};
