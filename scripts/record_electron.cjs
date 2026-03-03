const { app, BrowserWindow, session } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const waitOn = require('wait-on');

const PORT = 3000;
const VIDEO_DIR = path.join(__dirname, '../video');
const RAW_DIR = path.join(VIDEO_DIR, 'raw');
const AUDIO_FILE = path.join(__dirname, '../public/audio/windchimes.wav');

let viteServer;

async function startDevServer() {
    console.log(`🚀 Starting Vite dev server on port ${PORT}...`);
    viteServer = spawn('npm', ['run', 'dev', '--', '--port', PORT], { 
        cwd: path.join(__dirname, '..'), 
        stdio: 'ignore' 
    });
    
    await waitOn({
        resources: [`http://localhost:${PORT}`],
        timeout: 30000 
    });
}

function cleanupAndExit(code = 0) {
    if (viteServer) viteServer.kill();
    app.quit();
    process.exit(code);
}

function finalizeVideo(rawFile) {
    try {
        const timestamp = Date.now();
        const outputFile = path.join(VIDEO_DIR, `LetGo_Final_${timestamp}.mp4`);
        
        console.log('🎵 Merging video with original windchimes.wav via ffmpeg...');
        
        // -map 0:v:0 -> takes the video from the raw WebM
        // -map 1:a:0 -> takes the audio directly from the pristine WAV file
        const ffmpegCmd = `ffmpeg -i "${rawFile}" -i "${AUDIO_FILE}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -y "${outputFile}"`;
        
        execSync(ffmpegCmd, { stdio: 'inherit' });
        
        console.log(`🎉 Success! Final video ready at: ${outputFile}`);
        
        // Clean up the raw file
        fs.unlinkSync(rawFile);
        cleanupAndExit(0);
    } catch (err) {
        console.error('❌ FFmpeg conversion failed:', err.message);
        cleanupAndExit(1);
    }
}

app.whenReady().then(async () => {
    // 1. Prepare directories
    if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
    
    // Clean old raw files
    fs.readdirSync(RAW_DIR).forEach(f => fs.unlinkSync(path.join(RAW_DIR, f)));
    
    if (!fs.existsSync(AUDIO_FILE)) {
        console.error(`❌ Audio file not found at: ${AUDIO_FILE}`);
        cleanupAndExit(1);
    }

    // 2. Start Game Server
    await startDevServer();

    // 3. Launch Hidden Electron Window
    console.log('🌐 Launching headless Electron instance...');
    const win = new BrowserWindow({
        width: 1080,
        height: 1920,
        show: false, // Run headlessly
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false, // Ensure 60fps even when hidden
            autoplayPolicy: 'no-user-gesture-required' // Allow audio immediately
        }
    });

    // 4. Intercept the MediaRecorder download
    session.defaultSession.on('will-download', (event, item, webContents) => {
        const downloadedFilePath = path.join(RAW_DIR, item.getFilename());
        item.setSavePath(downloadedFilePath);
        
        console.log(`📥 Intercepted download: ${item.getFilename()} (${item.getTotalBytes()} bytes)`);

        item.once('done', (event, state) => {
            if (state === 'completed') {
                console.log(`✅ Download complete. Saved to: ${downloadedFilePath}`);
                finalizeVideo(downloadedFilePath);
            } else {
                console.error(`❌ Download failed with state: ${state}`);
                cleanupAndExit(1);
            }
        });
    });

    // Forward browser console logs
    win.webContents.on('console-message', (event, level, message) => {
        if (!message.includes('progress:')) {
            console.log(`[GAME] ${message}`);
        }
    });

    // 5. Load the game and automate interactions
    console.log(`📄 Navigating to http://localhost:${PORT}...`);
    await win.loadURL(`http://localhost:${PORT}`);

    // Wait for MenuScene to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🖱️ Clicking to unlock audio context...');
    win.webContents.sendInputEvent({ type: 'mouseDown', x: 540, y: 960, button: 'left', clickCount: 1 });
    win.webContents.sendInputEvent({ type: 'mouseUp', x: 540, y: 960, button: 'left', clickCount: 1 });

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('🎮 Pressing ENTER to start LetGoScene...');
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });

    // Wait for LetGoScene to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔴 Pressing R to start recording...');
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'R' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'R' });

    console.log('⏳ Engine is recording. Waiting for 32-second loop to finish...');
    // We don't need a timeout loop here; the 'will-download' event will automatically trigger
    // when the game's MediaRecorder finishes and calls a.click().
});

// Failsafe timeout just in case the game completely freezes
setTimeout(() => {
    console.error("❌ Process timed out after 3 minutes. The game likely hung or failed to trigger the download.");
    cleanupAndExit(1);
}, 180000);
