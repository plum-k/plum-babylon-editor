import { Observable } from "../Misc/observable.js";
import { Color4 } from "../Maths/math.color.js";
import { EngineStore } from "../Engines/engineStore.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { EffectWrapper } from "../Materials/effectRenderer.js";
import { Material } from "../Materials/material.js";

import { EffectFallbacks } from "../Materials/effectFallbacks.js";
import { DrawWrapper } from "../Materials/drawWrapper.js";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper.js";
import { BindMorphTargetParameters, PrepareDefinesAndAttributesForMorphTargets, PushAttributesForInstances } from "../Materials/materialHelper.functions.js";
import { ObjectRenderer } from "../Rendering/objectRenderer.js";
import { Engine } from "../Engines/engine.js";
/**
 * Special Glow Blur post process only blurring the alpha channel
 * It enforces keeping the most luminous color in the color channel.
 * @internal
 */
export class ThinGlowBlurPostProcess extends EffectWrapper {
    constructor(name, engine = null, direction, kernel, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinGlowBlurPostProcess.FragmentUrl,
            uniforms: ThinGlowBlurPostProcess.Uniforms,
        });
        this.direction = direction;
        this.kernel = kernel;
        this.textureWidth = 0;
        this.textureHeight = 0;
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/glowBlurPostProcess.fragment.js"));
        }
        else {
            list.push(import("../Shaders/glowBlurPostProcess.fragment.js"));
        }
        super._gatherImports(useWebGPU, list);
    }
    bind() {
        super.bind();
        this._drawWrapper.effect.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        this._drawWrapper.effect.setVector2("direction", this.direction);
        this._drawWrapper.effect.setFloat("blurWidth", this.kernel);
    }
}
/**
 * The fragment shader url
 */
ThinGlowBlurPostProcess.FragmentUrl = "glowBlurPostProcess";
/**
 * The list of uniforms used by the effect
 */
ThinGlowBlurPostProcess.Uniforms = ["screenSize", "direction", "blurWidth"];
/**
 * @internal
 */
