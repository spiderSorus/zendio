import { LOOP_DURATION } from '../core/Constants';

/**
 * VideoExporter: Captures the canvas and downloads it as a video.
 * Designed to capture exactly one loop.
 */
export class VideoExporter {
    constructor(scene) {
        this.scene = scene;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingStartTime = 0;
    }

    /**
     * Start recording for exactly LOOP_DURATION
     */
    async startRecording() {
        if (this.isRecording) return;
        
        const canvas = this.scene.game.canvas;
        const stream = canvas.captureStream(60); // Capture at 60fps
        
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 25000000 // 25Mbps for high quality
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.saveVideo();
        };

        // Sync with the start of the loop
        // We'll wait until the next loop start (time % LOOP_DURATION near 0)
        // or just start now and cut later? 
        // Better to wait for time % LOOP_DURATION === 0 to ensure seamless loop.
        
        this.isRecording = true;
        console.log("Waiting for loop start to begin recording...");
        
        const checkLoop = () => {
            const currentTime = this.scene.time.now;
            const progress = (currentTime % LOOP_DURATION) / LOOP_DURATION;
            
            // If we are within 100ms of the start of the loop
            if (progress < 0.01) {
                this.mediaRecorder.start();
                this.recordingStartTime = currentTime;
                console.log("Recording started at loop start.");
                
                // Set a timer to stop after exactly LOOP_DURATION
                this.scene.time.delayedCall(LOOP_DURATION, () => {
                    this.stopRecording();
                });
            } else {
                this.scene.time.delayedCall(16, checkLoop);
            }
        };

        checkLoop();
    }

    stopRecording() {
        if (!this.isRecording) return;
        this.mediaRecorder.stop();
        this.isRecording = false;
        console.log("Recording finished.");
    }

    saveVideo() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        const sceneName = this.scene.constructor.name;
        a.download = `${sceneName}_${Date.now()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}
