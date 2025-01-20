import { VertexBuffer } from "../Buffers/buffer.js";
import { Mesh } from "../Meshes/mesh.js";
import { Scene } from "../scene.js";

import { SceneComponentConstants } from "../sceneComponent.js";
import { DrawWrapper } from "../Materials/drawWrapper.js";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindMorphTargetParameters, PrepareDefinesAndAttributesForMorphTargets, PushAttributesForInstances } from "../Materials/materialHelper.functions.js";
import { EffectFallbacks } from "../Materials/effectFallbacks.js";
/**
 * Gets the outline renderer associated with the scene
 * @returns a OutlineRenderer
 */
Scene.prototype.getOutlineRenderer = function () {
    if (!this._outlineRenderer) {
        this._outlineRenderer = new OutlineRenderer(this);
    }
    return this._outlineRenderer;
};
Object.defineProperty(Mesh.prototype, "renderOutline", {
    get: function () {
        return this._renderOutline;
    },
    set: function (value) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOutline = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(Mesh.prototype, "renderOverlay", {
    get: function () {
        return this._renderOverlay;
    },
    set: function (value) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOverlay = value;
    },
    enumerable: true,
    configurable: true,
});
/**
 * This class is responsible to draw the outline/overlay of meshes.
 * It should not be used directly but through the available method on mesh.
 */
export class OutlineRenderer {
    /**
     * Gets the shader language used in the Outline renderer.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Instantiates a new outline renderer. (There could be only one per scene).
     * @param scene Defines the scene it belongs to
     */
    constructor(scene) {
        /**
         * The name of the component. Each component must have a unique name.
         */
        this.name = SceneComponentConstants.NAME_OUTLINERENDERER;
        /**
         * Defines a zOffset default Factor to prevent zFighting between the overlay and the mesh.
         */
        this.zOffset = 1;
        /**
         * Defines a zOffset default Unit to prevent zFighting between the overlay and the mesh.
         */
        this.zOffsetUnits = 4; // 4 to account for projection a bit by default
        /** Shader language used by the Outline renderer. */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this.scene = scene;
        this._engine = scene.getEngine();
        this.scene._addComponent(this);
        this._passIdForDrawWrapper = [];
        for (let i = 0; i < 4; ++i) {
            this._passIdForDrawWrapper[i] = this._engine.createRenderPassId(`Outline Renderer (${i})`);
        }
        const engine = this._engine;
        if (engine.isWebGPU) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
    }
    /**
     * Register the component to one instance of a scene.
     */
    register() {
        this.scene._beforeRenderingMeshStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERINGMESH_OUTLINE, this, this._beforeRenderingMesh);
        this.scene._afterRenderingMeshStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGMESH_OUTLINE, this, this._afterRenderingMesh);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        // Nothing to do here.
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        for (let i = 0; i < this._passIdForDrawWrapper.length; ++i) {
            this._engine.releaseRenderPassId(this._passIdForDrawWrapper[i]);
        }
    }
    /**
     * Renders the outline in the canvas.
     * @param subMesh Defines the sumesh to render
     * @param batch Defines the batch of meshes in case of instances
     * @param useOverlay Defines if the rendering is for the overlay or the outline
     * @param renderPassId Render pass id to use to render the mesh
     */
    render(subMesh, batch, useOverlay = false, renderPassId) {
        renderPassId = renderPassId ?? this._passIdForDrawWrapper[0];
        const scene = this.scene;
        const engine = scene.getEngine();
        const hardwareInstancedRendering = engine.getCaps().instancedArrays &&
            ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || subMesh.getRenderingMesh().hasThinInstances);
        if (!this.isReady(subMesh, hardwareInstancedRendering, renderPassId)) {
            return;
        }
        const ownerMesh = subMesh.getMesh();
        const replacementMesh = ownerMesh._internalAbstractMeshDataInfo._actAsRegularMesh ? ownerMesh : null;
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = replacementMesh ? replacementMesh : renderingMesh;
        const material = subMesh.getMaterial();
        if (!material || !scene.activeCamera) {
            return;
        }
        const drawWrapper = subMesh._getDrawWrapper(renderPassId);
        const effect = DrawWrapper.GetEffect(drawWrapper);
        engine.enableEffect(drawWrapper);
        // Logarithmic depth
        if (material.useLogarithmicDepth) {
            effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
        }
        effect.setFloat("offset", useOverlay ? 0 : renderingMesh.outlineWidth);
        effect.setColor4("color", useOverlay ? renderingMesh.overlayColor : renderingMesh.outlineColor, useOverlay ? renderingMesh.overlayAlpha : material.alpha);
        effect.setMatrix("viewProjection", scene.getTransformMatrix());
        effect.setMatrix("world", effectiveMesh.getWorldMatrix());
        // Bones
        BindBonesParameters(renderingMesh, effect);
        // Morph targets
        BindMorphTargetParameters(renderingMesh, effect);
        if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
            renderingMesh.morphTargetManager._bind(effect);
        }
        if (!hardwareInstancedRendering) {
            renderingMesh._bind(subMesh, effect, material.fillMode);
        }
        // Baked vertex animations
        const bvaManager = subMesh.getMesh().bakedVertexAnimationManager;
        if (bvaManager && bvaManager.isEnabled) {
            bvaManager.bind(effect, hardwareInstancedRendering);
        }
        // Alpha test
        if (material && material.needAlphaTesting()) {
            const alphaTexture = material.getAlphaTestTexture();
            if (alphaTexture) {
                effect.setTexture("diffuseSampler", alphaTexture);
                effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
            }
        }
        // Clip plane
        bindClipPlane(effect, material, scene);
        engine.setZOffset(-this.zOffset);
        engine.setZOffsetUnits(-this.zOffsetUnits);
        renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) => {
            effect.setMatrix("world", world);
        });
        engine.setZOffset(0);
        engine.setZOffsetUnits(0);
    }
    /**
     * Returns whether or not the outline renderer is ready for a given submesh.
     * All the dependencies e.g. submeshes, texture, effect... mus be ready
     * @param subMesh Defines the submesh to check readiness for
     * @param useInstances Defines whether wee are trying to render instances or not
     * @param renderPassId Render pass id to use to render the mesh
     * @returns true if ready otherwise false
     */
    isReady(subMesh, useInstances, renderPassId) {
        renderPassId = renderPassId ?? this._passIdForDrawWrapper[0];
        const defines = [];
        const attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];
        const mesh = subMesh.getMesh();
        const material = subMesh.getMaterial();
        if (!material) {
            return false;
        }
        const scene = mesh.getScene();
        let uv1 = false;
        let uv2 = false;
        // Alpha test
        if (material.needAlphaTesting()) {
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
        //Logarithmic depth
        if (material.useLogarithmicDepth) {
            defines.push("#define LOGARITHMICDEPTH");
        }
        // Clip planes
        prepareStringDefinesForClipPlanes(material, scene, defines);
        // Bones
        const fallbacks = new EffectFallbacks();
        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            const skeleton = mesh.skeleton;
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            if (mesh.numBoneInfluencers > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
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
            true, // useNormalMorph
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
        // Baked vertex animations
        const bvaManager = mesh.bakedVertexAnimationManager;
        if (bvaManager && bvaManager.isEnabled) {
            defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
            if (useInstances) {
                attribs.push("bakedVertexAnimationSettingsInstanced");
            }
        }
        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(renderPassId, true);
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            const uniforms = [
                "world",
                "mBones",
                "viewProjection",
                "diffuseMatrix",
                "offset",
                "color",
                "logarithmicDepthConstant",
                "morphTargetInfluences",
                "boneTextureWidth",
                "morphTargetCount",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
                "bakedVertexAnimationSettings",
                "bakedVertexAnimationTextureSizeInverted",
                "bakedVertexAnimationTime",
                "bakedVertexAnimationTexture",
            ];
            const samplers = ["diffuseSampler", "boneSampler", "morphTargets", "bakedVertexAnimationTexture"];
            addClipPlaneUniforms(uniforms);
            drawWrapper.setEffect(this.scene.getEngine().createEffect("outline", {
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
                extraInitializationsAsync: async () => {
                    if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                        await Promise.all([import("../ShadersWGSL/outline.fragment.js"), import("../ShadersWGSL/outline.vertex.js")]);
                    }
                    else {
                        await Promise.all([import("../Shaders/outline.fragment.js"), import("../Shaders/outline.vertex.js")]);
                    }
                },
            }, this.scene.getEngine()), join);
        }
        return drawWrapper.effect.isReady();
    }
    _beforeRenderingMesh(mesh, subMesh, batch) {
        // Outline - step 1
        this._savedDepthWrite = this._engine.getDepthWrite();
        if (mesh.renderOutline) {
            const material = subMesh.getMaterial();
            if (material && material.needAlphaBlendingForMesh(mesh)) {
                this._engine.cacheStencilState();
                // Draw only to stencil buffer for the original mesh
                // The resulting stencil buffer will be used so the outline is not visible inside the mesh when the mesh is transparent
                this._engine.setDepthWrite(false);
                this._engine.setColorWrite(false);
                this._engine.setStencilBuffer(true);
                this._engine.setStencilOperationPass(7681);
                this._engine.setStencilFunction(519);
                this._engine.setStencilMask(OutlineRenderer._StencilReference);
                this._engine.setStencilFunctionReference(OutlineRenderer._StencilReference);
                this._engine.stencilStateComposer.useStencilGlobalOnly = true;
                this.render(subMesh, batch, /* This sets offset to 0 */ true, this._passIdForDrawWrapper[1]);
                this._engine.setColorWrite(true);
                this._engine.setStencilFunction(517);
            }
            // Draw the outline using the above stencil if needed to avoid drawing within the mesh
            this._engine.setDepthWrite(false);
            this.render(subMesh, batch, false, this._passIdForDrawWrapper[0]);
            this._engine.setDepthWrite(this._savedDepthWrite);
            if (material && material.needAlphaBlendingForMesh(mesh)) {
                this._engine.stencilStateComposer.useStencilGlobalOnly = false;
                this._engine.restoreStencilState();
            }
        }
    }
    _afterRenderingMesh(mesh, subMesh, batch) {
        // Overlay
        if (mesh.renderOverlay) {
            const currentMode = this._engine.getAlphaMode();
            const alphaBlendState = this._engine.alphaState.alphaBlend;
            this._engine.setAlphaMode(2);
            this.render(subMesh, batch, true, this._passIdForDrawWrapper[3]);
            this._engine.setAlphaMode(currentMode);
            this._engine.setDepthWrite(this._savedDepthWrite);
            this._engine.alphaState.alphaBlend = alphaBlendState;
        }
        // Outline - step 2
        if (mesh.renderOutline && this._savedDepthWrite) {
            this._engine.setDepthWrite(true);
            this._engine.setColorWrite(false);
            this.render(subMesh, batch, false, this._passIdForDrawWrapper[2]);
            this._engine.setColorWrite(true);
        }
    }
}
/**
 * Stencil value used to avoid outline being seen within the mesh when the mesh is transparent
 */
OutlineRenderer._StencilReference = 0x04;
//# sourceMappingURL=outlineRenderer.js.map