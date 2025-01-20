import { __decorate } from "../../../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serialize } from "../../../Misc/decorators.js";
import { SerializationHelper } from "../../../Misc/decorators.serialization.js";
import { Vector3, Matrix, Quaternion, TmpVectors } from "../../../Maths/math.vector.js";
import { PostProcess } from "../../postProcess.js";
import { PostProcessRenderPipeline } from "../postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../postProcessRenderEffect.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { ScreenSpaceReflections2Configuration } from "../../../Rendering/screenSpaceReflections2Configuration.js";
import { GeometryBufferRenderer } from "../../../Rendering/geometryBufferRenderer.js";

import { DepthRenderer } from "../../../Rendering/depthRenderer.js";
import "../postProcessRenderPipelineManagerSceneComponent.js";
const trs = Matrix.Compose(new Vector3(0.5, 0.5, 0.5), Quaternion.Identity(), new Vector3(0.5, 0.5, 0.5));
const trsWebGPU = Matrix.Compose(new Vector3(0.5, 0.5, 1), Quaternion.Identity(), new Vector3(0.5, 0.5, 0));
/**
 * Render pipeline to produce Screen Space Reflections (SSR) effect
 *
 * References:
 *   Screen Space Ray Tracing:
 *     - http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html
 *     - https://sourceforge.net/p/g3d/code/HEAD/tree/G3D10/data-files/shader/screenSpaceRayTrace.glsl
 *     - https://github.com/kode80/kode80SSR
 *   SSR:
 *     - general tips: https://sakibsaikia.github.io/graphics/2016/12/26/Screen-Space-Reflection-in-Killing-Floor-2.html
 *     - computation of blur radius from roughness and distance: https://github.com/godotengine/godot/blob/master/servers/rendering/renderer_rd/shaders/effects/screen_space_reflection.glsl
 *     - blur and usage of back depth buffer: https://github.com/kode80/kode80SSR
 */
