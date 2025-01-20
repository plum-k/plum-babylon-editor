import { __decorate } from "../../tslib.es6.js";
import { Tools } from "../../Misc/tools.js";
import { serialize } from "../../Misc/decorators.js";
/**
 * PostProcessRenderPipeline
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
 */
export class PostProcessRenderPipeline {
    /**
     * Gets pipeline name
     */
    get name() {
        return this._name;
    }
    /** Gets the list of attached cameras */
    get cameras() {
        return this._cameras;
    }
    /**
     * Gets the active engine
     */
    get engine() {
        return this._engine;
    }
    /**
     * Initializes a PostProcessRenderPipeline
     * @param _engine engine to add the pipeline to
     * @param name name of the pipeline
     */
    constructor(_engine, name) {
        this._engine = _engine;
        this._name = name;
        this._renderEffects = {};
        this._renderEffectsForIsolatedPass = new Array();
        this._cameras = [];
    }
    /**
     * Gets the class name
     * @returns "PostProcessRenderPipeline"
     */
    getClassName() {
        return "PostProcessRenderPipeline";
    }
    /**
     * If all the render effects in the pipeline are supported
     */
    get isSupported() {
        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                if (!this._renderEffects[renderEffectName].isSupported) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Adds an effect to the pipeline
     * @param renderEffect the effect to add
     */
    addEffect(renderEffect) {
        this._renderEffects[renderEffect._name] = renderEffect;
    }
    // private
    /** @internal */
    _rebuild() { }
    /**
     * @internal
     */
    _enableEffect(renderEffectName, cameras) {
        const renderEffects = this._renderEffects[renderEffectName];
        if (!renderEffects) {
            return;
        }
        renderEffects._enable(Tools.MakeArray(cameras || this._cameras));
    }
    /**
     * @internal
     */
    _disableEffect(renderEffectName, cameras) {
        const renderEffects = this._renderEffects[renderEffectName];
        if (!renderEffects) {
            return;
        }
        renderEffects._disable(Tools.MakeArray(cameras || this._cameras));
    }
    /**
     * @internal
     */
    _attachCameras(cameras, unique) {
        const cams = Tools.MakeArray(cameras || this._cameras);
        if (!cams) {
            return;
        }
        const indicesToDelete = [];
        let i;
        for (i = 0; i < cams.length; i++) {
            const camera = cams[i];
            if (!camera) {
                continue;
            }
            if (this._cameras.indexOf(camera) === -1) {
                this._cameras.push(camera);
            }
            else if (unique) {
                indicesToDelete.push(i);
            }
        }
        for (i = 0; i < indicesToDelete.length; i++) {
            cams.splice(indicesToDelete[i], 1);
        }
        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                this._renderEffects[renderEffectName]._attachCameras(cams);
            }
        }
    }
    /**
     * @internal
     */
    _detachCameras(cameras) {
        const cams = Tools.MakeArray(cameras || this._cameras);
        if (!cams) {
            return;
        }
        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                this._renderEffects[renderEffectName]._detachCameras(cams);
            }
        }
        for (let i = 0; i < cams.length; i++) {
            this._cameras.splice(this._cameras.indexOf(cams[i]), 1);
        }
    }
    /** @internal */
    _update() {
        for (const renderEffectName in this._renderEffects) {
            if (Object.prototype.hasOwnProperty.call(this._renderEffects, renderEffectName)) {
                this._renderEffects[renderEffectName]._update();
            }
        }
        for (let i = 0; i < this._cameras.length; i++) {
            if (!this._cameras[i]) {
                continue;
            }
            const cameraName = this._cameras[i].name;
            if (this._renderEffectsForIsolatedPass[cameraName]) {
                this._renderEffectsForIsolatedPass[cameraName]._update();
            }
        }
    }
    /** @internal */
    _reset() {
        this._renderEffects = {};
        this._renderEffectsForIsolatedPass = new Array();
    }
    _enableMSAAOnFirstPostProcess(sampleCount) {
        if (!this._engine._features.supportMSAA) {
            return false;
        }
        // Set samples of the very first post process to 4 to enable native anti-aliasing in browsers that support webGL 2.0 (See: https://github.com/BabylonJS/Babylon.js/issues/3754)
        const effectKeys = Object.keys(this._renderEffects);
        if (effectKeys.length > 0) {
            const postProcesses = this._renderEffects[effectKeys[0]].getPostProcesses();
            if (postProcesses) {
                postProcesses[0].samples = sampleCount;
            }
        }
        return true;
    }
    /**
     * Ensures that all post processes in the pipeline are the correct size according to the
     * the viewport's required size
     */
    _adaptPostProcessesToViewPort() {
        const effectKeys = Object.keys(this._renderEffects);
        for (const effectKey of effectKeys) {
            const postProcesses = this._renderEffects[effectKey].getPostProcesses();
            if (postProcesses) {
                for (const postProcess of postProcesses) {
                    postProcess.adaptScaleToCurrentViewport = true;
                }
            }
        }
    }
    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup.
     * @returns true if the pre pass is needed.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPrePassRenderer(prePassRenderer) {
        // Do Nothing by default
        return false;
    }
    /**
     * Disposes of the pipeline
     */
    dispose() {
        // Must be implemented by children
    }
}
__decorate([
    serialize()
], PostProcessRenderPipeline.prototype, "_name", void 0);
//# sourceMappingURL=postProcessRenderPipeline.js.map