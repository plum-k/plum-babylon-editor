import { Camera } from "../Cameras/camera.js";
import { Halton2DSequence } from "../Maths/halton2DSequence.js";
import { Engine } from "../Engines/engine.js";
import { EffectWrapper } from "../Materials/effectRenderer.js";
/**
 * Simple implementation of Temporal Anti-Aliasing (TAA).
 * This can be used to improve image quality for still pictures (screenshots for e.g.).
 */
export class ThinTAAPostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/taa.fragment.js"));
        }
        else {
            list.push(import("../Shaders/taa.fragment.js"));
        }
    }
    /**
     * Number of accumulated samples (default: 8)
     */
    set samples(samples) {
        if (this._samples === samples) {
            return;
        }
        this._samples = samples;
        this._hs.regenerate(samples);
    }
    get samples() {
        return this._samples;
    }
    /**
     * Whether the TAA is disabled
     */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        if (this._disabled === value) {
            return;
        }
        this._disabled = value;
        this._reset();
    }
    /**
     * The width of the texture in which to render
     */
    get textureWidth() {
        return this._textureWidth;
    }
    set textureWidth(width) {
        if (this._textureWidth === width) {
            return;
        }
        this._textureWidth = width;
        this._reset();
    }
    /**
     * The height of the texture in which to render
     */
    get textureHeight() {
        return this._textureHeight;
    }
    set textureHeight(height) {
        if (this._textureHeight === height) {
            return;
        }
        this._textureHeight = height;
        this._reset();
    }
    /**
     * Constructs a new TAA post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinTAAPostProcess.FragmentUrl,
            uniforms: ThinTAAPostProcess.Uniforms,
            samplers: ThinTAAPostProcess.Samplers,
        });
        this._samples = 8;
        /**
         * The factor used to blend the history frame with current frame (default: 0.05)
         */
        this.factor = 0.05;
        this._disabled = false;
        this._textureWidth = 0;
        this._textureHeight = 0;
        /**
         * Disable TAA on camera move (default: true).
         * You generally want to keep this enabled, otherwise you will get a ghost effect when the camera moves (but if it's what you want, go for it!)
         */
        this.disableOnCameraMove = true;
        this._firstUpdate = true;
        this._hs = new Halton2DSequence(this.samples);
    }
    /** @internal */
    _reset() {
        this._hs.setDimensions(this._textureWidth / 2, this._textureHeight / 2);
        this._hs.next();
        this._firstUpdate = true;
    }
    updateProjectionMatrix() {
        if (this.disabled) {
            return;
        }
        if (this.camera && !this.camera.hasMoved) {
            if (this.camera.mode === Camera.PERSPECTIVE_CAMERA) {
                const projMat = this.camera.getProjectionMatrix();
                projMat.setRowFromFloats(2, this._hs.x, this._hs.y, projMat.m[10], projMat.m[11]);
            }
            else {
                // We must force the update of the projection matrix so that m[12] and m[13] are recomputed, as we modified them the previous frame
                const projMat = this.camera.getProjectionMatrix(true);
                projMat.setRowFromFloats(3, this._hs.x + projMat.m[12], this._hs.y + projMat.m[13], projMat.m[14], projMat.m[15]);
            }
        }
        this._hs.next();
    }
    bind() {
        super.bind();
        if (this.disabled) {
            return;
        }
        const effect = this._drawWrapper.effect;
        effect.setFloat("factor", (this.camera?.hasMoved && this.disableOnCameraMove) || this._firstUpdate ? 1 : this.factor);
        this._firstUpdate = false;
    }
}
/**
 * The fragment shader url
 */
ThinTAAPostProcess.FragmentUrl = "taa";
/**
 * The list of uniforms used by the effect
 */
ThinTAAPostProcess.Uniforms = ["factor"];
/**
 * The list of samplers used by the effect
 */
ThinTAAPostProcess.Samplers = ["historySampler"];
//# sourceMappingURL=thinTAAPostProcess.js.map