export class SSRRenderingPipeline extends PostProcessRenderPipeline {
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
     * Gets or sets the minimum value for one of the reflectivity component of the material to consider it for SSR (default: 0.04).
     * If all r/g/b components of the reflectivity is below or equal this value, the pixel will not be considered reflective and SSR won't be applied.
     */
    get reflectivityThreshold() {
        return this._reflectivityThreshold;
    }
    set reflectivityThreshold(threshold) {
        if (threshold === this._reflectivityThreshold) {
            return;
        }
        if ((threshold === 0 && this._reflectivityThreshold !== 0) || (threshold !== 0 && this._reflectivityThreshold === 0)) {
            this._reflectivityThreshold = threshold;
            this._buildPipeline();
        }
        else {
            this._reflectivityThreshold = threshold;
        }
    }
    /**
     * Gets or sets the downsample factor used to reduce the size of the texture used to compute the SSR contribution (default: 0).
     * Use 0 to render the SSR contribution at full resolution, 1 to render at half resolution, 2 to render at 1/3 resolution, etc.
     * Note that it is used only when blurring is enabled (blurDispersionStrength \> 0), because in that mode the SSR contribution is generated in a separate texture.
     */
    get ssrDownsample() {
        return this._ssrDownsample;
    }
    set ssrDownsample(downsample) {
        if (downsample === this._ssrDownsample) {
            return;
        }
        this._ssrDownsample = downsample;
        this._buildPipeline();
    }
    /**
     * Gets or sets the blur dispersion strength. Set this value to 0 to disable blurring (default: 0.05)
     * The reflections are blurred based on the roughness of the surface and the distance between the pixel shaded and the reflected pixel: the higher the distance the more blurry the reflection is.
     * blurDispersionStrength allows to increase or decrease this effect.
     */
    get blurDispersionStrength() {
        return this._blurDispersionStrength;
    }
    set blurDispersionStrength(strength) {
        if (strength === this._blurDispersionStrength) {
            return;
        }
        const rebuild = (strength === 0 && this._blurDispersionStrength !== 0) || (strength !== 0 && this._blurDispersionStrength === 0);
        this._blurDispersionStrength = strength;
        if (rebuild) {
            this._buildPipeline();
        }
    }
    _useBlur() {
        return this._blurDispersionStrength > 0;
    }
    /**
     * Gets or sets the downsample factor used to reduce the size of the textures used to blur the reflection effect (default: 0).
     * Use 0 to blur at full resolution, 1 to render at half resolution, 2 to render at 1/3 resolution, etc.
     */
    get blurDownsample() {
        return this._blurDownsample;
    }
    set blurDownsample(downsample) {
        if (downsample === this._blurDownsample) {
            return;
        }
        this._blurDownsample = downsample;
        this._buildPipeline();
    }
    /**
     * Gets or sets whether or not smoothing reflections is enabled (default: false)
     * Enabling smoothing will require more GPU power.
     * Note that this setting has no effect if step = 1: it's only used if step \> 1.
     */
    get enableSmoothReflections() {
        return this._enableSmoothReflections;
    }
    set enableSmoothReflections(enabled) {
        if (enabled === this._enableSmoothReflections) {
            return;
        }
        this._enableSmoothReflections = enabled;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets the environment cube texture used to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance/maxSteps is reached.
     */
    get environmentTexture() {
        return this._environmentTexture;
    }
    set environmentTexture(texture) {
        this._environmentTexture = texture;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets the boolean defining if the environment texture is a standard cubemap (false) or a probe (true). Default value is false.
     * Note: a probe cube texture is treated differently than an ordinary cube texture because the Y axis is reversed.
     */
    get environmentTextureIsProbe() {
        return this._environmentTextureIsProbe;
    }
    set environmentTextureIsProbe(isProbe) {
        this._environmentTextureIsProbe = isProbe;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated at the screen borders (default: true).
     */
    get attenuateScreenBorders() {
        return this._attenuateScreenBorders;
    }
    set attenuateScreenBorders(attenuate) {
        if (this._attenuateScreenBorders === attenuate) {
            return;
        }
        this._attenuateScreenBorders = attenuate;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the distance of the intersection (default: true).
     */
    get attenuateIntersectionDistance() {
        return this._attenuateIntersectionDistance;
    }
    set attenuateIntersectionDistance(attenuate) {
        if (this._attenuateIntersectionDistance === attenuate) {
            return;
        }
        this._attenuateIntersectionDistance = attenuate;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the number of iterations performed to find the intersection (default: true).
     */
    get attenuateIntersectionIterations() {
        return this._attenuateIntersectionIterations;
    }
    set attenuateIntersectionIterations(attenuate) {
        if (this._attenuateIntersectionIterations === attenuate) {
            return;
        }
        this._attenuateIntersectionIterations = attenuate;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated when the reflection ray is facing the camera (the view direction) (default: false).
     */
    get attenuateFacingCamera() {
        return this._attenuateFacingCamera;
    }
    set attenuateFacingCamera(attenuate) {
        if (this._attenuateFacingCamera === attenuate) {
            return;
        }
        this._attenuateFacingCamera = attenuate;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating if the backface reflections should be attenuated (default: false).
     */
    get attenuateBackfaceReflection() {
        return this._attenuateBackfaceReflection;
    }
    set attenuateBackfaceReflection(attenuate) {
        if (this._attenuateBackfaceReflection === attenuate) {
            return;
        }
        this._attenuateBackfaceReflection = attenuate;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating if the ray should be clipped to the frustum (default: true).
     * You can try to set this parameter to false to save some performances: it may produce some artefacts in some cases, but generally they won't really be visible
     */
    get clipToFrustum() {
        return this._clipToFrustum;
    }
    set clipToFrustum(clip) {
        if (this._clipToFrustum === clip) {
            return;
        }
        this._clipToFrustum = clip;
        this._updateEffectDefines();
    }
    /**
     * Gets or sets a boolean indicating whether the blending between the current color pixel and the reflection color should be done with a Fresnel coefficient (default: false).
     * It is more physically accurate to use the Fresnel coefficient (otherwise it uses the reflectivity of the material for blending), but it is also more expensive when you use blur (when blurDispersionStrength \> 0).
     */
    get useFresnel() {
        return this._useFresnel;
    }
    set useFresnel(fresnel) {
        if (this._useFresnel === fresnel) {
            return;
        }
        this._useFresnel = fresnel;
        this._buildPipeline();
    }
    /**
     * Gets or sets a boolean defining if geometry thickness should be computed automatically (default: false).
     * When enabled, a depth renderer is created which will render the back faces of the scene to a depth texture (meaning additional work for the GPU).
     * In that mode, the "thickness" property is still used as an offset to compute the ray intersection, but you can typically use a much lower
     * value than when enableAutomaticThicknessComputation is false (it's even possible to use a value of 0 when using low values for "step")
     * Note that for performance reasons, this option will only apply to the first camera to which the rendering pipeline is attached!
     */
    get enableAutomaticThicknessComputation() {
        return this._enableAutomaticThicknessComputation;
    }
    set enableAutomaticThicknessComputation(automatic) {
        if (this._enableAutomaticThicknessComputation === automatic) {
            return;
        }
        this._enableAutomaticThicknessComputation = automatic;
        this._buildPipeline();
    }
    /**
     * Gets the depth renderer used to render the back faces of the scene to a depth texture.
     */
    get backfaceDepthRenderer() {
        return this._depthRenderer;
    }
    /**
     * Gets or sets the downsample factor (default: 0) used to create the backface depth texture - used only if enableAutomaticThicknessComputation = true.
     * Use 0 to render the depth at full resolution, 1 to render at half resolution, 2 to render at 1/4 resolution, etc.
     * Note that you will get rendering artefacts when using a value different from 0: it's a tradeoff between image quality and performances.
     */
    get backfaceDepthTextureDownsample() {
        return this._backfaceDepthTextureDownsample;
    }
    set backfaceDepthTextureDownsample(factor) {
        if (this._backfaceDepthTextureDownsample === factor) {
            return;
        }
        this._backfaceDepthTextureDownsample = factor;
        this._resizeDepthRenderer();
    }
    /**
     * Gets or sets a boolean (default: true) indicating if the depth of transparent meshes should be written to the backface depth texture (when automatic thickness computation is enabled).
     */
    get backfaceForceDepthWriteTransparentMeshes() {
        return this._backfaceForceDepthWriteTransparentMeshes;
    }
    set backfaceForceDepthWriteTransparentMeshes(force) {
        if (this._backfaceForceDepthWriteTransparentMeshes === force) {
            return;
        }
        this._backfaceForceDepthWriteTransparentMeshes = force;
        if (this._depthRenderer) {
            this._depthRenderer.forceDepthWriteTransparentMeshes = force;
        }
    }
    /**
     * Gets or sets a boolean indicating if the effect is enabled (default: true).
     */
    get isEnabled() {
        return this._isEnabled;
    }
    set isEnabled(value) {
        if (this._isEnabled === value) {
            return;
        }
        this._isEnabled = value;
        if (!value) {
            if (this._cameras !== null) {
                this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
                this._cameras = this._camerasToBeAttached.slice();
            }
        }
        else if (value) {
            if (!this._isDirty) {
                if (this._cameras !== null) {
                    this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
                }
            }
            else {
                this._buildPipeline();
            }
        }
    }
    /**
     * Gets or sets a boolean defining if the input color texture is in gamma space (default: true)
     * The SSR effect works in linear space, so if the input texture is in gamma space, we must convert the texture to linear space before applying the effect
     */
    get inputTextureColorIsInGammaSpace() {
        return this._inputTextureColorIsInGammaSpace;
    }
    set inputTextureColorIsInGammaSpace(gammaSpace) {
        if (this._inputTextureColorIsInGammaSpace === gammaSpace) {
            return;
        }
        this._inputTextureColorIsInGammaSpace = gammaSpace;
        this._buildPipeline();
    }
    /**
     * Gets or sets a boolean defining if the output color texture generated by the SSR pipeline should be in gamma space (default: true)
     * If you have a post-process that comes after the SSR and that post-process needs the input to be in a linear space, you must disable generateOutputInGammaSpace
     */
    get generateOutputInGammaSpace() {
        return this._generateOutputInGammaSpace;
    }
    set generateOutputInGammaSpace(gammaSpace) {
        if (this._generateOutputInGammaSpace === gammaSpace) {
            return;
        }
        this._generateOutputInGammaSpace = gammaSpace;
        this._buildPipeline();
    }
    /**
     * Gets or sets a boolean indicating if the effect should be rendered in debug mode (default: false).
     * In this mode, colors have this meaning:
     *   - blue: the ray hit the max distance (we reached maxDistance)
     *   - red: the ray ran out of steps (we reached maxSteps)
     *   - yellow: the ray went off screen
     *   - green: the ray hit a surface. The brightness of the green color is proportional to the distance between the ray origin and the intersection point: A brighter green means more computation than a darker green.
     * In the first 3 cases, the final color is calculated by mixing the skybox color with the pixel color (if environmentTexture is defined), otherwise the pixel color is not modified
     * You should try to get as few blue/red/yellow pixels as possible, as this means that the ray has gone further than if it had hit a surface.
     */
    get debug() {
        return this._debug;
    }
    set debug(value) {
        if (this._debug === value) {
            return;
        }
        this._debug = value;
        this._buildPipeline();
    }
    /**
     * Gets the scene the effect belongs to.
     * @returns the scene the effect belongs to.
     */
    getScene() {
        return this._scene;
    }
    get _geometryBufferRenderer() {
        if (!this._forceGeometryBuffer) {
            return null;
        }
        return this._scene.geometryBufferRenderer;
    }
    get _prePassRenderer() {
        if (this._forceGeometryBuffer) {
            return null;
        }
        return this._scene.prePassRenderer;
    }
    /**
     * Gets active scene
     */
    get scene() {
        return this._scene;
    }
    /**
     * Returns true if SSR is supported by the running hardware
     */
    get isSupported() {
        const caps = this._scene.getEngine().getCaps();
        return caps.drawBuffersExtension && caps.texelFetch;
    }
    /**
     * Constructor of the SSR rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param cameras The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param forceGeometryBuffer Set to true if you want to use the legacy geometry buffer renderer (default: false)
     * @param textureType The texture type used by the different post processes created by SSR (default: 0)
     * @param useScreenspaceDepth Indicates if the depth buffer should be linear or screenspace (default: false). This allows sharing the buffer with other effect pipelines that may require the depth to be in screenspace.
     */
    constructor(name, scene, cameras, forceGeometryBuffer = false, textureType = 0, useScreenspaceDepth = false) {
        super(scene.getEngine(), name);
        /**
         * The SSR PostProcess effect id in the pipeline
         */
        this.SSRRenderEffect = "SSRRenderEffect";
        /**
         * The blur PostProcess effect id in the pipeline
         */
        this.SSRBlurRenderEffect = "SSRBlurRenderEffect";
        /**
         * The PostProcess effect id in the pipeline that combines the SSR-Blur output with the original scene color
         */
        this.SSRCombineRenderEffect = "SSRCombineRenderEffect";
        this._samples = 1;
        /**
         * Gets or sets the maxDistance used to define how far we look for reflection during the ray-marching on the reflected ray (default: 1000).
         * Note that this value is a view (camera) space distance (not pixels!).
         */
        this.maxDistance = 1000.0;
        /**
         * Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel. Should be an integer \>= 1 as it is the number of pixels we advance at each step (default: 1).
         * Use higher values to improve performances (but at the expense of quality).
         */
        this.step = 1.0;
        /**
         * Gets or sets the thickness value used as tolerance when computing the intersection between the reflected ray and the scene (default: 0.5).
         * If setting "enableAutomaticThicknessComputation" to true, you can use lower values for "thickness" (even 0), as the geometry thickness
         * is automatically computed thank to the regular depth buffer + the backface depth buffer
         */
        this.thickness = 0.5;
        /**
         * Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results (default: 1).
         */
        this.strength = 1;
        /**
         * Gets or sets the falloff exponent used to compute the reflection strength. Higher values lead to fainter reflections (default: 1).
         */
        this.reflectionSpecularFalloffExponent = 1;
        /**
         * Maximum number of steps during the ray marching process after which we consider an intersection could not be found (default: 1000).
         * Should be an integer value.
         */
        this.maxSteps = 1000.0;
        /**
         * Gets or sets the factor applied when computing roughness. Default value is 0.2.
         * When blurring based on roughness is enabled (meaning blurDispersionStrength \> 0), roughnessFactor is used as a global roughness factor applied on all objects.
         * If you want to disable this global roughness set it to 0.
         */
        this.roughnessFactor = 0.2;
        /**
         * Number of steps to skip at start when marching the ray to avoid self collisions (default: 1)
         * 1 should normally be a good value, depending on the scene you may need to use a higher value (2 or 3)
         */
        this.selfCollisionNumSkip = 1;
        this._reflectivityThreshold = 0.04;
        this._ssrDownsample = 0;
        this._blurDispersionStrength = 0.03;
        this._blurDownsample = 0;
        this._enableSmoothReflections = false;
        this._useScreenspaceDepth = false;
        this._environmentTextureIsProbe = false;
        this._attenuateScreenBorders = true;
        this._attenuateIntersectionDistance = true;
        this._attenuateIntersectionIterations = true;
        this._attenuateFacingCamera = false;
        this._attenuateBackfaceReflection = false;
        this._clipToFrustum = true;
        this._useFresnel = false;
        this._enableAutomaticThicknessComputation = false;
        this._backfaceDepthTextureDownsample = 0;
        this._backfaceForceDepthWriteTransparentMeshes = true;
        this._isEnabled = true;
        this._inputTextureColorIsInGammaSpace = true;
        this._generateOutputInGammaSpace = true;
        this._debug = false;
        this._forceGeometryBuffer = false;
        this._isDirty = false;
        this._camerasToBeAttached = [];
        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();
        this._scene = scene;
        this._textureType = textureType;
        this._forceGeometryBuffer = forceGeometryBuffer;
        this._useScreenspaceDepth = useScreenspaceDepth;
        if (this.isSupported) {
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (this._forceGeometryBuffer) {
                const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
                if (geometryBufferRenderer) {
                    geometryBufferRenderer.enableReflectivity = true;
                    geometryBufferRenderer.useSpecificClearForDepthTexture = true;
                    geometryBufferRenderer.enableScreenspaceDepth = this._useScreenspaceDepth;
                    geometryBufferRenderer.enableDepth = !this._useScreenspaceDepth;
                }
            }
            else {
                const prePassRenderer = scene.enablePrePassRenderer();
                if (prePassRenderer) {
                    prePassRenderer.useSpecificClearForDepthTexture = true;
                    prePassRenderer.markAsDirty();
                }
            }
            this._buildPipeline();
        }
    }
    /**
     * Get the class name
     * @returns "SSRRenderingPipeline"
     */
    getClassName() {
        return "SSRRenderingPipeline";
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
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableGeometryBufferRenderer if the geometry buffer renderer should be disabled
     */
    dispose(disableGeometryBufferRenderer = false) {
        this._disposeDepthRenderer();
        this._disposePostProcesses();
        if (disableGeometryBufferRenderer) {
            this._scene.disableGeometryBufferRenderer();
        }
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        super.dispose();
    }
    _getTextureSize() {
        const engine = this._scene.getEngine();
        const prePassRenderer = this._prePassRenderer;
        let textureSize = { width: engine.getRenderWidth(), height: engine.getRenderHeight() };
        if (prePassRenderer && this._scene.activeCamera?._getFirstPostProcess() === this._ssrPostProcess) {
            const renderTarget = prePassRenderer.getRenderTarget();
            if (renderTarget && renderTarget.textures) {
                textureSize = renderTarget.textures[prePassRenderer.getIndex(4)].getSize();
            }
        }
        else if (this._ssrPostProcess?.inputTexture) {
            textureSize.width = this._ssrPostProcess.inputTexture.width;
            textureSize.height = this._ssrPostProcess.inputTexture.height;
        }
        return textureSize;
    }
    _updateEffectDefines() {
        const defines = [];
        if (this._geometryBufferRenderer || this._prePassRenderer) {
            defines.push("#define SSR_SUPPORTED");
        }
        if (this._enableSmoothReflections) {
            defines.push("#define SSRAYTRACE_ENABLE_REFINEMENT");
        }
        if (this._scene.useRightHandedSystem) {
            defines.push("#define SSRAYTRACE_RIGHT_HANDED_SCENE");
        }
        if (this._useScreenspaceDepth) {
            defines.push("#define SSRAYTRACE_SCREENSPACE_DEPTH");
        }
        if (this._environmentTexture) {
            defines.push("#define SSR_USE_ENVIRONMENT_CUBE");
            if (this._environmentTexture.boundingBoxSize) {
                defines.push("#define SSR_USE_LOCAL_REFLECTIONMAP_CUBIC");
            }
            if (this._environmentTexture.gammaSpace) {
                defines.push("#define SSR_ENVIRONMENT_CUBE_IS_GAMMASPACE");
            }
        }
        if (this._environmentTextureIsProbe) {
            defines.push("#define SSR_INVERTCUBICMAP");
        }
        if (this._enableAutomaticThicknessComputation) {
            defines.push("#define SSRAYTRACE_USE_BACK_DEPTHBUFFER");
        }
        if (this._attenuateScreenBorders) {
            defines.push("#define SSR_ATTENUATE_SCREEN_BORDERS");
        }
        if (this._attenuateIntersectionDistance) {
            defines.push("#define SSR_ATTENUATE_INTERSECTION_DISTANCE");
        }
        if (this._attenuateIntersectionIterations) {
            defines.push("#define SSR_ATTENUATE_INTERSECTION_NUMITERATIONS");
        }
        if (this._attenuateFacingCamera) {
            defines.push("#define SSR_ATTENUATE_FACING_CAMERA");
        }
        if (this._attenuateBackfaceReflection) {
            defines.push("#define SSR_ATTENUATE_BACKFACE_REFLECTION");
        }
        if (this._clipToFrustum) {
            defines.push("#define SSRAYTRACE_CLIP_TO_FRUSTUM");
        }
        if (this._useBlur()) {
            defines.push("#define SSR_USE_BLUR");
        }
        if (this._debug) {
            defines.push("#define SSRAYTRACE_DEBUG");
        }
        if (this._inputTextureColorIsInGammaSpace) {
            defines.push("#define SSR_INPUT_IS_GAMMA_SPACE");
        }
        if (this._generateOutputInGammaSpace) {
            defines.push("#define SSR_OUTPUT_IS_GAMMA_SPACE");
        }
        if (this._useFresnel) {
            defines.push("#define SSR_BLEND_WITH_FRESNEL");
        }
        if (this._reflectivityThreshold === 0) {
            defines.push("#define SSR_DISABLE_REFLECTIVITY_TEST");
        }
        if (this._geometryBufferRenderer?.generateNormalsInWorldSpace ?? this._prePassRenderer?.generateNormalsInWorldSpace) {
            defines.push("#define SSR_NORMAL_IS_IN_WORLDSPACE");
        }
        if (this._geometryBufferRenderer?.normalsAreUnsigned) {
            defines.push("#define SSR_DECODE_NORMAL");
        }
        const camera = this._cameras?.[0];
        if (camera && camera.mode === 1) {
            defines.push("#define ORTHOGRAPHIC_CAMERA");
        }
        this._ssrPostProcess?.updateEffect(defines.join("\n"));
    }
    _buildPipeline() {
        if (!this.isSupported) {
            return;
        }
        if (!this._isEnabled) {
            this._isDirty = true;
            return;
        }
        this._isDirty = false;
        const engine = this._scene.getEngine();
        this._disposeDepthRenderer();
        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();
        if (this._enableAutomaticThicknessComputation) {
            const camera = this._cameras?.[0];
            if (camera) {
                this._depthRendererCamera = camera;
                this._depthRenderer = new DepthRenderer(this._scene, undefined, undefined, this._useScreenspaceDepth, 1, !this._useScreenspaceDepth, "SSRBackDepth");
                if (!this._useScreenspaceDepth) {
                    this._depthRenderer.clearColor.r = 1e8; // "infinity": put a big value because we use the storeCameraSpaceZ mode
                }
                this._depthRenderer.reverseCulling = true; // we generate depth for the back faces
                this._depthRenderer.forceDepthWriteTransparentMeshes = this._backfaceForceDepthWriteTransparentMeshes;
                this._resizeDepthRenderer();
                camera.customRenderTargets.push(this._depthRenderer.getDepthMap());
            }
        }
        this._createSSRPostProcess();
        this.addEffect(new PostProcessRenderEffect(engine, this.SSRRenderEffect, () => {
            return this._ssrPostProcess;
        }, true));
        if (this._useBlur()) {
            this._createBlurAndCombinerPostProcesses();
            this.addEffect(new PostProcessRenderEffect(engine, this.SSRBlurRenderEffect, () => {
                return [this._blurPostProcessX, this._blurPostProcessY];
            }, true));
            this.addEffect(new PostProcessRenderEffect(engine, this.SSRCombineRenderEffect, () => {
                return this._blurCombinerPostProcess;
            }, true));
        }
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }
    }
    _resizeDepthRenderer() {
        if (!this._depthRenderer) {
            return;
        }
        const textureSize = this._getTextureSize();
        const depthRendererSize = this._depthRenderer.getDepthMap().getSize();
        const width = Math.floor(textureSize.width / (this._backfaceDepthTextureDownsample + 1));
        const height = Math.floor(textureSize.height / (this._backfaceDepthTextureDownsample + 1));
        if (depthRendererSize.width !== width || depthRendererSize.height !== height) {
            this._depthRenderer.getDepthMap().resize({ width, height });
        }
    }
    _disposeDepthRenderer() {
        if (this._depthRenderer) {
            if (this._depthRendererCamera) {
                const idx = this._depthRendererCamera.customRenderTargets.indexOf(this._depthRenderer.getDepthMap()) ?? -1;
                if (idx !== -1) {
                    this._depthRendererCamera.customRenderTargets.splice(idx, 1);
                }
            }
            this._depthRendererCamera = null;
            this._depthRenderer.getDepthMap().dispose();
        }
        this._depthRenderer = null;
    }
    _disposePostProcesses() {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];
            this._ssrPostProcess?.dispose(camera);
            this._blurPostProcessX?.dispose(camera);
            this._blurPostProcessY?.dispose(camera);
            this._blurCombinerPostProcess?.dispose(camera);
        }
        this._ssrPostProcess = null;
        this._blurPostProcessX = null;
        this._blurPostProcessY = null;
        this._blurCombinerPostProcess = null;
    }
    _createSSRPostProcess() {
        this._ssrPostProcess = new PostProcess("ssr", "screenSpaceReflection2", [
            "projection",
            "invProjectionMatrix",
            "view",
            "invView",
            "thickness",
            "reflectionSpecularFalloffExponent",
            "strength",
            "stepSize",
            "maxSteps",
            "roughnessFactor",
            "projectionPixel",
            "nearPlaneZ",
            "farPlaneZ",
            "maxDistance",
            "selfCollisionNumSkip",
            "vReflectionPosition",
            "vReflectionSize",
            "backSizeFactor",
            "reflectivityThreshold",
        ], ["textureSampler", "normalSampler", "reflectivitySampler", "depthSampler", "envCubeSampler", "backDepthSampler"], 1.0, null, this._textureType, this._scene.getEngine(), false, "", this._textureType, undefined, undefined, undefined, undefined, this._scene.getEngine().isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */, (useWebGPU, list) => {
            if (useWebGPU) {
                list.push(import("../../../ShadersWGSL/screenSpaceReflection2.fragment.js"));
            }
            else {
                list.push(import("../../../Shaders/screenSpaceReflection2.fragment.js"));
            }
        });
        this._updateEffectDefines();
        this._ssrPostProcess.onApply = (effect) => {
            this._resizeDepthRenderer();
            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;
            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }
            if (geometryBufferRenderer) {
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);
                const normalIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[normalIndex]);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
                if (this._useScreenspaceDepth) {
                    const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
                    effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
                }
                else {
                    const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE);
                    effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
                }
            }
            else if (prePassRenderer) {
                const depthIndex = prePassRenderer.getIndex(this._useScreenspaceDepth ? 10 : 5);
                const roughnessIndex = prePassRenderer.getIndex(3);
                const normalIndex = prePassRenderer.getIndex(6);
                effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
            }
            if (this._enableAutomaticThicknessComputation && this._depthRenderer) {
                effect.setTexture("backDepthSampler", this._depthRenderer.getDepthMap());
                effect.setFloat("backSizeFactor", this._backfaceDepthTextureDownsample + 1);
            }
            const camera = this._scene.activeCamera;
            if (!camera) {
                return;
            }
            const viewMatrix = camera.getViewMatrix();
            const projectionMatrix = camera.getProjectionMatrix();
            projectionMatrix.invertToRef(TmpVectors.Matrix[0]);
            viewMatrix.invertToRef(TmpVectors.Matrix[1]);
            effect.setMatrix("projection", projectionMatrix);
            effect.setMatrix("view", viewMatrix);
            effect.setMatrix("invView", TmpVectors.Matrix[1]);
            effect.setMatrix("invProjectionMatrix", TmpVectors.Matrix[0]);
            effect.setFloat("thickness", this.thickness);
            effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
            effect.setFloat("strength", this.strength);
            effect.setFloat("stepSize", this.step);
            effect.setFloat("maxSteps", this.maxSteps);
            effect.setFloat("roughnessFactor", this.roughnessFactor);
            effect.setFloat("nearPlaneZ", camera.minZ);
            effect.setFloat("farPlaneZ", camera.maxZ);
            effect.setFloat("maxDistance", this.maxDistance);
            effect.setFloat("selfCollisionNumSkip", this.selfCollisionNumSkip);
            effect.setFloat("reflectivityThreshold", this._reflectivityThreshold);
            const textureSize = this._getTextureSize();
            Matrix.ScalingToRef(textureSize.width, textureSize.height, 1, TmpVectors.Matrix[2]);
            projectionMatrix.multiplyToRef(this._scene.getEngine().isWebGPU ? trsWebGPU : trs, TmpVectors.Matrix[3]);
            TmpVectors.Matrix[3].multiplyToRef(TmpVectors.Matrix[2], TmpVectors.Matrix[4]);
            effect.setMatrix("projectionPixel", TmpVectors.Matrix[4]);
            if (this._environmentTexture) {
                effect.setTexture("envCubeSampler", this._environmentTexture);
                if (this._environmentTexture.boundingBoxSize) {
                    effect.setVector3("vReflectionPosition", this._environmentTexture.boundingBoxPosition);
                    effect.setVector3("vReflectionSize", this._environmentTexture.boundingBoxSize);
                }
            }
        };
        this._ssrPostProcess.samples = this.samples;
        if (!this._forceGeometryBuffer) {
            this._ssrPostProcess._prePassEffectConfiguration = new ScreenSpaceReflections2Configuration(this._useScreenspaceDepth);
        }
    }
    _createBlurAndCombinerPostProcesses() {
        const engine = this._scene.getEngine();
        this._blurPostProcessX = new PostProcess("SSRblurX", "screenSpaceReflection2Blur", ["texelOffsetScale"], ["textureSampler"], this._useBlur() ? 1 / (this._ssrDownsample + 1) : 1, null, 2, engine, false, "", this._textureType, undefined, undefined, undefined, undefined, this._scene.getEngine().isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */, (useWebGPU, list) => {
            if (useWebGPU) {
                list.push(import("../../../ShadersWGSL/screenSpaceReflection2Blur.fragment.js"));
            }
            else {
                list.push(import("../../../Shaders/screenSpaceReflection2Blur.fragment.js"));
            }
        });
        this._blurPostProcessX.autoClear = false;
        this._blurPostProcessX.onApplyObservable.add((effect) => {
            const width = this._blurPostProcessX?.inputTexture.width ?? this._scene.getEngine().getRenderWidth();
            effect.setFloat2("texelOffsetScale", this._blurDispersionStrength / width, 0);
        });
        this._blurPostProcessY = new PostProcess("SSRblurY", "screenSpaceReflection2Blur", ["texelOffsetScale"], ["textureSampler"], this._useBlur() ? 1 / (this._blurDownsample + 1) : 1, null, 2, engine, false, "", this._textureType, undefined, undefined, undefined, undefined, this._scene.getEngine().isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */, (useWebGPU, list) => {
            if (useWebGPU) {
                list.push(import("../../../ShadersWGSL/screenSpaceReflection2Blur.fragment.js"));
            }
            else {
                list.push(import("../../../Shaders/screenSpaceReflection2Blur.fragment.js"));
            }
        });
        this._blurPostProcessY.autoClear = false;
        this._blurPostProcessY.onApplyObservable.add((effect) => {
            const height = this._blurPostProcessY?.inputTexture.height ?? this._scene.getEngine().getRenderHeight();
            effect.setFloat2("texelOffsetScale", 0, this._blurDispersionStrength / height);
        });
        const uniformNames = ["strength", "reflectionSpecularFalloffExponent", "reflectivityThreshold"];
        const samplerNames = ["textureSampler", "mainSampler", "reflectivitySampler"];
        let defines = "";
        if (this._debug) {
            defines += "#define SSRAYTRACE_DEBUG\n";
        }
        if (this._inputTextureColorIsInGammaSpace) {
            defines += "#define SSR_INPUT_IS_GAMMA_SPACE\n";
        }
        if (this._generateOutputInGammaSpace) {
            defines += "#define SSR_OUTPUT_IS_GAMMA_SPACE\n";
        }
        if (this.useFresnel) {
            defines += "#define SSR_BLEND_WITH_FRESNEL\n";
            uniformNames.push("projection", "invProjectionMatrix", "nearPlaneZ", "farPlaneZ");
            samplerNames.push("depthSampler", "normalSampler");
        }
        if (this._useScreenspaceDepth) {
            defines += "#define SSRAYTRACE_SCREENSPACE_DEPTH";
        }
        if (this._reflectivityThreshold === 0) {
            defines += "#define SSR_DISABLE_REFLECTIVITY_TEST";
        }
        this._blurCombinerPostProcess = new PostProcess("SSRblurCombiner", "screenSpaceReflection2BlurCombiner", uniformNames, samplerNames, this._useBlur() ? 1 / (this._blurDownsample + 1) : 1, null, 1, engine, false, defines, this._textureType, undefined, undefined, undefined, undefined, this._scene.getEngine().isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */, (useWebGPU, list) => {
            if (useWebGPU) {
                list.push(import("../../../ShadersWGSL/screenSpaceReflection2BlurCombiner.fragment.js"));
            }
            else {
                list.push(import("../../../Shaders/screenSpaceReflection2BlurCombiner.fragment.js"));
            }
        });
        this._blurCombinerPostProcess.autoClear = false;
        this._blurCombinerPostProcess.onApplyObservable.add((effect) => {
            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;
            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }
            if (prePassRenderer && this._scene.activeCamera?._getFirstPostProcess() === this._ssrPostProcess) {
                const renderTarget = prePassRenderer.getRenderTarget();
                if (renderTarget && renderTarget.textures) {
                    effect.setTexture("mainSampler", renderTarget.textures[prePassRenderer.getIndex(4)]);
                }
            }
            else {
                effect.setTextureFromPostProcess("mainSampler", this._ssrPostProcess);
            }
            if (geometryBufferRenderer) {
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
                if (this.useFresnel) {
                    const camera = this._scene.activeCamera;
                    if (camera && this._useScreenspaceDepth) {
                        effect.setFloat("nearPlaneZ", camera.minZ);
                        effect.setFloat("farPlaneZ", camera.maxZ);
                    }
                    effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[1]);
                    if (this._useScreenspaceDepth) {
                        const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
                        effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
                    }
                    else {
                        effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[0]);
                    }
                }
            }
            else if (prePassRenderer) {
                const roughnessIndex = prePassRenderer.getIndex(3);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
                if (this.useFresnel) {
                    const camera = this._scene.activeCamera;
                    if (camera && this._useScreenspaceDepth) {
                        effect.setFloat("nearPlaneZ", camera.minZ);
                        effect.setFloat("farPlaneZ", camera.maxZ);
                    }
                    const depthIndex = prePassRenderer.getIndex(this._useScreenspaceDepth ? 10 : 5);
                    const normalIndex = prePassRenderer.getIndex(6);
                    effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                    effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
                }
            }
            effect.setFloat("strength", this.strength);
            effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
            effect.setFloat("reflectivityThreshold", this._reflectivityThreshold);
            if (this.useFresnel) {
                const camera = this._scene.activeCamera;
                if (camera) {
                    const projectionMatrix = camera.getProjectionMatrix();
                    projectionMatrix.invertToRef(TmpVectors.Matrix[0]);
                    effect.setMatrix("projection", projectionMatrix);
                    effect.setMatrix("invProjectionMatrix", TmpVectors.Matrix[0]);
                }
            }
        });
    }
    /**
     * Serializes the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "SSRRenderingPipeline";
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
        return SerializationHelper.Parse(() => new SSRRenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
    }
}
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "samples", null);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "maxDistance", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "step", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "thickness", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "strength", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "reflectionSpecularFalloffExponent", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "maxSteps", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "roughnessFactor", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "selfCollisionNumSkip", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "_reflectivityThreshold", void 0);
__decorate([
    serialize("_ssrDownsample")
], SSRRenderingPipeline.prototype, "_ssrDownsample", void 0);
__decorate([
    serialize()
], SSRRenderingPipeline.prototype, "ssrDownsample", null);
__decorate([
    serialize("blurDispersionStrength")
], SSRRenderingPipeline.prototype, "_blurDispersionStrength", void 0);
__decorate([
    serialize("blurDownsample")
], SSRRenderingPipeline.prototype, "_blurDownsample", void 0);
__decorate([
    serialize("enableSmoothReflections")
], SSRRenderingPipeline.prototype, "_enableSmoothReflections", void 0);
__decorate([
    serialize("environmentTexture")
], SSRRenderingPipeline.prototype, "_environmentTexture", void 0);
__decorate([
    serialize("environmentTextureIsProbe")
], SSRRenderingPipeline.prototype, "_environmentTextureIsProbe", void 0);
__decorate([
    serialize("attenuateScreenBorders")
], SSRRenderingPipeline.prototype, "_attenuateScreenBorders", void 0);
__decorate([
    serialize("attenuateIntersectionDistance")
], SSRRenderingPipeline.prototype, "_attenuateIntersectionDistance", void 0);
__decorate([
    serialize("attenuateIntersectionIterations")
], SSRRenderingPipeline.prototype, "_attenuateIntersectionIterations", void 0);
__decorate([
    serialize("attenuateFacingCamera")
], SSRRenderingPipeline.prototype, "_attenuateFacingCamera", void 0);
__decorate([
    serialize("attenuateBackfaceReflection")
], SSRRenderingPipeline.prototype, "_attenuateBackfaceReflection", void 0);
__decorate([
    serialize("clipToFrustum")
], SSRRenderingPipeline.prototype, "_clipToFrustum", void 0);
__decorate([
    serialize("useFresnel")
], SSRRenderingPipeline.prototype, "_useFresnel", void 0);
__decorate([
    serialize("enableAutomaticThicknessComputation")
], SSRRenderingPipeline.prototype, "_enableAutomaticThicknessComputation", void 0);
__decorate([
    serialize("backfaceDepthTextureDownsample")
], SSRRenderingPipeline.prototype, "_backfaceDepthTextureDownsample", void 0);
__decorate([
    serialize("backfaceForceDepthWriteTransparentMeshes")
], SSRRenderingPipeline.prototype, "_backfaceForceDepthWriteTransparentMeshes", void 0);
__decorate([
    serialize("isEnabled")
], SSRRenderingPipeline.prototype, "_isEnabled", void 0);
__decorate([
    serialize("inputTextureColorIsInGammaSpace")
], SSRRenderingPipeline.prototype, "_inputTextureColorIsInGammaSpace", void 0);
__decorate([
    serialize("generateOutputInGammaSpace")
], SSRRenderingPipeline.prototype, "_generateOutputInGammaSpace", void 0);
__decorate([
    serialize("debug")
], SSRRenderingPipeline.prototype, "_debug", void 0);
RegisterClass("BABYLON.SSRRenderingPipeline", SSRRenderingPipeline);
//# sourceMappingURL=ssrRenderingPipeline.js.map