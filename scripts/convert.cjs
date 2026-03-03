const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * convert.cjs
 * Automatically finds the latest .webm in the Downloads folder
 * and converts it to an Instagram-ready .mp4 with windchimes audio.
 */

const DOWNLOADS_DIR = path.join(process.env.HOME, 'Downloads');
const OUTPUT_DIR = path.join(__dirname, '../video');
const AUDIO_FILE = path.join(__dirname, '../public/audio/windchimes.wav');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getLatestWebM() {
    const searchDirs = [OUTPUT_DIR, DOWNLOADS_DIR];
    let allFiles = [];

    searchDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir)
                .filter(f => f.endsWith('.webm') && f.includes('Scene'))
                .map(f => ({
                    name: f,
                    path: path.join(dir, f),
                    time: fs.statSync(path.join(dir, f)).mtime.getTime()
                }));
            allFiles = allFiles.concat(files);
        }
    });

    allFiles.sort((a, b) => b.time - a.time);
    return allFiles.length > 0 ? allFiles[0].path : null;
}

const inputFile = getLatestWebM();

if (!inputFile) {
    console.error("❌ No .webm scene exports found in Downloads.");
    process.exit(1);
}

const timestamp = Date.now();
const outputFile = path.join(OUTPUT_DIR, `LetGo_Final_${timestamp}.mp4`);

console.log(`🎬 Input Video: ${path.basename(inputFile)}`);
if (fs.existsSync(AUDIO_FILE)) {
    console.log(`🎵 Adding Audio: ${path.basename(AUDIO_FILE)}`);
} else {
    console.warn(`⚠️ Warning: Audio file not found at ${AUDIO_FILE}. Converting video only.`);
}
console.log(`🚀 Output: ${outputFile}`);

// FFmpeg Command optimized for MediaRecorder WebM:
// -fflags +genpts: Regenerate timestamps (fixes MediaRecorder seek issues)
// -analyzeduration 100M -probesize 100M: Help ffmpeg find streams in non-seekable files
let ffmpegCommand;
if (fs.existsSync(AUDIO_FILE)) {
    ffmpegCommand = `ffmpeg -fflags +genpts -analyzeduration 100M -probesize 100M -i "${inputFile}" -i "${AUDIO_FILE}" -map 0:v:0 -map 1:a:0 -vcodec libx264 -pix_fmt yuv420p -profile:v high -level:v 4.0 -crf 18 -acodec aac -b:a 192k -shortest -y "${outputFile}"`;
} else {
    ffmpegCommand = `ffmpeg -fflags +genpts -analyzeduration 100M -probesize 100M -i "${inputFile}" -vcodec libx264 -pix_fmt yuv420p -profile:v high -level:v 4.0 -crf 18 -acodec aac -y "${outputFile}"`;
}

try {
    execSync(ffmpegCommand, { stdio: 'inherit' });
    console.log("✅ Conversion and Audio Merge complete!");
} catch (error) {
    console.error("❌ Conversion failed. If the error says 'End of file', try opening the webm in Chrome and downloading it again, or wait a few seconds for the file to be fully written by the OS.");
}
