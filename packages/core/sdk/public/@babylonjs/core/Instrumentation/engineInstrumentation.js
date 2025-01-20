import { PerfCounter } from "../Misc/perfCounter.js";
/**
 * This class can be used to get instrumentation data from a Babylon engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
 */
export class EngineInstrumentation {
    // Properties
    /**
     * Gets the perf counter used for GPU frame time
     */
    get gpuFrameTimeCounter() {
        return this.engine.getGPUFrameTimeCounter();
    }
    /**
     * Gets the GPU frame time capture status
     */
    get captureGPUFrameTime() {
        return this._captureGPUFrameTime;
    }
    /**
     * Enable or disable the GPU frame time capture
     */
    set captureGPUFrameTime(value) {
        if (value === this._captureGPUFrameTime) {
            return;
        }
        this._captureGPUFrameTime = value;
        this.engine.captureGPUFrameTime(value);
    }
    /**
     * Gets the perf counter used for shader compilation time
     */
    get shaderCompilationTimeCounter() {
        return this._shaderCompilationTime;
    }
    /**
     * Gets the shader compilation time capture status
     */
    get captureShaderCompilationTime() {
        return this._captureShaderCompilationTime;
    }
    /**
     * Enable or disable the shader compilation time capture
     */
    set captureShaderCompilationTime(value) {
        if (value === this._captureShaderCompilationTime) {
            return;
        }
        this._captureShaderCompilationTime = value;
        if (value) {
            this._onBeforeShaderCompilationObserver = this.engine.onBeforeShaderCompilationObservable.add(() => {
                this._shaderCompilationTime.fetchNewFrame();
                this._shaderCompilationTime.beginMonitoring();
            });
            this._onAfterShaderCompilationObserver = this.engine.onAfterShaderCompilationObservable.add(() => {
                this._shaderCompilationTime.endMonitoring();
            });
        }
        else {
            this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
            this._onBeforeShaderCompilationObserver = null;
            this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
            this._onAfterShaderCompilationObserver = null;
        }
    }
    /**
     * Instantiates a new engine instrumentation.
     * This class can be used to get instrumentation data from a Babylon engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
     * @param engine Defines the engine to instrument
     */
    constructor(
    /**
     * Define the instrumented engine.
     */
    engine) {
        this.engine = engine;
        this._captureGPUFrameTime = false;
        this._captureShaderCompilationTime = false;
        this._shaderCompilationTime = new PerfCounter();
        // Observers
        this._onBeginFrameObserver = null;
        this._onEndFrameObserver = null;
        this._onBeforeShaderCompilationObserver = null;
        this._onAfterShaderCompilationObserver = null;
    }
    /**
     * Dispose and release associated resources.
     */
    dispose() {
        this.engine.onBeginFrameObservable.remove(this._onBeginFrameObserver);
        this._onBeginFrameObserver = null;
        this.engine.onEndFrameObservable.remove(this._onEndFrameObserver);
        this._onEndFrameObserver = null;
        this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
        this._onBeforeShaderCompilationObserver = null;
        this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
        this._onAfterShaderCompilationObserver = null;
        this.engine = null;
    }
}
//# sourceMappingURL=engineInstrumentation.js.map