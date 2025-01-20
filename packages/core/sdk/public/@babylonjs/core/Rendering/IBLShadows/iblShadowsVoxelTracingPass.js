
import { Matrix, Vector4 } from "../../Maths/math.vector.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";
import { GeometryBufferRenderer } from "../../Rendering/geometryBufferRenderer.js";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture.js";
/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsVoxelTracingPass {
    /**
     * The opacity of the shadow cast from the voxel grid
     */
    get voxelShadowOpacity() {
        return this._voxelShadowOpacity;
    }
    /**
     * The opacity of the shadow cast from the voxel grid
     */
    set voxelShadowOpacity(value) {
        this._voxelShadowOpacity = value;
    }
    /**
     * The opacity of the screen-space shadow
     */
    get ssShadowOpacity() {
        return this._ssShadowOpacity;
    }
    /**
     * The opacity of the screen-space shadow
     */
    set ssShadowOpacity(value) {
        this._ssShadowOpacity = value;
    }
    /**
     * The number of samples used in the screen space shadow pass.
     */
    get sssSamples() {
        return this._sssSamples;
    }
    /**
     * The number of samples used in the screen space shadow pass.
     */
    set sssSamples(value) {
        this._sssSamples = value;
    }
    /**
     * The stride used in the screen space shadow pass. This controls the distance between samples.
     */
    get sssStride() {
        return this._sssStride;
    }
    /**
     * The stride used in the screen space shadow pass. This controls the distance between samples.
     */
    set sssStride(value) {
        this._sssStride = value;
    }
    /**
     * The maximum distance that the screen-space shadow will be able to occlude.
     */
    get sssMaxDist() {
        return this._sssMaxDist;
    }
    /**
     * The maximum distance that the screen-space shadow will be able to occlude.
     */
    set sssMaxDist(value) {
        this._sssMaxDist = value;
    }
    /**
     * The thickness of the screen-space shadow
     */
    get sssThickness() {
        return this._sssThickness;
    }
    /**
     * The thickness of the screen-space shadow
     */
    set sssThickness(value) {
        this._sssThickness = value;
    }
    /**
     * The bias to apply to the voxel sampling in the direction of the surface normal of the geometry.
     */
    get voxelNormalBias() {
        return this._voxelNormalBias;
    }
    set voxelNormalBias(value) {
        this._voxelNormalBias = value;
    }
    /**
     * The bias to apply to the voxel sampling in the direction of the light.
     */
    get voxelDirectionBias() {
        return this._voxelDirectionBias;
    }
    set voxelDirectionBias(value) {
        this._voxelDirectionBias = value;
    }
    /**
     * The number of directions to sample for the voxel tracing.
     */
    get sampleDirections() {
        return this._sampleDirections;
    }
    /**
     * The number of directions to sample for the voxel tracing.
     */
    set sampleDirections(value) {
        this._sampleDirections = value;
    }
    /**
     * The current rotation of the environment map, in radians.
     */
    get envRotation() {
        return this._envRotation;
    }
    /**
     * The current rotation of the environment map, in radians.
     */
    set envRotation(value) {
        this._envRotation = value;
    }
    /**
     * Returns the output texture of the pass.
     * @returns The output texture.
     */
    getOutputTexture() {
        return this._outputTexture;
    }
    /**
     * Gets the debug pass post process. This will create the resources for the pass
     * if they don't already exist.
     * @returns The post process
     */
    getDebugPassPP() {
        if (!this._debugPassPP) {
            this._createDebugPass();
        }
        return this._debugPassPP;
    }
    /**
     * The name of the debug pass
     */
    get debugPassName() {
        return this._debugPassName;
    }
    /**
     * Set the matrix to use for scaling the world space to voxel space
     * @param matrix The matrix to use for scaling the world space to voxel space
     */
    setWorldScaleMatrix(matrix) {
        this._invWorldScaleMatrix = matrix;
    }
    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    setDebugDisplayParams(x, y, widthScale, heightScale) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    /**
     * Creates the debug post process effect for this pass
     */
    _createDebugPass() {
        const isWebGPU = this._engine.isWebGPU;
        if (!this._debugPassPP) {
            const debugOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                uniforms: ["sizeParams"],
                samplers: ["debugSampler"],
                engine: this._engine,
                reusable: true,
                shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
                extraInitializations: (useWebGPU, list) => {
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblShadowDebug.fragment.js"));
                    }
                    else {
                        list.push(import("../../Shaders/iblShadowDebug.fragment.js"));
                    }
                },
            };
            this._debugPassPP = new PostProcess(this.debugPassName, "iblShadowDebug", debugOptions);
            this._debugPassPP.autoClear = false;
            this._debugPassPP.onApplyObservable.add((effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTexture("debugSampler", this._outputTexture);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }
    /**
     * Instantiates the shadow voxel-tracing pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The shadow voxel-tracing pass
     */
    constructor(scene, iblShadowsRenderPipeline) {
        this._voxelShadowOpacity = 1.0;
        this._sssSamples = 16;
        this._sssStride = 8;
        this._sssMaxDist = 0.05;
        this._sssThickness = 0.5;
        this._ssShadowOpacity = 1.0;
        this._cameraInvView = Matrix.Identity();
        this._cameraInvProj = Matrix.Identity();
        this._invWorldScaleMatrix = Matrix.Identity();
        this._frameId = 0;
        this._sampleDirections = 4;
        this._shadowParameters = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._sssParameters = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._opacityParameters = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._voxelBiasParameters = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._voxelNormalBias = 1.4;
        this._voxelDirectionBias = 1.75;
        /**
         * Is the effect enabled
         */
        this.enabled = true;
        /** Enable the debug view for this pass */
        this.debugEnabled = false;
        this._debugPassName = "Voxel Tracing Debug Pass";
        /** The default rotation of the environment map will align the shadows with the default lighting orientation */
        this._envRotation = 0.0;
        this._debugVoxelMarchEnabled = false;
        this._debugSizeParams = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }
    _createTextures() {
        let defines = "";
        if (this._scene.useRightHandedSystem) {
            defines += "#define RIGHT_HANDED\n";
        }
        if (this._debugVoxelMarchEnabled) {
            defines += "#define VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION 1u\n";
        }
        const isWebGPU = this._engine.isWebGPU;
        const textureOptions = {
            type: 0,
            format: 5,
            samplingMode: 1,
            generateDepthBuffer: false,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowVoxelTracing.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/iblShadowVoxelTracing.fragment.js")]);
                }
            },
        };
        this._outputTexture = new ProceduralTexture("voxelTracingPass", {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
        }, "iblShadowVoxelTracing", this._scene, textureOptions);
        this._outputTexture.refreshRate = -1;
        this._outputTexture.autoClear = false;
        this._outputTexture.defines = defines;
        // Need to set all the textures first so that the effect gets created with the proper uniforms.
        this._setBindings(this._scene.activeCamera);
        let counter = 0;
        this._scene.onBeforeRenderObservable.add(() => {
            counter = 0;
        });
        this._scene.onAfterRenderTargetsRenderObservable.add(() => {
            if (++counter == 2) {
                if (this.enabled && this._outputTexture.isReady()) {
                    this._setBindings(this._scene.activeCamera);
                    this._outputTexture.render();
                }
            }
        });
    }
    _setBindings(camera) {
        if (this._scene.useRightHandedSystem) {
            this._outputTexture.defines = "#define RIGHT_HANDED\n";
        }
        this._outputTexture.setMatrix("viewMtx", camera.getViewMatrix());
        this._outputTexture.setMatrix("projMtx", camera.getProjectionMatrix());
        camera.getProjectionMatrix().invertToRef(this._cameraInvProj);
        camera.getViewMatrix().invertToRef(this._cameraInvView);
        this._outputTexture.setMatrix("invProjMtx", this._cameraInvProj);
        this._outputTexture.setMatrix("invViewMtx", this._cameraInvView);
        this._outputTexture.setMatrix("wsNormalizationMtx", this._invWorldScaleMatrix);
        this._frameId++;
        let rotation = 0.0;
        if (this._scene.environmentTexture) {
            rotation = this._scene.environmentTexture.rotationY ?? 0;
        }
        rotation = this._scene.useRightHandedSystem ? -(rotation + 0.5 * Math.PI) : rotation - 0.5 * Math.PI;
        rotation = rotation % (2.0 * Math.PI);
        this._shadowParameters.set(this._sampleDirections, this._frameId, 1.0, rotation);
        this._outputTexture.setVector4("shadowParameters", this._shadowParameters);
        const voxelGrid = this._renderPipeline._getVoxelGridTexture();
        const highestMip = Math.floor(Math.log2(voxelGrid.getSize().width));
        this._voxelBiasParameters.set(this._voxelNormalBias, this._voxelDirectionBias, highestMip, 0.0);
        this._outputTexture.setVector4("voxelBiasParameters", this._voxelBiasParameters);
        // SSS Options.
        this._sssParameters.set(this._sssSamples, this._sssStride, this._sssMaxDist, this._sssThickness);
        this._outputTexture.setVector4("sssParameters", this._sssParameters);
        this._opacityParameters.set(this._voxelShadowOpacity, this._ssShadowOpacity, 0.0, 0.0);
        this._outputTexture.setVector4("shadowOpacity", this._opacityParameters);
        this._outputTexture.setTexture("voxelGridSampler", voxelGrid);
        this._outputTexture.setTexture("blueNoiseSampler", this._renderPipeline._getNoiseTexture());
        const cdfGenerator = this._scene.iblCdfGenerator;
        if (cdfGenerator) {
            this._outputTexture.setTexture("icdfSampler", cdfGenerator.getIcdfTexture());
        }
        if (this._debugVoxelMarchEnabled) {
            this._outputTexture.defines += "#define VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION 1u\n";
        }
        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        if (!geometryBufferRenderer) {
            return;
        }
        const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
        this._outputTexture.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
        const wnormalIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
        this._outputTexture.setTexture("worldNormalSampler", geometryBufferRenderer.getGBuffer().textures[wnormalIndex]);
    }
    /**
     * Called by render pipeline when canvas resized.
     * @param scaleFactor The factor by which to scale the canvas size.
     */
    resize(scaleFactor = 1.0) {
        const newSize = {
            width: Math.max(1.0, Math.floor(this._engine.getRenderWidth() * scaleFactor)),
            height: Math.max(1.0, Math.floor(this._engine.getRenderHeight() * scaleFactor)),
        };
        this._outputTexture.resize(newSize, false);
    }
    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    isReady() {
        return (this._outputTexture.isReady() &&
            !(this._debugPassPP && !this._debugPassPP.isReady()) &&
            this._scene.iblCdfGenerator &&
            this._scene.iblCdfGenerator.getIcdfTexture().isReady() &&
            this._renderPipeline._getVoxelGridTexture().isReady());
    }
    /**
     * Disposes the associated resources
     */
    dispose() {
        this._outputTexture.dispose();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
//# sourceMappingURL=iblShadowsVoxelTracingPass.js.map