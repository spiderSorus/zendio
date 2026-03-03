# Zendio - Generative Loop Engine

A Phaser 3 + Vite project for creating seamless generative video loops, combining architectural patterns from `refract` (layering/cameras) and `spiderSorus` (noise/generative).

## Project Structure
- `src/core/Constants.js`: Central registry for `LAYERS` (BACKGROUND, MIDGROUND, FOREGROUND, UI) and `LOOP_DURATION` (default 10s).
- `src/camera/CameraManager.js`: Handles multi-camera layering. Each layer has a dedicated `Phaser.GameObjects.Container` and a `Phaser.Cameras.Scene2D.Camera` that ignores all other layers.
- `src/graphics/`:
    - `BaseGraphic.js`: Abstract class for generative entities. Automatically adds to the correct layer/container.
    - `CircleGraphic.js`: Implementation example using circular motion.
- `src/utils/Loop.js`: Utility for seamless looping.
    - `getLoopProgress(time, duration)`: Returns 0.0 -> 1.0.
    - `getLoopSin/Cos`: Returns -1.0 -> 1.0 for seamless circular/oscillating motion.
- `src/scenes/MainScene.js`: Main entry point; initializes `CameraManager` and manages the `graphics` array.

## Architectural Patterns
1. **Layer-to-Camera Mapping**: Every entity belongs to a layer defined in `Constants.js`. The `CameraManager` ensures that each camera only renders its specific layer's container.
2. **Seamless Looping**: All animations should be driven by the `time` parameter passed to `update(time, delta)` using `time % LOOP_DURATION`. Use `Loop.js` helpers to ensure the state at `progress = 0` matches `progress = 1`.
3. **Graphic Lifecycle**: Extend `BaseGraphic`. Use `create(config)` for initialization and `onUpdate(time, delta)` for loop-based logic.

## Dependencies
- `phaser`: Rendering engine.
- `simplex-noise`: For generative patterns.
- `vite`: Build tool and dev server.
