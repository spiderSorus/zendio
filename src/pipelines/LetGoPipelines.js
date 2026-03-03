import Phaser from 'phaser';

const aquarelleFragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform float uScrollX;
uniform float uScrollY;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uScale;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                        0.366025403784439,
                        -0.577350269189626,
                        0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = outTexCoord;
    vec2 worldUV = uv + vec2(uScrollX, uScrollY) * 0.0001;
    float n = snoise(worldUV * uFrequency) * 3.14159;
    vec2 offset = vec2(cos(n), sin(n)) * uAmplitude * uScale;
    float n2 = snoise(worldUV * 20.0);
    vec2 bleed = vec2(cos(n2), sin(n2)) * 0.02 * uScale;
    
    gl_FragColor = texture2D(uMainSampler, uv + offset + bleed);
}
`;

export class AquarellePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game,
            renderTarget: true,
            fragShader: aquarelleFragShader,
            uniforms: [
                'uMainSampler',
                'uScrollX',
                'uScrollY',
                'uAmplitude',
                'uFrequency',
                'uScale'
            ]
        });
        this.amplitude = 0.015;
        this.frequency = 8.0;
        this.scale = 1.0;
    }

    onPreRender() {
        const scenes = this.game.scene.getScenes(true);
        if (scenes.length > 0) {
            const cam = scenes[0].cameras.main;
            this.set1f('uScrollX', cam.scrollX);
            this.set1f('uScrollY', cam.scrollY);
        }
        this.set1f('uAmplitude', this.amplitude);
        this.set1f('uFrequency', this.frequency);
        this.set1f('uScale', this.scale);
    }
}

const smokyFogFragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform float uTime;
uniform float uAlpha;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ; m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = outTexCoord;
    vec4 color = texture2D(uMainSampler, uv);
    
    // Create smoke layers - doubled density
    float n1 = snoise(uv * 6.0 + uTime * 0.2) * 0.5 + 0.5;
    float n2 = snoise(uv * 12.0 - uTime * 0.1) * 0.5 + 0.5;
    float smoke = n1 * n2;
    
    // Apply smoke to alpha
    gl_FragColor = vec4(color.rgb, color.a * smoke * uAlpha);
}
`;

export class SmokyFogPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game,
            renderTarget: true,
            fragShader: smokyFogFragShader,
            uniforms: ['uMainSampler', 'uTime', 'uAlpha']
        });
        this.alpha = 1.0;
    }
    onPreRender() {
        this.set1f('uTime', this.game.loop.time * 0.001);
        this.set1f('uAlpha', this.alpha);
    }
}

const rainbowFragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

vec3 hslToRgb(vec3 hsl) {
    vec3 rgb;
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
}

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    float hue = outTexCoord.x;
    vec3 rainbowColor = hslToRgb(vec3(hue, 1.0, 0.5));
    gl_FragColor = vec4(color.rgb * rainbowColor, color.a * 1.0);
}
`;

export class RainbowPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game,
            renderTarget: true,
            fragShader: rainbowFragShader,
            uniforms: [
                'uMainSampler'
            ]
        });
    }
}

const oldGlassFragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform float uTime;
uniform float uVelocity;

void main() {
    vec2 uv = outTexCoord;
    float wave = sin(uv.y * 20.0 + uTime * 2.0) * 0.005 * uVelocity;
    float wave2 = cos(uv.x * 20.0 + uTime * 1.5) * 0.005 * uVelocity;
    
    vec4 cr = texture2D(uMainSampler, uv + wave * uVelocity);
    vec4 cg = texture2D(uMainSampler, uv + wave2 * uVelocity);
    vec4 cb = texture2D(uMainSampler, uv - wave * uVelocity);
    
    float alpha = max(cr.a, max(cg.a, cb.a));
    gl_FragColor = vec4(cr.r, cg.g, cb.b, alpha);
}
`;

export class OldGlassPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game,
            renderTarget: true,
            fragShader: oldGlassFragShader,
            uniforms: [
                'uMainSampler',
                'uTime',
                'uVelocity'
            ]
        });
        this.velocity = 0.5; 
    }

    onPreRender() {
        this.set1f('uTime', this.game.loop.time * 0.001);
        this.set1f('uVelocity', this.velocity);
    }
}
