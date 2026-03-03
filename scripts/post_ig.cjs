require('dotenv').config();
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

/**
 * post_ig.js
 * Automatically finds the latest .mp4 in the zendio/video folder
 * and uploads it to Instagram.
 */

const VIDEO_DIR = path.join(__dirname, '../video');

async function getLatestMp4() {
    if (!fs.existsSync(VIDEO_DIR)) return null;
    const files = fs.readdirSync(VIDEO_DIR)
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({
            name: f,
            path: path.join(VIDEO_DIR, f),
            time: fs.statSync(path.join(VIDEO_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    return files.length > 0 ? files[0] : null;
}

async function postToInstagram() {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);

    try {
        console.log("🔐 Logging in...");
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
        process.nextTick(async () => await ig.simulate.postLoginFlow());

        const video = await getLatestMp4();
        if (!video) {
            console.error("❌ No .mp4 files found in zendio/video. Run 'npm run convert' first.");
            return;
        }

        console.log(`📸 Uploading: ${video.name}...`);
        
        // Load video buffer
        const videoBuffer = fs.readFileSync(video.path);

        // Upload to IG
        // Note: For video, we typically use publish.video()
        // We can also provide a thumbnail if needed, but IG API can often extract one
        const publishResult = await ig.publish.video({
            video: videoBuffer,
            caption: 'Generated with Zendio #generative #phaserjs #loop',
            // You can optionally provide a coverImage: fs.readFileSync(...)
        });

        console.log("✅ Successfully posted to Instagram!");
        console.log(`🔗 URL: https://www.instagram.com/p/${publishResult.media.code}/`);

    } catch (error) {
        console.error("❌ Instagram Post Failed:", error.message);
        if (error.message.includes("checkpoint")) {
            console.log("⚠️ Instagram requires manual verification (checkpoint). Please log in via the app/web first.");
        }
    }
}

if (!process.env.IG_USERNAME || !process.env.IG_PASSWORD) {
    console.error("❌ IG_USERNAME and IG_PASSWORD must be set in your .env file.");
    process.exit(1);
}

postToInstagram();
