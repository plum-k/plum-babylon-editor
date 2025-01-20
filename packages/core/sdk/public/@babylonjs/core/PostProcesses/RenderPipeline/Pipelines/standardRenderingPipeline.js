import { __decorate } from "../../../tslib.es6.js";
import { serialize, serializeAsTexture } from "../../../Misc/decorators.js";
import { SerializationHelper } from "../../../Misc/decorators.serialization.js";
import { Logger } from "../../../Misc/logger.js";
import { Vector2, Vector3, Matrix, Vector4 } from "../../../Maths/math.vector.js";
import { Clamp } from "../../../Maths/math.scalar.functions.js";
import { Texture } from "../../../Materials/Textures/texture.js";
import { PostProcess } from "../../../PostProcesses/postProcess.js";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect.js";
import { BlurPostProcess } from "../../../PostProcesses/blurPostProcess.js";
import { FxaaPostProcess } from "../../../PostProcesses/fxaaPostProcess.js";

import { RegisterClass } from "../../../Misc/typeStore.js";
import { MotionBlurPostProcess } from "../../motionBlurPostProcess.js";
import { ScreenSpaceReflectionPostProcess } from "../../screenSpaceReflectionPostProcess.js";
import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.js";
import "../../../Shaders/standard.fragment.js";
/**
 * Standard rendering pipeline
 * Default pipeline should be used going forward but the standard pipeline will be kept for backwards compatibility.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/standardRenderingPipeline
 */
