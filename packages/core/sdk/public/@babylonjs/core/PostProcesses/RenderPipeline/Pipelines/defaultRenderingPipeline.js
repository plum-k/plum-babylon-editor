import { __decorate } from "../../../tslib.es6.js";
import { serialize } from "../../../Misc/decorators.js";
import { SerializationHelper } from "../../../Misc/decorators.serialization.js";
import { Observable } from "../../../Misc/observable.js";
import { Logger } from "../../../Misc/logger.js";
import { Texture } from "../../../Materials/Textures/texture.js";

import { GlowLayer } from "../../../Layers/glowLayer.js";
import { SharpenPostProcess } from "../../../PostProcesses/sharpenPostProcess.js";
import { ImageProcessingPostProcess } from "../../../PostProcesses/imageProcessingPostProcess.js";
import { ChromaticAberrationPostProcess } from "../../../PostProcesses/chromaticAberrationPostProcess.js";
import { GrainPostProcess } from "../../../PostProcesses/grainPostProcess.js";
import { FxaaPostProcess } from "../../../PostProcesses/fxaaPostProcess.js";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect.js";
import { DepthOfFieldEffect } from "../../../PostProcesses/depthOfFieldEffect.js";
import { BloomEffect } from "../../../PostProcesses/bloomEffect.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { EngineStore } from "../../../Engines/engineStore.js";
import { Tools } from "../../../Misc/tools.js";
import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.js";
/**
 * The default rendering pipeline can be added to a scene to apply common post processing effects such as anti-aliasing or depth of field.
 * See https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline
 */
