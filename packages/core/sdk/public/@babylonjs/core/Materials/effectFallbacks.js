/**
 * EffectFallbacks can be used to add fallbacks (properties to disable) to certain properties when desired to improve performance.
 * (Eg. Start at high quality with reflection and fog, if fps is low, remove reflection, if still low remove fog)
 */
export class EffectFallbacks {
    constructor() {
        this._defines = {};
        this._currentRank = 32;
        this._maxRank = -1;
        this._mesh = null;
    }
    /**
     * Removes the fallback from the bound mesh.
     */
    unBindMesh() {
        this._mesh = null;
    }
    /**
     * Adds a fallback on the specified property.
     * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
     * @param define The name of the define in the shader
     */
    addFallback(rank, define) {
        if (!this._defines[rank]) {
            if (rank < this._currentRank) {
                this._currentRank = rank;
            }
            if (rank > this._maxRank) {
                this._maxRank = rank;
            }
            this._defines[rank] = new Array();
        }
        this._defines[rank].push(define);
    }
    /**
     * Sets the mesh to use CPU skinning when needing to fallback.
     * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
     * @param mesh The mesh to use the fallbacks.
     */
    addCPUSkinningFallback(rank, mesh) {
        this._mesh = mesh;
        if (rank < this._currentRank) {
            this._currentRank = rank;
        }
        if (rank > this._maxRank) {
            this._maxRank = rank;
        }
    }
    /**
     * Checks to see if more fallbacks are still available.
     */
    get hasMoreFallbacks() {
        return this._currentRank <= this._maxRank;
    }
    /**
     * Removes the defines that should be removed when falling back.
     * @param currentDefines defines the current define statements for the shader.
     * @param effect defines the current effect we try to compile
     * @returns The resulting defines with defines of the current rank removed.
     */
    reduce(currentDefines, effect) {
        // First we try to switch to CPU skinning
        if (this._mesh && this._mesh.computeBonesUsingShaders && this._mesh.numBoneInfluencers > 0) {
            this._mesh.computeBonesUsingShaders = false;
            currentDefines = currentDefines.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0");
            effect._bonesComputationForcedToCPU = true;
            const scene = this._mesh.getScene();
            for (let index = 0; index < scene.meshes.length; index++) {
                const otherMesh = scene.meshes[index];
                if (!otherMesh.material) {
                    if (!this._mesh.material && otherMesh.computeBonesUsingShaders && otherMesh.numBoneInfluencers > 0) {
                        otherMesh.computeBonesUsingShaders = false;
                    }
                    continue;
                }
                if (!otherMesh.computeBonesUsingShaders || otherMesh.numBoneInfluencers === 0) {
                    continue;
                }
                if (otherMesh.material.getEffect() === effect) {
                    otherMesh.computeBonesUsingShaders = false;
                }
                else if (otherMesh.subMeshes) {
                    for (const subMesh of otherMesh.subMeshes) {
                        const subMeshEffect = subMesh.effect;
                        if (subMeshEffect === effect) {
                            otherMesh.computeBonesUsingShaders = false;
                            break;
                        }
                    }
                }
            }
        }
        else {
            const currentFallbacks = this._defines[this._currentRank];
            if (currentFallbacks) {
                for (let index = 0; index < currentFallbacks.length; index++) {
                    currentDefines = currentDefines.replace("#define " + currentFallbacks[index], "");
                }
            }
            this._currentRank++;
        }
        return currentDefines;
    }
}
//# sourceMappingURL=effectFallbacks.js.map