export class StandardRenderingPipeline extends PostProcessRenderPipeline {
    /**
     * Gets the overall exposure used by the pipeline
     */
    get exposure() {
        return this._fixedExposure;
    }
    /**
     * Sets the overall exposure used by the pipeline
     */
    set exposure(value) {
        this._fixedExposure = value;
        this._currentExposure = value;
    }
    /**
     * Gets whether or not the exposure of the overall pipeline should be automatically adjusted by the HDR post-process
     */
    get hdrAutoExposure() {
        return this._hdrAutoExposure;
    }
    /**
     * Sets whether or not the exposure of the overall pipeline should be automatically adjusted by the HDR post-process
     */
    set hdrAutoExposure(value) {
        this._hdrAutoExposure = value;
        if (this.hdrPostProcess) {
            const defines = ["#define HDR"];
            if (value) {
                defines.push("#define AUTO_EXPOSURE");
            }
            this.hdrPostProcess.updateEffect(defines.join("\n"));
        }
    }
    /**
     * Gets how much the image is blurred by the movement while using the motion blur post-process
     */
    get motionStrength() {
        return this._motionStrength;
    }
    /**
     * Sets how much the image is blurred by the movement while using the motion blur post-process
     */
    set motionStrength(strength) {
        this._motionStrength = strength;
        if (this._isObjectBasedMotionBlur && this.motionBlurPostProcess) {
            this.motionBlurPostProcess.motionStrength = strength;
        }
    }
    /**
     * Gets whether or not the motion blur post-process is object based or screen based.
     */
    get objectBasedMotionBlur() {
        return this._isObjectBasedMotionBlur;
    }
    /**
     * Sets whether or not the motion blur post-process should be object based or screen based
     */
    set objectBasedMotionBlur(value) {
        const shouldRebuild = this._isObjectBasedMotionBlur !== value;
        this._isObjectBasedMotionBlur = value;
        if (shouldRebuild) {
            this._buildPipeline();
        }
    }
    /**
     * @ignore
     * Specifies if the bloom pipeline is enabled
     */
    get BloomEnabled() {
        return this._bloomEnabled;
    }
    set BloomEnabled(enabled) {
        if (this._bloomEnabled === enabled) {
            return;
        }
        this._bloomEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * @ignore
     * Specifies if the depth of field pipeline is enabled
     */
    get DepthOfFieldEnabled() {
        return this._depthOfFieldEnabled;
    }
    set DepthOfFieldEnabled(enabled) {
        if (this._depthOfFieldEnabled === enabled) {
            return;
        }
        this._depthOfFieldEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * @ignore
     * Specifies if the lens flare pipeline is enabled
     */
    get LensFlareEnabled() {
        return this._lensFlareEnabled;
    }
    set LensFlareEnabled(enabled) {
        if (this._lensFlareEnabled === enabled) {
            return;
        }
        this._lensFlareEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * @ignore
     * Specifies if the HDR pipeline is enabled
     */
    get HDREnabled() {
        return this._hdrEnabled;
    }
    set HDREnabled(enabled) {
        if (this._hdrEnabled === enabled) {
            return;
        }
        this._hdrEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * @ignore
     * Specifies if the volumetric lights scattering effect is enabled
     */
    get VLSEnabled() {
        return this._vlsEnabled;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    set VLSEnabled(enabled) {
        if (this._vlsEnabled === enabled) {
            return;
        }
        if (enabled) {
            const geometry = this._scene.enableGeometryBufferRenderer();
            if (!geometry) {
                Logger.Warn("Geometry renderer is not supported, cannot create volumetric lights in Standard Rendering Pipeline");
                return;
            }
        }
        this._vlsEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * @ignore
     * Specifies if the motion blur effect is enabled
     */
    get MotionBlurEnabled() {
        return this._motionBlurEnabled;
    }
    set MotionBlurEnabled(enabled) {
        if (this._motionBlurEnabled === enabled) {
            return;
        }
        this._motionBlurEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * Specifies if anti-aliasing is enabled
     */
    get fxaaEnabled() {
        return this._fxaaEnabled;
    }
    set fxaaEnabled(enabled) {
        if (this._fxaaEnabled === enabled) {
            return;
        }
        this._fxaaEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * Specifies if screen space reflections are enabled.
     */
    get screenSpaceReflectionsEnabled() {
        return this._screenSpaceReflectionsEnabled;
    }
    set screenSpaceReflectionsEnabled(enabled) {
        if (this._screenSpaceReflectionsEnabled === enabled) {
            return;
        }
        this._screenSpaceReflectionsEnabled = enabled;
        this._buildPipeline();
    }
    /**
     * Specifies the number of steps used to calculate the volumetric lights
     * Typically in interval [50, 200]
     */
    get volumetricLightStepsCount() {
        return this._volumetricLightStepsCount;
    }
    set volumetricLightStepsCount(count) {
        if (this.volumetricLightPostProcess) {
            this.volumetricLightPostProcess.updateEffect("#define VLS\n#define NB_STEPS " + count.toFixed(1));
        }
        this._volumetricLightStepsCount = count;
    }
    /**
     * Specifies the number of samples used for the motion blur effect
     * Typically in interval [16, 64]
     */
    get motionBlurSamples() {
        return this._motionBlurSamples;
    }
    set motionBlurSamples(samples) {
        if (this.motionBlurPostProcess) {
            if (this._isObjectBasedMotionBlur) {
                this.motionBlurPostProcess.motionBlurSamples = samples;
            }
            else {
                this.motionBlurPostProcess.updateEffect("#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + samples.toFixed(1));
            }
        }
        this._motionBlurSamples = samples;
    }
    /**
     * Specifies MSAA sample count, setting this to 4 will provide 4x anti aliasing. (default: 1)
     */
    get samples() {
        return this._samples;
    }
    set samples(sampleCount) {
        if (this._samples === sampleCount) {
            return;
        }
        this._samples = sampleCount;
        this._buildPipeline();
    }
    /**
     * Default pipeline should be used going forward but the standard pipeline will be kept for backwards compatibility.
     * @constructor
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param ratio The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
     * @param originalPostProcess the custom original color post-process. Must be "reusable". Can be null.
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     */
    constructor(name, scene, ratio, originalPostProcess = null, cameras) {
        super(scene.getEngine(), name);
        /**
         * Post-process used to down scale an image x4
         */
        this.downSampleX4PostProcess = null;
        /**
         * Post-process used to calculate the illuminated surfaces controlled by a threshold
         */
        this.brightPassPostProcess = null;
        /**
         * Post-process array storing all the horizontal blur post-processes used by the pipeline
         */
        this.blurHPostProcesses = [];
        /**
         * Post-process array storing all the vertical blur post-processes used by the pipeline
         */
        this.blurVPostProcesses = [];
        /**
         * Post-process used to add colors of 2 textures (typically brightness + real scene color)
         */
        this.textureAdderPostProcess = null;
        /**
         * Post-process used to create volumetric lighting effect
         */
        this.volumetricLightPostProcess = null;
        /**
         * Post-process used to smooth the previous volumetric light post-process on the X axis
         */
        this.volumetricLightSmoothXPostProcess = null;
        /**
         * Post-process used to smooth the previous volumetric light post-process on the Y axis
         */
        this.volumetricLightSmoothYPostProcess = null;
        /**
         * Post-process used to merge the volumetric light effect and the real scene color
         */
        this.volumetricLightMergePostProces = null;
        /**
         * Post-process used to store the final volumetric light post-process (attach/detach for debug purpose)
         */
        this.volumetricLightFinalPostProcess = null;
        /**
         * Base post-process used to calculate the average luminance of the final image for HDR
         */
        this.luminancePostProcess = null;
        /**
         * Post-processes used to create down sample post-processes in order to get
         * the average luminance of the final image for HDR
         * Array of length "StandardRenderingPipeline.LuminanceSteps"
         */
        this.luminanceDownSamplePostProcesses = [];
        /**
         * Post-process used to create a HDR effect (light adaptation)
         */
        this.hdrPostProcess = null;
        /**
         * Post-process used to store the final texture adder post-process (attach/detach for debug purpose)
         */
        this.textureAdderFinalPostProcess = null;
        /**
         * Post-process used to store the final lens flare post-process (attach/detach for debug purpose)
         */
        this.lensFlareFinalPostProcess = null;
        /**
         * Post-process used to merge the final HDR post-process and the real scene color
         */
        this.hdrFinalPostProcess = null;
        /**
         * Post-process used to create a lens flare effect
         */
        this.lensFlarePostProcess = null;
        /**
         * Post-process that merges the result of the lens flare post-process and the real scene color
         */
        this.lensFlareComposePostProcess = null;
        /**
         * Post-process used to create a motion blur effect
         */
        this.motionBlurPostProcess = null;
        /**
         * Post-process used to create a depth of field effect
         */
        this.depthOfFieldPostProcess = null;
        /**
         * The Fast Approximate Anti-Aliasing post process which attempts to remove aliasing from an image.
         */
        this.fxaaPostProcess = null;
        /**
         * Post-process used to simulate realtime reflections using the screen space and geometry renderer.
         */
        this.screenSpaceReflectionPostProcess = null;
        // Values
        /**
         * Represents the brightness threshold in order to configure the illuminated surfaces
         */
        this.brightThreshold = 1.0;
        /**
         * Configures the blur intensity used for surexposed surfaces are highlighted surfaces (light halo)
         */
        this.blurWidth = 512.0;
        /**
         * Sets if the blur for highlighted surfaces must be only horizontal
         */
        this.horizontalBlur = false;
        /**
         * Texture used typically to simulate "dirty" on camera lens
         */
        this.lensTexture = null;
        /**
         * Represents the offset coefficient based on Rayleigh principle. Typically in interval [-0.2, 0.2]
         */
        this.volumetricLightCoefficient = 0.2;
        /**
         * The overall power of volumetric lights, typically in interval [0, 10] maximum
         */
        this.volumetricLightPower = 4.0;
        /**
         * Used the set the blur intensity to smooth the volumetric lights
         */
        this.volumetricLightBlurScale = 64.0;
        /**
         * Light (spot or directional) used to generate the volumetric lights rays
         * The source light must have a shadow generate so the pipeline can get its
         * depth map
         */
        this.sourceLight = null;
        /**
         * For eye adaptation, represents the minimum luminance the eye can see
         */
        this.hdrMinimumLuminance = 1.0;
        /**
         * For eye adaptation, represents the decrease luminance speed
         */
        this.hdrDecreaseRate = 0.5;
        /**
         * For eye adaptation, represents the increase luminance speed
         */
        this.hdrIncreaseRate = 0.5;
        /**
         * Lens color texture used by the lens flare effect. Mandatory if lens flare effect enabled
         */
        this.lensColorTexture = null;
        /**
         * The overall strength for the lens flare effect
         */
        this.lensFlareStrength = 20.0;
        /**
         * Dispersion coefficient for lens flare ghosts
         */
        this.lensFlareGhostDispersal = 1.4;
        /**
         * Main lens flare halo width
         */
        this.lensFlareHaloWidth = 0.7;
        /**
         * Based on the lens distortion effect, defines how much the lens flare result
         * is distorted
         */
        this.lensFlareDistortionStrength = 16.0;
        /**
         * Configures the blur intensity used for for lens flare (halo)
         */
        this.lensFlareBlurWidth = 512.0;
        /**
         * Lens star texture must be used to simulate rays on the flares and is available
         * in the documentation
         */
        this.lensStarTexture = null;
        /**
         * As the "lensTexture" (can be the same texture or different), it is used to apply the lens
         * flare effect by taking account of the dirt texture
         */
        this.lensFlareDirtTexture = null;
        /**
         * Represents the focal length for the depth of field effect
         */
        this.depthOfFieldDistance = 10.0;
        /**
         * Represents the blur intensity for the blurred part of the depth of field effect
         */
        this.depthOfFieldBlurWidth = 64.0;
        /**
         * List of animations for the pipeline (IAnimatable implementation)
         */
        this.animations = [];
        this._currentDepthOfFieldSource = null;
        this._fixedExposure = 1.0;
        this._currentExposure = 1.0;
        this._hdrAutoExposure = false;
        this._hdrCurrentLuminance = 1.0;
        this._motionStrength = 1.0;
        this._isObjectBasedMotionBlur = false;
        this._camerasToBeAttached = [];
        // Getters and setters
        this._bloomEnabled = false;
        this._depthOfFieldEnabled = false;
        this._vlsEnabled = false;
        this._lensFlareEnabled = false;
        this._hdrEnabled = false;
        this._motionBlurEnabled = false;
        this._fxaaEnabled = false;
        this._screenSpaceReflectionsEnabled = false;
        this._motionBlurSamples = 64.0;
        this._volumetricLightStepsCount = 50.0;
        this._samples = 1;
        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();
        // Initialize
        this._scene = scene;
        this._basePostProcess = originalPostProcess;
        this._ratio = ratio;
        // Misc
        this._floatTextureType = scene.getEngine().getCaps().textureFloatRender ? 1 : 2;
        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        this._buildPipeline();
    }
    _buildPipeline() {
        const ratio = this._ratio;
        const scene = this._scene;
        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();
        // Create pass post-process
        if (this._screenSpaceReflectionsEnabled) {
            this.screenSpaceReflectionPostProcess = new ScreenSpaceReflectionPostProcess("HDRPass", scene, ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, this._floatTextureType);
            this.screenSpaceReflectionPostProcess.onApplyObservable.add(() => {
                this._currentDepthOfFieldSource = this.screenSpaceReflectionPostProcess;
            });
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRScreenSpaceReflections", () => this.screenSpaceReflectionPostProcess, true));
        }
        if (!this._basePostProcess) {
            this.originalPostProcess = new PostProcess("HDRPass", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", this._floatTextureType);
        }
        else {
            this.originalPostProcess = this._basePostProcess;
        }
        this.originalPostProcess.autoClear = !this.screenSpaceReflectionPostProcess;
        this.originalPostProcess.onApplyObservable.add(() => {
            this._currentDepthOfFieldSource = this.originalPostProcess;
        });
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", () => this.originalPostProcess, true));
        if (this._bloomEnabled) {
            // Create down sample X4 post-process
            this._createDownSampleX4PostProcess(scene, ratio / 4);
            // Create bright pass post-process
            this._createBrightPassPostProcess(scene, ratio / 4);
            // Create gaussian blur post-processes (down sampling blurs)
            this._createBlurPostProcesses(scene, ratio / 4, 1);
            // Create texture adder post-process
            this._createTextureAdderPostProcess(scene, ratio);
            // Create depth-of-field source post-process
            this.textureAdderFinalPostProcess = new PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", 0);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBaseDepthOfFieldSource", () => {
                return this.textureAdderFinalPostProcess;
            }, true));
        }
        if (this._vlsEnabled) {
            // Create volumetric light
            this._createVolumetricLightPostProcess(scene, ratio);
            // Create volumetric light final post-process
            this.volumetricLightFinalPostProcess = new PostProcess("HDRVLSFinal", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", 0);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLSFinal", () => {
                return this.volumetricLightFinalPostProcess;
            }, true));
        }
        if (this._lensFlareEnabled) {
            // Create lens flare post-process
            this._createLensFlarePostProcess(scene, ratio);
            // Create depth-of-field source post-process post lens-flare and disable it now
            this.lensFlareFinalPostProcess = new PostProcess("HDRPostLensFlareDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", 0);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostLensFlareDepthOfFieldSource", () => {
                return this.lensFlareFinalPostProcess;
            }, true));
        }
        if (this._hdrEnabled) {
            // Create luminance
            this._createLuminancePostProcesses(scene, this._floatTextureType);
            // Create HDR
            this._createHdrPostProcess(scene, ratio);
            // Create depth-of-field source post-process post hdr and disable it now
            this.hdrFinalPostProcess = new PostProcess("HDRPostHDReDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", 0);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostHDReDepthOfFieldSource", () => {
                return this.hdrFinalPostProcess;
            }, true));
        }
        if (this._depthOfFieldEnabled) {
            // Create gaussian blur used by depth-of-field
            this._createBlurPostProcesses(scene, ratio / 2, 3, "depthOfFieldBlurWidth");
            // Create depth-of-field post-process
            this._createDepthOfFieldPostProcess(scene, ratio);
        }
        if (this._motionBlurEnabled) {
            // Create motion blur post-process
            this._createMotionBlurPostProcess(scene, ratio);
        }
        if (this._fxaaEnabled) {
            // Create fxaa post-process
            this.fxaaPostProcess = new FxaaPostProcess("fxaa", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, 0);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRFxaa", () => {
                return this.fxaaPostProcess;
            }, true));
        }
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }
        if (!this._enableMSAAOnFirstPostProcess(this._samples) && this._samples > 1) {
            Logger.Warn("MSAA failed to enable, MSAA is only supported in browsers that support webGL >= 2.0");
        }
    }
    // Down Sample X4 Post-Process
    _createDownSampleX4PostProcess(scene, ratio) {
        const downSampleX4Offsets = new Array(32);
        this.downSampleX4PostProcess = new PostProcess("HDRDownSampleX4", "standard", ["dsOffsets"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4", this._floatTextureType);
        this.downSampleX4PostProcess.onApply = (effect) => {
            let id = 0;
            const width = this.downSampleX4PostProcess.width;
            const height = this.downSampleX4PostProcess.height;
            for (let i = -2; i < 2; i++) {
                for (let j = -2; j < 2; j++) {
                    downSampleX4Offsets[id] = (i + 0.5) * (1.0 / width);
                    downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / height);
                    id += 2;
                }
            }
            effect.setArray2("dsOffsets", downSampleX4Offsets);
        };
        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4", () => {
            return this.downSampleX4PostProcess;
        }, true));
    }
    // Brightpass Post-Process
    _createBrightPassPostProcess(scene, ratio) {
        const brightOffsets = new Array(8);
        this.brightPassPostProcess = new PostProcess("HDRBrightPass", "standard", ["dsOffsets", "brightThreshold"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS", this._floatTextureType);
        this.brightPassPostProcess.onApply = (effect) => {
            const sU = 1.0 / this.brightPassPostProcess.width;
            const sV = 1.0 / this.brightPassPostProcess.height;
            brightOffsets[0] = -0.5 * sU;
            brightOffsets[1] = 0.5 * sV;
            brightOffsets[2] = 0.5 * sU;
            brightOffsets[3] = 0.5 * sV;
            brightOffsets[4] = -0.5 * sU;
            brightOffsets[5] = -0.5 * sV;
            brightOffsets[6] = 0.5 * sU;
            brightOffsets[7] = -0.5 * sV;
            effect.setArray2("dsOffsets", brightOffsets);
            effect.setFloat("brightThreshold", this.brightThreshold);
        };
        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBrightPass", () => {
            return this.brightPassPostProcess;
        }, true));
    }
    // Create blur H&V post-processes
    _createBlurPostProcesses(scene, ratio, indice, blurWidthKey = "blurWidth") {
        const engine = scene.getEngine();
        const blurX = new BlurPostProcess("HDRBlurH" + "_" + indice, new Vector2(1, 0), this[blurWidthKey], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, this._floatTextureType);
        const blurY = new BlurPostProcess("HDRBlurV" + "_" + indice, new Vector2(0, 1), this[blurWidthKey], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, this._floatTextureType);
        blurX.onActivateObservable.add(() => {
            const dw = blurX.width / engine.getRenderWidth();
            blurX.kernel = this[blurWidthKey] * dw;
        });
        blurY.onActivateObservable.add(() => {
            const dw = blurY.height / engine.getRenderHeight();
            blurY.kernel = this.horizontalBlur ? 64 * dw : this[blurWidthKey] * dw;
        });
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBlurH" + indice, () => {
            return blurX;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBlurV" + indice, () => {
            return blurY;
        }, true));
        this.blurHPostProcesses.push(blurX);
        this.blurVPostProcesses.push(blurY);
    }
    // Create texture adder post-process
    _createTextureAdderPostProcess(scene, ratio) {
        this.textureAdderPostProcess = new PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", this._floatTextureType);
        this.textureAdderPostProcess.onApply = (effect) => {
            effect.setTextureFromPostProcess("otherSampler", this._vlsEnabled ? this._currentDepthOfFieldSource : this.originalPostProcess);
            effect.setTexture("lensSampler", this.lensTexture);
            effect.setFloat("exposure", this._currentExposure);
            this._currentDepthOfFieldSource = this.textureAdderFinalPostProcess;
        };
        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", () => {
            return this.textureAdderPostProcess;
        }, true));
    }
    _createVolumetricLightPostProcess(scene, ratio) {
        const geometryRenderer = scene.enableGeometryBufferRenderer();
        geometryRenderer.enablePosition = true;
        const geometry = geometryRenderer.getGBuffer();
        // Base post-process
        this.volumetricLightPostProcess = new PostProcess("HDRVLS", "standard", ["shadowViewProjection", "cameraPosition", "sunDirection", "sunColor", "scatteringCoefficient", "scatteringPower", "depthValues"], ["shadowMapSampler", "positionSampler"], ratio / 8, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define VLS\n#define NB_STEPS " + this._volumetricLightStepsCount.toFixed(1));
        const depthValues = Vector2.Zero();
        this.volumetricLightPostProcess.onApply = (effect) => {
            if (this.sourceLight && this.sourceLight.getShadowGenerator() && this._scene.activeCamera) {
                const generator = this.sourceLight.getShadowGenerator();
                effect.setTexture("shadowMapSampler", generator.getShadowMap());
                effect.setTexture("positionSampler", geometry.textures[2]);
                effect.setColor3("sunColor", this.sourceLight.diffuse);
                effect.setVector3("sunDirection", this.sourceLight.getShadowDirection());
                effect.setVector3("cameraPosition", this._scene.activeCamera.globalPosition);
                effect.setMatrix("shadowViewProjection", generator.getTransformMatrix());
                effect.setFloat("scatteringCoefficient", this.volumetricLightCoefficient);
                effect.setFloat("scatteringPower", this.volumetricLightPower);
                depthValues.x = this.sourceLight.getDepthMinZ(this._scene.activeCamera);
                depthValues.y = this.sourceLight.getDepthMaxZ(this._scene.activeCamera);
                effect.setVector2("depthValues", depthValues);
            }
        };
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLS", () => {
            return this.volumetricLightPostProcess;
        }, true));
        // Smooth
        this._createBlurPostProcesses(scene, ratio / 4, 0, "volumetricLightBlurScale");
        // Merge
        this.volumetricLightMergePostProces = new PostProcess("HDRVLSMerge", "standard", [], ["originalSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define VLSMERGE");
        this.volumetricLightMergePostProces.onApply = (effect) => {
            effect.setTextureFromPostProcess("originalSampler", this._bloomEnabled ? this.textureAdderFinalPostProcess : this.originalPostProcess);
            this._currentDepthOfFieldSource = this.volumetricLightFinalPostProcess;
        };
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLSMerge", () => {
            return this.volumetricLightMergePostProces;
        }, true));
    }
    // Create luminance
    _createLuminancePostProcesses(scene, textureType) {
        // Create luminance
        let size = Math.pow(3, StandardRenderingPipeline.LuminanceSteps);
        this.luminancePostProcess = new PostProcess("HDRLuminance", "standard", ["lumOffsets"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE", textureType);
        const offsets = [];
        this.luminancePostProcess.onApply = (effect) => {
            const sU = 1.0 / this.luminancePostProcess.width;
            const sV = 1.0 / this.luminancePostProcess.height;
            offsets[0] = -0.5 * sU;
            offsets[1] = 0.5 * sV;
            offsets[2] = 0.5 * sU;
            offsets[3] = 0.5 * sV;
            offsets[4] = -0.5 * sU;
            offsets[5] = -0.5 * sV;
            offsets[6] = 0.5 * sU;
            offsets[7] = -0.5 * sV;
            effect.setArray2("lumOffsets", offsets);
        };
        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLuminance", () => {
            return this.luminancePostProcess;
        }, true));
        // Create down sample luminance
        for (let i = StandardRenderingPipeline.LuminanceSteps - 1; i >= 0; i--) {
            size = Math.pow(3, i);
            let defines = "#define LUMINANCE_DOWN_SAMPLE\n";
            if (i === 0) {
                defines += "#define FINAL_DOWN_SAMPLER";
            }
            const postProcess = new PostProcess("HDRLuminanceDownSample" + i, "standard", ["dsOffsets", "halfDestPixelSize"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, defines, textureType);
            this.luminanceDownSamplePostProcesses.push(postProcess);
        }
        // Create callbacks and add effects
        let lastLuminance = this.luminancePostProcess;
        this.luminanceDownSamplePostProcesses.forEach((pp, index) => {
            const downSampleOffsets = new Array(18);
            pp.onApply = (effect) => {
                if (!lastLuminance) {
                    return;
                }
                let id = 0;
                for (let x = -1; x < 2; x++) {
                    for (let y = -1; y < 2; y++) {
                        downSampleOffsets[id] = x / lastLuminance.width;
                        downSampleOffsets[id + 1] = y / lastLuminance.height;
                        id += 2;
                    }
                }
                effect.setArray2("dsOffsets", downSampleOffsets);
                effect.setFloat("halfDestPixelSize", 0.5 / lastLuminance.width);
                if (index === this.luminanceDownSamplePostProcesses.length - 1) {
                    lastLuminance = this.luminancePostProcess;
                }
                else {
                    lastLuminance = pp;
                }
            };
            if (index === this.luminanceDownSamplePostProcesses.length - 1) {
                pp.onAfterRender = () => {
                    const pixel = scene.getEngine().readPixels(0, 0, 1, 1);
                    const bit_shift = new Vector4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
                    pixel.then((pixel) => {
                        const data = new Uint8Array(pixel.buffer);
                        this._hdrCurrentLuminance = (data[0] * bit_shift.x + data[1] * bit_shift.y + data[2] * bit_shift.z + data[3] * bit_shift.w) / 100.0;
                    });
                };
            }
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLuminanceDownSample" + index, () => {
                return pp;
            }, true));
        });
    }
    // Create HDR post-process
    _createHdrPostProcess(scene, ratio) {
        const defines = ["#define HDR"];
        if (this._hdrAutoExposure) {
            defines.push("#define AUTO_EXPOSURE");
        }
        this.hdrPostProcess = new PostProcess("HDR", "standard", ["averageLuminance"], ["textureAdderSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, defines.join("\n"), 0);
        let outputLiminance = 1;
        let time = 0;
        let lastTime = 0;
        this.hdrPostProcess.onApply = (effect) => {
            effect.setTextureFromPostProcess("textureAdderSampler", this._currentDepthOfFieldSource);
            time += scene.getEngine().getDeltaTime();
            if (outputLiminance < 0) {
                outputLiminance = this._hdrCurrentLuminance;
            }
            else {
                const dt = (lastTime - time) / 1000.0;
                if (this._hdrCurrentLuminance < outputLiminance + this.hdrDecreaseRate * dt) {
                    outputLiminance += this.hdrDecreaseRate * dt;
                }
                else if (this._hdrCurrentLuminance > outputLiminance - this.hdrIncreaseRate * dt) {
                    outputLiminance -= this.hdrIncreaseRate * dt;
                }
                else {
                    outputLiminance = this._hdrCurrentLuminance;
                }
            }
            if (this.hdrAutoExposure) {
                this._currentExposure = this._fixedExposure / outputLiminance;
            }
            else {
                outputLiminance = Clamp(outputLiminance, this.hdrMinimumLuminance, 1e20);
                effect.setFloat("averageLuminance", outputLiminance);
            }
            lastTime = time;
            this._currentDepthOfFieldSource = this.hdrFinalPostProcess;
        };
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDR", () => {
            return this.hdrPostProcess;
        }, true));
    }
    // Create lens flare post-process
    _createLensFlarePostProcess(scene, ratio) {
        this.lensFlarePostProcess = new PostProcess("HDRLensFlare", "standard", ["strength", "ghostDispersal", "haloWidth", "resolution", "distortionStrength"], ["lensColorSampler"], ratio / 2, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE", 0);
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlare", () => {
            return this.lensFlarePostProcess;
        }, true));
        this._createBlurPostProcesses(scene, ratio / 4, 2, "lensFlareBlurWidth");
        this.lensFlareComposePostProcess = new PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", 0);
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", () => {
            return this.lensFlareComposePostProcess;
        }, true));
        const resolution = new Vector2(0, 0);
        // Lens flare
        this.lensFlarePostProcess.externalTextureSamplerBinding = true;
        this.lensFlarePostProcess.onApply = (effect) => {
            effect.setTextureFromPostProcess("textureSampler", this._bloomEnabled ? this.blurHPostProcesses[0] : this.originalPostProcess);
            effect.setTexture("lensColorSampler", this.lensColorTexture);
            effect.setFloat("strength", this.lensFlareStrength);
            effect.setFloat("ghostDispersal", this.lensFlareGhostDispersal);
            effect.setFloat("haloWidth", this.lensFlareHaloWidth);
            // Shift
            resolution.x = this.lensFlarePostProcess.width;
            resolution.y = this.lensFlarePostProcess.height;
            effect.setVector2("resolution", resolution);
            effect.setFloat("distortionStrength", this.lensFlareDistortionStrength);
        };
        // Compose
        const scaleBias1 = Matrix.FromValues(2.0, 0.0, -1.0, 0.0, 0.0, 2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
        const scaleBias2 = Matrix.FromValues(0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
        this.lensFlareComposePostProcess.onApply = (effect) => {
            if (!this._scene.activeCamera) {
                return;
            }
            effect.setTextureFromPostProcess("otherSampler", this.lensFlarePostProcess);
            effect.setTexture("lensDirtSampler", this.lensFlareDirtTexture);
            effect.setTexture("lensStarSampler", this.lensStarTexture);
            // Lens start rotation matrix
            const camerax = this._scene.activeCamera.getViewMatrix().getRow(0);
            const cameraz = this._scene.activeCamera.getViewMatrix().getRow(2);
            let camRot = Vector3.Dot(camerax.toVector3(), new Vector3(1.0, 0.0, 0.0)) + Vector3.Dot(cameraz.toVector3(), new Vector3(0.0, 0.0, 1.0));
            camRot *= 4.0;
            const starRotation = Matrix.FromValues(Math.cos(camRot) * 0.5, -Math.sin(camRot), 0.0, 0.0, Math.sin(camRot), Math.cos(camRot) * 0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
            const lensStarMatrix = scaleBias2.multiply(starRotation).multiply(scaleBias1);
            effect.setMatrix("lensStarMatrix", lensStarMatrix);
            this._currentDepthOfFieldSource = this.lensFlareFinalPostProcess;
        };
    }
    // Create depth-of-field post-process
    _createDepthOfFieldPostProcess(scene, ratio) {
        this.depthOfFieldPostProcess = new PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", 0);
        this.depthOfFieldPostProcess.onApply = (effect) => {
            effect.setTextureFromPostProcess("otherSampler", this._currentDepthOfFieldSource);
            effect.setTexture("depthSampler", this._getDepthTexture());
            effect.setFloat("distance", this.depthOfFieldDistance);
        };
        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", () => {
            return this.depthOfFieldPostProcess;
        }, true));
    }
    // Create motion blur post-process
    _createMotionBlurPostProcess(scene, ratio) {
        if (this._isObjectBasedMotionBlur) {
            const mb = new MotionBlurPostProcess("HDRMotionBlur", scene, ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, 0);
            mb.motionStrength = this.motionStrength;
            mb.motionBlurSamples = this.motionBlurSamples;
            this.motionBlurPostProcess = mb;
        }
        else {
            this.motionBlurPostProcess = new PostProcess("HDRMotionBlur", "standard", ["inverseViewProjection", "prevViewProjection", "screenSize", "motionScale", "motionStrength"], ["depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + this.motionBlurSamples.toFixed(1), 0);
            let motionScale = 0;
            let prevViewProjection = Matrix.Identity();
            const invViewProjection = Matrix.Identity();
            let viewProjection = Matrix.Identity();
            const screenSize = Vector2.Zero();
            this.motionBlurPostProcess.onApply = (effect) => {
                viewProjection = scene.getProjectionMatrix().multiply(scene.getViewMatrix());
                viewProjection.invertToRef(invViewProjection);
                effect.setMatrix("inverseViewProjection", invViewProjection);
                effect.setMatrix("prevViewProjection", prevViewProjection);
                prevViewProjection = viewProjection;
                screenSize.x = this.motionBlurPostProcess.width;
                screenSize.y = this.motionBlurPostProcess.height;
                effect.setVector2("screenSize", screenSize);
                motionScale = scene.getEngine().getFps() / 60.0;
                effect.setFloat("motionScale", motionScale);
                effect.setFloat("motionStrength", this.motionStrength);
                effect.setTexture("depthSampler", this._getDepthTexture());
            };
        }
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRMotionBlur", () => {
            return this.motionBlurPostProcess;
        }, true));
    }
    _getDepthTexture() {
        if (this._scene.getEngine().getCaps().drawBuffersExtension) {
            const renderer = this._scene.enableGeometryBufferRenderer();
            return renderer.getGBuffer().textures[0];
        }
        return this._scene.enableDepthRenderer().getDepthMap();
    }
    _disposePostProcesses() {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];
            if (this.originalPostProcess) {
                this.originalPostProcess.dispose(camera);
            }
            if (this.screenSpaceReflectionPostProcess) {
                this.screenSpaceReflectionPostProcess.dispose(camera);
            }
            if (this.downSampleX4PostProcess) {
                this.downSampleX4PostProcess.dispose(camera);
            }
            if (this.brightPassPostProcess) {
                this.brightPassPostProcess.dispose(camera);
            }
            if (this.textureAdderPostProcess) {
                this.textureAdderPostProcess.dispose(camera);
            }
            if (this.volumetricLightPostProcess) {
                this.volumetricLightPostProcess.dispose(camera);
            }
            if (this.volumetricLightSmoothXPostProcess) {
                this.volumetricLightSmoothXPostProcess.dispose(camera);
            }
            if (this.volumetricLightSmoothYPostProcess) {
                this.volumetricLightSmoothYPostProcess.dispose(camera);
            }
            if (this.volumetricLightMergePostProces) {
                this.volumetricLightMergePostProces.dispose(camera);
            }
            if (this.volumetricLightFinalPostProcess) {
                this.volumetricLightFinalPostProcess.dispose(camera);
            }
            if (this.lensFlarePostProcess) {
                this.lensFlarePostProcess.dispose(camera);
            }
            if (this.lensFlareComposePostProcess) {
                this.lensFlareComposePostProcess.dispose(camera);
            }
            for (let j = 0; j < this.luminanceDownSamplePostProcesses.length; j++) {
                this.luminanceDownSamplePostProcesses[j].dispose(camera);
            }
            if (this.luminancePostProcess) {
                this.luminancePostProcess.dispose(camera);
            }
            if (this.hdrPostProcess) {
                this.hdrPostProcess.dispose(camera);
            }
            if (this.hdrFinalPostProcess) {
                this.hdrFinalPostProcess.dispose(camera);
            }
            if (this.depthOfFieldPostProcess) {
                this.depthOfFieldPostProcess.dispose(camera);
            }
            if (this.motionBlurPostProcess) {
                this.motionBlurPostProcess.dispose(camera);
            }
            if (this.fxaaPostProcess) {
                this.fxaaPostProcess.dispose(camera);
            }
            for (let j = 0; j < this.blurHPostProcesses.length; j++) {
                this.blurHPostProcesses[j].dispose(camera);
            }
            for (let j = 0; j < this.blurVPostProcesses.length; j++) {
                this.blurVPostProcesses[j].dispose(camera);
            }
        }
        this.originalPostProcess = null;
        this.downSampleX4PostProcess = null;
        this.brightPassPostProcess = null;
        this.textureAdderPostProcess = null;
        this.textureAdderFinalPostProcess = null;
        this.volumetricLightPostProcess = null;
        this.volumetricLightSmoothXPostProcess = null;
        this.volumetricLightSmoothYPostProcess = null;
        this.volumetricLightMergePostProces = null;
        this.volumetricLightFinalPostProcess = null;
        this.lensFlarePostProcess = null;
        this.lensFlareComposePostProcess = null;
        this.luminancePostProcess = null;
        this.hdrPostProcess = null;
        this.hdrFinalPostProcess = null;
        this.depthOfFieldPostProcess = null;
        this.motionBlurPostProcess = null;
        this.fxaaPostProcess = null;
        this.screenSpaceReflectionPostProcess = null;
        this.luminanceDownSamplePostProcesses.length = 0;
        this.blurHPostProcesses.length = 0;
        this.blurVPostProcesses.length = 0;
    }
    /**
     * Dispose of the pipeline and stop all post processes
     */
    dispose() {
        this._disposePostProcesses();
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        super.dispose();
    }
    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        if (this.sourceLight) {
            serializationObject.sourceLightId = this.sourceLight.id;
        }
        if (this.screenSpaceReflectionPostProcess) {
            serializationObject.screenSpaceReflectionPostProcess = SerializationHelper.Serialize(this.screenSpaceReflectionPostProcess);
        }
        serializationObject.customType = "StandardRenderingPipeline";
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
        const p = SerializationHelper.Parse(() => new StandardRenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
        if (source.sourceLightId) {
            p.sourceLight = scene.getLightById(source.sourceLightId);
        }
        if (source.screenSpaceReflectionPostProcess) {
            SerializationHelper.Parse(() => p.screenSpaceReflectionPostProcess, source.screenSpaceReflectionPostProcess, scene, rootUrl);
        }
        return p;
    }
}
/**
 * Luminance steps
 */
