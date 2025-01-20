import { Color4 } from "../Maths/math.color.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
import { Camera } from "../Cameras/camera.js";

import "../Shaders/depth.fragment.js";
import "../Shaders/depth.vertex.js";
import { _WarnImport } from "../Misc/devTools.js";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindMorphTargetParameters, PrepareDefinesAndAttributesForMorphTargets, PushAttributesForInstances } from "../Materials/materialHelper.functions.js";
import { EffectFallbacks } from "../Materials/effectFallbacks.js";
/**
 * This represents a depth renderer in Babylon.
 * A depth renderer will render to it's depth map every frame which can be displayed or used in post processing
 */
export class DepthRenderer {
    /**
     * Gets the shader language used in this material.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Sets a specific material to be used to render a mesh/a list of meshes by the depth renderer
     * @param mesh mesh or array of meshes
     * @param material material to use by the depth render when rendering the mesh(es). If undefined is passed, the specific material created by the depth renderer will be used.
     */
    setMaterialForRendering(mesh, material) {
        this._depthMap.setMaterialForRendering(mesh, material);
    }
    /**
     * Instantiates a depth renderer
     * @param scene The scene the renderer belongs to
     * @param type The texture type of the depth map (default: Engine.TEXTURETYPE_FLOAT)
     * @param camera The camera to be used to render the depth map (default: scene's active camera)
     * @param storeNonLinearDepth Defines whether the depth is stored linearly like in Babylon Shadows or directly like glFragCoord.z
     * @param samplingMode The sampling mode to be used with the render target (Linear, Nearest...) (default: TRILINEAR_SAMPLINGMODE)
     * @param storeCameraSpaceZ Defines whether the depth stored is the Z coordinate in camera space. If true, storeNonLinearDepth has no effect. (Default: false)
     * @param name Name of the render target (default: DepthRenderer)
     */
    constructor(scene, type = 1, camera = null, storeNonLinearDepth = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, storeCameraSpaceZ = false, name) {
        /** Shader language used by the material */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        /** Enable or disable the depth renderer. When disabled, the depth texture is not updated */
        this.enabled = true;
        /** Force writing the transparent objects into the depth map */
        this.forceDepthWriteTransparentMeshes = false;
        /**
         * Specifies that the depth renderer will only be used within
         * the camera it is created for.
         * This can help forcing its rendering during the camera processing.
         */
        this.useOnlyInActiveCamera = false;
        /** If true, reverse the culling of materials before writing to the depth texture.
         * So, basically, when "true", back facing instead of front facing faces are rasterized into the texture
         */
        this.reverseCulling = false;
        this._shadersLoaded = false;
        this._scene = scene;
        this._storeNonLinearDepth = storeNonLinearDepth;
        this._storeCameraSpaceZ = storeCameraSpaceZ;
        this.isPacked = type === 0;
        if (this.isPacked) {
            this.clearColor = new Color4(1.0, 1.0, 1.0, 1.0);
        }
        else {
            this.clearColor = new Color4(storeCameraSpaceZ ? 1e8 : 1.0, 0.0, 0.0, 1.0);
        }
        this._initShaderSourceAsync();
        DepthRenderer._SceneComponentInitialization(this._scene);
        const engine = scene.getEngine();
        this._camera = camera;
        if (samplingMode !== Texture.NEAREST_SAMPLINGMODE) {
            if (type === 1 && !engine._caps.textureFloatLinearFiltering) {
                samplingMode = Texture.NEAREST_SAMPLINGMODE;
            }
            if (type === 2 && !engine._caps.textureHalfFloatLinearFiltering) {
                samplingMode = Texture.NEAREST_SAMPLINGMODE;
            }
        }
        // Render target
        const format = this.isPacked || !engine._features.supportExtendedTextureFormats ? 5 : 6;
        this._depthMap = new RenderTargetTexture(name ?? "DepthRenderer", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, this._scene, false, true, type, false, samplingMode, undefined, undefined, undefined, format);
        this._depthMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._depthMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._depthMap.refreshRate = 1;
        this._depthMap.renderParticles = false;
        this._depthMap.renderList = null;
        this._depthMap.noPrePassRenderer = true;
        // Camera to get depth map from to support multiple concurrent cameras
        this._depthMap.activeCamera = this._camera;
        this._depthMap.ignoreCameraViewport = true;
        this._depthMap.useCameraPostProcesses = false;
        // set default depth value to 1.0 (far away)
        this._depthMap.onClearObservable.add((engine) => {
            engine.clear(this.clearColor, true, true, true);
        });
        this._depthMap.onBeforeBindObservable.add(() => {
            engine._debugPushGroup?.("depth renderer", 1);
        });
        this._depthMap.onAfterUnbindObservable.add(() => {
            engine._debugPopGroup?.(1);
        });
        this._depthMap.customIsReadyFunction = (mesh, refreshRate, preWarm) => {
            if ((preWarm || refreshRate === 0) && mesh.subMeshes) {
                for (let i = 0; i < mesh.subMeshes.length; ++i) {
                    const subMesh = mesh.subMeshes[i];
                    const renderingMesh = subMesh.getRenderingMesh();
                    const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
                    const hardwareInstancedRendering = engine.getCaps().instancedArrays &&
                        ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || renderingMesh.hasThinInstances);
                    if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                        return false;
                    }
                }
            }
            return true;
        };
        // Custom render function
        const renderSubMesh = (subMesh) => {
            const renderingMesh = subMesh.getRenderingMesh();
            const effectiveMesh = subMesh.getEffectiveMesh();
            const scene = this._scene;
            const engine = scene.getEngine();
            const material = subMesh.getMaterial();
            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;
            if (!material || effectiveMesh.infiniteDistance || material.disableDepthWrite || subMesh.verticesCount === 0 || subMesh._renderId === scene.getRenderId()) {
                return;
            }
            // Culling
            const detNeg = effectiveMesh._getWorldMatrixDeterminant() < 0;
            let sideOrientation = material._getEffectiveOrientation(renderingMesh);
            if (detNeg) {
                sideOrientation =
                    sideOrientation === 0
                        ? 1
                        : 0;
            }
            const reverseSideOrientation = sideOrientation === 0;
            engine.setState(material.backFaceCulling, 0, false, reverseSideOrientation, this.reverseCulling ? !material.cullBackFaces : material.cullBackFaces);
            // Managing instances
            const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
            if (batch.mustReturn) {
                return;
            }
            const hardwareInstancedRendering = engine.getCaps().instancedArrays &&
                ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || renderingMesh.hasThinInstances);
            const camera = this._camera || scene.activeCamera;
            if (this.isReady(subMesh, hardwareInstancedRendering) && camera) {
                subMesh._renderId = scene.getRenderId();
                const renderingMaterial = effectiveMesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];
                let drawWrapper = subMesh._getDrawWrapper();
                if (!drawWrapper && renderingMaterial) {
                    drawWrapper = renderingMaterial._getDrawWrapper();
                }
                const cameraIsOrtho = camera.mode === Camera.ORTHOGRAPHIC_CAMERA;
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
                    if (this._storeCameraSpaceZ) {
                        effect.setMatrix("view", scene.getViewMatrix());
                    }
                }
                else {
                    renderingMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), effectiveMesh, subMesh);
                }
                let minZ, maxZ;
                if (cameraIsOrtho) {
                    minZ = !engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                    maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                }
                else {
                    minZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? camera.minZ : engine.isNDCHalfZRange ? 0 : camera.minZ;
                    maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : camera.maxZ;
                }
                effect.setFloat2("depthValues", minZ, minZ + maxZ);
                if (!renderingMaterial) {
                    // Alpha test
                    if (material.needAlphaTesting()) {
                        const alphaTexture = material.getAlphaTestTexture();
                        if (alphaTexture) {
                            effect.setTexture("diffuseSampler", alphaTexture);
                            effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                    }
                    // Bones
                    BindBonesParameters(renderingMesh, effect);
                    // Clip planes
                    bindClipPlane(effect, material, scene);
                    // Morph targets
                    BindMorphTargetParameters(renderingMesh, effect);
                    if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                        renderingMesh.morphTargetManager._bind(effect);
                    }
                    // Baked vertex animations
                    const bvaManager = subMesh.getMesh().bakedVertexAnimationManager;
                    if (bvaManager && bvaManager.isEnabled) {
                        bvaManager.bind(effect, hardwareInstancedRendering);
                    }
                    // Points cloud rendering
                    if (material.pointsCloud) {
                        effect.setFloat("pointSize", material.pointSize);
                    }
                }
                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) => effect.setMatrix("world", world));
            }
        };
        this._depthMap.customRenderFunction = (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes) => {
            let index;
            if (depthOnlySubMeshes.length) {
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    renderSubMesh(depthOnlySubMeshes.data[index]);
                }
            }
            for (index = 0; index < opaqueSubMeshes.length; index++) {
                renderSubMesh(opaqueSubMeshes.data[index]);
            }
            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderSubMesh(alphaTestSubMeshes.data[index]);
            }
            if (this.forceDepthWriteTransparentMeshes) {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            }
            else {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    transparentSubMeshes.data[index].getEffectiveMesh()._internalAbstractMeshDataInfo._isActiveIntermediate = false;
                }
            }
        };
    }
    async _initShaderSourceAsync(forceGLSL = false) {
        const engine = this._scene.getEngine();
        if (engine.isWebGPU && !forceGLSL && !DepthRenderer.ForceGLSL) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
            await Promise.all([import("../ShadersWGSL/depth.vertex.js"), import("../ShadersWGSL/depth.fragment.js")]);
        }
        else {
            await Promise.all([import("../Shaders/depth.vertex.js"), import("../Shaders/depth.fragment.js")]);
        }
        this._shadersLoaded = true;
    }
    /**
     * Creates the depth rendering effect and checks if the effect is ready.
     * @param subMesh The submesh to be used to render the depth map of
     * @param useInstances If multiple world instances should be used
     * @returns if the depth renderer is ready to render the depth map
     */
    isReady(subMesh, useInstances) {
        if (!this._shadersLoaded) {
            return false;
        }
        const engine = this._scene.getEngine();
        const mesh = subMesh.getMesh();
        const scene = mesh.getScene();
        const renderingMaterial = mesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];
        if (renderingMaterial) {
            return renderingMaterial.isReadyForSubMesh(mesh, subMesh, useInstances);
        }
        const material = subMesh.getMaterial();
        if (!material || material.disableDepthWrite) {
            return false;
        }
        const defines = [];
        const attribs = [VertexBuffer.PositionKind];
        let uv1 = false;
        let uv2 = false;
        // Alpha test
        if (material.needAlphaTesting() && material.getAlphaTestTexture()) {
            defines.push("#define ALPHATEST");
            if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                attribs.push(VertexBuffer.UVKind);
                defines.push("#define UV1");
                uv1 = true;
            }
            if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                attribs.push(VertexBuffer.UV2Kind);
                defines.push("#define UV2");
                uv2 = true;
            }
        }
        // Bones
        const fallbacks = new EffectFallbacks();
        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            if (mesh.numBoneInfluencers > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
            const skeleton = mesh.skeleton;
            if (skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            }
            else {
                defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));
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
        // Points cloud rendering
        if (material.pointsCloud) {
            defines.push("#define POINTSIZE");
        }
        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }
        // Baked vertex animations
        const bvaManager = mesh.bakedVertexAnimationManager;
        if (bvaManager && bvaManager.isEnabled) {
            defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
            if (useInstances) {
                attribs.push("bakedVertexAnimationSettingsInstanced");
            }
        }
        // None linear depth
        if (this._storeNonLinearDepth) {
            defines.push("#define NONLINEARDEPTH");
        }
        // Store camera space Z coordinate instead of NDC Z
        if (this._storeCameraSpaceZ) {
            defines.push("#define STORE_CAMERASPACE_Z");
        }
        // Float Mode
        if (this.isPacked) {
            defines.push("#define PACKED");
        }
        // Clip planes
        prepareStringDefinesForClipPlanes(material, scene, defines);
        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(undefined, true);
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            const uniforms = [
                "world",
                "mBones",
                "boneTextureWidth",
                "pointSize",
                "viewProjection",
                "view",
                "diffuseMatrix",
                "depthValues",
                "morphTargetInfluences",
                "morphTargetCount",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
                "bakedVertexAnimationSettings",
                "bakedVertexAnimationTextureSizeInverted",
                "bakedVertexAnimationTime",
                "bakedVertexAnimationTexture",
            ];
            const samplers = ["diffuseSampler", "morphTargets", "boneSampler", "bakedVertexAnimationTexture"];
            addClipPlaneUniforms(uniforms);
            drawWrapper.setEffect(engine.createEffect("depth", {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: [],
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: null,
                onError: null,
                indexParameters: { maxSimultaneousMorphTargets: numMorphInfluencers },
                shaderLanguage: this._shaderLanguage,
            }, engine));
        }
        return drawWrapper.effect.isReady();
    }
    /**
     * Gets the texture which the depth map will be written to.
     * @returns The depth map texture
     */
    getDepthMap() {
        return this._depthMap;
    }
    /**
     * Disposes of the depth renderer.
     */
    dispose() {
        const keysToDelete = [];
        for (const key in this._scene._depthRenderer) {
            const depthRenderer = this._scene._depthRenderer[key];
            if (depthRenderer === this) {
                keysToDelete.push(key);
            }
        }
        if (keysToDelete.length > 0) {
            this._depthMap.dispose();
            for (const key of keysToDelete) {
                delete this._scene._depthRenderer[key];
            }
        }
    }
}
/**
 * Force all the depth renderer to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
DepthRenderer.ForceGLSL = false;
/**
 * @internal
 */
DepthRenderer._SceneComponentInitialization = (_) => {
    throw _WarnImport("DepthRendererSceneComponent");
};
//# sourceMappingURL=depthRenderer.js.map