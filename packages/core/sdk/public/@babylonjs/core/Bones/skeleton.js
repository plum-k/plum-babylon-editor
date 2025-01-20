import { Bone } from "./bone.js";
import { Observable } from "../Misc/observable.js";
import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector.js";
import { RawTexture } from "../Materials/Textures/rawTexture.js";
import { Animation } from "../Animations/animation.js";
import { AnimationRange } from "../Animations/animationRange.js";
import { EngineStore } from "../Engines/engineStore.js";

import { Logger } from "../Misc/logger.js";
import { DeepCopier } from "../Misc/deepCopier.js";
/**
 * Class used to handle skinning animations
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
 */
export class Skeleton {
    /**
     * Gets or sets a boolean indicating that bone matrices should be stored as a texture instead of using shader uniforms (default is true).
     * Please note that this option is not available if the hardware does not support it
     */
    get useTextureToStoreBoneMatrices() {
        return this._useTextureToStoreBoneMatrices;
    }
    set useTextureToStoreBoneMatrices(value) {
        this._useTextureToStoreBoneMatrices = value;
        this._markAsDirty();
    }
    /**
     * Gets or sets the animation properties override
     */
    get animationPropertiesOverride() {
        if (!this._animationPropertiesOverride) {
            return this._scene.animationPropertiesOverride;
        }
        return this._animationPropertiesOverride;
    }
    set animationPropertiesOverride(value) {
        this._animationPropertiesOverride = value;
    }
    /**
     * Gets a boolean indicating that the skeleton effectively stores matrices into a texture
     */
    get isUsingTextureForMatrices() {
        return this.useTextureToStoreBoneMatrices && this._canUseTextureForBones;
    }
    /**
     * Gets the unique ID of this skeleton
     */
    get uniqueId() {
        return this._uniqueId;
    }
    /**
     * Creates a new skeleton
     * @param name defines the skeleton name
     * @param id defines the skeleton Id
     * @param scene defines the hosting scene
     */
    constructor(
    /** defines the skeleton name */
    name, 
    /** defines the skeleton Id */
    id, scene) {
        this.name = name;
        this.id = id;
        /**
         * Defines the list of child bones
         */
        this.bones = [];
        /**
         * Defines a boolean indicating if the root matrix is provided by meshes or by the current skeleton (this is the default value)
         */
        this.needInitialSkinMatrix = false;
        this._isDirty = true;
        this._meshesWithPoseMatrix = new Array();
        this._identity = Matrix.Identity();
        this._currentRenderId = -1;
        this._ranges = {};
        this._absoluteTransformIsDirty = true;
        this._canUseTextureForBones = false;
        this._uniqueId = 0;
        /** @internal */
        this._numBonesWithLinkedTransformNode = 0;
        /** @internal */
        this._hasWaitingData = null;
        /** @internal */
        this._parentContainer = null;
        /**
         * Specifies if the skeleton should be serialized
         */
        this.doNotSerialize = false;
        this._useTextureToStoreBoneMatrices = true;
        this._animationPropertiesOverride = null;
        // Events
        /**
         * An observable triggered before computing the skeleton's matrices
         */
        this.onBeforeComputeObservable = new Observable();
        this.bones = [];
        this._scene = scene || EngineStore.LastCreatedScene;
        this._uniqueId = this._scene.getUniqueId();
        this._scene.addSkeleton(this);
        //make sure it will recalculate the matrix next time prepare is called.
        this._isDirty = true;
        const engineCaps = this._scene.getEngine().getCaps();
        this._canUseTextureForBones = engineCaps.textureFloat && engineCaps.maxVertexTextureImageUnits > 0;
    }
    /**
     * Gets the current object class name.
     * @returns the class name
     */
    getClassName() {
        return "Skeleton";
    }
    /**
     * Returns an array containing the root bones
     * @returns an array containing the root bones
     */
    getChildren() {
        return this.bones.filter((b) => !b.getParent());
    }
    // Members
    /**
     * Gets the list of transform matrices to send to shaders (one matrix per bone)
     * @param mesh defines the mesh to use to get the root matrix (if needInitialSkinMatrix === true)
     * @returns a Float32Array containing matrices data
     */
    getTransformMatrices(mesh) {
        if (this.needInitialSkinMatrix) {
            if (!mesh) {
                throw new Error("getTransformMatrices: When using the needInitialSkinMatrix flag, a mesh must be provided");
            }
            if (!mesh._bonesTransformMatrices) {
                this.prepare(true);
            }
            return mesh._bonesTransformMatrices;
        }
        if (!this._transformMatrices || this._isDirty) {
            this.prepare(!this._transformMatrices);
        }
        return this._transformMatrices;
    }
    /**
     * Gets the list of transform matrices to send to shaders inside a texture (one matrix per bone)
     * @param mesh defines the mesh to use to get the root matrix (if needInitialSkinMatrix === true)
     * @returns a raw texture containing the data
     */
    getTransformMatrixTexture(mesh) {
        if (this.needInitialSkinMatrix && mesh._transformMatrixTexture) {
            return mesh._transformMatrixTexture;
        }
        return this._transformMatrixTexture;
    }
    /**
     * Gets the current hosting scene
     * @returns a scene object
     */
    getScene() {
        return this._scene;
    }
    // Methods
    /**
     * Gets a string representing the current skeleton data
     * @param fullDetails defines a boolean indicating if we want a verbose version
     * @returns a string representing the current skeleton data
     */
    toString(fullDetails) {
        let ret = `Name: ${this.name}, nBones: ${this.bones.length}`;
        ret += `, nAnimationRanges: ${this._ranges ? Object.keys(this._ranges).length : "none"}`;
        if (fullDetails) {
            ret += ", Ranges: {";
            let first = true;
            for (const name in this._ranges) {
                if (first) {
                    ret += ", ";
                    first = false;
                }
                ret += name;
            }
            ret += "}";
        }
        return ret;
    }
    /**
     * Get bone's index searching by name
     * @param name defines bone's name to search for
     * @returns the indice of the bone. Returns -1 if not found
     */
    getBoneIndexByName(name) {
        for (let boneIndex = 0, cache = this.bones.length; boneIndex < cache; boneIndex++) {
            if (this.bones[boneIndex].name === name) {
                return boneIndex;
            }
        }
        return -1;
    }
    /**
     * Create a new animation range
     * @param name defines the name of the range
     * @param from defines the start key
     * @param to defines the end key
     */
    createAnimationRange(name, from, to) {
        // check name not already in use
        if (!this._ranges[name]) {
            this._ranges[name] = new AnimationRange(name, from, to);
            for (let i = 0, nBones = this.bones.length; i < nBones; i++) {
                if (this.bones[i].animations[0]) {
                    this.bones[i].animations[0].createRange(name, from, to);
                }
            }
        }
    }
    /**
     * Delete a specific animation range
     * @param name defines the name of the range
     * @param deleteFrames defines if frames must be removed as well
     */
    deleteAnimationRange(name, deleteFrames = true) {
        for (let i = 0, nBones = this.bones.length; i < nBones; i++) {
            if (this.bones[i].animations[0]) {
                this.bones[i].animations[0].deleteRange(name, deleteFrames);
            }
        }
        this._ranges[name] = null; // said much faster than 'delete this._range[name]'
    }
    /**
     * Gets a specific animation range
     * @param name defines the name of the range to look for
     * @returns the requested animation range or null if not found
     */
    getAnimationRange(name) {
        return this._ranges[name] || null;
    }
    /**
     * Gets the list of all animation ranges defined on this skeleton
     * @returns an array
     */
    getAnimationRanges() {
        const animationRanges = [];
        let name;
        for (name in this._ranges) {
            animationRanges.push(this._ranges[name]);
        }
        return animationRanges;
    }
    /**
     * Copy animation range from a source skeleton.
     * This is not for a complete retargeting, only between very similar skeleton's with only possible bone length differences
     * @param source defines the source skeleton
     * @param name defines the name of the range to copy
     * @param rescaleAsRequired defines if rescaling must be applied if required
     * @returns true if operation was successful
     */
    copyAnimationRange(source, name, rescaleAsRequired = false) {
        if (this._ranges[name] || !source.getAnimationRange(name)) {
            return false;
        }
        let ret = true;
        const frameOffset = this._getHighestAnimationFrame() + 1;
        // make a dictionary of source skeleton's bones, so exact same order or doubly nested loop is not required
        const boneDict = {};
        const sourceBones = source.bones;
        let nBones;
        let i;
        for (i = 0, nBones = sourceBones.length; i < nBones; i++) {
            boneDict[sourceBones[i].name] = sourceBones[i];
        }
        if (this.bones.length !== sourceBones.length) {
            Logger.Warn(`copyAnimationRange: this rig has ${this.bones.length} bones, while source as ${sourceBones.length}`);
            ret = false;
        }
        const skelDimensionsRatio = rescaleAsRequired && this.dimensionsAtRest && source.dimensionsAtRest ? this.dimensionsAtRest.divide(source.dimensionsAtRest) : null;
        for (i = 0, nBones = this.bones.length; i < nBones; i++) {
            const boneName = this.bones[i].name;
            const sourceBone = boneDict[boneName];
            if (sourceBone) {
                ret = ret && this.bones[i].copyAnimationRange(sourceBone, name, frameOffset, rescaleAsRequired, skelDimensionsRatio);
            }
            else {
                Logger.Warn("copyAnimationRange: not same rig, missing source bone " + boneName);
                ret = false;
            }
        }
        // do not call createAnimationRange(), since it also is done to bones, which was already done
        const range = source.getAnimationRange(name);
        if (range) {
            this._ranges[name] = new AnimationRange(name, range.from + frameOffset, range.to + frameOffset);
        }
        return ret;
    }
    /**
     * Forces the skeleton to go to rest pose
     */
    returnToRest() {
        for (const bone of this.bones) {
            if (bone._index !== -1) {
                bone.returnToRest();
            }
        }
    }
    _getHighestAnimationFrame() {
        let ret = 0;
        for (let i = 0, nBones = this.bones.length; i < nBones; i++) {
            if (this.bones[i].animations[0]) {
                const highest = this.bones[i].animations[0].getHighestFrame();
                if (ret < highest) {
                    ret = highest;
                }
            }
        }
        return ret;
    }
    /**
     * Begin a specific animation range
     * @param name defines the name of the range to start
     * @param loop defines if looping must be turned on (false by default)
     * @param speedRatio defines the speed ratio to apply (1 by default)
     * @param onAnimationEnd defines a callback which will be called when animation will end
     * @returns a new animatable
     */
    beginAnimation(name, loop, speedRatio, onAnimationEnd) {
        const range = this.getAnimationRange(name);
        if (!range) {
            return null;
        }
        return this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
    }
    /**
     * Convert the keyframes for a range of animation on a skeleton to be relative to a given reference frame.
     * @param skeleton defines the Skeleton containing the animation range to convert
     * @param referenceFrame defines the frame that keyframes in the range will be relative to
     * @param range defines the name of the AnimationRange belonging to the Skeleton to convert
     * @returns the original skeleton
     */
    static MakeAnimationAdditive(skeleton, referenceFrame = 0, range) {
        const rangeValue = skeleton.getAnimationRange(range);
        // We can't make a range additive if it doesn't exist
        if (!rangeValue) {
            return null;
        }
        // Find any current scene-level animatable belonging to the target that matches the range
        const sceneAnimatables = skeleton._scene.getAllAnimatablesByTarget(skeleton);
        let rangeAnimatable = null;
        for (let index = 0; index < sceneAnimatables.length; index++) {
            const sceneAnimatable = sceneAnimatables[index];
            if (sceneAnimatable.fromFrame === rangeValue?.from && sceneAnimatable.toFrame === rangeValue?.to) {
                rangeAnimatable = sceneAnimatable;
                break;
            }
        }
        // Convert the animations belonging to the skeleton to additive keyframes
        const animatables = skeleton.getAnimatables();
        for (let index = 0; index < animatables.length; index++) {
            const animatable = animatables[index];
            const animations = animatable.animations;
            if (!animations) {
                continue;
            }
            for (let animIndex = 0; animIndex < animations.length; animIndex++) {
                Animation.MakeAnimationAdditive(animations[animIndex], referenceFrame, range);
            }
        }
        // Mark the scene-level animatable as additive
        if (rangeAnimatable) {
            rangeAnimatable.isAdditive = true;
        }
        return skeleton;
    }
    /** @internal */
    _markAsDirty() {
        this._isDirty = true;
        this._absoluteTransformIsDirty = true;
    }
    /**
     * @internal
     */
    _registerMeshWithPoseMatrix(mesh) {
        this._meshesWithPoseMatrix.push(mesh);
    }
    /**
     * @internal
     */
    _unregisterMeshWithPoseMatrix(mesh) {
        const index = this._meshesWithPoseMatrix.indexOf(mesh);
        if (index > -1) {
            this._meshesWithPoseMatrix.splice(index, 1);
        }
    }
    _computeTransformMatrices(targetMatrix, initialSkinMatrix) {
        this.onBeforeComputeObservable.notifyObservers(this);
        for (let index = 0; index < this.bones.length; index++) {
            const bone = this.bones[index];
            bone._childUpdateId++;
            const parentBone = bone.getParent();
            if (parentBone) {
                bone.getLocalMatrix().multiplyToRef(parentBone.getFinalMatrix(), bone.getFinalMatrix());
            }
            else {
                if (initialSkinMatrix) {
                    bone.getLocalMatrix().multiplyToRef(initialSkinMatrix, bone.getFinalMatrix());
                }
                else {
                    bone.getFinalMatrix().copyFrom(bone.getLocalMatrix());
                }
            }
            if (bone._index !== -1) {
                const mappedIndex = bone._index === null ? index : bone._index;
                bone.getAbsoluteInverseBindMatrix().multiplyToArray(bone.getFinalMatrix(), targetMatrix, mappedIndex * 16);
            }
        }
        this._identity.copyToArray(targetMatrix, this.bones.length * 16);
    }
    /**
     * Build all resources required to render a skeleton
     * @param dontCheckFrameId defines a boolean indicating if prepare should be run without checking first the current frame id (default: false)
     */
    prepare(dontCheckFrameId = false) {
        if (!dontCheckFrameId) {
            const currentRenderId = this.getScene().getRenderId();
            if (this._currentRenderId === currentRenderId) {
                return;
            }
            this._currentRenderId = currentRenderId;
        }
        // Update the local matrix of bones with linked transform nodes.
        if (this._numBonesWithLinkedTransformNode > 0) {
            for (const bone of this.bones) {
                if (bone._linkedTransformNode) {
                    const node = bone._linkedTransformNode;
                    bone.position = node.position;
                    if (node.rotationQuaternion) {
                        bone.rotationQuaternion = node.rotationQuaternion;
                    }
                    else {
                        bone.rotation = node.rotation;
                    }
                    bone.scaling = node.scaling;
                }
            }
        }
        if (this.needInitialSkinMatrix) {
            for (const mesh of this._meshesWithPoseMatrix) {
                const poseMatrix = mesh.getPoseMatrix();
                let needsUpdate = this._isDirty;
                if (!mesh._bonesTransformMatrices || mesh._bonesTransformMatrices.length !== 16 * (this.bones.length + 1)) {
                    mesh._bonesTransformMatrices = new Float32Array(16 * (this.bones.length + 1));
                    needsUpdate = true;
                }
                if (!needsUpdate) {
                    continue;
                }
                if (this._synchronizedWithMesh !== mesh) {
                    this._synchronizedWithMesh = mesh;
                    // Prepare bones
                    for (const bone of this.bones) {
                        if (!bone.getParent()) {
                            const matrix = bone.getBindMatrix();
                            matrix.multiplyToRef(poseMatrix, TmpVectors.Matrix[1]);
                            bone._updateAbsoluteBindMatrices(TmpVectors.Matrix[1]);
                        }
                    }
                    if (this.isUsingTextureForMatrices) {
                        const textureWidth = (this.bones.length + 1) * 4;
                        if (!mesh._transformMatrixTexture || mesh._transformMatrixTexture.getSize().width !== textureWidth) {
                            if (mesh._transformMatrixTexture) {
                                mesh._transformMatrixTexture.dispose();
                            }
                            mesh._transformMatrixTexture = RawTexture.CreateRGBATexture(mesh._bonesTransformMatrices, (this.bones.length + 1) * 4, 1, this._scene, false, false, 1, 1);
                        }
                    }
                }
                this._computeTransformMatrices(mesh._bonesTransformMatrices, poseMatrix);
                if (this.isUsingTextureForMatrices && mesh._transformMatrixTexture) {
                    mesh._transformMatrixTexture.update(mesh._bonesTransformMatrices);
                }
            }
        }
        else {
            if (!this._isDirty) {
                return;
            }
            if (!this._transformMatrices || this._transformMatrices.length !== 16 * (this.bones.length + 1)) {
                this._transformMatrices = new Float32Array(16 * (this.bones.length + 1));
                if (this.isUsingTextureForMatrices) {
                    if (this._transformMatrixTexture) {
                        this._transformMatrixTexture.dispose();
                    }
                    this._transformMatrixTexture = RawTexture.CreateRGBATexture(this._transformMatrices, (this.bones.length + 1) * 4, 1, this._scene, false, false, 1, 1);
                }
            }
            this._computeTransformMatrices(this._transformMatrices, null);
            if (this.isUsingTextureForMatrices && this._transformMatrixTexture) {
                this._transformMatrixTexture.update(this._transformMatrices);
            }
        }
        this._isDirty = false;
    }
    /**
     * Gets the list of animatables currently running for this skeleton
     * @returns an array of animatables
     */
    getAnimatables() {
        if (!this._animatables || this._animatables.length !== this.bones.length) {
            this._animatables = [];
            for (let index = 0; index < this.bones.length; index++) {
                this._animatables.push(this.bones[index]);
            }
        }
        return this._animatables;
    }
    /**
     * Clone the current skeleton
     * @param name defines the name of the new skeleton
     * @param id defines the id of the new skeleton
     * @returns the new skeleton
     */
    clone(name, id) {
        const result = new Skeleton(name, id || name, this._scene);
        result.needInitialSkinMatrix = this.needInitialSkinMatrix;
        for (let index = 0; index < this.bones.length; index++) {
            const source = this.bones[index];
            let parentBone = null;
            const parent = source.getParent();
            if (parent) {
                const parentIndex = this.bones.indexOf(parent);
                parentBone = result.bones[parentIndex];
            }
            const bone = new Bone(source.name, result, parentBone, source.getBindMatrix().clone(), source.getRestMatrix().clone());
            bone._index = source._index;
            if (source._linkedTransformNode) {
                bone.linkTransformNode(source._linkedTransformNode);
            }
            DeepCopier.DeepCopy(source.animations, bone.animations);
        }
        if (this._ranges) {
            result._ranges = {};
            for (const rangeName in this._ranges) {
                const range = this._ranges[rangeName];
                if (range) {
                    result._ranges[rangeName] = range.clone();
                }
            }
        }
        this._isDirty = true;
        result.prepare(true);
        return result;
    }
    /**
     * Enable animation blending for this skeleton
     * @param blendingSpeed defines the blending speed to apply
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-blending
     */
    enableBlending(blendingSpeed = 0.01) {
        this.bones.forEach((bone) => {
            bone.animations.forEach((animation) => {
                animation.enableBlending = true;
                animation.blendingSpeed = blendingSpeed;
            });
        });
    }
    /**
     * Releases all resources associated with the current skeleton
     */
    dispose() {
        this._meshesWithPoseMatrix.length = 0;
        // Animations
        this.getScene().stopAnimation(this);
        // Remove from scene
        this.getScene().removeSkeleton(this);
        if (this._parentContainer) {
            const index = this._parentContainer.skeletons.indexOf(this);
            if (index > -1) {
                this._parentContainer.skeletons.splice(index, 1);
            }
            this._parentContainer = null;
        }
        if (this._transformMatrixTexture) {
            this._transformMatrixTexture.dispose();
            this._transformMatrixTexture = null;
        }
    }
    /**
     * Serialize the skeleton in a JSON object
     * @returns a JSON object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.name = this.name;
        serializationObject.id = this.id;
        if (this.dimensionsAtRest) {
            serializationObject.dimensionsAtRest = this.dimensionsAtRest.asArray();
        }
        serializationObject.bones = [];
        serializationObject.needInitialSkinMatrix = this.needInitialSkinMatrix;
        for (let index = 0; index < this.bones.length; index++) {
            const bone = this.bones[index];
            const parent = bone.getParent();
            const serializedBone = {
                parentBoneIndex: parent ? this.bones.indexOf(parent) : -1,
                index: bone.getIndex(),
                name: bone.name,
                id: bone.id,
                matrix: bone.getBindMatrix().asArray(),
                rest: bone.getRestMatrix().asArray(),
                linkedTransformNodeId: bone.getTransformNode()?.id,
            };
            serializationObject.bones.push(serializedBone);
            if (bone.length) {
                serializedBone.length = bone.length;
            }
            if (bone.metadata) {
                serializedBone.metadata = bone.metadata;
            }
            if (bone.animations && bone.animations.length > 0) {
                serializedBone.animation = bone.animations[0].serialize();
            }
            serializationObject.ranges = [];
            for (const name in this._ranges) {
                const source = this._ranges[name];
                if (!source) {
                    continue;
                }
                const range = {};
                range.name = name;
                range.from = source.from;
                range.to = source.to;
                serializationObject.ranges.push(range);
            }
        }
        return serializationObject;
    }
    /**
     * Creates a new skeleton from serialized data
     * @param parsedSkeleton defines the serialized data
     * @param scene defines the hosting scene
     * @returns a new skeleton
     */
    static Parse(parsedSkeleton, scene) {
        const skeleton = new Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);
        if (parsedSkeleton.dimensionsAtRest) {
            skeleton.dimensionsAtRest = Vector3.FromArray(parsedSkeleton.dimensionsAtRest);
        }
        skeleton.needInitialSkinMatrix = parsedSkeleton.needInitialSkinMatrix;
        let index;
        for (index = 0; index < parsedSkeleton.bones.length; index++) {
            const parsedBone = parsedSkeleton.bones[index];
            const parsedBoneIndex = parsedSkeleton.bones[index].index;
            let parentBone = null;
            if (parsedBone.parentBoneIndex > -1) {
                parentBone = skeleton.bones[parsedBone.parentBoneIndex];
            }
            const rest = parsedBone.rest ? Matrix.FromArray(parsedBone.rest) : null;
            const bone = new Bone(parsedBone.name, skeleton, parentBone, Matrix.FromArray(parsedBone.matrix), rest, null, parsedBoneIndex);
            if (parsedBone.id !== undefined && parsedBone.id !== null) {
                bone.id = parsedBone.id;
            }
            if (parsedBone.length) {
                bone.length = parsedBone.length;
            }
            if (parsedBone.metadata) {
                bone.metadata = parsedBone.metadata;
            }
            if (parsedBone.animation) {
                bone.animations.push(Animation.Parse(parsedBone.animation));
            }
            if (parsedBone.linkedTransformNodeId !== undefined && parsedBone.linkedTransformNodeId !== null) {
                skeleton._hasWaitingData = true;
                bone._waitingTransformNodeId = parsedBone.linkedTransformNodeId;
            }
        }
        // placed after bones, so createAnimationRange can cascade down
        if (parsedSkeleton.ranges) {
            for (index = 0; index < parsedSkeleton.ranges.length; index++) {
                const data = parsedSkeleton.ranges[index];
                skeleton.createAnimationRange(data.name, data.from, data.to);
            }
        }
        return skeleton;
    }
    /**
     * Compute all node absolute matrices
     * @param forceUpdate defines if computation must be done even if cache is up to date
     */
    computeAbsoluteMatrices(forceUpdate = false) {
        if (this._absoluteTransformIsDirty || forceUpdate) {
            this.bones[0].computeAbsoluteMatrices();
            this._absoluteTransformIsDirty = false;
        }
    }
    /**
     * Compute all node absolute matrices
     * @param forceUpdate defines if computation must be done even if cache is up to date
     * @deprecated Please use computeAbsoluteMatrices instead
     */
    computeAbsoluteTransforms(forceUpdate = false) {
        this.computeAbsoluteMatrices(forceUpdate);
    }
    /**
     * Gets the root pose matrix
     * @returns a matrix
     */
    getPoseMatrix() {
        let poseMatrix = null;
        if (this._meshesWithPoseMatrix.length > 0) {
            poseMatrix = this._meshesWithPoseMatrix[0].getPoseMatrix();
        }
        return poseMatrix;
    }
    /**
     * Sorts bones per internal index
     */
    sortBones() {
        const bones = [];
        const visited = new Array(this.bones.length);
        for (let index = 0; index < this.bones.length; index++) {
            this._sortBones(index, bones, visited);
        }
        this.bones = bones;
    }
    _sortBones(index, bones, visited) {
        if (visited[index]) {
            return;
        }
        visited[index] = true;
        const bone = this.bones[index];
        if (!bone)
            return;
        if (bone._index === undefined) {
            bone._index = index;
        }
        const parentBone = bone.getParent();
        if (parentBone) {
            this._sortBones(this.bones.indexOf(parentBone), bones, visited);
        }
        bones.push(bone);
    }
    /**
     * Set the current local matrix as the restPose for all bones in the skeleton.
     */
    setCurrentPoseAsRest() {
        this.bones.forEach((b) => {
            b.setCurrentPoseAsRest();
        });
    }
}
//# sourceMappingURL=skeleton.js.map