StandardRenderingPipeline.LuminanceSteps = 6;
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "brightThreshold", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "blurWidth", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "horizontalBlur", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "exposure", null);
__decorate([
    serializeAsTexture("lensTexture")
], StandardRenderingPipeline.prototype, "lensTexture", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "volumetricLightCoefficient", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "volumetricLightPower", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "volumetricLightBlurScale", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "hdrMinimumLuminance", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "hdrDecreaseRate", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "hdrIncreaseRate", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "hdrAutoExposure", null);
__decorate([
    serializeAsTexture("lensColorTexture")
], StandardRenderingPipeline.prototype, "lensColorTexture", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "lensFlareStrength", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "lensFlareGhostDispersal", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "lensFlareHaloWidth", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "lensFlareDistortionStrength", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "lensFlareBlurWidth", void 0);
__decorate([
    serializeAsTexture("lensStarTexture")
], StandardRenderingPipeline.prototype, "lensStarTexture", void 0);
__decorate([
    serializeAsTexture("lensFlareDirtTexture")
], StandardRenderingPipeline.prototype, "lensFlareDirtTexture", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "depthOfFieldDistance", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "depthOfFieldBlurWidth", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "motionStrength", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "objectBasedMotionBlur", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "_ratio", void 0);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "BloomEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "DepthOfFieldEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "LensFlareEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "HDREnabled", null);
__decorate([
    serialize()
    // eslint-disable-next-line @typescript-eslint/naming-convention
], StandardRenderingPipeline.prototype, "VLSEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "MotionBlurEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "fxaaEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "screenSpaceReflectionsEnabled", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "volumetricLightStepsCount", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "motionBlurSamples", null);
__decorate([
    serialize()
], StandardRenderingPipeline.prototype, "samples", null);
RegisterClass("BABYLON.StandardRenderingPipeline", StandardRenderingPipeline);
//# sourceMappingURL=standardRenderingPipeline.js.map