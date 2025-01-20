import { __decorate } from "../tslib.es6.js";
import { serialize } from "../Misc/decorators.js";
import { ImageProcessingConfiguration } from "../Materials/imageProcessingConfiguration.js";
import { PostProcess } from "./postProcess.js";
import { EngineStore } from "../Engines/engineStore.js";

/**
 * ImageProcessingPostProcess
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#imageprocessing
 */
export class ImageProcessingPostProcess extends PostProcess {
    /**
     * Gets the image processing configuration used either in this material.
     */
    get imageProcessingConfiguration() {
        return this._imageProcessingConfiguration;
    }
    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    set imageProcessingConfiguration(value) {
        // We are almost sure it is applied by post process as
        // We are in the post process :-)
        value.applyByPostProcess = true;
        this._attachImageProcessingConfiguration(value);
    }
    /**
     * Attaches a new image processing configuration to the PBR Material.
     * @param configuration
     * @param doNotBuild
     */
    _attachImageProcessingConfiguration(configuration, doNotBuild = false) {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }
        // Detaches observer.
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        // Pick the scene configuration if needed.
        if (!configuration) {
            let scene = null;
            const engine = this.getEngine();
            const camera = this.getCamera();
            if (camera) {
                scene = camera.getScene();
            }
            else if (engine && engine.scenes) {
                const scenes = engine.scenes;
                scene = scenes[scenes.length - 1];
            }
            else {
                scene = EngineStore.LastCreatedScene;
            }
            if (scene) {
                this._imageProcessingConfiguration = scene.imageProcessingConfiguration;
            }
            else {
                this._imageProcessingConfiguration = new ImageProcessingConfiguration();
            }
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }
        // Attaches observer.
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._updateParameters();
            });
        }
        // Ensure the effect will be rebuilt.
        if (!doNotBuild) {
            this._updateParameters();
        }
    }
    /**
     * If the post process is supported.
     */
    get isSupported() {
        const effect = this.getEffect();
        return !effect || effect.isSupported;
    }
    /**
     * Gets Color curves setup used in the effect if colorCurvesEnabled is set to true .
     */
    get colorCurves() {
        return this.imageProcessingConfiguration.colorCurves;
    }
    /**
     * Sets Color curves setup used in the effect if colorCurvesEnabled is set to true .
     */
    set colorCurves(value) {
        this.imageProcessingConfiguration.colorCurves = value;
    }
    /**
     * Gets whether the color curves effect is enabled.
     */
    get colorCurvesEnabled() {
        return this.imageProcessingConfiguration.colorCurvesEnabled;
    }
    /**
     * Sets whether the color curves effect is enabled.
     */
    set colorCurvesEnabled(value) {
        this.imageProcessingConfiguration.colorCurvesEnabled = value;
    }
    /**
     * Gets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
     */
    get colorGradingTexture() {
        return this.imageProcessingConfiguration.colorGradingTexture;
    }
    /**
     * Sets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
     */
    set colorGradingTexture(value) {
        this.imageProcessingConfiguration.colorGradingTexture = value;
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    get colorGradingEnabled() {
        return this.imageProcessingConfiguration.colorGradingEnabled;
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    set colorGradingEnabled(value) {
        this.imageProcessingConfiguration.colorGradingEnabled = value;
    }
    /**
     * Gets exposure used in the effect.
     */
    get exposure() {
        return this.imageProcessingConfiguration.exposure;
    }
    /**
     * Sets exposure used in the effect.
     */
    set exposure(value) {
        this.imageProcessingConfiguration.exposure = value;
    }
    /**
     * Gets whether tonemapping is enabled or not.
     */
    get toneMappingEnabled() {
        return this._imageProcessingConfiguration.toneMappingEnabled;
    }
    /**
     * Sets whether tonemapping is enabled or not
     */
    set toneMappingEnabled(value) {
        this._imageProcessingConfiguration.toneMappingEnabled = value;
    }
    /**
     * Gets the type of tone mapping effect.
     */
    get toneMappingType() {
        return this._imageProcessingConfiguration.toneMappingType;
    }
    /**
     * Sets the type of tone mapping effect.
     */
    set toneMappingType(value) {
        this._imageProcessingConfiguration.toneMappingType = value;
    }
    /**
     * Gets contrast used in the effect.
     */
    get contrast() {
        return this.imageProcessingConfiguration.contrast;
    }
    /**
     * Sets contrast used in the effect.
     */
    set contrast(value) {
        this.imageProcessingConfiguration.contrast = value;
    }
    /**
     * Gets Vignette stretch size.
     */
    get vignetteStretch() {
        return this.imageProcessingConfiguration.vignetteStretch;
    }
    /**
     * Sets Vignette stretch size.
     */
    set vignetteStretch(value) {
        this.imageProcessingConfiguration.vignetteStretch = value;
    }
    /**
     * Gets Vignette center X Offset.
     * @deprecated use vignetteCenterX instead
     */
    get vignetteCentreX() {
        return this.imageProcessingConfiguration.vignetteCenterX;
    }
    /**
     * Sets Vignette center X Offset.
     * @deprecated use vignetteCenterX instead
     */
    set vignetteCentreX(value) {
        this.imageProcessingConfiguration.vignetteCenterX = value;
    }
    /**
     * Gets Vignette center Y Offset.
     * @deprecated use vignetteCenterY instead
     */
    get vignetteCentreY() {
        return this.imageProcessingConfiguration.vignetteCenterY;
    }
    /**
     * Sets Vignette center Y Offset.
     * @deprecated use vignetteCenterY instead
     */
    set vignetteCentreY(value) {
        this.imageProcessingConfiguration.vignetteCenterY = value;
    }
    /**
     * Vignette center Y Offset.
     */
    get vignetteCenterY() {
        return this.imageProcessingConfiguration.vignetteCenterY;
    }
    set vignetteCenterY(value) {
        this.imageProcessingConfiguration.vignetteCenterY = value;
    }
    /**
     * Vignette center X Offset.
     */
    get vignetteCenterX() {
        return this.imageProcessingConfiguration.vignetteCenterX;
    }
    set vignetteCenterX(value) {
        this.imageProcessingConfiguration.vignetteCenterX = value;
    }
    /**
     * Gets Vignette weight or intensity of the vignette effect.
     */
    get vignetteWeight() {
        return this.imageProcessingConfiguration.vignetteWeight;
    }
    /**
     * Sets Vignette weight or intensity of the vignette effect.
     */
    set vignetteWeight(value) {
        this.imageProcessingConfiguration.vignetteWeight = value;
    }
    /**
     * Gets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
     * if vignetteEnabled is set to true.
     */
    get vignetteColor() {
        return this.imageProcessingConfiguration.vignetteColor;
    }
    /**
     * Sets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
     * if vignetteEnabled is set to true.
     */
    set vignetteColor(value) {
        this.imageProcessingConfiguration.vignetteColor = value;
    }
    /**
     * Gets Camera field of view used by the Vignette effect.
     */
    get vignetteCameraFov() {
        return this.imageProcessingConfiguration.vignetteCameraFov;
    }
    /**
     * Sets Camera field of view used by the Vignette effect.
     */
    set vignetteCameraFov(value) {
        this.imageProcessingConfiguration.vignetteCameraFov = value;
    }
    /**
     * Gets the vignette blend mode allowing different kind of effect.
     */
    get vignetteBlendMode() {
        return this.imageProcessingConfiguration.vignetteBlendMode;
    }
    /**
     * Sets the vignette blend mode allowing different kind of effect.
     */
    set vignetteBlendMode(value) {
        this.imageProcessingConfiguration.vignetteBlendMode = value;
    }
    /**
     * Gets whether the vignette effect is enabled.
     */
    get vignetteEnabled() {
        return this.imageProcessingConfiguration.vignetteEnabled;
    }
    /**
     * Sets whether the vignette effect is enabled.
     */
    set vignetteEnabled(value) {
        this.imageProcessingConfiguration.vignetteEnabled = value;
    }
    /**
     * Gets intensity of the dithering effect.
     */
    get ditheringIntensity() {
        return this.imageProcessingConfiguration.ditheringIntensity;
    }
    /**
     * Sets intensity of the dithering effect.
     */
    set ditheringIntensity(value) {
        this.imageProcessingConfiguration.ditheringIntensity = value;
    }
    /**
     * Gets whether the dithering effect is enabled.
     */
    get ditheringEnabled() {
        return this.imageProcessingConfiguration.ditheringEnabled;
    }
    /**
     * Sets whether the dithering effect is enabled.
     */
    set ditheringEnabled(value) {
        this.imageProcessingConfiguration.ditheringEnabled = value;
    }
    /**
     * Gets whether the input of the processing is in Gamma or Linear Space.
     */
    get fromLinearSpace() {
        return this._fromLinearSpace;
    }
    /**
     * Sets whether the input of the processing is in Gamma or Linear Space.
     */
    set fromLinearSpace(value) {
        if (this._fromLinearSpace === value) {
            return;
        }
        this._fromLinearSpace = value;
        this._updateParameters();
    }
    constructor(name, options, camera = null, samplingMode, engine, reusable, textureType = 0, imageProcessingConfiguration) {
        super(name, "imageProcessing", [], [], options, camera, samplingMode, engine, reusable, null, textureType, "postprocess", null, true);
        this._fromLinearSpace = true;
        /**
         * Defines cache preventing GC.
         */
        this._defines = {
            IMAGEPROCESSING: false,
            VIGNETTE: false,
            VIGNETTEBLENDMODEMULTIPLY: false,
            VIGNETTEBLENDMODEOPAQUE: false,
            TONEMAPPING: 0,
            CONTRAST: false,
            COLORCURVES: false,
            COLORGRADING: false,
            COLORGRADING3D: false,
            FROMLINEARSPACE: false,
            SAMPLER3DGREENDEPTH: false,
            SAMPLER3DBGRMAP: false,
            DITHER: false,
            IMAGEPROCESSINGPOSTPROCESS: false,
            EXPOSURE: false,
            SKIPFINALCOLORCLAMP: false,
        };
        // Setup the configuration as forced by the constructor. This would then not force the
        // scene materials output in linear space and let untouched the default forward pass.
        if (imageProcessingConfiguration) {
            imageProcessingConfiguration.applyByPostProcess = true;
            this._attachImageProcessingConfiguration(imageProcessingConfiguration, true);
            // This will cause the shader to be compiled
            this._updateParameters();
        }
        // Setup the default processing configuration to the scene.
        else {
            this._attachImageProcessingConfiguration(null, true);
            this.imageProcessingConfiguration.applyByPostProcess = true;
        }
        this.onApply = (effect) => {
            this.imageProcessingConfiguration.bind(effect, this.aspectRatio);
        };
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/imageProcessing.fragment.js"));
        }
        else {
            list.push(import("../Shaders/imageProcessing.fragment.js"));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     *  "ImageProcessingPostProcess"
     * @returns "ImageProcessingPostProcess"
     */
    getClassName() {
        return "ImageProcessingPostProcess";
    }
    /**
     * @internal
     */
    _updateParameters() {
        this._defines.FROMLINEARSPACE = this._fromLinearSpace;
        this.imageProcessingConfiguration.prepareDefines(this._defines, true);
        let defines = "";
        for (const prop in this._defines) {
            const value = this._defines[prop];
            const type = typeof value;
            switch (type) {
                case "number":
                case "string":
                    defines += `#define ${prop} ${value};\n`;
                    break;
                default:
                    if (value) {
                        defines += `#define ${prop};\n`;
                    }
                    break;
            }
        }
        const samplers = ["textureSampler"];
        const uniforms = ["scale"];
        if (ImageProcessingConfiguration) {
            ImageProcessingConfiguration.PrepareSamplers(samplers, this._defines);
            ImageProcessingConfiguration.PrepareUniforms(uniforms, this._defines);
        }
        this.updateEffect(defines, uniforms, samplers);
    }
    dispose(camera) {
        super.dispose(camera);
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        if (this._imageProcessingConfiguration) {
            this.imageProcessingConfiguration.applyByPostProcess = false;
        }
    }
}
__decorate([
    serialize()
], ImageProcessingPostProcess.prototype, "_fromLinearSpace", void 0);
//# sourceMappingURL=imageProcessingPostProcess.js.map