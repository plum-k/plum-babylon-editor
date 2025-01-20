import { VertexBuffer, Buffer } from "../../Buffers/buffer.js";

import { BindBonesParameters, BindMorphTargetParameters, PrepareAttributesForBakedVertexAnimation, PrepareDefinesAndAttributesForMorphTargets, } from "../../Materials/materialHelper.functions.js";
import { extractMinAndMax } from "../../Maths/math.functions.js";
import { Vector3 } from "../../Maths/math.vector.js";
import "../../Shaders/gpuTransform.vertex.js";
import "../../Shaders/gpuTransform.fragment.js";
/** @internal */
export class TransformFeedbackBoundingHelper {
    /**
     * Creates a new TransformFeedbackBoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine) {
        this._buffers = {};
        this._effects = {};
        this._meshListCounter = 0;
        this._engine = engine;
    }
    /** @internal */
    processAsync(meshes) {
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        this._meshListCounter = 0;
        this._processMeshList(meshes);
        return Promise.resolve();
    }
    _processMeshList(meshes) {
        const parallelShaderCompile = this._engine.getCaps().parallelShaderCompile;
        this._engine.getCaps().parallelShaderCompile = undefined;
        for (let i = 0; i < meshes.length; ++i) {
            const mesh = meshes[i];
            const vertexCount = mesh.getTotalVertices();
            if (vertexCount === 0 || !mesh.getVertexBuffer || !mesh.getVertexBuffer(VertexBuffer.PositionKind)) {
                continue;
            }
            // Get correct effect
            let computeEffect;
            const defines = [];
            const attribs = [VertexBuffer.PositionKind];
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BONETEXTURE " + mesh.skeleton.isUsingTextureForMatrices);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
            }
            else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }
            // Morph
            const numMorphInfluencers = mesh.morphTargetManager
                ? PrepareDefinesAndAttributesForMorphTargets(mesh.morphTargetManager, defines, attribs, mesh, true, // usePositionMorph
                false, // useNormalMorph
                false, // useTangentMorph
                false, // useUVMorph
                false // useUV2Morph
                )
                : 0;
            // Baked Vertex Animation
            const bvaManager = mesh.bakedVertexAnimationManager;
            if (bvaManager && bvaManager.isEnabled) {
                defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
                PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);
            }
            const join = defines.join("\n");
            if (!this._effects[join]) {
                const uniforms = [
                    "boneTextureWidth",
                    "mBones",
                    "morphTargetInfluences",
                    "morphTargetCount",
                    "morphTargetTextureInfo",
                    "morphTargetTextureIndices",
                    "bakedVertexAnimationSettings",
                    "bakedVertexAnimationTextureSizeInverted",
                    "bakedVertexAnimationTime",
                ];
                const samplers = ["boneSampler", "morphTargets", "bakedVertexAnimationTexture"];
                const computeEffectOptions = {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: [],
                    samplers: samplers,
                    defines: join,
                    fallbacks: null,
                    onCompiled: null,
                    onError: null,
                    indexParameters: { maxSimultaneousMorphTargets: numMorphInfluencers },
                    maxSimultaneousLights: 0,
                    transformFeedbackVaryings: ["outPosition"],
                };
                computeEffect = this._engine.createEffect("gpuTransform", computeEffectOptions, this._engine);
                this._effects[join] = computeEffect;
            }
            else {
                computeEffect = this._effects[join];
            }
            this._compute(mesh, computeEffect);
        }
        this._engine.getCaps().parallelShaderCompile = parallelShaderCompile;
    }
    _compute(mesh, effect) {
        const engine = this._engine;
        // Buffer
        let targetBuffer;
        const vertexCount = mesh.getTotalVertices();
        if (!this._buffers[mesh.uniqueId]) {
            const targetData = new Float32Array(vertexCount * 3);
            targetBuffer = new Buffer(mesh.getEngine(), targetData, true, 3);
            this._buffers[mesh.uniqueId] = targetBuffer;
        }
        else {
            targetBuffer = this._buffers[mesh.uniqueId];
        }
        // Bind
        effect.getEngine().enableEffect(effect);
        mesh._bindDirect(effect, null, true);
        // Bones
        BindBonesParameters(mesh, effect);
        // Morph targets
        BindMorphTargetParameters(mesh, effect);
        if (mesh.morphTargetManager && mesh.morphTargetManager.isUsingTextureForTargets) {
            mesh.morphTargetManager._bind(effect);
        }
        // BVA
        const bvaManager = mesh.bakedVertexAnimationManager;
        if (bvaManager && bvaManager.isEnabled) {
            mesh.bakedVertexAnimationManager?.bind(effect, false);
        }
        // Update
        const arrayBuffer = targetBuffer.getData();
        engine.bindTransformFeedbackBuffer(targetBuffer.getBuffer());
        engine.setRasterizerState(false);
        engine.beginTransformFeedback(true);
        engine.drawArraysType(2, 0, vertexCount);
        engine.endTransformFeedback();
        engine.setRasterizerState(true);
        engine.readTransformFeedbackBuffer(arrayBuffer);
        engine.bindTransformFeedbackBuffer(null);
        // Update mesh
        if (this._meshListCounter === 0) {
            mesh._refreshBoundingInfo(arrayBuffer, null);
        }
        else {
            const bb = mesh.getBoundingInfo().boundingBox;
            const extend = extractMinAndMax(arrayBuffer, 0, vertexCount);
            TransformFeedbackBoundingHelper._Min.copyFrom(bb.minimum).minimizeInPlace(extend.minimum);
            TransformFeedbackBoundingHelper._Max.copyFrom(bb.maximum).maximizeInPlace(extend.maximum);
            mesh._refreshBoundingInfoDirect({ minimum: TransformFeedbackBoundingHelper._Min, maximum: TransformFeedbackBoundingHelper._Max });
        }
    }
    /** @internal */
    registerMeshListAsync(meshes) {
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        this._meshList = meshes;
        this._meshListCounter = 0;
        return Promise.resolve();
    }
    /** @internal */
    processMeshList() {
        if (this._meshList.length === 0) {
            return;
        }
        this._processMeshList(this._meshList);
        this._meshListCounter++;
    }
    /** @internal */
    fetchResultsForMeshListAsync() {
        this._meshListCounter = 0;
        return Promise.resolve();
    }
    /** @internal */
    dispose() {
        for (const key in this._buffers) {
            this._buffers[key].dispose();
        }
        this._buffers = {};
        this._effects = {};
        this._engine = null;
    }
}
TransformFeedbackBoundingHelper._Min = new Vector3();
TransformFeedbackBoundingHelper._Max = new Vector3();
//# sourceMappingURL=transformFeedbackBoundingHelper.js.map