export class DefaultRenderingPipeline extends PostProcessRenderPipeline {
    /**
     * Enable or disable automatic building of the pipeline when effects are enabled and disabled.
     * If false, you will have to manually call prepare() to update the pipeline.
     */
    get automaticBuild() {
        return this._buildAllowed;
    }
    set automaticBuild(value) {
        this._buildAllowed = value;
    }
    /**
     * Gets active scene
     */
    get scene() {
        return this._scene;
    }
    /**
     * Enable or disable the sharpen process from the pipeline
     */
    set sharpenEnabled(enabled) {
        if (this._sharpenEnabled === enabled) {
            return;
        }
        this._sharpenEnabled = enabled;
        this._buildPipeline();
    }
    get sharpenEnabled() {
        return this._sharpenEnabled;
    }
    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    get bloomKernel() {
        return this._bloomKernel;
    }
    set bloomKernel(value) {
        this._bloomKernel = value;
        this.bloom.kernel = value / this._hardwareScaleLevel;
    }
    /**
     * The strength of the bloom.
     */
    set bloomWeight(value) {
        if (this._bloomWeight === value) {
            return;
        }
        this.bloom.weight = value;
        this._bloomWeight = value;
    }
    get bloomWeight() {
        return this._bloomWeight;
    }
    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    set bloomThreshold(value) {
        if (this._bloomThreshold === value) {
            return;
        }
        this.bloom.threshold = value;
        this._bloomThreshold = value;
    }
    get bloomThreshold() {
        return this._bloomThreshold;
    }
    /**
     * The scale of the bloom, lower value will provide better performance.
     */
    set bloomScale(value) {
        if (this._bloomScale === value) {
            return;
        }
        this._bloomScale = value;
        // recreate bloom and dispose old as this setting is not dynamic
        this._rebuildBloom();
        this._buildPipeline();
    }
    get bloomScale() {
        return this._bloomScale;
    }
    /**
     * Enable or disable the bloom from the pipeline
     */
    set bloomEnabled(enabled) {
        if (this._bloomEnabled === enabled) {
            return;
        }
        this._bloomEnabled = enabled;
        this._buildPipeline();
    }
    get bloomEnabled() {
        return this._bloomEnabled;
    }
    _rebuildBloom() {
        // recreate bloom and dispose old as this setting is not dynamic
        const oldBloom = this.bloom;
        this.bloom = new BloomEffect(this._scene, this.bloomScale, this._bloomWeight, this.bloomKernel / this._hardwareScaleLevel, this._defaultPipelineTextureType, false);
        this.bloom.threshold = oldBloom.threshold;
        for (let i = 0; i < this._cameras.length; i++) {
            oldBloom.disposeEffects(this._cameras[i]);
        }
    }
    /**
     * If the depth of field is enabled.
     */
    get depthOfFieldEnabled() {
        return this._depthOfFieldEnabled;
    }
    set depthOfFieldEnabled(enabled) {
        if (this._depthOfFieldEnabled === enabled) {
            return;
        }
        this._depthOfFieldEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * Blur level of the depth of field effect. (Higher blur will effect performance)
     */
    get depthOfFieldBlurLevel() {
        return this._depthOfFieldBlurLevel;
    }
    set depthOfFieldBlurLevel(value) {
        if (this._depthOfFieldBlurLevel === value) {
            return;
        }
        this._depthOfFieldBlurLevel = value;
        // recreate dof and dispose old as this setting is not dynamic
        const oldDof = this.depthOfField;
        this.depthOfField = new DepthOfFieldEffect(this._scene, null, this._depthOfFieldBlurLevel, this._defaultPipelineTextureType, false);
        this.depthOfField.focalLength = oldDof.focalLength;
        this.depthOfField.focusDistance = oldDof.focusDistance;
        this.depthOfField.fStop = oldDof.fStop;
        this.depthOfField.lensSize = oldDof.lensSize;
        for (let i = 0; i < this._cameras.length; i++) {
            oldDof.disposeEffects(this._cameras[i]);
        }
        this._buildPipeline();
    }
    /**
     * If the anti aliasing is enabled.
     */
    set fxaaEnabled(enabled) {
        if (this._fxaaEnabled === enabled) {
            return;
        }
        this._fxaaEnabled = enabled;
        this._buildPipeline();
    }
    get fxaaEnabled() {
        return this._fxaaEnabled;
    }
    /**
     * MSAA sample count, setting this to 4 will provide 4x anti aliasing. (default: 1)
     */
    set samples(sampleCount) {
        if (this._samples === sampleCount) {
            return;
        }
        this._samples = sampleCount;
        this._buildPipeline();
    }
    get samples() {
        return this._samples;
    }
    /**
     * If image processing is enabled.
     */
    set imageProcessingEnabled(enabled) {
        if (this._imageProcessingEnabled === enabled) {
            return;
        }
        this._scene.imageProcessingConfiguration.isEnabled = enabled;
    }
    get imageProcessingEnabled() {
        return this._imageProcessingEnabled;
    }
    /**
     * If glow layer is enabled. (Adds a glow effect to emmissive materials)
     */
    set glowLayerEnabled(enabled) {
        if (enabled && !this._glowLayer) {
            this._glowLayer = new GlowLayer("", this._scene);
        }
        else if (!enabled && this._glowLayer) {
            this._glowLayer.dispose();
            this._glowLayer = null;
        }
    }
    get glowLayerEnabled() {
        return this._glowLayer != null;
    }
    /**
     * Gets the glow layer (or null if not defined)
     */
    get glowLayer() {
        return this._glowLayer;
    }
    /**
     * Enable or disable the chromaticAberration process from the pipeline
     */
    set chromaticAberrationEnabled(enabled) {
        if (this._chromaticAberrationEnabled === enabled) {
            return;
        }
        this._chromaticAberrationEnabled = enabled;
        this._buildPipeline();
    }
    get chromaticAberrationEnabled() {
        return this._chromaticAberrationEnabled;
    }
    /**
     * Enable or disable the grain process from the pipeline
     */
    set grainEnabled(enabled) {
        if (this._grainEnabled === enabled) {
            return;
        }
        this._grainEnabled = enabled;
        this._buildPipeline();
    }
    get grainEnabled() {
        return this._grainEnabled;
    }
    /**
     * Instantiates a DefaultRenderingPipeline.
     * @param name The rendering pipeline name (default: "")
     * @param hdr If high dynamic range textures should be used (default: true)
     * @param scene The scene linked to this pipeline (default: the last created scene)
     * @param cameras The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param automaticBuild If false, you will have to manually call prepare() to update the pipeline (default: true)
     */
    constructor(name = "", hdr = true, scene = EngineStore.LastCreatedScene, cameras, automaticBuild = true) {
        super(scene.getEngine(), name);
        this._camerasToBeAttached = [];
        /**
         * ID of the sharpen post process,
         */
        this.SharpenPostProcessId = "SharpenPostProcessEffect";
        /**
         * @ignore
         * ID of the image processing post process;
         */
        this.ImageProcessingPostProcessId = "ImageProcessingPostProcessEffect";
        /**
         * @ignore
         * ID of the Fast Approximate Anti-Aliasing post process;
         */
        this.FxaaPostProcessId = "FxaaPostProcessEffect";
        /**
         * ID of the chromatic aberration post process,
         */
        this.ChromaticAberrationPostProcessId = "ChromaticAberrationPostProcessEffect";
        /**
         * ID of the grain post process
         */
        this.GrainPostProcessId = "GrainPostProcessEffect";
        /**
         * Glow post process which adds a glow to emissive areas of the image
         */
        this._glowLayer = null;
        /**
         * Animations which can be used to tweak settings over a period of time
         */
        this.animations = [];
        this._imageProcessingConfigurationObserver = null;
        // Values
        this._sharpenEnabled = false;
        this._bloomEnabled = false;
        this._depthOfFieldEnabled = false;
        this._depthOfFieldBlurLevel = 0 /* DepthOfFieldEffectBlurLevel.Low */;
        this._fxaaEnabled = false;
        this._imageProcessingEnabled = true;
        this._bloomScale = 0.5;
        this._chromaticAberrationEnabled = false;
        this._grainEnabled = false;
        this._buildAllowed = true;
        /**
         * This is triggered each time the pipeline has been built.
         */
        this.onBuildObservable = new Observable();
        this._resizeObserver = null;
        this._hardwareScaleLevel = 1.0;
        this._bloomKernel = 64;
        /**
         * Specifies the weight of the bloom in the final rendering
         */
        this._bloomWeight = 0.15;
        /**
         * Specifies the luma threshold for the area that will be blurred by the bloom
         */
        this._bloomThreshold = 0.9;
        this._samples = 1;
        this._hasCleared = false;
        this._prevPostProcess = null;
        this._prevPrevPostProcess = null;
        this._depthOfFieldSceneObserver = null;
        this._activeCameraChangedObserver = null;
        this._activeCamerasChangedObserver = null;
        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();
        this._buildAllowed = automaticBuild;
        // Initialize
        this._scene = scene;
        const caps = this._scene.getEngine().getCaps();
        this._hdr = hdr && (caps.textureHalfFloatRender || caps.textureFloatRender);
        // Misc
        if (this._hdr) {
            if (caps.textureHalfFloatRender) {
                this._defaultPipelineTextureType = 2;
            }
            else if (caps.textureFloatRender) {
                this._defaultPipelineTextureType = 1;
            }
        }
        else {
            this._defaultPipelineTextureType = 0;
        }
        // Attach
        scene.postProcessRenderPipelineManager.addPipeline(this);
        const engine = this._scene.getEngine();
        // Create post processes before hand so they can be modified before enabled.
        // Block compilation flag is set to true to avoid compilation prior to use, these will be updated on first use in build pipeline.
        this.sharpen = new SharpenPostProcess("sharpen", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, true);
        this._sharpenEffect = new PostProcessRenderEffect(engine, this.SharpenPostProcessId, () => {
            return this.sharpen;
        }, true);
        this.depthOfField = new DepthOfFieldEffect(this._scene, null, this._depthOfFieldBlurLevel, this._defaultPipelineTextureType, true);
        // To keep the bloom sizes consistent across different display densities, factor in the hardware scaling level.
        this._hardwareScaleLevel = engine.getHardwareScalingLevel();
        this._resizeObserver = engine.onResizeObservable.add(() => {
            this._hardwareScaleLevel = engine.getHardwareScalingLevel();
            this.bloomKernel = this._bloomKernel;
        });
        this.bloom = new BloomEffect(this._scene, this._bloomScale, this._bloomWeight, this.bloomKernel / this._hardwareScaleLevel, this._defaultPipelineTextureType, true);
        this.chromaticAberration = new ChromaticAberrationPostProcess("ChromaticAberration", engine.getRenderWidth(), engine.getRenderHeight(), 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, true);
        this._chromaticAberrationEffect = new PostProcessRenderEffect(engine, this.ChromaticAberrationPostProcessId, () => {
            return this.chromaticAberration;
        }, true);
        this.grain = new GrainPostProcess("Grain", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, true);
        this._grainEffect = new PostProcessRenderEffect(engine, this.GrainPostProcessId, () => {
            return this.grain;
        }, true);
        let avoidReentrancyAtConstructionTime = true;
        this._imageProcessingConfigurationObserver = this._scene.imageProcessingConfiguration.onUpdateParameters.add(() => {
            this.bloom._downscale._exposure = this._scene.imageProcessingConfiguration.exposure;
            if (this.imageProcessingEnabled !== this._scene.imageProcessingConfiguration.isEnabled) {
                this._imageProcessingEnabled = this._scene.imageProcessingConfiguration.isEnabled;
                // Avoid re-entrant problems by deferring the call to _buildPipeline because the call to _buildPipeline
                // at the end of the constructor could end up triggering imageProcessingConfiguration.onUpdateParameters!
                // Note that the pipeline could have been disposed before the deferred call was executed, but in that case
                // _buildAllowed will have been set to false, preventing _buildPipeline from being executed.
                if (avoidReentrancyAtConstructionTime) {
                    Tools.SetImmediate(() => {
                        this._buildPipeline();
                    });
                }
                else {
                    this._buildPipeline();
                }
            }
        });
        this._buildPipeline();
        avoidReentrancyAtConstructionTime = false;
    }
    /**
     * Get the class name
     * @returns "DefaultRenderingPipeline"
     */
    getClassName() {
        return "DefaultRenderingPipeline";
    }
    /**
     * Force the compilation of the entire pipeline.
     */
    prepare() {
        const previousState = this._buildAllowed;
        this._buildAllowed = true;
        this._buildPipeline();
        this._buildAllowed = previousState;
    }
    _setAutoClearAndTextureSharing(postProcess, skipTextureSharing = false) {
        if (this._hasCleared) {
            postProcess.autoClear = false;
        }
        else {
            postProcess.autoClear = true;
            this._scene.autoClear = false;
            this._hasCleared = true;
        }
        if (!skipTextureSharing) {
            if (this._prevPrevPostProcess) {
                postProcess.shareOutputWith(this._prevPrevPostProcess);
            }
            else {
                postProcess.useOwnOutput();
            }
            if (this._prevPostProcess) {
                this._prevPrevPostProcess = this._prevPostProcess;
            }
            this._prevPostProcess = postProcess;
        }
    }
    _buildPipeline() {
        if (!this._buildAllowed) {
            return;
        }
        this._scene.autoClear = true;
        const engine = this._scene.getEngine();
        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();
        this._prevPostProcess = null;
        this._prevPrevPostProcess = null;
        this._hasCleared = false;
        if (this.depthOfFieldEnabled) {
            // Multi camera suport
            if (this._cameras.length > 1) {
                for (const camera of this._cameras) {
                    const depthRenderer = this._scene.enableDepthRenderer(camera);
                    depthRenderer.useOnlyInActiveCamera = true;
                }
                this._depthOfFieldSceneObserver = this._scene.onAfterRenderTargetsRenderObservable.add((scene) => {
                    if (this._cameras.indexOf(scene.activeCamera) > -1) {
                        this.depthOfField.depthTexture = scene.enableDepthRenderer(scene.activeCamera).getDepthMap();
                    }
                });
            }
            else {
                this._scene.onAfterRenderTargetsRenderObservable.remove(this._depthOfFieldSceneObserver);
                const depthRenderer = this._scene.enableDepthRenderer(this._cameras[0]);
                this.depthOfField.depthTexture = depthRenderer.getDepthMap();
            }
            if (!this.depthOfField._isReady()) {
                this.depthOfField._updateEffects();
            }
            this.addEffect(this.depthOfField);
            this._setAutoClearAndTextureSharing(this.depthOfField._effects[0], true);
        }
        else {
            this._scene.onAfterRenderTargetsRenderObservable.remove(this._depthOfFieldSceneObserver);
        }
        if (this.bloomEnabled) {
            if (!this.bloom._isReady()) {
                this.bloom._updateEffects();
            }
            this.addEffect(this.bloom);
            this._setAutoClearAndTextureSharing(this.bloom._effects[0], true);
        }
        if (this._imageProcessingEnabled) {
            this.imageProcessing = new ImageProcessingPostProcess("imageProcessing", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, this.scene.imageProcessingConfiguration);
            if (this._hdr) {
                this.addEffect(new PostProcessRenderEffect(engine, this.ImageProcessingPostProcessId, () => {
                    return this.imageProcessing;
                }, true));
                this._setAutoClearAndTextureSharing(this.imageProcessing);
            }
            else {
                this._scene.imageProcessingConfiguration.applyByPostProcess = false;
            }
            if (!this._cameras || this._cameras.length === 0) {
                this._scene.imageProcessingConfiguration.applyByPostProcess = false;
            }
            if (!this.imageProcessing.getEffect()) {
                this.imageProcessing._updateParameters();
            }
        }
        if (this.sharpenEnabled) {
            if (!this.sharpen.isReady()) {
                this.sharpen.updateEffect();
            }
            this.addEffect(this._sharpenEffect);
            this._setAutoClearAndTextureSharing(this.sharpen);
        }
        if (this.grainEnabled) {
            if (!this.grain.isReady()) {
                this.grain.updateEffect();
            }
            this.addEffect(this._grainEffect);
            this._setAutoClearAndTextureSharing(this.grain);
        }
        if (this.chromaticAberrationEnabled) {
            if (!this.chromaticAberration.isReady()) {
                this.chromaticAberration.updateEffect();
            }
            this.addEffect(this._chromaticAberrationEffect);
            this._setAutoClearAndTextureSharing(this.chromaticAberration);
        }
        if (this.fxaaEnabled) {
            this.fxaa = new FxaaPostProcess("fxaa", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
            this.addEffect(new PostProcessRenderEffect(engine, this.FxaaPostProcessId, () => {
                return this.fxaa;
            }, true));
            this._setAutoClearAndTextureSharing(this.fxaa, true);
        }
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }
        // In multicamera mode, the scene needs to autoclear in between cameras.
        if ((this._scene.activeCameras && this._scene.activeCameras.length > 1) || (this._scene.activeCamera && this._cameras.indexOf(this._scene.activeCamera) === -1)) {
            this._scene.autoClear = true;
        }
        // The active camera on the scene can be changed anytime
        if (!this._activeCameraChangedObserver) {
            this._activeCameraChangedObserver = this._scene.onActiveCameraChanged.add(() => {
                if (this._scene.activeCamera && this._cameras.indexOf(this._scene.activeCamera) === -1) {
                    this._scene.autoClear = true;
                }
            });
        }
        if (!this._activeCamerasChangedObserver) {
            this._activeCamerasChangedObserver = this._scene.onActiveCamerasChanged.add(() => {
                if (this._scene.activeCameras && this._scene.activeCameras.length > 1) {
                    this._scene.autoClear = true;
                }
            });
        }
        this._adaptPostProcessesToViewPort();
        if (!this._enableMSAAOnFirstPostProcess(this.samples) && this.samples > 1) {
            Logger.Warn("MSAA failed to enable, MSAA is only supported in browsers that support webGL >= 2.0");
        }
        this.onBuildObservable.notifyObservers(this);
    }
    _disposePostProcesses(disposeNonRecreated = false) {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];
            if (this.imageProcessing) {
                this.imageProcessing.dispose(camera);
            }
            if (this.fxaa) {
                this.fxaa.dispose(camera);
            }
            // These are created in the constructor and should not be disposed on every pipeline change
            if (disposeNonRecreated) {
                if (this.sharpen) {
                    this.sharpen.dispose(camera);
                }
                if (this.depthOfField) {
                    this._scene.onAfterRenderTargetsRenderObservable.remove(this._depthOfFieldSceneObserver);
                    this.depthOfField.disposeEffects(camera);
                }
                if (this.bloom) {
                    this.bloom.disposeEffects(camera);
                }
                if (this.chromaticAberration) {
                    this.chromaticAberration.dispose(camera);
                }
                if (this.grain) {
                    this.grain.dispose(camera);
                }
                if (this._glowLayer) {
                    this._glowLayer.dispose();
                }
            }
        }
        this.imageProcessing = null;
        this.fxaa = null;
        if (disposeNonRecreated) {
            this.sharpen = null;
            this._sharpenEffect = null;
            this.depthOfField = null;
            this.bloom = null;
            this.chromaticAberration = null;
            this._chromaticAberrationEffect = null;
            this.grain = null;
            this._grainEffect = null;
            this._glowLayer = null;
        }
    }
    /**
     * Adds a camera to the pipeline
     * @param camera the camera to be added
     */
    addCamera(camera) {
        this._camerasToBeAttached.push(camera);
        this._buildPipeline();
    }
    /**
     * Removes a camera from the pipeline
     * @param camera the camera to remove
     */
    removeCamera(camera) {
        const index = this._camerasToBeAttached.indexOf(camera);
        this._camerasToBeAttached.splice(index, 1);
        this._buildPipeline();
    }
    /**
     * Dispose of the pipeline and stop all post processes
     */
    dispose() {
        this._buildAllowed = false;
        this.onBuildObservable.clear();
        this._disposePostProcesses(true);
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        this._scene._postProcessRenderPipelineManager.removePipeline(this.name);
        this._scene.autoClear = true;
        if (this._resizeObserver) {
            this._scene.getEngine().onResizeObservable.remove(this._resizeObserver);
            this._resizeObserver = null;
        }
        this._scene.onActiveCameraChanged.remove(this._activeCameraChangedObserver);
        this._scene.onActiveCamerasChanged.remove(this._activeCamerasChangedObserver);
        this._scene.imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingConfigurationObserver);
        super.dispose();
    }
    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "DefaultRenderingPipeline";
        return serializationObject;
    }
    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new DefaultRenderingPipeline(source._name, source._name._hdr, scene), source, scene, rootUrl);
    }
}
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "sharpenEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "bloomKernel", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "_bloomWeight", void 0);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "_bloomThreshold", void 0);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "_hdr", void 0);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "bloomWeight", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "bloomThreshold", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "bloomScale", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "bloomEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "depthOfFieldEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "depthOfFieldBlurLevel", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "fxaaEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "samples", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "imageProcessingEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "glowLayerEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "chromaticAberrationEnabled", null);
__decorate([
    serialize()
], DefaultRenderingPipeline.prototype, "grainEnabled", null);
RegisterClass("BABYLON.DefaultRenderingPipeline", DefaultRenderingPipeline);
//# sourceMappingURL=defaultRenderingPipeline.js.map