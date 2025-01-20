
import { Observable } from "./observable.js";
import { PostProcess } from "../PostProcesses/postProcess.js";
import { PostProcessManager } from "../PostProcesses/postProcessManager.js";
import "../Shaders/minmaxRedux.fragment.js";
/**
 * This class computes a min/max reduction from a texture: it means it computes the minimum
 * and maximum values from all values of the texture.
 * It is performed on the GPU for better performances, thanks to a succession of post processes.
 * The source values are read from the red channel of the texture.
 */
export class MinMaxReducer {
    /**
     * Creates a min/max reducer
     * @param camera The camera to use for the post processes
     */
    constructor(camera) {
        /**
         * Observable triggered when the computation has been performed
         */
        this.onAfterReductionPerformed = new Observable();
        this._forceFullscreenViewport = true;
        this._activated = false;
        this._camera = camera;
        this._postProcessManager = new PostProcessManager(camera.getScene());
        this._onContextRestoredObserver = camera.getEngine().onContextRestoredObservable.add(() => {
            this._postProcessManager._rebuild();
        });
    }
    /**
     * Gets the texture used to read the values from.
     */
    get sourceTexture() {
        return this._sourceTexture;
    }
    /**
     * Sets the source texture to read the values from.
     * One must indicate if the texture is a depth texture or not through the depthRedux parameter
     * because in such textures '1' value must not be taken into account to compute the maximum
     * as this value is used to clear the texture.
     * Note that the computation is not activated by calling this function, you must call activate() for that!
     * @param sourceTexture The texture to read the values from. The values should be in the red channel.
     * @param depthRedux Indicates if the texture is a depth texture or not
     * @param type The type of the textures created for the reduction (defaults to TEXTURETYPE_HALF_FLOAT)
     * @param forceFullscreenViewport Forces the post processes used for the reduction to be applied without taking into account viewport (defaults to true)
     */
    setSourceTexture(sourceTexture, depthRedux, type = 2, forceFullscreenViewport = true) {
        if (sourceTexture === this._sourceTexture) {
            return;
        }
        this.dispose(false);
        this._sourceTexture = sourceTexture;
        this._reductionSteps = [];
        this._forceFullscreenViewport = forceFullscreenViewport;
        const scene = this._camera.getScene();
        // create the first step
        const reductionInitial = new PostProcess("Initial reduction phase", "minmaxRedux", // shader
        ["texSize"], ["sourceTexture"], // textures
        1.0, // options
        null, // camera
        1, // sampling
        scene.getEngine(), // engine
        false, // reusable
        "#define INITIAL" + (depthRedux ? "\n#define DEPTH_REDUX" : ""), // defines
        type, undefined, undefined, undefined, 7);
        reductionInitial.autoClear = false;
        reductionInitial.forceFullscreenViewport = forceFullscreenViewport;
        let w = this._sourceTexture.getRenderWidth(), h = this._sourceTexture.getRenderHeight();
        reductionInitial.onApply = ((w, h) => {
            return (effect) => {
                effect.setTexture("sourceTexture", this._sourceTexture);
                effect.setFloat2("texSize", w, h);
            };
        })(w, h);
        this._reductionSteps.push(reductionInitial);
        let index = 1;
        // create the additional steps
        while (w > 1 || h > 1) {
            w = Math.max(Math.round(w / 2), 1);
            h = Math.max(Math.round(h / 2), 1);
            const reduction = new PostProcess("Reduction phase " + index, "minmaxRedux", // shader
            ["texSize"], null, { width: w, height: h }, // options
            null, // camera
            1, // sampling
            scene.getEngine(), // engine
            false, // reusable
            "#define " + (w == 1 && h == 1 ? "LAST" : w == 1 || h == 1 ? "ONEBEFORELAST" : "MAIN"), // defines
            type, undefined, undefined, undefined, 7);
            reduction.autoClear = false;
            reduction.forceFullscreenViewport = forceFullscreenViewport;
            reduction.onApply = ((w, h) => {
                return (effect) => {
                    if (w == 1 || h == 1) {
                        effect.setInt2("texSize", w, h);
                    }
                    else {
                        effect.setFloat2("texSize", w, h);
                    }
                };
            })(w, h);
            this._reductionSteps.push(reduction);
            index++;
            if (w == 1 && h == 1) {
                const func = (w, h, reduction) => {
                    const buffer = new Float32Array(4 * w * h), minmax = { min: 0, max: 0 };
                    return () => {
                        scene.getEngine()._readTexturePixels(reduction.inputTexture.texture, w, h, -1, 0, buffer, false);
                        minmax.min = buffer[0];
                        minmax.max = buffer[1];
                        this.onAfterReductionPerformed.notifyObservers(minmax);
                    };
                };
                reduction.onAfterRenderObservable.add(func(w, h, reduction));
            }
        }
    }
    /**
     * Defines the refresh rate of the computation.
     * Use 0 to compute just once, 1 to compute on every frame, 2 to compute every two frames and so on...
     */
    get refreshRate() {
        return this._sourceTexture ? this._sourceTexture.refreshRate : -1;
    }
    set refreshRate(value) {
        if (this._sourceTexture) {
            this._sourceTexture.refreshRate = value;
        }
    }
    /**
     * Gets the activation status of the reducer
     */
    get activated() {
        return this._activated;
    }
    /**
     * Activates the reduction computation.
     * When activated, the observers registered in onAfterReductionPerformed are
     * called after the computation is performed
     */
    activate() {
        if (this._onAfterUnbindObserver || !this._sourceTexture) {
            return;
        }
        this._onAfterUnbindObserver = this._sourceTexture.onAfterUnbindObservable.add(() => {
            const engine = this._camera.getScene().getEngine();
            engine._debugPushGroup?.(`min max reduction`, 1);
            this._reductionSteps[0].activate(this._camera);
            this._postProcessManager.directRender(this._reductionSteps, this._reductionSteps[0].inputTexture, this._forceFullscreenViewport);
            engine.unBindFramebuffer(this._reductionSteps[0].inputTexture, false);
            engine._debugPopGroup?.(1);
        });
        this._activated = true;
    }
    /**
     * Deactivates the reduction computation.
     */
    deactivate() {
        if (!this._onAfterUnbindObserver || !this._sourceTexture) {
            return;
        }
        this._sourceTexture.onAfterUnbindObservable.remove(this._onAfterUnbindObserver);
        this._onAfterUnbindObserver = null;
        this._activated = false;
    }
    /**
     * Disposes the min/max reducer
     * @param disposeAll true to dispose all the resources. You should always call this function with true as the parameter (or without any parameter as it is the default one). This flag is meant to be used internally.
     */
    dispose(disposeAll = true) {
        if (disposeAll) {
            this.onAfterReductionPerformed.clear();
            if (this._onContextRestoredObserver) {
                this._camera.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver);
                this._onContextRestoredObserver = null;
            }
        }
        this.deactivate();
        if (this._reductionSteps) {
            for (let i = 0; i < this._reductionSteps.length; ++i) {
                this._reductionSteps[i].dispose();
            }
            this._reductionSteps = null;
        }
        if (this._postProcessManager && disposeAll) {
            this._postProcessManager.dispose();
        }
        this._sourceTexture = null;
    }
}
//# sourceMappingURL=minMaxReducer.js.map