const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * convert.js
 * Automatically finds the latest .webm in the Downloads folder (or video folder)
 * and converts it to an Instagram-ready .mp4
 */

const DOWNLOADS_DIR = path.join(process.env.HOME, 'Downloads');
const OUTPUT_DIR = path.join(__dirname, '../video');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getLatestWebM() {
    const files = fs.readdirSync(DOWNLOADS_DIR)
        .filter(f => f.endsWith('.webm') && f.includes('Scene'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(DOWNLOADS_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    return files.length > 0 ? path.join(DOWNLOADS_DIR, files[0].name) : null;
}

const inputFile = getLatestWebM();

if (!inputFile) {
    console.error("❌ No .webm scene exports found in Downloads.");
    process.exit(1);
}

const timestamp = Date.now();
const outputFile = path.join(OUTPUT_DIR, `export_${timestamp}.mp4`);

console.log(`🎬 Converting: ${path.basename(inputFile)}`);
console.log(`🚀 To: ${outputFile}`);

// Instagram optimized settings:
// -vcodec libx264: H.264 video
// -pix_fmt yuv420p: Standard pixel format for mobile players
// -profile:v high -level:v 4.0: High compatibility
// -crf 18: High quality (lower is better)
// -acodec aac: Standard audio
const ffmpegCommand = `ffmpeg -i "${inputFile}" -vcodec libx264 -pix_fmt yuv420p -profile:v high -level:v 4.0 -crf 18 -acodec aac -y "${outputFile}"`;

try {
    execSync(ffmpegCommand, { stdio: 'inherit' });
    console.log("✅ Conversion complete!");
} catch (error) {
    console.error("❌ Conversion failed:", error.message);
}
