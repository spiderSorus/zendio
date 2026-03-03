export const LAYERS = {
    BACKGROUND: 'background',
    CONDENSING_TEXT: 'condensing_text',
    FOG: 'fog',
    MIDGROUND: 'midground',
    FOREGROUND: 'foreground',
    UI: 'ui'
};

export const LOOP_DURATION = 32000; // 32 seconds for a loop

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
