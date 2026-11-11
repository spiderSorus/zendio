# Zendio — Seamless Generative Audio-Visual Loop Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Zendio** is a creative-coding engine and desktop studio built with **Phaser 3**, **Simplex Noise**, **Vite**, and **Electron** for authoring, previewing, and recording **mathematically seamless generative audio-visual loops**.

Built for **generative artists, ambient visuals creators, and meditative installation designers**, Zendio guarantees zero-seam loop transitions (`progress = 0.0 === progress = 1.0`) by driving all procedural geometry, multi-plane camera parallax, atmospheric fog shaders, and soundscapes through periodic phase functions (`getLoopProgress`, `getLoopSin`, `getLoopCos`) over a configurable `LOOP_DURATION`.

---

## Built With

- **Rendering Engine**: [Phaser 3](https://phaser.io/) (`^3.80.1`) with multi-camera layer isolation (`BACKGROUND`, `MIDGROUND`, `FOREGROUND`, `UI`).
- **Procedural Noise**: [`simplex-noise`](https://www.npmjs.com/package/simplex-noise) (`^4.0.3`) for periodic 2D/3D noise fields, procedural forest silhouettes (`RedwoodsScene`), and organic motion paths (`LetGoScene`).
- **Desktop & Automated Recording**: [Electron](https://www.electronjs.org/) (`^40.6.1`) and [Puppeteer](https://pptr.dev/) (`^24.37.5`) (`scripts/record_electron.cjs`, `scripts/convert.cjs`) for deterministic frame capture and loop video encoding.
- **Dev Server & Bundler**: [Vite](https://vitejs.dev/) (`^5.0.0`).

---

## Repository Structure

- `src/core/Constants.js` — Central registry for render `LAYERS` (`BACKGROUND`, `MIDGROUND`, `FOREGROUND`, `UI`) and default `LOOP_DURATION` (`10,000 ms`).
- `src/camera/CameraManager.js` — Multi-camera layer compositor where each depth layer is isolated into its own `Phaser.GameObjects.Container` and dedicated camera.
- `src/utils/Loop.js` — Periodic math utilities (`getLoopProgress`, `getLoopSin`, `getLoopCos`) ensuring exact state continuity between `t = 0` and `t = LOOP_DURATION`.
- `src/graphics/` — Extensible procedural graphic primitives (`BaseGraphic.js`, `CircleGraphic.js`).
- `src/scenes/`:
  - `MenuScene.js` — Interactive scene selector.
  - `BaseScene.js` — Shared lifecycle, camera setup, and loop timing base class.
  - `RedwoodsScene.js` — Procedural multi-depth redwood forest with drifting volumetric fog layers and simplex-noise foliage.
  - `LetGoScene.js` — Meditative ambient scene with harmonic orbital motion and synchronized windchime audio (`public/windchimes.wav`).
- `scripts/` — Automated Electron recording (`record_electron.cjs`), video conversion (`convert.cjs`), and publishing helper scripts.

---

## How to Run

### Prerequisites
- **Node.js** `>= 18.x` and **npm**
- *(Optional, for video conversion scripts)* `ffmpeg` installed on `PATH`.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Interactive Browser Dev Server
```bash
npm run dev
```
Open the local URL printed by Vite (typically `http://localhost:5173`) to browse and preview generative scenes in real time.

### 3. Run in Electron Desktop Window
```bash
npm start
```

### 4. Record & Convert Seamless Video Loops
```bash
# Record a deterministic loop capture via Electron:
npm run record

# Convert captured frames/video via scripts/convert.cjs:
npm run convert
```

---

## Architectural Principles

1. **Strict Periodic Continuity**:
   - Every visual and audio parameter is a pure function of `progress = (time % LOOP_DURATION) / LOOP_DURATION`.
   - 2D/3D Simplex Noise is sampled along a circular trajectory in noise space $(\cos(2\pi p)\cdot r, \sin(2\pi p)\cdot r)$ so that drifting fog, swaying branches, and particle fields return to their exact starting pixel state at `progress = 1.0`.
2. **Multi-Camera Depth Layering**:
   - `CameraManager` provisions independent cameras per depth plane, allowing per-layer post-processing shaders, blur, and parallax speeds without affecting UI overlays.

---

## Roadmap & Planned Work Ahead (35+ Hours)

- [ ] **Phase 1 — Deterministic Frame-Stepping & Lossless FFmpeg Export Pipeline (~8 hrs)**
  - [ ] Upgrade `scripts/record_electron.cjs` from wall-clock capture to deterministic fixed-dt frame stepping (`60 FPS`, exact `N = LOOP_DURATION * 60` frames) so exported `.mp4` / `.webm` / `.gif` loops are 100% frame-accurate with zero dropped frames.
  - [ ] Add resolution presets (`1080x1920` vertical reel, `1920x1080` landscape, `1080x1080` square, `4K`).
- [ ] **Phase 2 — Periodic WebAudio Synthesizer & Audio-Reactive Modulation (~8 hrs)**
  - [ ] Build a procedural WebAudio synthesis engine (`src/audio/LoopSynth.js`) generating seamless harmonic drone pads, pentatonic bell/chime arpeggios, and filtered pink-noise rain/wind locked to `LOOP_DURATION`.
  - [ ] Expose offline `OfflineAudioContext` WAV rendering so the generated audio track merges automatically with the recorded video loop.
- [ ] **Phase 3 — Live Parameter Inspector, Timeline Scrubber & Preset System (~7 hrs)**
  - [ ] Add a toggleable HUD overlay (`Tab` key) with a loop phase timeline scrubber (`0.00 -> 1.00`), pause/step controls, seed randomizer, and live sliders for palette, fog density, camera sway, and loop duration.
  - [ ] Support exporting and loading JSON scene presets (`presets/*.json`).
- [ ] **Phase 4 — Custom WebGL Post-Processing Shaders & New Generative Biomes (~12 hrs)**
  - [ ] Add custom WebGL fragment pipelines (film grain, chromatic aberration, bloom, watercolor bleed, CRT scanlines) assignable per camera layer in `CameraManager`.
  - [ ] Implement 4 new generative loop scenes: `BioluminescentTideScene`, `DesertDunesStarfieldScene`, `SacredGeometryMandalaScene`, and `KoiPondRipplesScene`.

---

## License

Released under the [MIT License](LICENSE).
