import { Tools } from "./tools.js";
/**
 * This can help with recording videos from BabylonJS.
 * This is based on the available WebRTC functionalities of the browser.
 *
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/renderToVideo
 */
export class VideoRecorder {
    /**
     * Returns whether or not the VideoRecorder is available in your browser.
     * @param engine Defines the Babylon Engine.
     * @param canvas Defines the canvas to record. If not provided, the engine canvas will be used.
     * @returns true if supported otherwise false.
     */
    static IsSupported(engine, canvas) {
        const targetCanvas = canvas ?? engine.getRenderingCanvas();
        return !!targetCanvas && typeof targetCanvas.captureStream === "function";
    }
    /**
     * True when a recording is already in progress.
     */
    get isRecording() {
        return !!this._canvas && this._isRecording;
    }
    /**
     * Create a new VideoCapture object which can help converting what you see in Babylon to a video file.
     * @param engine Defines the BabylonJS Engine you wish to record.
     * @param options Defines options that can be used to customize the capture.
     */
    constructor(engine, options = {}) {
        if (!VideoRecorder.IsSupported(engine, options.canvas)) {
            // eslint-disable-next-line no-throw-literal
            throw "Your browser does not support recording so far.";
        }
        const canvas = options.canvas ?? engine.getRenderingCanvas();
        if (!canvas) {
            // eslint-disable-next-line no-throw-literal
            throw "The babylon engine must have a canvas to be recorded";
        }
        this._canvas = canvas;
        this._isRecording = false;
        this._options = {
            ...VideoRecorder._DefaultOptions,
            ...options,
        };
        const stream = this._canvas.captureStream(this._options.fps);
        if (this._options.audioTracks) {
            for (const track of this._options.audioTracks) {
                stream.addTrack(track);
            }
        }
        this._mediaRecorder = new MediaRecorder(stream, { mimeType: this._options.mimeType });
        this._mediaRecorder.ondataavailable = (evt) => this._handleDataAvailable(evt);
        this._mediaRecorder.onerror = (evt) => this._handleError(evt);
        this._mediaRecorder.onstop = () => this._handleStop();
    }
    /**
     * Stops the current recording before the default capture timeout passed in the startRecording function.
     */
    stopRecording() {
        if (!this._canvas || !this._mediaRecorder) {
            return;
        }
        if (!this.isRecording) {
            return;
        }
        this._isRecording = false;
        this._mediaRecorder.stop();
    }
    /**
     * Starts recording the canvas for a max duration specified in parameters.
     * @param fileName Defines the name of the file to be downloaded when the recording stop.
     * If null no automatic download will start and you can rely on the promise to get the data back.
     * @param maxDuration Defines the maximum recording time in seconds.
     * It defaults to 7 seconds. A value of zero will not stop automatically, you would need to call stopRecording manually.
     * @returns A promise callback at the end of the recording with the video data in Blob.
     */
    startRecording(fileName = "babylonjs.webm", maxDuration = 7) {
        if (!this._canvas || !this._mediaRecorder) {
            // eslint-disable-next-line no-throw-literal
            throw "Recorder has already been disposed";
        }
        if (this.isRecording) {
            // eslint-disable-next-line no-throw-literal
            throw "Recording already in progress";
        }
        if (maxDuration > 0) {
            setTimeout(() => {
                this.stopRecording();
            }, maxDuration * 1000);
        }
        this._fileName = fileName;
        this._recordedChunks = [];
        this._resolve = null;
        this._reject = null;
        this._isRecording = true;
        this._mediaRecorder.start(this._options.recordChunckSize);
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    /**
     * Releases internal resources used during the recording.
     */
    dispose() {
        this._canvas = null;
        this._mediaRecorder = null;
        this._recordedChunks = [];
        this._fileName = null;
        this._resolve = null;
        this._reject = null;
    }
    _handleDataAvailable(event) {
        if (event.data.size > 0) {
            this._recordedChunks.push(event.data);
        }
    }
    _handleError(event) {
        this.stopRecording();
        if (this._reject) {
            this._reject(event.error);
        }
        else {
            throw new event.error();
        }
    }
    _handleStop() {
        this.stopRecording();
        const superBuffer = new Blob(this._recordedChunks);
        if (this._resolve) {
            this._resolve(superBuffer);
        }
        window.URL.createObjectURL(superBuffer);
        if (this._fileName) {
            Tools.Download(superBuffer, this._fileName);
        }
    }
}
VideoRecorder._DefaultOptions = {
    mimeType: "video/webm",
    fps: 25,
    recordChunckSize: 3000,
};
//# sourceMappingURL=videoRecorder.js.map