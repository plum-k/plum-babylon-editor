import { Tools } from "../Misc/tools.js";
import { PerfCounter } from "../Misc/perfCounter.js";
/**
 * This class can be used to get instrumentation data from a Babylon engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#sceneinstrumentation
 */
export class SceneInstrumentation {
    // Properties
    /**
     * Gets the perf counter used for active meshes evaluation time
     */
    get activeMeshesEvaluationTimeCounter() {
        return this._activeMeshesEvaluationTime;
    }
    /**
     * Gets the active meshes evaluation time capture status
     */
    get captureActiveMeshesEvaluationTime() {
        return this._captureActiveMeshesEvaluationTime;
    }
    /**
     * Enable or disable the active meshes evaluation time capture
     */
    set captureActiveMeshesEvaluationTime(value) {
        if (value === this._captureActiveMeshesEvaluationTime) {
            return;
        }
        this._captureActiveMeshesEvaluationTime = value;
        if (value) {
            this._onBeforeActiveMeshesEvaluationObserver = this.scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
                Tools.StartPerformanceCounter("Active meshes evaluation");
                this._activeMeshesEvaluationTime.beginMonitoring();
            });
            this._onAfterActiveMeshesEvaluationObserver = this.scene.onAfterActiveMeshesEvaluationObservable.add(() => {
                Tools.EndPerformanceCounter("Active meshes evaluation");
                this._activeMeshesEvaluationTime.endMonitoring(false);
            });
        }
        else {
            this.scene.onBeforeActiveMeshesEvaluationObservable.remove(this._onBeforeActiveMeshesEvaluationObserver);
            this._onBeforeActiveMeshesEvaluationObserver = null;
            this.scene.onAfterActiveMeshesEvaluationObservable.remove(this._onAfterActiveMeshesEvaluationObserver);
            this._onAfterActiveMeshesEvaluationObserver = null;
        }
    }
    /**
     * Gets the perf counter used for render targets render time
     */
    get renderTargetsRenderTimeCounter() {
        return this._renderTargetsRenderTime;
    }
    /**
     * Gets the render targets render time capture status
     */
    get captureRenderTargetsRenderTime() {
        return this._captureRenderTargetsRenderTime;
    }
    /**
     * Enable or disable the render targets render time capture
     */
    set captureRenderTargetsRenderTime(value) {
        if (value === this._captureRenderTargetsRenderTime) {
            return;
        }
        this._captureRenderTargetsRenderTime = value;
        if (value) {
            this._onBeforeRenderTargetsRenderObserver = this.scene.onBeforeRenderTargetsRenderObservable.add(() => {
                Tools.StartPerformanceCounter("Render targets rendering");
                this._renderTargetsRenderTime.beginMonitoring();
            });
            this._onAfterRenderTargetsRenderObserver = this.scene.onAfterRenderTargetsRenderObservable.add(() => {
                Tools.EndPerformanceCounter("Render targets rendering");
                this._renderTargetsRenderTime.endMonitoring(false);
            });
        }
        else {
            this.scene.onBeforeRenderTargetsRenderObservable.remove(this._onBeforeRenderTargetsRenderObserver);
            this._onBeforeRenderTargetsRenderObserver = null;
            this.scene.onAfterRenderTargetsRenderObservable.remove(this._onAfterRenderTargetsRenderObserver);
            this._onAfterRenderTargetsRenderObserver = null;
        }
    }
    /**
     * Gets the perf counter used for particles render time
     */
    get particlesRenderTimeCounter() {
        return this._particlesRenderTime;
    }
    /**
     * Gets the particles render time capture status
     */
    get captureParticlesRenderTime() {
        return this._captureParticlesRenderTime;
    }
    /**
     * Enable or disable the particles render time capture
     */
    set captureParticlesRenderTime(value) {
        if (value === this._captureParticlesRenderTime) {
            return;
        }
        this._captureParticlesRenderTime = value;
        if (value) {
            this._onBeforeParticlesRenderingObserver = this.scene.onBeforeParticlesRenderingObservable.add(() => {
                Tools.StartPerformanceCounter("Particles");
                this._particlesRenderTime.beginMonitoring();
            });
            this._onAfterParticlesRenderingObserver = this.scene.onAfterParticlesRenderingObservable.add(() => {
                Tools.EndPerformanceCounter("Particles");
                this._particlesRenderTime.endMonitoring(false);
            });
        }
        else {
            this.scene.onBeforeParticlesRenderingObservable.remove(this._onBeforeParticlesRenderingObserver);
            this._onBeforeParticlesRenderingObserver = null;
            this.scene.onAfterParticlesRenderingObservable.remove(this._onAfterParticlesRenderingObserver);
            this._onAfterParticlesRenderingObserver = null;
        }
    }
    /**
     * Gets the perf counter used for sprites render time
     */
    get spritesRenderTimeCounter() {
        return this._spritesRenderTime;
    }
    /**
     * Gets the sprites render time capture status
     */
    get captureSpritesRenderTime() {
        return this._captureSpritesRenderTime;
    }
    /**
     * Enable or disable the sprites render time capture
     */
    set captureSpritesRenderTime(value) {
        if (value === this._captureSpritesRenderTime) {
            return;
        }
        this._captureSpritesRenderTime = value;
        if (!this.scene.spriteManagers) {
            return;
        }
        if (value) {
            this._onBeforeSpritesRenderingObserver = this.scene.onBeforeSpritesRenderingObservable.add(() => {
                Tools.StartPerformanceCounter("Sprites");
                this._spritesRenderTime.beginMonitoring();
            });
            this._onAfterSpritesRenderingObserver = this.scene.onAfterSpritesRenderingObservable.add(() => {
                Tools.EndPerformanceCounter("Sprites");
                this._spritesRenderTime.endMonitoring(false);
            });
        }
        else {
            this.scene.onBeforeSpritesRenderingObservable.remove(this._onBeforeSpritesRenderingObserver);
            this._onBeforeSpritesRenderingObserver = null;
            this.scene.onAfterSpritesRenderingObservable.remove(this._onAfterSpritesRenderingObserver);
            this._onAfterSpritesRenderingObserver = null;
        }
    }
    /**
     * Gets the perf counter used for physics time
     */
    get physicsTimeCounter() {
        return this._physicsTime;
    }
    /**
     * Gets the physics time capture status
     */
    get capturePhysicsTime() {
        return this._capturePhysicsTime;
    }
    /**
     * Enable or disable the physics time capture
     */
    set capturePhysicsTime(value) {
        if (value === this._capturePhysicsTime) {
            return;
        }
        if (!this.scene.onBeforePhysicsObservable) {
            return;
        }
        this._capturePhysicsTime = value;
        if (value) {
            this._onBeforePhysicsObserver = this.scene.onBeforePhysicsObservable.add(() => {
                Tools.StartPerformanceCounter("Physics");
                this._physicsTime.beginMonitoring();
            });
            this._onAfterPhysicsObserver = this.scene.onAfterPhysicsObservable.add(() => {
                Tools.EndPerformanceCounter("Physics");
                this._physicsTime.endMonitoring();
            });
        }
        else {
            this.scene.onBeforePhysicsObservable.remove(this._onBeforePhysicsObserver);
            this._onBeforePhysicsObserver = null;
            this.scene.onAfterPhysicsObservable.remove(this._onAfterPhysicsObserver);
            this._onAfterPhysicsObserver = null;
        }
    }
    /**
     * Gets the perf counter used for animations time
     */
    get animationsTimeCounter() {
        return this._animationsTime;
    }
    /**
     * Gets the animations time capture status
     */
    get captureAnimationsTime() {
        return this._captureAnimationsTime;
    }
    /**
     * Enable or disable the animations time capture
     */
    set captureAnimationsTime(value) {
        if (value === this._captureAnimationsTime) {
            return;
        }
        this._captureAnimationsTime = value;
        if (value) {
            this._onAfterAnimationsObserver = this.scene.onAfterAnimationsObservable.add(() => {
                this._animationsTime.endMonitoring();
            });
        }
        else {
            this.scene.onAfterAnimationsObservable.remove(this._onAfterAnimationsObserver);
            this._onAfterAnimationsObserver = null;
        }
    }
    /**
     * Gets the perf counter used for frame time capture
     */
    get frameTimeCounter() {
        return this._frameTime;
    }
    /**
     * Gets the frame time capture status
     */
    get captureFrameTime() {
        return this._captureFrameTime;
    }
    /**
     * Enable or disable the frame time capture
     */
    set captureFrameTime(value) {
        this._captureFrameTime = value;
    }
    /**
     * Gets the perf counter used for inter-frames time capture
     */
    get interFrameTimeCounter() {
        return this._interFrameTime;
    }
    /**
     * Gets the inter-frames time capture status
     */
    get captureInterFrameTime() {
        return this._captureInterFrameTime;
    }
    /**
     * Enable or disable the inter-frames time capture
     */
    set captureInterFrameTime(value) {
        this._captureInterFrameTime = value;
    }
    /**
     * Gets the perf counter used for render time capture
     */
    get renderTimeCounter() {
        return this._renderTime;
    }
    /**
     * Gets the render time capture status
     */
    get captureRenderTime() {
        return this._captureRenderTime;
    }
    /**
     * Enable or disable the render time capture
     */
    set captureRenderTime(value) {
        if (value === this._captureRenderTime) {
            return;
        }
        this._captureRenderTime = value;
        if (value) {
            this._onBeforeDrawPhaseObserver = this.scene.onBeforeDrawPhaseObservable.add(() => {
                this._renderTime.beginMonitoring();
                Tools.StartPerformanceCounter("Main render");
            });
            this._onAfterDrawPhaseObserver = this.scene.onAfterDrawPhaseObservable.add(() => {
                this._renderTime.endMonitoring(false);
                Tools.EndPerformanceCounter("Main render");
            });
        }
        else {
            this.scene.onBeforeDrawPhaseObservable.remove(this._onBeforeDrawPhaseObserver);
            this._onBeforeDrawPhaseObserver = null;
            this.scene.onAfterDrawPhaseObservable.remove(this._onAfterDrawPhaseObserver);
            this._onAfterDrawPhaseObserver = null;
        }
    }
    /**
     * Gets the perf counter used for camera render time capture
     */
    get cameraRenderTimeCounter() {
        return this._cameraRenderTime;
    }
    /**
     * Gets the camera render time capture status
     */
    get captureCameraRenderTime() {
        return this._captureCameraRenderTime;
    }
    /**
     * Enable or disable the camera render time capture
     */
    set captureCameraRenderTime(value) {
        if (value === this._captureCameraRenderTime) {
            return;
        }
        this._captureCameraRenderTime = value;
        if (value) {
            this._onBeforeCameraRenderObserver = this.scene.onBeforeCameraRenderObservable.add((camera) => {
                this._cameraRenderTime.beginMonitoring();
                Tools.StartPerformanceCounter(`Rendering camera ${camera.name}`);
            });
            this._onAfterCameraRenderObserver = this.scene.onAfterCameraRenderObservable.add((camera) => {
                this._cameraRenderTime.endMonitoring(false);
                Tools.EndPerformanceCounter(`Rendering camera ${camera.name}`);
            });
        }
        else {
            this.scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
            this._onBeforeCameraRenderObserver = null;
            this.scene.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver);
            this._onAfterCameraRenderObserver = null;
        }
    }
    /**
     * Gets the perf counter used for draw calls
     */
    get drawCallsCounter() {
        return this.scene.getEngine()._drawCalls;
    }
    /**
     * Instantiates a new scene instrumentation.
     * This class can be used to get instrumentation data from a Babylon engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#sceneinstrumentation
     * @param scene Defines the scene to instrument
     */
    constructor(
    /**
     * Defines the scene to instrument
     */
    scene) {
        this.scene = scene;
        this._captureActiveMeshesEvaluationTime = false;
        this._activeMeshesEvaluationTime = new PerfCounter();
        this._captureRenderTargetsRenderTime = false;
        this._renderTargetsRenderTime = new PerfCounter();
        this._captureFrameTime = false;
        this._frameTime = new PerfCounter();
        this._captureRenderTime = false;
        this._renderTime = new PerfCounter();
        this._captureInterFrameTime = false;
        this._interFrameTime = new PerfCounter();
        this._captureParticlesRenderTime = false;
        this._particlesRenderTime = new PerfCounter();
        this._captureSpritesRenderTime = false;
        this._spritesRenderTime = new PerfCounter();
        this._capturePhysicsTime = false;
        this._physicsTime = new PerfCounter();
        this._captureAnimationsTime = false;
        this._animationsTime = new PerfCounter();
        this._captureCameraRenderTime = false;
        this._cameraRenderTime = new PerfCounter();
        // Observers
        this._onBeforeActiveMeshesEvaluationObserver = null;
        this._onAfterActiveMeshesEvaluationObserver = null;
        this._onBeforeRenderTargetsRenderObserver = null;
        this._onAfterRenderTargetsRenderObserver = null;
        this._onAfterRenderObserver = null;
        this._onBeforeDrawPhaseObserver = null;
        this._onAfterDrawPhaseObserver = null;
        this._onBeforeAnimationsObserver = null;
        this._onBeforeParticlesRenderingObserver = null;
        this._onAfterParticlesRenderingObserver = null;
        this._onBeforeSpritesRenderingObserver = null;
        this._onAfterSpritesRenderingObserver = null;
        this._onBeforePhysicsObserver = null;
        this._onAfterPhysicsObserver = null;
        this._onAfterAnimationsObserver = null;
        this._onBeforeCameraRenderObserver = null;
        this._onAfterCameraRenderObserver = null;
        // Before render
        this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            if (this._captureActiveMeshesEvaluationTime) {
                this._activeMeshesEvaluationTime.fetchNewFrame();
            }
            if (this._captureRenderTargetsRenderTime) {
                this._renderTargetsRenderTime.fetchNewFrame();
            }
            if (this._captureFrameTime) {
                Tools.StartPerformanceCounter("Scene rendering");
                this._frameTime.beginMonitoring();
            }
            if (this._captureInterFrameTime) {
                this._interFrameTime.endMonitoring();
            }
            if (this._captureParticlesRenderTime) {
                this._particlesRenderTime.fetchNewFrame();
            }
            if (this._captureSpritesRenderTime) {
                this._spritesRenderTime.fetchNewFrame();
            }
            if (this._captureAnimationsTime) {
                this._animationsTime.beginMonitoring();
            }
            if (this._captureRenderTime) {
                this._renderTime.fetchNewFrame();
            }
            if (this._captureCameraRenderTime) {
                this._cameraRenderTime.fetchNewFrame();
            }
            this.scene.getEngine()._drawCalls.fetchNewFrame();
        });
        // After render
        this._onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
            if (this._captureFrameTime) {
                Tools.EndPerformanceCounter("Scene rendering");
                this._frameTime.endMonitoring();
            }
            if (this._captureRenderTime) {
                this._renderTime.endMonitoring(false);
            }
            if (this._captureInterFrameTime) {
                this._interFrameTime.beginMonitoring();
            }
            if (this._captureActiveMeshesEvaluationTime) {
                this._activeMeshesEvaluationTime.endFrame();
            }
            if (this._captureRenderTargetsRenderTime) {
                this._renderTargetsRenderTime.endFrame();
            }
            if (this._captureParticlesRenderTime) {
                this._particlesRenderTime.endFrame();
            }
            if (this._captureSpritesRenderTime) {
                this._spritesRenderTime.endFrame();
            }
            if (this._captureRenderTime) {
                this._renderTime.endFrame();
            }
            if (this._captureCameraRenderTime) {
                this._cameraRenderTime.endFrame();
            }
        });
    }
    /**
     * Dispose and release associated resources.
     */
    dispose() {
        this.scene.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        this._onAfterRenderObserver = null;
        this.scene.onBeforeActiveMeshesEvaluationObservable.remove(this._onBeforeActiveMeshesEvaluationObserver);
        this._onBeforeActiveMeshesEvaluationObserver = null;
        this.scene.onAfterActiveMeshesEvaluationObservable.remove(this._onAfterActiveMeshesEvaluationObserver);
        this._onAfterActiveMeshesEvaluationObserver = null;
        this.scene.onBeforeRenderTargetsRenderObservable.remove(this._onBeforeRenderTargetsRenderObserver);
        this._onBeforeRenderTargetsRenderObserver = null;
        this.scene.onAfterRenderTargetsRenderObservable.remove(this._onAfterRenderTargetsRenderObserver);
        this._onAfterRenderTargetsRenderObserver = null;
        this.scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
        this._onBeforeAnimationsObserver = null;
        this.scene.onBeforeParticlesRenderingObservable.remove(this._onBeforeParticlesRenderingObserver);
        this._onBeforeParticlesRenderingObserver = null;
        this.scene.onAfterParticlesRenderingObservable.remove(this._onAfterParticlesRenderingObserver);
        this._onAfterParticlesRenderingObserver = null;
        if (this._onBeforeSpritesRenderingObserver) {
            this.scene.onBeforeSpritesRenderingObservable.remove(this._onBeforeSpritesRenderingObserver);
            this._onBeforeSpritesRenderingObserver = null;
        }
        if (this._onAfterSpritesRenderingObserver) {
            this.scene.onAfterSpritesRenderingObservable.remove(this._onAfterSpritesRenderingObserver);
            this._onAfterSpritesRenderingObserver = null;
        }
        this.scene.onBeforeDrawPhaseObservable.remove(this._onBeforeDrawPhaseObserver);
        this._onBeforeDrawPhaseObserver = null;
        this.scene.onAfterDrawPhaseObservable.remove(this._onAfterDrawPhaseObserver);
        this._onAfterDrawPhaseObserver = null;
        if (this._onBeforePhysicsObserver) {
            this.scene.onBeforePhysicsObservable.remove(this._onBeforePhysicsObserver);
            this._onBeforePhysicsObserver = null;
        }
        if (this._onAfterPhysicsObserver) {
            this.scene.onAfterPhysicsObservable.remove(this._onAfterPhysicsObserver);
            this._onAfterPhysicsObserver = null;
        }
        this.scene.onAfterAnimationsObservable.remove(this._onAfterAnimationsObserver);
        this._onAfterAnimationsObserver = null;
        this.scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this._onBeforeCameraRenderObserver = null;
        this.scene.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver);
        this._onAfterCameraRenderObserver = null;
        this.scene = null;
    }
}
//# sourceMappingURL=sceneInstrumentation.js.map