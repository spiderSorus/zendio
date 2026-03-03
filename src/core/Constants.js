export const LAYERS = {
    BACKGROUND: 'background',
    MIDGROUND: 'midground',
    FOREGROUND: 'foreground',
    UI: 'ui'
};

export const LOOP_DURATION = 24000; // 24 seconds for a loop

export const RESOLUTION = {
    WIDTH: 1080,
    HEIGHT: 1920
};

export const CAMERA_CONFIGS = {
    [LAYERS.BACKGROUND]: {
        name: 'BackgroundCamera',
        effects: ['blur']
    },
    [LAYERS.MIDGROUND]: {
        name: 'MidgroundCamera',
        effects: []
    },
    [LAYERS.FOREGROUND]: {
        name: 'ForegroundCamera',
        effects: ['glow']
    },
    [LAYERS.UI]: {
        name: 'UICamera',
        effects: []
    }
};
