import { createNoise2D } from 'simplex-noise';

/**
 * WindchimeEngine: Generative audio using Web Audio API and Simplex Noise.
 * Simulates natural wind gusts triggering chimes with "strike velocity" dynamics.
 */
export class WindchimeEngine {
    constructor() {
        this.ctx = null;
        this.noise2D = createNoise2D();
        
        // A Minor frequencies (O4 - O6)
        this.scale = [
            440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99,
            880.00, 987.77, 1046.50, 1174.66, 1318.51, 1396.91, 1567.98
        ];
        
        this.isEnabled = false;
        this.reverbNode = null;
        this.windIntensity = 0;
        this.lastPingTime = 0;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupReverb();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupReverb() {
        const length = this.ctx.sampleRate * 4;
        const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
            }
        }

        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = impulse;
        
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.5;
        
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.ctx.destination);
    }

    start() {
        this.init();
        this.isEnabled = true;
    }

    stop() {
        this.isEnabled = false;
    }

    update(time) {
        if (!this.isEnabled || !this.ctx) return;

        const noiseValue = this.noise2D(time / 8000, 0);
        this.windIntensity = Math.pow(Math.max(0, noiseValue + 0.2), 2);

        const threshold = 0.005 + (this.windIntensity * 0.06);
        if (Math.random() < threshold && time - this.lastPingTime > 150) {
            // Velocity is a mix of wind intensity and a random "strike" factor
            const velocity = (this.windIntensity * 0.7) + (Math.random() * 0.3);
            this.playPing(velocity);
            this.lastPingTime = time;
        }
    }

    /**
     * @param {number} velocity 0 to 1 based on strike force
     */
    playPing(velocity) {
        const now = this.ctx.currentTime;
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();

        // Harder strikes have slightly higher pitch "detune" for realism
        const detune = (velocity - 0.5) * 5;
        osc.frequency.setValueAtTime(freq + detune, now);
        osc2.frequency.setValueAtTime(freq * 2.71 + detune, now); 

        // 1. VOLUME based on velocity
        const maxVol = 0.01 + (velocity * 0.12);
        
        // 2. DECAY length based on velocity (Harder strikes ring longer)
        const decayTime = 4 + (velocity * 8);

        // 3. BRIGHTNESS: Secondary harmonic is louder for harder strikes
        const harmonicVol = maxVol * (0.3 + velocity * 0.5);

        // Natural Fade In (Attack)
        // Harder strikes are faster, softer strikes have a tiny "bloom"
        const attackTime = 0.005 + (1 - velocity) * 0.04;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(maxVol, now + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(harmonicVol, now + attackTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + (decayTime * 0.6));

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.ctx.destination);
        gain2.connect(this.ctx.destination);
        
        if (this.reverbNode) {
            gain.connect(this.reverbNode);
            gain2.connect(this.reverbNode);
        }

        osc.start(now);
        osc2.start(now);
        osc.stop(now + decayTime + 0.1);
        osc2.stop(now + (decayTime * 0.6) + 0.1);
    }
}

export const globalAudio = new WindchimeEngine();