export class ThinEffectLayer {
    /**
     * Gets/sets the camera attached to the layer.
     */
    get camera() {
        return this._options.camera;
    }
    set camera(camera) {
        this._options.camera = camera;
    }
    /**
     * Gets the rendering group id the layer should render in.
     */
    get renderingGroupId() {
        return this._options.renderingGroupId;
    }
    set renderingGroupId(renderingGroupId) {
        this._options.renderingGroupId = renderingGroupId;
    }
    /**
     * Gets the object renderer used to render objects in the layer
     */
    get objectRenderer() {
        return this._objectRenderer;
    }
    /**
     * Gets the shader language used in this material.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Sets a specific material to be used to render a mesh/a list of meshes in the layer
     * @param mesh mesh or array of meshes
     * @param material material to use by the layer when rendering the mesh(es). If undefined is passed, the specific material created by the layer will be used.
     */
    setMaterialForRendering(mesh, material) {
        this._objectRenderer.setMaterialForRendering(mesh, material);
        if (Array.isArray(mesh)) {
            for (let i = 0; i < mesh.length; ++i) {
                const currentMesh = mesh[i];
                if (!material) {
                    delete this._materialForRendering[currentMesh.uniqueId];
                }
                else {
                    this._materialForRendering[currentMesh.uniqueId] = [currentMesh, material];
                }
            }
        }
        else {
            if (!material) {
                delete this._materialForRendering[mesh.uniqueId];
            }
            else {
                this._materialForRendering[mesh.uniqueId] = [mesh, material];
            }
        }
    }
    /**
     * Gets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to get the effect intensity for
     * @returns The intensity of the effect for the mesh
     */
    getEffectIntensity(mesh) {
        return this._effectIntensity[mesh.uniqueId] ?? 1;
    }
    /**
     * Sets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to set the effect intensity for
     * @param intensity The intensity of the effect for the mesh
     */
    setEffectIntensity(mesh, intensity) {
        this._effectIntensity[mesh.uniqueId] = intensity;
    }
    /**
     * Instantiates a new effect Layer
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     * @param _additionalImportShadersAsync Additional shaders to import when the layer is created
     */
    constructor(name, scene, forceGLSL = false, dontCheckIfReady = false, _additionalImportShadersAsync) {
        this._additionalImportShadersAsync = _additionalImportShadersAsync;
        this._vertexBuffers = {};
        this._dontCheckIfReady = false;
        /** @internal */
        this._shouldRender = true;
        /** @internal */
        this._emissiveTextureAndColor = { texture: null, color: new Color4() };
        /** @internal */
        this._effectIntensity = {};
        /** @internal */
        this._postProcesses = [];
        /**
         * The clear color of the texture used to generate the glow map.
         */
        this.neutralColor = new Color4();
        /**
         * Specifies whether the effect layer is enabled or not.
         */
        this.isEnabled = true;
        /**
         * Specifies if the bounding boxes should be rendered normally or if they should undergo the effect of the layer
         */
        this.disableBoundingBoxesFromEffectLayer = false;
        /**
         * An event triggered when the effect layer has been disposed.
         */
        this.onDisposeObservable = new Observable();
        /**
         * An event triggered when the effect layer is about rendering the main texture with the glowy parts.
         */
        this.onBeforeRenderLayerObservable = new Observable();
        /**
         * An event triggered when the generated texture is being merged in the scene.
         */
        this.onBeforeComposeObservable = new Observable();
        /**
         * An event triggered when the mesh is rendered into the effect render target.
         */
        this.onBeforeRenderMeshToEffect = new Observable();
        /**
         * An event triggered after the mesh has been rendered into the effect render target.
         */
        this.onAfterRenderMeshToEffect = new Observable();
        /**
         * An event triggered when the generated texture has been merged in the scene.
         */
        this.onAfterComposeObservable = new Observable();
        /**
         * An event triggered when the layer is being blurred.
         */
        this.onBeforeBlurObservable = new Observable();
        /**
         * An event triggered when the layer has been blurred.
         */
        this.onAfterBlurObservable = new Observable();
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._materialForRendering = {};
        /** @internal */
        this._shadersLoaded = false;
        this.name = name;
        this._scene = scene || EngineStore.LastCreatedScene;
        this._dontCheckIfReady = dontCheckIfReady;
        const engine = this._scene.getEngine();
        if (engine.isWebGPU && !forceGLSL && !ThinEffectLayer.ForceGLSL) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
        this._engine = this._scene.getEngine();
        this._mergeDrawWrapper = [];
        // Generate Buffers
        this._generateIndexBuffer();
        this._generateVertexBuffer();
    }
    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    getEffectName() {
        return "";
    }
    /**
     * Checks for the readiness of the element composing the layer.
     * @param _subMesh the mesh to check for
     * @param _useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    isReady(_subMesh, _useInstances) {
        return true;
    }
    /**
     * Returns whether or not the layer needs stencil enabled during the mesh rendering.
     * @returns true if the effect requires stencil during the main canvas render pass.
     */
    needStencil() {
        return false;
    }
    /** @internal */
    _createMergeEffect() {
        throw new Error("Effect Layer: no merge effect defined");
    }
    /** @internal */
    _createTextureAndPostProcesses() { }
    /** @internal */
    _internalCompose(_effect, _renderIndex) { }
    /** @internal */
    _setEmissiveTextureAndColor(_mesh, _subMesh, _material) { }
    /** @internal */
    _numInternalDraws() {
        return 1;
    }
    /** @internal */
    _init(options) {
        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            mainTextureFixedSize: 0,
            mainTextureType: 0,
            alphaBlendingMode: 2,
            camera: null,
            renderingGroupId: -1,
            ...options,
        };
        this._createObjectRenderer();
    }
    _generateIndexBuffer() {
        // Indices
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);
        indices.push(0);
        indices.push(2);
        indices.push(3);
        this._indexBuffer = this._engine.createIndexBuffer(indices);
    }
    _generateVertexBuffer() {
        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);
        const vertexBuffer = new VertexBuffer(this._engine, vertices, VertexBuffer.PositionKind, false, false, 2);
        this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;
    }
    _createObjectRenderer() {
        this._objectRenderer = new ObjectRenderer(`ObjectRenderer for thin effect layer ${this.name}`, this._scene, {
            doNotChangeAspectRatio: true,
        });
        this._objectRenderer.activeCamera = this._options.camera;
        this._objectRenderer.renderParticles = false;
        this._objectRenderer.renderList = null;
        // Prevent package size in es6 (getBoundingBoxRenderer might not be present)
        const hasBoundingBoxRenderer = !!this._scene.getBoundingBoxRenderer;
        let boundingBoxRendererEnabled = false;
        if (hasBoundingBoxRenderer) {
            this._objectRenderer.onBeforeRenderObservable.add(() => {
                boundingBoxRendererEnabled = this._scene.getBoundingBoxRenderer().enabled;
                this._scene.getBoundingBoxRenderer().enabled = !this.disableBoundingBoxesFromEffectLayer && boundingBoxRendererEnabled;
            });
            this._objectRenderer.onAfterRenderObservable.add(() => {
                this._scene.getBoundingBoxRenderer().enabled = boundingBoxRendererEnabled;
            });
        }
        this._objectRenderer.customIsReadyFunction = (mesh, refreshRate, preWarm) => {
            if ((preWarm || refreshRate === 0) && mesh.subMeshes) {
                for (let i = 0; i < mesh.subMeshes.length; ++i) {
                    const subMesh = mesh.subMeshes[i];
                    const material = subMesh.getMaterial();
                    const renderingMesh = subMesh.getRenderingMesh();
                    if (!material) {
                        continue;
                    }
                    const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
                    const hardwareInstancedRendering = batch.hardwareInstancedRendering[subMesh._id] || renderingMesh.hasThinInstances;
                    this._setEmissiveTextureAndColor(renderingMesh, subMesh, material);
                    if (!this._isSubMeshReady(subMesh, hardwareInstancedRendering, this._emissiveTextureAndColor.texture)) {
                        return false;
                    }
                }
            }
            return true;
        };
        // Custom render function
        this._objectRenderer.customRenderFunction = (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes) => {
            this.onBeforeRenderLayerObservable.notifyObservers(this);
            let index;
            const engine = this._scene.getEngine();
            if (depthOnlySubMeshes.length) {
                engine.setColorWrite(false);
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    this._renderSubMesh(depthOnlySubMeshes.data[index]);
                }
                engine.setColorWrite(true);
            }
            for (index = 0; index < opaqueSubMeshes.length; index++) {
                this._renderSubMesh(opaqueSubMeshes.data[index]);
            }
            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                this._renderSubMesh(alphaTestSubMeshes.data[index]);
            }
            const previousAlphaMode = engine.getAlphaMode();
            for (index = 0; index < transparentSubMeshes.length; index++) {
                const subMesh = transparentSubMeshes.data[index];
                const material = subMesh.getMaterial();
                if (material && material.needDepthPrePass) {
                    const engine = material.getScene().getEngine();
                    engine.setColorWrite(false);
                    this._renderSubMesh(subMesh);
                    engine.setColorWrite(true);
                }
                this._renderSubMesh(subMesh, true);
            }
            engine.setAlphaMode(previousAlphaMode);
        };
    }
    /** @internal */
    _addCustomEffectDefines(_defines) { }
    /** @internal */
    _internalIsSubMeshReady(subMesh, useInstances, emissiveTexture) {
        const engine = this._scene.getEngine();
        const mesh = subMesh.getMesh();
        const renderingMaterial = mesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];
        if (renderingMaterial) {
            return renderingMaterial.isReadyForSubMesh(mesh, subMesh, useInstances);
        }
        const material = subMesh.getMaterial();
        if (!material) {
            return false;
        }
        if (this._useMeshMaterial(subMesh.getRenderingMesh())) {
            return material.isReadyForSubMesh(subMesh.getMesh(), subMesh, useInstances);
        }
        const defines = [];
        const attribs = [VertexBuffer.PositionKind];
        let uv1 = false;
        let uv2 = false;
        // Diffuse
        if (material) {
            const needAlphaTest = material.needAlphaTesting();
            const diffuseTexture = material.getAlphaTestTexture();
            const needAlphaBlendFromDiffuse = diffuseTexture && diffuseTexture.hasAlpha && (material.useAlphaFromDiffuseTexture || material._useAlphaFromAlbedoTexture);
            if (diffuseTexture && (needAlphaTest || needAlphaBlendFromDiffuse)) {
                defines.push("#define DIFFUSE");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) && diffuseTexture.coordinatesIndex === 1) {
                    defines.push("#define DIFFUSEUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define DIFFUSEUV1");
                    uv1 = true;
                }
                if (needAlphaTest) {
                    defines.push("#define ALPHATEST");
                    defines.push("#define ALPHATESTVALUE 0.4");
                }
                if (!diffuseTexture.gammaSpace) {
                    defines.push("#define DIFFUSE_ISLINEAR");
                }
            }
            const opacityTexture = material.opacityTexture;
            if (opacityTexture) {
                defines.push("#define OPACITY");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) && opacityTexture.coordinatesIndex === 1) {
                    defines.push("#define OPACITYUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define OPACITYUV1");
                    uv1 = true;
                }
            }
        }
        // Emissive
        if (emissiveTexture) {
            defines.push("#define EMISSIVE");
            if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) && emissiveTexture.coordinatesIndex === 1) {
                defines.push("#define EMISSIVEUV2");
                uv2 = true;
            }
            else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                defines.push("#define EMISSIVEUV1");
                uv1 = true;
            }
            if (!emissiveTexture.gammaSpace) {
                defines.push("#define EMISSIVE_ISLINEAR");
            }
        }
        // Vertex
        if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && mesh.hasVertexAlpha && material.transparencyMode !== Material.MATERIAL_OPAQUE) {
            attribs.push(VertexBuffer.ColorKind);
            defines.push("#define VERTEXALPHA");
        }
        if (uv1) {
            attribs.push(VertexBuffer.UVKind);
            defines.push("#define UV1");
        }
        if (uv2) {
            attribs.push(VertexBuffer.UV2Kind);
            defines.push("#define UV2");
        }
        // Bones
        const fallbacks = new EffectFallbacks();
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            const skeleton = mesh.skeleton;
            if (skeleton && skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            }
            else {
                defines.push("#define BonesPerMesh " + (skeleton ? skeleton.bones.length + 1 : 0));
            }
            if (mesh.numBoneInfluencers > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
        }
        else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }
        // Morph targets
        const numMorphInfluencers = mesh.morphTargetManager
            ? PrepareDefinesAndAttributesForMorphTargets(mesh.morphTargetManager, defines, attribs, mesh, true, // usePositionMorph
            false, // useNormalMorph
            false, // useTangentMorph
            uv1, // useUVMorph
            uv2 // useUV2Morph
            )
            : 0;
        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }
        // ClipPlanes
        prepareStringDefinesForClipPlanes(material, this._scene, defines);
        this._addCustomEffectDefines(defines);
        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(undefined, true);
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            const uniforms = [
                "world",
                "mBones",
                "viewProjection",
                "glowColor",
                "morphTargetInfluences",
                "morphTargetCount",
                "boneTextureWidth",
                "diffuseMatrix",
                "emissiveMatrix",
                "opacityMatrix",
                "opacityIntensity",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
                "glowIntensity",
            ];
            addClipPlaneUniforms(uniforms);
            drawWrapper.setEffect(this._engine.createEffect("glowMapGeneration", attribs, uniforms, ["diffuseSampler", "emissiveSampler", "opacitySampler", "boneSampler", "morphTargets"], join, fallbacks, undefined, undefined, { maxSimultaneousMorphTargets: numMorphInfluencers }, this._shaderLanguage, this._shadersLoaded
                ? undefined
                : async () => {
                    await this._importShadersAsync();
                    this._shadersLoaded = true;
                }), join);
        }
        const effectIsReady = drawWrapper.effect.isReady();
        return effectIsReady && (this._dontCheckIfReady || (!this._dontCheckIfReady && this.isLayerReady()));
    }
    /** @internal */
    _isSubMeshReady(subMesh, useInstances, emissiveTexture) {
        return this._internalIsSubMeshReady(subMesh, useInstances, emissiveTexture);
    }
    async _importShadersAsync() {
        if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([import("../ShadersWGSL/glowMapGeneration.vertex.js"), import("../ShadersWGSL/glowMapGeneration.fragment.js")]);
        }
        else {
            await Promise.all([import("../Shaders/glowMapGeneration.vertex.js"), import("../Shaders/glowMapGeneration.fragment.js")]);
        }
        this._additionalImportShadersAsync?.();
    }
    /** @internal */
    _internalIsLayerReady() {
        let isReady = true;
        for (let i = 0; i < this._postProcesses.length; i++) {
            isReady = this._postProcesses[i].isReady() && isReady;
        }
        const numDraws = this._numInternalDraws();
        for (let i = 0; i < numDraws; ++i) {
            let currentEffect = this._mergeDrawWrapper[i];
            if (!currentEffect) {
                currentEffect = this._mergeDrawWrapper[i] = new DrawWrapper(this._engine);
                currentEffect.setEffect(this._createMergeEffect());
            }
            isReady = currentEffect.effect.isReady() && isReady;
        }
        return isReady;
    }
    /**
     * Checks if the layer is ready to be used.
     * @returns true if the layer is ready to be used
     */
    isLayerReady() {
        return this._internalIsLayerReady();
    }
    /**
     * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
     * @returns true if the rendering was successful
     */
    compose() {
        if (!this._dontCheckIfReady && !this.isLayerReady()) {
            return false;
        }
        const engine = this._scene.getEngine();
        const numDraws = this._numInternalDraws();
        this.onBeforeComposeObservable.notifyObservers(this);
        const previousAlphaMode = engine.getAlphaMode();
        for (let i = 0; i < numDraws; ++i) {
            const currentEffect = this._mergeDrawWrapper[i];
            // Render
            engine.enableEffect(currentEffect);
            engine.setState(false);
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect.effect);
            // Go Blend.
            engine.setAlphaMode(this._options.alphaBlendingMode);
            // Blends the map on the main canvas.
            this._internalCompose(currentEffect.effect, i);
        }
        // Restore Alpha
        engine.setAlphaMode(previousAlphaMode);
        this.onAfterComposeObservable.notifyObservers(this);
        return true;
    }
    /** @internal */
    _internalHasMesh(mesh) {
        if (this.renderingGroupId === -1 || mesh.renderingGroupId === this.renderingGroupId) {
            return true;
        }
        return false;
    }
    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    hasMesh(mesh) {
        return this._internalHasMesh(mesh);
    }
    /** @internal */
    _internalShouldRender() {
        return this.isEnabled && this._shouldRender;
    }
    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    shouldRender() {
        return this._internalShouldRender();
    }
    /** @internal */
    _shouldRenderMesh(_mesh) {
        return true;
    }
    /** @internal */
    _internalCanRenderMesh(mesh, material) {
        return !material.needAlphaBlendingForMesh(mesh);
    }
    /** @internal */
    _canRenderMesh(mesh, material) {
        return this._internalCanRenderMesh(mesh, material);
    }
    _renderSubMesh(subMesh, enableAlphaMode = false) {
        if (!this._internalShouldRender()) {
            return;
        }
        const material = subMesh.getMaterial();
        const ownerMesh = subMesh.getMesh();
        const replacementMesh = subMesh.getReplacementMesh();
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = subMesh.getEffectiveMesh();
        const scene = this._scene;
        const engine = scene.getEngine();
        effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;
        if (!material) {
            return;
        }
        // Do not block in blend mode.
        if (!this._canRenderMesh(renderingMesh, material)) {
            return;
        }
        // Culling
        let sideOrientation = material._getEffectiveOrientation(renderingMesh);
        const mainDeterminant = effectiveMesh._getWorldMatrixDeterminant();
        if (mainDeterminant < 0) {
            sideOrientation = sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        }
        const reverse = sideOrientation === Material.ClockWiseSideOrientation;
        engine.setState(material.backFaceCulling, material.zOffset, undefined, reverse, material.cullBackFaces, undefined, material.zOffsetUnits);
        // Managing instances
        const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!replacementMesh);
        if (batch.mustReturn) {
            return;
        }
        // Early Exit per mesh
        if (!this._shouldRenderMesh(renderingMesh)) {
            return;
        }
        const hardwareInstancedRendering = batch.hardwareInstancedRendering[subMesh._id] || renderingMesh.hasThinInstances;
        this._setEmissiveTextureAndColor(renderingMesh, subMesh, material);
        this.onBeforeRenderMeshToEffect.notifyObservers(ownerMesh);
        if (this._useMeshMaterial(renderingMesh)) {
            subMesh.getMaterial()._glowModeEnabled = true;
            renderingMesh.render(subMesh, enableAlphaMode, replacementMesh || undefined);
            subMesh.getMaterial()._glowModeEnabled = false;
        }
        else if (this._isSubMeshReady(subMesh, hardwareInstancedRendering, this._emissiveTextureAndColor.texture)) {
            const renderingMaterial = effectiveMesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];
            let drawWrapper = subMesh._getDrawWrapper();
            if (!drawWrapper && renderingMaterial) {
                drawWrapper = renderingMaterial._getDrawWrapper();
            }
            if (!drawWrapper) {
                return;
            }
            const effect = drawWrapper.effect;
            engine.enableEffect(drawWrapper);
            if (!hardwareInstancedRendering) {
                renderingMesh._bind(subMesh, effect, material.fillMode);
            }
            if (!renderingMaterial) {
                effect.setMatrix("viewProjection", scene.getTransformMatrix());
                effect.setMatrix("world", effectiveMesh.getWorldMatrix());
                effect.setFloat4("glowColor", this._emissiveTextureAndColor.color.r, this._emissiveTextureAndColor.color.g, this._emissiveTextureAndColor.color.b, this._emissiveTextureAndColor.color.a);
            }
            else {
                renderingMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), effectiveMesh, subMesh);
            }
            if (!renderingMaterial) {
                const needAlphaTest = material.needAlphaTesting();
                const diffuseTexture = material.getAlphaTestTexture();
                const needAlphaBlendFromDiffuse = diffuseTexture && diffuseTexture.hasAlpha && (material.useAlphaFromDiffuseTexture || material._useAlphaFromAlbedoTexture);
                if (diffuseTexture && (needAlphaTest || needAlphaBlendFromDiffuse)) {
                    effect.setTexture("diffuseSampler", diffuseTexture);
                    const textureMatrix = diffuseTexture.getTextureMatrix();
                    if (textureMatrix) {
                        effect.setMatrix("diffuseMatrix", textureMatrix);
                    }
                }
                const opacityTexture = material.opacityTexture;
                if (opacityTexture) {
                    effect.setTexture("opacitySampler", opacityTexture);
                    effect.setFloat("opacityIntensity", opacityTexture.level);
                    const textureMatrix = opacityTexture.getTextureMatrix();
                    if (textureMatrix) {
                        effect.setMatrix("opacityMatrix", textureMatrix);
                    }
                }
                // Glow emissive only
                if (this._emissiveTextureAndColor.texture) {
                    effect.setTexture("emissiveSampler", this._emissiveTextureAndColor.texture);
                    effect.setMatrix("emissiveMatrix", this._emissiveTextureAndColor.texture.getTextureMatrix());
                }
                // Bones
                if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                    const skeleton = renderingMesh.skeleton;
                    if (skeleton.isUsingTextureForMatrices) {
                        const boneTexture = skeleton.getTransformMatrixTexture(renderingMesh);
                        if (!boneTexture) {
                            return;
                        }
                        effect.setTexture("boneSampler", boneTexture);
                        effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                    }
                    else {
                        effect.setMatrices("mBones", skeleton.getTransformMatrices(renderingMesh));
                    }
                }
                // Morph targets
                BindMorphTargetParameters(renderingMesh, effect);
                if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                    renderingMesh.morphTargetManager._bind(effect);
                }
                // Alpha mode
                if (enableAlphaMode) {
                    engine.setAlphaMode(material.alphaMode);
                }
                // Intensity of effect
                effect.setFloat("glowIntensity", this.getEffectIntensity(renderingMesh));
                // Clip planes
                bindClipPlane(effect, material, scene);
            }
            // Draw
            renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) => effect.setMatrix("world", world));
        }
        else {
            // Need to reset refresh rate of the main map
            this._objectRenderer.resetRefreshCounter();
        }
        this.onAfterRenderMeshToEffect.notifyObservers(ownerMesh);
    }
    /** @internal */
    _useMeshMaterial(_mesh) {
        return false;
    }
    /** @internal */
    _rebuild() {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vb) {
            vb._rebuild();
        }
        this._generateIndexBuffer();
    }
    /**
     * Dispose the effect layer and free resources.
     */
    dispose() {
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }
        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
        for (const drawWrapper of this._mergeDrawWrapper) {
            drawWrapper.dispose();
        }
        this._mergeDrawWrapper = [];
        this._objectRenderer.dispose();
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this.onBeforeRenderLayerObservable.clear();
        this.onBeforeComposeObservable.clear();
        this.onBeforeRenderMeshToEffect.clear();
        this.onAfterRenderMeshToEffect.clear();
        this.onAfterComposeObservable.clear();
    }
}
/**
 * Force all the effect layers to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
ThinEffectLayer.ForceGLSL = false;
//# sourceMappingURL=thinEffectLayer.js.map