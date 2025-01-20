import { ComputeShader } from "../../Compute/computeShader.js";
import { StorageBuffer } from "../../Buffers/storageBuffer.js";
import { VertexBuffer } from "../../Buffers/buffer.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { UniformBuffer } from "../../Materials/uniformBuffer.js";
import "../../ShadersWGSL/boundingInfo.compute.js";
import { _retryWithInterval } from "../../Misc/timingTools.js";
/** @internal */
export class ComputeShaderBoundingHelper {
    /**
     * Creates a new ComputeShaderBoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine) {
        this._computeShadersCache = {};
        this._positionBuffers = {};
        this._indexBuffers = {};
        this._weightBuffers = {};
        this._indexExtraBuffers = {};
        this._weightExtraBuffers = {};
        this._morphTargetInfluenceBuffers = {};
        this._morphTargetTextureIndexBuffers = {};
        this._ubos = [];
        this._uboIndex = 0;
        this._processedMeshes = [];
        this._computeShaders = [];
        this._uniqueComputeShaders = new Set();
        this._resultBuffers = [];
        this._engine = engine;
    }
    _getComputeShader(defines, hasBones, hasMorphs) {
        let computeShader;
        const join = defines.join("\n");
        if (!this._computeShadersCache[join]) {
            const bindingsMapping = {
                positionBuffer: { group: 0, binding: 0 },
                resultBuffer: { group: 0, binding: 1 },
                settings: { group: 0, binding: 7 },
            };
            if (hasBones) {
                bindingsMapping.boneSampler = { group: 0, binding: 2 };
                bindingsMapping.indexBuffer = { group: 0, binding: 3 };
                bindingsMapping.weightBuffer = { group: 0, binding: 4 };
                bindingsMapping.indexExtraBuffer = { group: 0, binding: 5 };
                bindingsMapping.weightExtraBuffer = { group: 0, binding: 6 };
            }
            if (hasMorphs) {
                bindingsMapping.morphTargets = { group: 0, binding: 8 };
                bindingsMapping.morphTargetInfluences = { group: 0, binding: 9 };
                bindingsMapping.morphTargetTextureIndices = { group: 0, binding: 10 };
            }
            computeShader = new ComputeShader(`boundingInfoCompute${hasBones ? "_bones" : ""}${hasMorphs ? "_morphs" : ""}`, this._engine, "boundingInfo", {
                bindingsMapping,
                defines: defines,
            });
            this._computeShadersCache[join] = computeShader;
        }
        else {
            computeShader = this._computeShadersCache[join];
        }
        return computeShader;
    }
    _getUBO() {
        if (this._uboIndex >= this._ubos.length) {
            const ubo = new UniformBuffer(this._engine);
            ubo.addFloat3("morphTargetTextureInfo", 0, 0, 0);
            ubo.addUniform("morphTargetCount", 1);
            ubo.addUniform("indexResult", 1);
            this._ubos.push(ubo);
        }
        return this._ubos[this._uboIndex++];
    }
    _extractDataAndLink(computeShader, mesh, kind, stride, name, storageUnit) {
        let buffer;
        const vertexCount = mesh.getTotalVertices();
        if (!storageUnit[mesh.uniqueId]) {
            const dataArray = mesh.getVertexBuffer(kind)?.getFloatData(vertexCount);
            buffer = new StorageBuffer(this._engine, Float32Array.BYTES_PER_ELEMENT * vertexCount * stride);
            buffer.update(dataArray);
            storageUnit[mesh.uniqueId] = buffer;
        }
        else {
            buffer = storageUnit[mesh.uniqueId];
        }
        computeShader.setStorageBuffer(name, buffer);
    }
    _prepareStorage(computeShader, name, id, storageUnit, numInfluencers, data) {
        let buffer;
        if (!storageUnit[id]) {
            buffer = new StorageBuffer(this._engine, Float32Array.BYTES_PER_ELEMENT * numInfluencers);
            storageUnit[id] = buffer;
        }
        else {
            buffer = storageUnit[id];
        }
        buffer.update(data);
        computeShader.setStorageBuffer(name, buffer);
    }
    /** @internal */
    async processAsync(meshes) {
        await this.registerMeshListAsync(meshes);
        this.processMeshList();
        await this.fetchResultsForMeshListAsync();
    }
    /** @internal */
    registerMeshListAsync(meshes) {
        this._disposeForMeshList();
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        let maxNumInfluencers = 0;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const vertexCount = mesh.getTotalVertices();
            if (vertexCount === 0 || !mesh.getVertexBuffer || !mesh.getVertexBuffer(VertexBuffer.PositionKind)) {
                continue;
            }
            this._processedMeshes.push(mesh);
            const manager = mesh.morphTargetManager;
            if (manager && manager.supportsPositions) {
                maxNumInfluencers = Math.max(maxNumInfluencers, manager.numTargets);
            }
        }
        for (let i = 0; i < this._processedMeshes.length; i++) {
            const mesh = this._processedMeshes[i];
            let defines = [""];
            let hasBones = false;
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                hasBones = true;
            }
            const computeShaderWithoutMorph = this._getComputeShader(defines, hasBones, false);
            this._uniqueComputeShaders.add(computeShaderWithoutMorph);
            const manager = mesh.morphTargetManager;
            if (manager && manager.supportsPositions) {
                defines = defines.slice();
                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + maxNumInfluencers);
                const computeShaderWithMorph = this._getComputeShader(defines, hasBones, true);
                this._uniqueComputeShaders.add(computeShaderWithMorph);
                this._computeShaders.push([computeShaderWithoutMorph, computeShaderWithMorph]);
            }
            else {
                this._computeShaders.push([computeShaderWithoutMorph, computeShaderWithoutMorph]);
            }
            // Pre-build the ubos, as they won't change if there's no morph targets
            const ubo = this._getUBO();
            ubo.updateUInt("indexResult", i);
            ubo.update();
        }
        return new Promise((resolve) => {
            _retryWithInterval(() => {
                const iterator = this._uniqueComputeShaders.keys();
                for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                    const computeShader = key.value;
                    if (!computeShader.isReady()) {
                        return false;
                    }
                }
                return true;
            }, resolve);
        });
    }
    /** @internal */
    processMeshList() {
        if (this._processedMeshes.length === 0) {
            return;
        }
        this._uboIndex = 0;
        const resultDataSize = 8 * this._processedMeshes.length;
        const resultData = new Float32Array(resultDataSize);
        const resultBuffer = new StorageBuffer(this._engine, Float32Array.BYTES_PER_ELEMENT * resultDataSize);
        this._resultBuffers.push(resultBuffer);
        for (let i = 0; i < this._processedMeshes.length; i++) {
            resultData[i * 8 + 0] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 1] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 2] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 3] = Number.NEGATIVE_INFINITY;
            resultData[i * 8 + 4] = Number.NEGATIVE_INFINITY;
            resultData[i * 8 + 5] = Number.NEGATIVE_INFINITY;
        }
        resultBuffer.update(resultData);
        for (let i = 0; i < this._processedMeshes.length; i++) {
            const mesh = this._processedMeshes[i];
            const vertexCount = mesh.getTotalVertices();
            const [computeShaderWithoutMorph, computeShaderWithMorph] = this._computeShaders[i];
            const manager = mesh.morphTargetManager;
            const hasMorphs = manager && manager.numInfluencers > 0 && manager.supportsPositions;
            const computeShader = hasMorphs ? computeShaderWithMorph : computeShaderWithoutMorph;
            this._extractDataAndLink(computeShader, mesh, VertexBuffer.PositionKind, 3, "positionBuffer", this._positionBuffers);
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton && mesh.skeleton.useTextureToStoreBoneMatrices) {
                this._extractDataAndLink(computeShader, mesh, VertexBuffer.MatricesIndicesKind, 4, "indexBuffer", this._indexBuffers);
                this._extractDataAndLink(computeShader, mesh, VertexBuffer.MatricesWeightsKind, 4, "weightBuffer", this._weightBuffers);
                const boneSampler = mesh.skeleton.getTransformMatrixTexture(mesh);
                computeShader.setTexture("boneSampler", boneSampler, false);
                if (mesh.numBoneInfluencers > 4) {
                    this._extractDataAndLink(computeShader, mesh, VertexBuffer.MatricesIndicesExtraKind, 4, "indexExtraBuffer", this._indexExtraBuffers);
                    this._extractDataAndLink(computeShader, mesh, VertexBuffer.MatricesWeightsExtraKind, 4, "weightExtraBuffer", this._weightExtraBuffers);
                }
            }
            const ubo = this._getUBO();
            // Morphs
            if (hasMorphs) {
                const morphTargets = manager._targetStoreTexture;
                computeShader.setTexture("morphTargets", morphTargets, false);
                this._prepareStorage(computeShader, "morphTargetInfluences", mesh.uniqueId, this._morphTargetInfluenceBuffers, manager.numInfluencers, manager.influences);
                this._prepareStorage(computeShader, "morphTargetTextureIndices", mesh.uniqueId, this._morphTargetTextureIndexBuffers, manager.numInfluencers, manager._morphTargetTextureIndices);
                ubo.updateFloat3("morphTargetTextureInfo", manager._textureVertexStride, manager._textureWidth, manager._textureHeight);
                ubo.updateInt("morphTargetCount", manager.numInfluencers);
                ubo.update();
            }
            computeShader.setStorageBuffer("resultBuffer", resultBuffer);
            computeShader.setUniformBuffer("settings", ubo);
            // Dispatch
            computeShader.dispatch(Math.ceil(vertexCount / 256));
            this._engine.flushFramebuffer();
        }
    }
    /** @internal */
    fetchResultsForMeshListAsync() {
        return new Promise((resolve) => {
            const buffers = [];
            let size = 0;
            for (let i = 0; i < this._resultBuffers.length; i++) {
                const buffer = this._resultBuffers[i].getBuffer();
                buffers.push(buffer);
                size += buffer.capacity;
            }
            const resultData = new Float32Array(size / Float32Array.BYTES_PER_ELEMENT);
            const minimum = Vector3.Zero();
            const maximum = Vector3.Zero();
            const minmax = { minimum, maximum };
            this._engine.readFromMultipleStorageBuffers(buffers, 0, undefined, resultData, true).then(() => {
                let resultDataOffset = 0;
                for (let j = 0; j < this._resultBuffers.length; j++) {
                    for (let i = 0; i < this._processedMeshes.length; i++) {
                        const mesh = this._processedMeshes[i];
                        Vector3.FromArrayToRef(resultData, resultDataOffset + i * 8, minimum);
                        Vector3.FromArrayToRef(resultData, resultDataOffset + i * 8 + 3, maximum);
                        if (j > 0) {
                            minimum.minimizeInPlace(mesh.getBoundingInfo().minimum);
                            maximum.maximizeInPlace(mesh.getBoundingInfo().maximum);
                        }
                        mesh._refreshBoundingInfoDirect(minmax);
                    }
                    resultDataOffset += 8 * this._processedMeshes.length;
                }
                for (const resultBuffer of this._resultBuffers) {
                    resultBuffer.dispose();
                }
                this._resultBuffers = [];
                this._uboIndex = 0;
                resolve();
            });
        });
    }
    _disposeCache(storageUnit) {
        for (const key in storageUnit) {
            storageUnit[key].dispose();
        }
    }
    _disposeForMeshList() {
        for (const resultBuffer of this._resultBuffers) {
            resultBuffer.dispose();
        }
        this._resultBuffers = [];
        this._processedMeshes = [];
        this._computeShaders = [];
        this._uniqueComputeShaders = new Set();
    }
    /** @internal */
    dispose() {
        this._disposeCache(this._positionBuffers);
        this._positionBuffers = {};
        this._disposeCache(this._indexBuffers);
        this._indexBuffers = {};
        this._disposeCache(this._weightBuffers);
        this._weightBuffers = {};
        this._disposeCache(this._morphTargetInfluenceBuffers);
        this._morphTargetInfluenceBuffers = {};
        this._disposeCache(this._morphTargetTextureIndexBuffers);
        this._morphTargetTextureIndexBuffers = {};
        for (const ubo of this._ubos) {
            ubo.dispose();
        }
        this._ubos = [];
        this._computeShadersCache = {};
        this._engine = undefined;
        this._disposeForMeshList();
    }
}
//# sourceMappingURL=computeShaderBoundingHelper.js.map