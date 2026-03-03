import { LOOP_DURATION } from '../core/Constants';

/**
 * VideoExporter: Captures the canvas only and downloads it as a video.
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
        const videoStream = canvas.captureStream(60); 
        
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(videoStream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 25000000 
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.saveVideo();
        };

        this.isRecording = true;
        
        const checkLoop = () => {
            const currentTime = this.scene.time.now;
            const progress = (currentTime % LOOP_DURATION) / LOOP_DURATION;
            
            if (progress < 0.02) {
                this.mediaRecorder.start(1000); 
                this.recordingStartTime = currentTime;
                this.scene.events.emit('recording-start');
                
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
    }

    saveVideo() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        const sceneName = this.scene.constructor.name;
        const fileName = `${sceneName}_${Date.now()}.webm`;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}
