
import { EngineStore } from "../../Engines/engineStore.js";
import { Matrix, Vector3, Vector4, Quaternion } from "../../Maths/math.vector.js";
import { Texture } from "../../Materials/Textures/texture.js";
import { Logger } from "../../Misc/logger.js";
import { _IblShadowsVoxelRenderer } from "./iblShadowsVoxelRenderer.js";
import { _IblShadowsVoxelTracingPass } from "./iblShadowsVoxelTracingPass.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";
import { _IblShadowsSpatialBlurPass } from "./iblShadowsSpatialBlurPass.js";
import { _IblShadowsAccumulationPass } from "./iblShadowsAccumulationPass.js";
import { PostProcessRenderPipeline } from "../../PostProcesses/RenderPipeline/postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../../PostProcesses/RenderPipeline/postProcessRenderEffect.js";
import { GeometryBufferRenderer } from "../geometryBufferRenderer.js";
import { RawTexture } from "../../Materials/Textures/rawTexture.js";
import { RawTexture3D } from "../../Materials/Textures/rawTexture3D.js";
import { Engine } from "../../Engines/engine.js";
import { IBLShadowsPluginMaterial } from "./iblShadowsPluginMaterial.js";
import { PBRBaseMaterial } from "../../Materials/PBR/pbrBaseMaterial.js";
import { StandardMaterial } from "../../Materials/standardMaterial.js";
import { Observable } from "../../Misc/observable.js";
/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsRenderPipeline extends PostProcessRenderPipeline {
    /**
     * Reset the shadow accumulation. This has a similar affect to lowering the remanence for a single frame.
     * This is useful when making a sudden change to the IBL.
     */
    resetAccumulation() {
        this._accumulationPass.reset = true;
    }
    /**
     * How dark the shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    get shadowOpacity() {
        return this._shadowOpacity;
    }
    set shadowOpacity(value) {
        this._shadowOpacity = value;
        this._setPluginParameters();
    }
    /**
     * A multiplier for the render size of the shadows. Used for rendering lower-resolution shadows.
     */
    get shadowRenderSizeFactor() {
        return this._renderSizeFactor;
    }
    set shadowRenderSizeFactor(value) {
        this._renderSizeFactor = Math.max(Math.min(value, 1.0), 0.0);
        this._voxelTracingPass.resize(value);
        this._spatialBlurPass.resize(value);
        this._accumulationPass.resize(value);
        this._setPluginParameters();
    }
    /**
     * How dark the voxel shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    get voxelShadowOpacity() {
        return this._voxelTracingPass?.voxelShadowOpacity;
    }
    set voxelShadowOpacity(value) {
        if (!this._voxelTracingPass)
            return;
        this._voxelTracingPass.voxelShadowOpacity = value;
    }
    /**
     * How dark the screen-space shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    get ssShadowOpacity() {
        return this._voxelTracingPass?.ssShadowOpacity;
    }
    set ssShadowOpacity(value) {
        if (!this._voxelTracingPass)
            return;
        this._voxelTracingPass.ssShadowOpacity = value;
    }
    /**
     * The number of samples used in the screen space shadow pass.
     */
    get ssShadowSampleCount() {
        return this._voxelTracingPass?.sssSamples;
    }
    set ssShadowSampleCount(value) {
        if (!this._voxelTracingPass)
            return;
        this._voxelTracingPass.sssSamples = value;
    }
    /**
     * The stride of the screen-space shadow pass. This controls the distance between samples
     * in pixels.
     */
    get ssShadowStride() {
        return this._voxelTracingPass?.sssStride;
    }
    set ssShadowStride(value) {
        if (!this._voxelTracingPass)
            return;
        this._voxelTracingPass.sssStride = value;
    }
    /**
     * A scale for the maximum distance a screen-space shadow can be cast in world-space.
     * The maximum distance that screen-space shadows cast is derived from the voxel size
     * and this value so shouldn't need to change if you scale your scene
     */
    get ssShadowDistanceScale() {
        return this._sssMaxDistScale;
    }
    set ssShadowDistanceScale(value) {
        this._sssMaxDistScale = value;
        this._updateSSShadowParams();
    }
    /**
     * Screen-space shadow thickness scale. This value controls the assumed thickness of
     * on-screen surfaces in world-space. It scales with the size of the shadow-casting
     * region so shouldn't need to change if you scale your scene.
     */
    get ssShadowThicknessScale() {
        return this._sssThicknessScale;
    }
    set ssShadowThicknessScale(value) {
        this._sssThicknessScale = value;
        this._updateSSShadowParams();
    }
    /**
     * Returns the texture containing the voxel grid data
     * @returns The texture containing the voxel grid data
     * @internal
     */
    _getVoxelGridTexture() {
        const tex = this._voxelRenderer?.getVoxelGrid();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture3d;
    }
    /**
     * Returns the noise texture.
     * @returns The noise texture.
     * @internal
     */
    _getNoiseTexture() {
        const tex = this._noiseTexture;
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }
    /**
     * Returns the voxel-tracing texture.
     * @returns The voxel-tracing texture.
     * @internal
     */
    _getVoxelTracingTexture() {
        const tex = this._voxelTracingPass?.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }
    /**
     * Returns the spatial blur texture.
     * @returns The spatial blur texture.
     * @internal
     */
    _getSpatialBlurTexture() {
        const tex = this._spatialBlurPass.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }
    /**
     * Returns the accumulated shadow texture.
     * @returns The accumulated shadow texture.
     * @internal
     */
    _getAccumulatedTexture() {
        const tex = this._accumulationPass?.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }
    /**
     * Turn on or off the debug view of the G-Buffer. This will display only the targets
     * of the g-buffer that are used by the shadow pipeline.
     */
    get gbufferDebugEnabled() {
        return this._gbufferDebugEnabled;
    }
    set gbufferDebugEnabled(enabled) {
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable G-Buffer debug view without setting allowDebugPasses to true.");
            return;
        }
        this._gbufferDebugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._getGBufferDebugPass().name, this.cameras);
        }
        else {
            this._disableEffect(this._getGBufferDebugPass().name, this.cameras);
        }
    }
    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    get cdfDebugEnabled() {
        return this.scene.iblCdfGenerator ? this.scene.iblCdfGenerator.debugEnabled : false;
    }
    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    set cdfDebugEnabled(enabled) {
        if (!this.scene.iblCdfGenerator)
            return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable importance sampling debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this.scene.iblCdfGenerator.debugEnabled)
            return;
        this.scene.iblCdfGenerator.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this.scene.iblCdfGenerator.debugPassName, this.cameras);
        }
        else {
            this._disableEffect(this.scene.iblCdfGenerator.debugPassName, this.cameras);
        }
    }
    /**
     * This displays the voxel grid in slices spread across the screen.
     * It also displays what slices of the model are stored in each layer
     * of the voxel grid. Each red stripe represents one layer while each gradient
     * (from bright red to black) represents the layers rendered in a single draw call.
     */
    get voxelDebugEnabled() {
        return this._voxelRenderer?.voxelDebugEnabled;
    }
    set voxelDebugEnabled(enabled) {
        if (!this._voxelRenderer)
            return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable voxel debug view without setting allowDebugPasses to true.");
            return;
        }
        this._voxelRenderer.voxelDebugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._voxelRenderer.debugPassName, this.cameras);
        }
        else {
            this._disableEffect(this._voxelRenderer.debugPassName, this.cameras);
        }
    }
    /**
     * When using tri-planar voxelization (the default), this value can be used to
     * display only the voxelization result for that axis. z-axis = 0, y-axis = 1, x-axis = 2
     */
    get voxelDebugAxis() {
        return this._voxelRenderer?.voxelDebugAxis;
    }
    set voxelDebugAxis(axisNum) {
        if (!this._voxelRenderer)
            return;
        this._voxelRenderer.voxelDebugAxis = axisNum;
    }
    /**
     * Displays a given mip of the voxel grid. `voxelDebugAxis` must be undefined in this
     * case because we only generate mips for the combined voxel grid.
     */
    set voxelDebugDisplayMip(mipNum) {
        if (!this._voxelRenderer)
            return;
        this._voxelRenderer.setDebugMipNumber(mipNum);
    }
    /**
     * Display the debug view for just the shadow samples taken this frame.
     */
    get voxelTracingDebugEnabled() {
        return this._voxelTracingPass?.debugEnabled;
    }
    set voxelTracingDebugEnabled(enabled) {
        if (!this._voxelTracingPass)
            return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable voxel tracing debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._voxelTracingPass.debugEnabled)
            return;
        this._voxelTracingPass.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._voxelTracingPass.debugPassName, this.cameras);
        }
        else {
            this._disableEffect(this._voxelTracingPass.debugPassName, this.cameras);
        }
    }
    /**
     * Display the debug view for the spatial blur pass
     */
    get spatialBlurPassDebugEnabled() {
        return this._spatialBlurPass.debugEnabled;
    }
    set spatialBlurPassDebugEnabled(enabled) {
        if (!this._spatialBlurPass)
            return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable spatial blur debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._spatialBlurPass.debugEnabled)
            return;
        this._spatialBlurPass.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._spatialBlurPass.debugPassName, this.cameras);
        }
        else {
            this._disableEffect(this._spatialBlurPass.debugPassName, this.cameras);
        }
    }
    /**
     * Display the debug view for the shadows accumulated over time.
     */
    get accumulationPassDebugEnabled() {
        return this._accumulationPass?.debugEnabled;
    }
    set accumulationPassDebugEnabled(enabled) {
        if (!this._accumulationPass)
            return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable accumulation pass debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._accumulationPass.debugEnabled)
            return;
        this._accumulationPass.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._accumulationPass.debugPassName, this.cameras);
        }
        else {
            this._disableEffect(this._accumulationPass.debugPassName, this.cameras);
        }
    }
    /**
     * Add a mesh to be used for shadow-casting in the IBL shadow pipeline.
     * These meshes will be written to the voxel grid.
     * @param mesh A mesh or list of meshes that you want to cast shadows
     */
    addShadowCastingMesh(mesh) {
        if (Array.isArray(mesh)) {
            for (const m of mesh) {
                if (m && this._shadowCastingMeshes.indexOf(m) === -1) {
                    this._shadowCastingMeshes.push(m);
                }
            }
        }
        else {
            if (mesh && this._shadowCastingMeshes.indexOf(mesh) === -1) {
                this._shadowCastingMeshes.push(mesh);
            }
        }
    }
    /**
     * Remove a mesh from the shadow-casting list. The mesh will no longer be written
     * to the voxel grid and will not cast shadows.
     * @param mesh The mesh or list of meshes that you don't want to cast shadows.
     */
    removeShadowCastingMesh(mesh) {
        if (Array.isArray(mesh)) {
            for (const m of mesh) {
                const index = this._shadowCastingMeshes.indexOf(m);
                if (index !== -1) {
                    this._shadowCastingMeshes.splice(index, 1);
                }
            }
        }
        else {
            const index = this._shadowCastingMeshes.indexOf(mesh);
            if (index !== -1) {
                this._shadowCastingMeshes.splice(index, 1);
            }
        }
    }
    /**
     * The exponent of the resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     * The resolution is calculated as 2 to the power of this number.
     */
    get resolutionExp() {
        return this._voxelRenderer.voxelResolutionExp;
    }
    set resolutionExp(newResolution) {
        if (newResolution === this._voxelRenderer.voxelResolutionExp)
            return;
        if (this._voxelRenderer.isVoxelizationInProgress()) {
            Logger.Warn("Can't change the resolution of the voxel grid while voxelization is in progress.");
            return;
        }
        this._voxelRenderer.voxelResolutionExp = Math.max(1, Math.min(newResolution, 8));
        this._accumulationPass.reset = true;
    }
    /**
     * The number of different directions to sample during the voxel tracing pass
     */
    get sampleDirections() {
        return this._voxelTracingPass?.sampleDirections;
    }
    /**
     * The number of different directions to sample during the voxel tracing pass
     */
    set sampleDirections(value) {
        if (!this._voxelTracingPass)
            return;
        this._voxelTracingPass.sampleDirections = value;
    }
    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    get shadowRemanence() {
        return this._accumulationPass?.remanence;
    }
    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    set shadowRemanence(value) {
        if (!this._accumulationPass)
            return;
        this._accumulationPass.remanence = value;
    }
    /**
     * The global Y-axis rotation of the IBL for shadows. This should match the Y-rotation of the environment map applied to materials, skybox, etc.
     */
    get envRotation() {
        return this._voxelTracingPass?.envRotation;
    }
    /**
     * The global Y-axis rotation of the IBL for shadows. This should match the Y-rotation of the environment map applied to materials, skybox, etc.
     */
    set envRotation(value) {
        if (!this._voxelTracingPass)
            return;
        this._voxelTracingPass.envRotation = value;
        this._accumulationPass.reset = true;
    }
    /**
     * Allow debug passes to be enabled. Default is false.
     */
    get allowDebugPasses() {
        return this._allowDebugPasses;
    }
    /**
     * Allow debug passes to be enabled. Default is false.
     */
    set allowDebugPasses(value) {
        if (this._allowDebugPasses === value)
            return;
        this._allowDebugPasses = value;
        if (value && this.scene.iblCdfGenerator) {
            if (this.scene.iblCdfGenerator.isReady()) {
                this._createDebugPasses();
            }
            else {
                this.scene.iblCdfGenerator.onGeneratedObservable.addOnce(() => {
                    this._createDebugPasses();
                });
            }
        }
        else {
            this._disposeDebugPasses();
        }
    }
    /**
     *  Support test.
     */
    static get IsSupported() {
        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }
        return engine._features.supportIBLShadows;
    }
    /**
     * Toggle the shadow tracing on or off
     * @param enabled Toggle the shadow tracing on or off
     */
    toggleShadow(enabled) {
        this._enabled = enabled;
        this._voxelTracingPass.enabled = enabled;
        this._spatialBlurPass.enabled = enabled;
        this._accumulationPass.enabled = enabled;
        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(IBLShadowsPluginMaterial.Name);
                plugin.isEnabled = enabled;
            }
        });
        this._setPluginParameters();
    }
    /**
     * Trigger the scene to be re-voxelized. This should be run when any shadow-casters have been added, removed or moved.
     */
    updateVoxelization() {
        if (this._shadowCastingMeshes.length === 0) {
            Logger.Warn("IBL Shadows: updateVoxelization called with no shadow-casting meshes to voxelize.");
            return;
        }
        this._voxelRenderer.updateVoxelGrid(this._shadowCastingMeshes);
        this._updateSSShadowParams();
    }
    /**
     * Trigger the scene bounds of shadow-casters to be calculated. This is the world size that the voxel grid will cover and will always be a cube.
     */
    updateSceneBounds() {
        const bounds = {
            min: new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
            max: new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE),
        };
        this._shadowCastingMeshes.forEach((mesh) => {
            const localBounds = mesh.getHierarchyBoundingVectors(true);
            bounds.min = Vector3.Minimize(bounds.min, localBounds.min);
            bounds.max = Vector3.Maximize(bounds.max, localBounds.max);
        });
        const size = bounds.max.subtract(bounds.min);
        this.voxelGridSize = Math.max(size.x, size.y, size.z);
        if (this._shadowCastingMeshes.length === 0 || !isFinite(this.voxelGridSize) || this.voxelGridSize === 0) {
            Logger.Warn("IBL Shadows: Scene size is invalid. Can't update bounds.");
            this.voxelGridSize = 1.0;
            return;
        }
        const halfSize = this.voxelGridSize / 2.0;
        const centre = bounds.max.add(bounds.min).multiplyByFloats(-0.5, -0.5, -0.5);
        const invWorldScaleMatrix = Matrix.Compose(new Vector3(1.0 / halfSize, 1.0 / halfSize, 1.0 / halfSize), new Quaternion(), new Vector3(0, 0, 0));
        const invTranslationMatrix = Matrix.Compose(new Vector3(1.0, 1.0, 1.0), new Quaternion(), centre);
        invTranslationMatrix.multiplyToRef(invWorldScaleMatrix, invWorldScaleMatrix);
        this._voxelTracingPass.setWorldScaleMatrix(invWorldScaleMatrix);
        this._voxelRenderer.setWorldScaleMatrix(invWorldScaleMatrix);
        // Set world scale for spatial blur.
        this._spatialBlurPass.setWorldScale(halfSize * 2.0);
        this._updateSSShadowParams();
    }
    /**
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param options Options to configure the pipeline
     * @param cameras Cameras to apply the pipeline to.
     */
    constructor(name, scene, options = {}, cameras) {
        super(scene.getEngine(), name);
        this._allowDebugPasses = false;
        this._debugPasses = [];
        this._shadowCastingMeshes = [];
        this._shadowOpacity = 0.8;
        this._enabled = true;
        this._materialsWithRenderPlugin = [];
        /**
         * Observable that triggers when the shadow renderer is ready
         */
        this.onShadowTextureReadyObservable = new Observable();
        /**
         * Observable that triggers when a new IBL is set and the importance sampling is ready
         */
        this.onNewIblReadyObservable = new Observable();
        /**
         * The current world-space size of that the voxel grid covers in the scene.
         */
        this.voxelGridSize = 1.0;
        this._renderSizeFactor = 1.0;
        this._gbufferDebugEnabled = false;
        this._gBufferDebugSizeParams = new Vector4(0.0, 0.0, 0.0, 0.0);
        this.scene = scene;
        this._cameras = cameras || [scene.activeCamera];
        // Create the dummy textures to be used when the pipeline is not ready
        const blackPixels = new Uint8Array([0, 0, 0, 255]);
        this._dummyTexture2d = new RawTexture(blackPixels, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false);
        this._dummyTexture3d = new RawTexture3D(blackPixels, 1, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false);
        // Setup the geometry buffer target formats
        const textureTypesAndFormats = {};
        textureTypesAndFormats[GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE] = {
            textureFormat: 6,
            textureType: 1,
        };
        textureTypesAndFormats[GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE] = {
            textureFormat: 7,
            textureType: 2,
        };
        textureTypesAndFormats[GeometryBufferRenderer.POSITION_TEXTURE_TYPE] = {
            textureFormat: 5,
            textureType: 2,
        };
        textureTypesAndFormats[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE] = {
            textureFormat: 5,
            textureType: 2,
        };
        const geometryBufferRenderer = scene.enableGeometryBufferRenderer(undefined, 14, textureTypesAndFormats);
        if (!geometryBufferRenderer) {
            Logger.Error("Geometry buffer renderer is required for IBL shadows to work.");
            return;
        }
        this._geometryBufferRenderer = geometryBufferRenderer;
        this._geometryBufferRenderer.enableScreenspaceDepth = true;
        this._geometryBufferRenderer.enableVelocityLinear = true;
        this._geometryBufferRenderer.enablePosition = true;
        this._geometryBufferRenderer.enableNormal = true;
        this._geometryBufferRenderer.generateNormalsInWorldSpace = true;
        this.scene.enableIblCdfGenerator();
        this.shadowOpacity = options.shadowOpacity || 0.8;
        this._voxelRenderer = new _IblShadowsVoxelRenderer(this.scene, this, options ? options.resolutionExp : 6, options.triPlanarVoxelization !== undefined ? options.triPlanarVoxelization : true);
        this._voxelTracingPass = new _IblShadowsVoxelTracingPass(this.scene, this);
        this._spatialBlurPass = new _IblShadowsSpatialBlurPass(this.scene, this);
        this._accumulationPass = new _IblShadowsAccumulationPass(this.scene, this);
        this._accumulationPass.onReadyObservable.addOnce(() => {
            this.onShadowTextureReadyObservable.notifyObservers();
        });
        this.sampleDirections = options.sampleDirections || 2;
        this.voxelShadowOpacity = options.voxelShadowOpacity ?? 1.0;
        this.envRotation = options.envRotation ?? 0.0;
        this.shadowRenderSizeFactor = options.shadowRenderSizeFactor || 1.0;
        this.ssShadowOpacity = options.ssShadowsEnabled === undefined || options.ssShadowsEnabled ? 1.0 : 0.0;
        this.ssShadowDistanceScale = options.ssShadowDistanceScale || 1.25;
        this.ssShadowSampleCount = options.ssShadowSampleCount || 16;
        this.ssShadowStride = options.ssShadowStride || 8;
        this.ssShadowThicknessScale = options.ssShadowThicknessScale || 1.0;
        this.shadowRemanence = options.shadowRemanence ?? 0.75;
        this._noiseTexture = new Texture("https://assets.babylonjs.com/textures/blue_noise/blue_noise_rgb.png", this.scene, false, true, 1);
        scene.postProcessRenderPipelineManager.addPipeline(this);
        this.scene.onActiveCameraChanged.add(this._listenForCameraChanges.bind(this));
        this.scene.onBeforeRenderObservable.add(this._updateBeforeRender.bind(this));
        this._listenForCameraChanges();
        this.scene.getEngine().onResizeObservable.add(this._handleResize.bind(this));
        // Assigning the shadow texture to the materials needs to be done after the RT's are created.
        if (this.scene.iblCdfGenerator) {
            this.scene.iblCdfGenerator.onGeneratedObservable.add(() => {
                this._setPluginParameters();
                this.onNewIblReadyObservable.notifyObservers();
            });
        }
    }
    _handleResize() {
        this._voxelRenderer.resize();
        this._voxelTracingPass.resize(this.shadowRenderSizeFactor);
        this._spatialBlurPass.resize(this.shadowRenderSizeFactor);
        this._accumulationPass.resize(this.shadowRenderSizeFactor);
        this._setPluginParameters();
    }
    _getGBufferDebugPass() {
        if (this._gbufferDebugPass) {
            return this._gbufferDebugPass;
        }
        const isWebGPU = this.engine.isWebGPU;
        const textureNames = ["depthSampler", "normalSampler", "positionSampler", "velocitySampler"];
        const options = {
            width: this.scene.getEngine().getRenderWidth(),
            height: this.scene.getEngine().getRenderHeight(),
            samplingMode: 1,
            engine: this.scene.getEngine(),
            textureType: 0,
            textureFormat: 5,
            uniforms: ["sizeParams"],
            samplers: textureNames,
            reusable: false,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializations: (useWebGPU, list) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/iblShadowGBufferDebug.fragment.js"));
                }
                else {
                    list.push(import("../../Shaders/iblShadowGBufferDebug.fragment.js"));
                }
            },
        };
        this._gbufferDebugPass = new PostProcess("iblShadowGBufferDebug", "iblShadowGBufferDebug", options);
        this._gbufferDebugPass.autoClear = false;
        this._gbufferDebugPass.onApplyObservable.add((effect) => {
            const depthIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
            effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[depthIndex]);
            const normalIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
            effect.setTexture("normalSampler", this._geometryBufferRenderer.getGBuffer().textures[normalIndex]);
            const positionIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
            effect.setTexture("positionSampler", this._geometryBufferRenderer.getGBuffer().textures[positionIndex]);
            const velocityIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE);
            effect.setTexture("velocitySampler", this._geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
            effect.setVector4("sizeParams", this._gBufferDebugSizeParams);
            if (this.scene.activeCamera) {
                effect.setFloat("maxDepth", this.scene.activeCamera.maxZ);
            }
        });
        return this._gbufferDebugPass;
    }
    _createDebugPasses() {
        if (this.scene.iblCdfGenerator) {
            this._debugPasses = [{ pass: this.scene.iblCdfGenerator.getDebugPassPP(), enabled: this.cdfDebugEnabled }];
        }
        else {
            this._debugPasses = [];
        }
        this._debugPasses.push({ pass: this._voxelRenderer.getDebugPassPP(), enabled: this.voxelDebugEnabled }, { pass: this._voxelTracingPass.getDebugPassPP(), enabled: this.voxelTracingDebugEnabled }, { pass: this._spatialBlurPass.getDebugPassPP(), enabled: this.spatialBlurPassDebugEnabled }, { pass: this._accumulationPass.getDebugPassPP(), enabled: this.accumulationPassDebugEnabled }, { pass: this._getGBufferDebugPass(), enabled: this.gbufferDebugEnabled });
        for (let i = 0; i < this._debugPasses.length; i++) {
            if (!this._debugPasses[i].pass)
                continue;
            this.addEffect(new PostProcessRenderEffect(this.scene.getEngine(), this._debugPasses[i].pass.name, () => {
                return this._debugPasses[i].pass;
            }, true));
        }
        const cameras = this.cameras.slice();
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this.name, this.cameras);
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, cameras);
        for (let i = 0; i < this._debugPasses.length; i++) {
            if (!this._debugPasses[i].pass)
                continue;
            if (this._debugPasses[i].enabled) {
                this._enableEffect(this._debugPasses[i].pass.name, this.cameras);
            }
            else {
                this._disableEffect(this._debugPasses[i].pass.name, this.cameras);
            }
        }
    }
    _disposeEffectPasses() {
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this.name, this.cameras);
        this._disposeDebugPasses();
        this._reset();
    }
    _disposeDebugPasses() {
        for (let i = 0; i < this._debugPasses.length; i++) {
            this._disableEffect(this._debugPasses[i].pass.name, this.cameras);
            this._debugPasses[i].pass.dispose();
        }
        this._debugPasses = [];
    }
    _updateDebugPasses() {
        let count = 0;
        if (this._gbufferDebugEnabled)
            count++;
        if (this.cdfDebugEnabled)
            count++;
        if (this.voxelDebugEnabled)
            count++;
        if (this.voxelTracingDebugEnabled)
            count++;
        if (this.spatialBlurPassDebugEnabled)
            count++;
        if (this.accumulationPassDebugEnabled)
            count++;
        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);
        const width = 1.0 / cols;
        const height = 1.0 / rows;
        let x = 0;
        let y = 0;
        if (this.gbufferDebugEnabled) {
            this._gBufferDebugSizeParams.set(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.cdfDebugEnabled && this.scene.iblCdfGenerator) {
            this.scene.iblCdfGenerator.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.voxelDebugEnabled) {
            this._voxelRenderer.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.voxelTracingDebugEnabled) {
            this._voxelTracingPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.spatialBlurPassDebugEnabled) {
            this._spatialBlurPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.accumulationPassDebugEnabled) {
            this._accumulationPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
    }
    /**
     * Update the SS shadow max distance and thickness based on the voxel grid size and resolution.
     * The max distance should be just a little larger than the world size of a single voxel.
     */
    _updateSSShadowParams() {
        this._voxelTracingPass.sssMaxDist = (this._sssMaxDistScale * this.voxelGridSize) / (1 << this.resolutionExp);
        this._voxelTracingPass.sssThickness = this._sssThicknessScale * 0.005 * this.voxelGridSize;
    }
    /**
     * Apply the shadows to a material or array of materials. If no material is provided, all
     * materials in the scene will be added.
     * @param material Material that will be affected by the shadows. If not provided, all materials of the scene will be affected.
     */
    addShadowReceivingMaterial(material) {
        if (material) {
            if (Array.isArray(material)) {
                material.forEach((m) => {
                    this._addShadowSupportToMaterial(m);
                });
            }
            else {
                this._addShadowSupportToMaterial(material);
            }
        }
        else {
            this.scene.materials.forEach((mat) => {
                this._addShadowSupportToMaterial(mat);
            });
        }
    }
    /**
     * Remove a material from the list of materials that receive shadows. If no material
     * is provided, all materials in the scene will be removed.
     * @param material The material or array of materials that will no longer receive shadows
     */
    removeShadowReceivingMaterial(material) {
        if (Array.isArray(material)) {
            material.forEach((m) => {
                const matIndex = this._materialsWithRenderPlugin.indexOf(m);
                if (matIndex !== -1) {
                    this._materialsWithRenderPlugin.splice(matIndex, 1);
                    const plugin = m.pluginManager?.getPlugin(IBLShadowsPluginMaterial.Name);
                    plugin.isEnabled = false;
                }
            });
        }
        else {
            const matIndex = this._materialsWithRenderPlugin.indexOf(material);
            if (matIndex !== -1) {
                this._materialsWithRenderPlugin.splice(matIndex, 1);
                const plugin = material.pluginManager.getPlugin(IBLShadowsPluginMaterial.Name);
                plugin.isEnabled = false;
            }
        }
    }
    _addShadowSupportToMaterial(material) {
        if (!(material instanceof PBRBaseMaterial) && !(material instanceof StandardMaterial)) {
            return;
        }
        let plugin = material.pluginManager?.getPlugin(IBLShadowsPluginMaterial.Name);
        if (!plugin) {
            plugin = new IBLShadowsPluginMaterial(material);
        }
        if (this._materialsWithRenderPlugin.indexOf(material) !== -1) {
            return;
        }
        if (this._enabled) {
            plugin.iblShadowsTexture = this._getAccumulatedTexture().getInternalTexture();
            plugin.shadowOpacity = this.shadowOpacity;
        }
        plugin.isEnabled = this._enabled;
        this._materialsWithRenderPlugin.push(material);
    }
    _setPluginParameters() {
        if (!this._enabled) {
            return;
        }
        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(IBLShadowsPluginMaterial.Name);
                plugin.iblShadowsTexture = this._getAccumulatedTexture().getInternalTexture();
                plugin.shadowOpacity = this.shadowOpacity;
            }
        });
    }
    _updateBeforeRender() {
        this._updateDebugPasses();
    }
    _listenForCameraChanges() {
        // We want to listen for camera changes and change settings while the camera is moving.
        this.scene.activeCamera?.onViewMatrixChangedObservable.add(() => {
            this._accumulationPass.isMoving = true;
        });
    }
    /**
     * Checks if the IBL shadow pipeline is ready to render shadows
     * @returns true if the IBL shadow pipeline is ready to render the shadows
     */
    isReady() {
        return (this._noiseTexture.isReady() &&
            this._voxelRenderer.isReady() &&
            this.scene.iblCdfGenerator &&
            this.scene.iblCdfGenerator.isReady() &&
            (!this._voxelTracingPass || this._voxelTracingPass.isReady()) &&
            (!this._spatialBlurPass || this._spatialBlurPass.isReady()) &&
            (!this._accumulationPass || this._accumulationPass.isReady()));
    }
    /**
     * Get the class name
     * @returns "IBLShadowsRenderPipeline"
     */
    getClassName() {
        return "IBLShadowsRenderPipeline";
    }
    /**
     * Disposes the IBL shadow pipeline and associated resources
     */
    dispose() {
        const materials = this._materialsWithRenderPlugin.splice(0);
        materials.forEach((mat) => {
            this.removeShadowReceivingMaterial(mat);
        });
        this._disposeEffectPasses();
        this._noiseTexture.dispose();
        this._voxelRenderer.dispose();
        this._voxelTracingPass.dispose();
        this._spatialBlurPass.dispose();
        this._accumulationPass.dispose();
        this._dummyTexture2d.dispose();
        this._dummyTexture3d.dispose();
        this.onNewIblReadyObservable.clear();
        this.onShadowTextureReadyObservable.clear();
        super.dispose();
    }
}
//# sourceMappingURL=iblShadowsRenderPipeline.js.map