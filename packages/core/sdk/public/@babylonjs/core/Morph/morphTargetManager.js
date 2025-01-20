import { SmartArray } from "../Misc/smartArray.js";
import { Logger } from "../Misc/logger.js";
import { EngineStore } from "../Engines/engineStore.js";
import { MorphTarget } from "./morphTarget.js";

import { RawTexture2DArray } from "../Materials/Textures/rawTexture2DArray.js";
/**
 * This class is used to deform meshes using morphing between different targets
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/morphTargets
 */
export class MorphTargetManager {
    /**
     * Sets a boolean indicating that adding new target or updating an existing target will not update the underlying data buffers
     */
    set areUpdatesFrozen(block) {
        if (block) {
            this._blockCounter++;
        }
        else {
            this._blockCounter--;
            if (this._blockCounter <= 0) {
                this._blockCounter = 0;
                this._syncActiveTargets(this._forceUpdateWhenUnfrozen);
                this._forceUpdateWhenUnfrozen = false;
            }
        }
    }
    get areUpdatesFrozen() {
        return this._blockCounter > 0;
    }
    /**
     * Creates a new MorphTargetManager
     * @param scene defines the current scene
     */
    constructor(scene = null) {
        this._targets = new Array();
        this._targetInfluenceChangedObservers = new Array();
        this._targetDataLayoutChangedObservers = new Array();
        this._activeTargets = new SmartArray(16);
        this._supportsPositions = false;
        this._supportsNormals = false;
        this._supportsTangents = false;
        this._supportsUVs = false;
        this._supportsUV2s = false;
        this._vertexCount = 0;
        this._uniqueId = 0;
        this._tempInfluences = new Array();
        this._canUseTextureForTargets = false;
        this._blockCounter = 0;
        this._mustSynchronize = true;
        this._forceUpdateWhenUnfrozen = false;
        /** @internal */
        this._textureVertexStride = 0;
        /** @internal */
        this._textureWidth = 0;
        /** @internal */
        this._textureHeight = 1;
        /** @internal */
        this._parentContainer = null;
        /**
         * Gets or sets a boolean indicating if influencers must be optimized (eg. recompiling the shader if less influencers are used)
         */
        this.optimizeInfluencers = true;
        /**
         * Gets or sets a boolean indicating if positions must be morphed
         */
        this.enablePositionMorphing = true;
        /**
         * Gets or sets a boolean indicating if normals must be morphed
         */
        this.enableNormalMorphing = true;
        /**
         * Gets or sets a boolean indicating if tangents must be morphed
         */
        this.enableTangentMorphing = true;
        /**
         * Gets or sets a boolean indicating if UV must be morphed
         */
        this.enableUVMorphing = true;
        /**
         * Gets or sets a boolean indicating if UV2 must be morphed
         */
        this.enableUV2Morphing = true;
        this._numMaxInfluencers = 0;
        this._useTextureToStoreTargets = true;
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }
        this._scene = scene;
        if (this._scene) {
            this._scene.addMorphTargetManager(this);
            this._uniqueId = this._scene.getUniqueId();
            const engineCaps = this._scene.getEngine().getCaps();
            this._canUseTextureForTargets =
                engineCaps.canUseGLVertexID && engineCaps.textureFloat && engineCaps.maxVertexTextureImageUnits > 0 && engineCaps.texture2DArrayMaxLayerCount > 1;
        }
    }
    /**
     * Gets or sets the maximum number of influencers (targets) (default value: 0).
     * Setting a value for this property can lead to a smoother experience, as only one shader will be compiled, which will use this value as the maximum number of influencers.
     * If you leave the value at 0 (default), a new shader will be compiled every time the number of active influencers changes. This can cause problems, as compiling a shader takes time.
     * If you assign a non-zero value to this property, you need to ensure that this value is greater than the maximum number of (active) influencers you'll need for this morph manager.
     * Otherwise, the number of active influencers will be truncated at the value you set for this property, which can lead to unexpected results.
     * Note that this property has no effect if "useTextureToStoreTargets" is false.
     */
    get numMaxInfluencers() {
        return this._numMaxInfluencers;
    }
    set numMaxInfluencers(value) {
        if (this._numMaxInfluencers === value) {
            return;
        }
        this._numMaxInfluencers = value;
        this._mustSynchronize = true;
        this._syncActiveTargets();
    }
    /**
     * Gets the unique ID of this manager
     */
    get uniqueId() {
        return this._uniqueId;
    }
    /**
     * Gets the number of vertices handled by this manager
     */
    get vertexCount() {
        return this._vertexCount;
    }
    /**
     * Gets a boolean indicating if this manager supports morphing of positions
     */
    get supportsPositions() {
        return this._supportsPositions && this.enablePositionMorphing;
    }
    /**
     * Gets a boolean indicating if this manager supports morphing of normals
     */
    get supportsNormals() {
        return this._supportsNormals && this.enableNormalMorphing;
    }
    /**
     * Gets a boolean indicating if this manager supports morphing of tangents
     */
    get supportsTangents() {
        return this._supportsTangents && this.enableTangentMorphing;
    }
    /**
     * Gets a boolean indicating if this manager supports morphing of texture coordinates
     */
    get supportsUVs() {
        return this._supportsUVs && this.enableUVMorphing;
    }
    /**
     * Gets a boolean indicating if this manager supports morphing of texture coordinates 2
     */
    get supportsUV2s() {
        return this._supportsUV2s && this.enableUV2Morphing;
    }
    /**
     * Gets a boolean indicating if this manager has data for morphing positions
     */
    get hasPositions() {
        return this._supportsPositions;
    }
    /**
     * Gets a boolean indicating if this manager has data for morphing normals
     */
    get hasNormals() {
        return this._supportsNormals;
    }
    /**
     * Gets a boolean indicating if this manager has data for morphing tangents
     */
    get hasTangents() {
        return this._supportsTangents;
    }
    /**
     * Gets a boolean indicating if this manager has data for morphing texture coordinates
     */
    get hasUVs() {
        return this._supportsUVs;
    }
    /**
     * Gets a boolean indicating if this manager has data for morphing texture coordinates 2
     */
    get hasUV2s() {
        return this._supportsUV2s;
    }
    /**
     * Gets the number of targets stored in this manager
     */
    get numTargets() {
        return this._targets.length;
    }
    /**
     * Gets the number of influencers (ie. the number of targets with influences > 0)
     */
    get numInfluencers() {
        return this._activeTargets.length;
    }
    /**
     * Gets the list of influences (one per target)
     */
    get influences() {
        return this._influences;
    }
    /**
     * Gets or sets a boolean indicating that targets should be stored as a texture instead of using vertex attributes (default is true).
     * Please note that this option is not available if the hardware does not support it
     */
    get useTextureToStoreTargets() {
        return this._useTextureToStoreTargets;
    }
    set useTextureToStoreTargets(value) {
        if (this._useTextureToStoreTargets === value) {
            return;
        }
        this._useTextureToStoreTargets = value;
        this._mustSynchronize = true;
        this._syncActiveTargets();
    }
    /**
     * Gets a boolean indicating that the targets are stored into a texture (instead of as attributes)
     */
    get isUsingTextureForTargets() {
        return (MorphTargetManager.EnableTextureStorage &&
            this.useTextureToStoreTargets &&
            this._canUseTextureForTargets &&
            !this._scene?.getEngine().getCaps().disableMorphTargetTexture);
    }
    /**
     * Gets the active target at specified index. An active target is a target with an influence > 0
     * @param index defines the index to check
     * @returns the requested target
     */
    getActiveTarget(index) {
        return this._activeTargets.data[index];
    }
    /**
     * Gets the target at specified index
     * @param index defines the index to check
     * @returns the requested target
     */
    getTarget(index) {
        return this._targets[index];
    }
    /**
     * Gets the first target with the specified name
     * @param name defines the name to check
     * @returns the requested target
     */
    getTargetByName(name) {
        for (const target of this._targets) {
            if (target.name === name) {
                return target;
            }
        }
        return null;
    }
    /**
     * Add a new target to this manager
     * @param target defines the target to add
     */
    addTarget(target) {
        this._targets.push(target);
        this._targetInfluenceChangedObservers.push(target.onInfluenceChanged.add((needUpdate) => {
            if (this.areUpdatesFrozen && needUpdate) {
                this._forceUpdateWhenUnfrozen = true;
            }
            this._syncActiveTargets(needUpdate);
        }));
        this._targetDataLayoutChangedObservers.push(target._onDataLayoutChanged.add(() => {
            this._mustSynchronize = true;
            this._syncActiveTargets();
        }));
        this._mustSynchronize = true;
        this._syncActiveTargets();
    }
    /**
     * Removes a target from the manager
     * @param target defines the target to remove
     */
    removeTarget(target) {
        const index = this._targets.indexOf(target);
        if (index >= 0) {
            this._targets.splice(index, 1);
            target.onInfluenceChanged.remove(this._targetInfluenceChangedObservers.splice(index, 1)[0]);
            target._onDataLayoutChanged.remove(this._targetDataLayoutChangedObservers.splice(index, 1)[0]);
            this._mustSynchronize = true;
            this._syncActiveTargets();
        }
        if (this._scene) {
            this._scene.stopAnimation(target);
        }
    }
    /**
     * @internal
     */
    _bind(effect) {
        effect.setFloat3("morphTargetTextureInfo", this._textureVertexStride, this._textureWidth, this._textureHeight);
        effect.setFloatArray("morphTargetTextureIndices", this._morphTargetTextureIndices);
        effect.setTexture("morphTargets", this._targetStoreTexture);
        effect.setInt("morphTargetCount", this.numInfluencers);
    }
    /**
     * Clone the current manager
     * @returns a new MorphTargetManager
     */
    clone() {
        const copy = new MorphTargetManager(this._scene);
        for (const target of this._targets) {
            copy.addTarget(target.clone());
        }
        copy.enablePositionMorphing = this.enablePositionMorphing;
        copy.enableNormalMorphing = this.enableNormalMorphing;
        copy.enableTangentMorphing = this.enableTangentMorphing;
        copy.enableUVMorphing = this.enableUVMorphing;
        copy.enableUV2Morphing = this.enableUV2Morphing;
        return copy;
    }
    /**
     * Serializes the current manager into a Serialization object
     * @returns the serialized object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.id = this.uniqueId;
        serializationObject.targets = [];
        for (const target of this._targets) {
            serializationObject.targets.push(target.serialize());
        }
        return serializationObject;
    }
    _syncActiveTargets(needUpdate = false) {
        if (this.areUpdatesFrozen) {
            return;
        }
        const wasUsingTextureForTargets = !!this._targetStoreTexture;
        const isUsingTextureForTargets = this.isUsingTextureForTargets;
        if (this._mustSynchronize || wasUsingTextureForTargets !== isUsingTextureForTargets) {
            this._mustSynchronize = false;
            this.synchronize();
        }
        let influenceCount = 0;
        this._activeTargets.reset();
        if (!this._morphTargetTextureIndices || this._morphTargetTextureIndices.length !== this._targets.length) {
            this._morphTargetTextureIndices = new Float32Array(this._targets.length);
        }
        let targetIndex = -1;
        for (const target of this._targets) {
            targetIndex++;
            if (target.influence === 0 && this.optimizeInfluencers) {
                continue;
            }
            if (this._activeTargets.length >= MorphTargetManager.MaxActiveMorphTargetsInVertexAttributeMode && !this.isUsingTextureForTargets) {
                break;
            }
            this._activeTargets.push(target);
            this._morphTargetTextureIndices[influenceCount] = targetIndex;
            this._tempInfluences[influenceCount++] = target.influence;
        }
        if (this._morphTargetTextureIndices.length !== influenceCount) {
            this._morphTargetTextureIndices = this._morphTargetTextureIndices.slice(0, influenceCount);
        }
        if (!this._influences || this._influences.length !== influenceCount) {
            this._influences = new Float32Array(influenceCount);
        }
        for (let index = 0; index < influenceCount; index++) {
            this._influences[index] = this._tempInfluences[index];
        }
        if (needUpdate && this._scene) {
            for (const mesh of this._scene.meshes) {
                if (mesh.morphTargetManager === this) {
                    if (isUsingTextureForTargets) {
                        mesh._markSubMeshesAsAttributesDirty();
                    }
                    else {
                        mesh._syncGeometryWithMorphTargetManager();
                    }
                }
            }
        }
    }
    /**
     * Synchronize the targets with all the meshes using this morph target manager
     */
    synchronize() {
        if (!this._scene || this.areUpdatesFrozen) {
            return;
        }
        const engine = this._scene.getEngine();
        this._supportsPositions = true;
        this._supportsNormals = true;
        this._supportsTangents = true;
        this._supportsUVs = true;
        this._supportsUV2s = true;
        this._vertexCount = 0;
        this._targetStoreTexture?.dispose();
        this._targetStoreTexture = null;
        if (this.isUsingTextureForTargets && this._targets.length > engine.getCaps().texture2DArrayMaxLayerCount) {
            this.useTextureToStoreTargets = false;
        }
        for (const target of this._targets) {
            this._supportsPositions = this._supportsPositions && target.hasPositions;
            this._supportsNormals = this._supportsNormals && target.hasNormals;
            this._supportsTangents = this._supportsTangents && target.hasTangents;
            this._supportsUVs = this._supportsUVs && target.hasUVs;
            this._supportsUV2s = this._supportsUV2s && target.hasUV2s;
            const vertexCount = target.vertexCount;
            if (this._vertexCount === 0) {
                this._vertexCount = vertexCount;
            }
            else if (this._vertexCount !== vertexCount) {
                Logger.Error(`Incompatible target. Targets must all have the same vertices count. Current vertex count: ${this._vertexCount}, vertex count for target "${target.name}": ${vertexCount}`);
                return;
            }
        }
        if (this.isUsingTextureForTargets) {
            this._textureVertexStride = 0;
            this._supportsPositions && this._textureVertexStride++;
            this._supportsNormals && this._textureVertexStride++;
            this._supportsTangents && this._textureVertexStride++;
            this._supportsUVs && this._textureVertexStride++;
            this.supportsUV2s && this._textureVertexStride++;
            this._textureWidth = this._vertexCount * this._textureVertexStride || 1;
            this._textureHeight = 1;
            const maxTextureSize = engine.getCaps().maxTextureSize;
            if (this._textureWidth > maxTextureSize) {
                this._textureHeight = Math.ceil(this._textureWidth / maxTextureSize);
                this._textureWidth = maxTextureSize;
            }
            const targetCount = this._targets.length;
            const data = new Float32Array(targetCount * this._textureWidth * this._textureHeight * 4);
            let offset = 0;
            for (let index = 0; index < targetCount; index++) {
                const target = this._targets[index];
                const positions = target.getPositions();
                const normals = target.getNormals();
                const uvs = target.getUVs();
                const tangents = target.getTangents();
                const uv2s = target.getUV2s();
                offset = index * this._textureWidth * this._textureHeight * 4;
                for (let vertex = 0; vertex < this._vertexCount; vertex++) {
                    if (this._supportsPositions && positions) {
                        data[offset] = positions[vertex * 3];
                        data[offset + 1] = positions[vertex * 3 + 1];
                        data[offset + 2] = positions[vertex * 3 + 2];
                        offset += 4;
                    }
                    if (this._supportsNormals && normals) {
                        data[offset] = normals[vertex * 3];
                        data[offset + 1] = normals[vertex * 3 + 1];
                        data[offset + 2] = normals[vertex * 3 + 2];
                        offset += 4;
                    }
                    if (this._supportsUVs && uvs) {
                        data[offset] = uvs[vertex * 2];
                        data[offset + 1] = uvs[vertex * 2 + 1];
                        offset += 4;
                    }
                    if (this._supportsTangents && tangents) {
                        data[offset] = tangents[vertex * 3];
                        data[offset + 1] = tangents[vertex * 3 + 1];
                        data[offset + 2] = tangents[vertex * 3 + 2];
                        offset += 4;
                    }
                    if (this._supportsUV2s && uv2s) {
                        data[offset] = uv2s[vertex * 2];
                        data[offset + 1] = uv2s[vertex * 2 + 1];
                        offset += 4;
                    }
                }
            }
            this._targetStoreTexture = RawTexture2DArray.CreateRGBATexture(data, this._textureWidth, this._textureHeight, targetCount, this._scene, false, false, 1, 1);
            this._targetStoreTexture.name = `Morph texture_${this.uniqueId}`;
        }
        // Flag meshes as dirty to resync with the active targets
        for (const mesh of this._scene.meshes) {
            if (mesh.morphTargetManager === this) {
                mesh._syncGeometryWithMorphTargetManager();
            }
        }
    }
    /**
     * Release all resources
     */
    dispose() {
        if (this._targetStoreTexture) {
            this._targetStoreTexture.dispose();
        }
        this._targetStoreTexture = null;
        // Remove from scene
        if (this._scene) {
            this._scene.removeMorphTargetManager(this);
            if (this._parentContainer) {
                const index = this._parentContainer.morphTargetManagers.indexOf(this);
                if (index > -1) {
                    this._parentContainer.morphTargetManagers.splice(index, 1);
                }
                this._parentContainer = null;
            }
            for (const morph of this._targets) {
                this._scene.stopAnimation(morph);
            }
        }
    }
    // Statics
    /**
     * Creates a new MorphTargetManager from serialized data
     * @param serializationObject defines the serialized data
     * @param scene defines the hosting scene
     * @returns the new MorphTargetManager
     */
    static Parse(serializationObject, scene) {
        const result = new MorphTargetManager(scene);
        for (const targetData of serializationObject.targets) {
            result.addTarget(MorphTarget.Parse(targetData, scene));
        }
        return result;
    }
}
/** Enable storing morph target data into textures when set to true (true by default) */
MorphTargetManager.EnableTextureStorage = true;
/** Maximum number of active morph targets supported in the "vertex attribute" mode (i.e., not the "texture" mode) */
MorphTargetManager.MaxActiveMorphTargetsInVertexAttributeMode = 8;
//# sourceMappingURL=morphTargetManager.js.map