import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsVector3, serializeAsQuaternion } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { Observable } from "../Misc/observable.js";
import { Quaternion, Matrix, Vector3, TmpVectors } from "../Maths/math.vector.js";
import { Node } from "../node.js";
import { GetClass } from "../Misc/typeStore.js";
const convertRHSToLHS = Matrix.Compose(Vector3.One(), Quaternion.FromEulerAngles(0, Math.PI, 0), Vector3.Zero());
/**
 * A TransformNode is an object that is not rendered but can be used as a center of transformation. This can decrease memory usage and increase rendering speed compared to using an empty mesh as a parent and is less complicated than using a pivot matrix.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/transform_node
 */
export class TransformNode extends Node {
    /**
     * Gets or sets the billboard mode. Default is 0.
     *
     * | Value | Type | Description |
     * | --- | --- | --- |
     * | 0 | BILLBOARDMODE_NONE |  |
     * | 1 | BILLBOARDMODE_X |  |
     * | 2 | BILLBOARDMODE_Y |  |
     * | 4 | BILLBOARDMODE_Z |  |
     * | 7 | BILLBOARDMODE_ALL |  |
     *
     */
    get billboardMode() {
        return this._billboardMode;
    }
    set billboardMode(value) {
        if (this._billboardMode === value) {
            return;
        }
        this._billboardMode = value;
        this._cache.useBillboardPosition = (this._billboardMode & TransformNode.BILLBOARDMODE_USE_POSITION) !== 0;
        this._computeUseBillboardPath();
    }
    /**
     * Gets or sets a boolean indicating that parent rotation should be preserved when using billboards.
     * This could be useful for glTF objects where parent rotation helps converting from right handed to left handed
     */
    get preserveParentRotationForBillboard() {
        return this._preserveParentRotationForBillboard;
    }
    set preserveParentRotationForBillboard(value) {
        if (value === this._preserveParentRotationForBillboard) {
            return;
        }
        this._preserveParentRotationForBillboard = value;
        this._computeUseBillboardPath();
    }
    _computeUseBillboardPath() {
        this._cache.useBillboardPath = this._billboardMode !== TransformNode.BILLBOARDMODE_NONE && !this.preserveParentRotationForBillboard;
    }
    /**
     * Gets or sets the distance of the object to max, often used by skybox
     */
    get infiniteDistance() {
        return this._infiniteDistance;
    }
    set infiniteDistance(value) {
        if (this._infiniteDistance === value) {
            return;
        }
        this._infiniteDistance = value;
    }
    constructor(name, scene = null, isPure = true) {
        super(name, scene, false);
        this._forward = new Vector3(0, 0, 1);
        this._up = new Vector3(0, 1, 0);
        this._right = new Vector3(1, 0, 0);
        // Properties
        this._position = Vector3.Zero();
        this._rotation = Vector3.Zero();
        this._rotationQuaternion = null;
        this._scaling = Vector3.One();
        this._transformToBoneReferal = null;
        this._isAbsoluteSynced = false;
        this._billboardMode = TransformNode.BILLBOARDMODE_NONE;
        this._preserveParentRotationForBillboard = false;
        /**
         * Multiplication factor on scale x/y/z when computing the world matrix. Eg. for a 1x1x1 cube setting this to 2 will make it a 2x2x2 cube
         */
        this.scalingDeterminant = 1;
        this._infiniteDistance = false;
        /**
         * Gets or sets a boolean indicating that non uniform scaling (when at least one component is different from others) should be ignored.
         * By default the system will update normals to compensate
         */
        this.ignoreNonUniformScaling = false;
        /**
         * Gets or sets a boolean indicating that even if rotationQuaternion is defined, you can keep updating rotation property and Babylon.js will just mix both
         */
        this.reIntegrateRotationIntoRotationQuaternion = false;
        // Cache
        /** @internal */
        this._poseMatrix = null;
        /** @internal */
        this._localMatrix = Matrix.Zero();
        this._usePivotMatrix = false;
        this._absolutePosition = Vector3.Zero();
        this._absoluteScaling = Vector3.Zero();
        this._absoluteRotationQuaternion = Quaternion.Identity();
        this._pivotMatrix = Matrix.Identity();
        /** @internal */
        this._postMultiplyPivotMatrix = false;
        this._isWorldMatrixFrozen = false;
        /** @internal */
        this._indexInSceneTransformNodesArray = -1;
        /**
         * An event triggered after the world matrix is updated
         */
        this.onAfterWorldMatrixUpdateObservable = new Observable();
        this._nonUniformScaling = false;
        if (isPure) {
            this.getScene().addTransformNode(this);
        }
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "TransformNode" string
     */
    getClassName() {
        return "TransformNode";
    }
    /**
     * Gets or set the node position (default is (0.0, 0.0, 0.0))
     */
    get position() {
        return this._position;
    }
    set position(newPosition) {
        this._position = newPosition;
        this._markAsDirtyInternal();
    }
    /**
     * return true if a pivot has been set
     * @returns true if a pivot matrix is used
     */
    isUsingPivotMatrix() {
        return this._usePivotMatrix;
    }
    /**
     * @returns true if pivot matrix must be cancelled in the world matrix. When this parameter is set to true (default), the inverse of the pivot matrix is also applied at the end to cancel the transformation effect.
     */
    isUsingPostMultiplyPivotMatrix() {
        return this._postMultiplyPivotMatrix;
    }
    /**
     * Gets or sets the rotation property : a Vector3 defining the rotation value in radians around each local axis X, Y, Z  (default is (0.0, 0.0, 0.0)).
     * If rotation quaternion is set, this Vector3 will be ignored and copy from the quaternion
     */
    get rotation() {
        return this._rotation;
    }
    set rotation(newRotation) {
        this._rotation = newRotation;
        this._rotationQuaternion = null;
        this._markAsDirtyInternal();
    }
    /**
     * Gets or sets the scaling property : a Vector3 defining the node scaling along each local axis X, Y, Z (default is (1.0, 1.0, 1.0)).
     */
    get scaling() {
        return this._scaling;
    }
    set scaling(newScaling) {
        this._scaling = newScaling;
        this._markAsDirtyInternal();
    }
    /**
     * Gets or sets the rotation Quaternion property : this a Quaternion object defining the node rotation by using a unit quaternion (undefined by default, but can be null).
     * If set, only the rotationQuaternion is then used to compute the node rotation (ie. node.rotation will be ignored)
     */
    get rotationQuaternion() {
        return this._rotationQuaternion;
    }
    set rotationQuaternion(quaternion) {
        this._rotationQuaternion = quaternion;
        //reset the rotation vector.
        if (quaternion) {
            this._rotation.setAll(0.0);
        }
        this._markAsDirtyInternal();
    }
    _markAsDirtyInternal() {
        if (this._isDirty) {
            return;
        }
        this._isDirty = true;
        if (this.customMarkAsDirty) {
            this.customMarkAsDirty();
        }
    }
    /**
     * The forward direction of that transform in world space.
     */
    get forward() {
        Vector3.TransformNormalFromFloatsToRef(0, 0, this.getScene().useRightHandedSystem ? -1.0 : 1.0, this.getWorldMatrix(), this._forward);
        return this._forward.normalize();
    }
    /**
     * The up direction of that transform in world space.
     */
    get up() {
        Vector3.TransformNormalFromFloatsToRef(0, 1, 0, this.getWorldMatrix(), this._up);
        return this._up.normalize();
    }
    /**
     * The right direction of that transform in world space.
     */
    get right() {
        Vector3.TransformNormalFromFloatsToRef(this.getScene().useRightHandedSystem ? -1.0 : 1.0, 0, 0, this.getWorldMatrix(), this._right);
        return this._right.normalize();
    }
    /**
     * Copies the parameter passed Matrix into the mesh Pose matrix.
     * @param matrix the matrix to copy the pose from
     * @returns this TransformNode.
     */
    updatePoseMatrix(matrix) {
        if (!this._poseMatrix) {
            this._poseMatrix = matrix.clone();
            return this;
        }
        this._poseMatrix.copyFrom(matrix);
        return this;
    }
    /**
     * Returns the mesh Pose matrix.
     * @returns the pose matrix
     */
    getPoseMatrix() {
        if (!this._poseMatrix) {
            this._poseMatrix = Matrix.Identity();
        }
        return this._poseMatrix;
    }
    /** @internal */
    _isSynchronized() {
        const cache = this._cache;
        if (this._billboardMode !== cache.billboardMode || this._billboardMode !== TransformNode.BILLBOARDMODE_NONE) {
            return false;
        }
        if (cache.pivotMatrixUpdated) {
            return false;
        }
        if (this._infiniteDistance) {
            return false;
        }
        if (this._position._isDirty) {
            return false;
        }
        if (this._scaling._isDirty) {
            return false;
        }
        if ((this._rotationQuaternion && this._rotationQuaternion._isDirty) || this._rotation._isDirty) {
            return false;
        }
        return true;
    }
    /** @internal */
    _initCache() {
        super._initCache();
        const cache = this._cache;
        cache.localMatrixUpdated = false;
        cache.billboardMode = -1;
        cache.infiniteDistance = false;
        cache.useBillboardPosition = false;
        cache.useBillboardPath = false;
    }
    /**
     * Returns the current mesh absolute position.
     * Returns a Vector3.
     */
    get absolutePosition() {
        return this.getAbsolutePosition();
    }
    /**
     * Returns the current mesh absolute scaling.
     * Returns a Vector3.
     */
    get absoluteScaling() {
        this._syncAbsoluteScalingAndRotation();
        return this._absoluteScaling;
    }
    /**
     * Returns the current mesh absolute rotation.
     * Returns a Quaternion.
     */
    get absoluteRotationQuaternion() {
        this._syncAbsoluteScalingAndRotation();
        return this._absoluteRotationQuaternion;
    }
    /**
     * Sets a new matrix to apply before all other transformation
     * @param matrix defines the transform matrix
     * @returns the current TransformNode
     */
    setPreTransformMatrix(matrix) {
        return this.setPivotMatrix(matrix, false);
    }
    /**
     * Sets a new pivot matrix to the current node
     * @param matrix defines the new pivot matrix to use
     * @param postMultiplyPivotMatrix defines if the pivot matrix must be cancelled in the world matrix. When this parameter is set to true (default), the inverse of the pivot matrix is also applied at the end to cancel the transformation effect
     * @returns the current TransformNode
     */
    setPivotMatrix(matrix, postMultiplyPivotMatrix = true) {
        this._pivotMatrix.copyFrom(matrix);
        this._usePivotMatrix = !this._pivotMatrix.isIdentity();
        this._cache.pivotMatrixUpdated = true;
        this._postMultiplyPivotMatrix = postMultiplyPivotMatrix;
        if (this._postMultiplyPivotMatrix) {
            if (!this._pivotMatrixInverse) {
                this._pivotMatrixInverse = Matrix.Invert(this._pivotMatrix);
            }
            else {
                this._pivotMatrix.invertToRef(this._pivotMatrixInverse);
            }
        }
        return this;
    }
    /**
     * Returns the mesh pivot matrix.
     * Default : Identity.
     * @returns the matrix
     */
    getPivotMatrix() {
        return this._pivotMatrix;
    }
    /**
     * Instantiate (when possible) or clone that node with its hierarchy
     * @param newParent defines the new parent to use for the instance (or clone)
     * @param options defines options to configure how copy is done
     * @param options.doNotInstantiate defines if the model must be instantiated or just cloned
     * @param onNewNodeCreated defines an option callback to call when a clone or an instance is created
     * @returns an instance (or a clone) of the current node with its hierarchy
     */
    instantiateHierarchy(newParent = null, options, onNewNodeCreated) {
        const clone = this.clone("Clone of " + (this.name || this.id), newParent || this.parent, true);
        if (clone) {
            if (onNewNodeCreated) {
                onNewNodeCreated(this, clone);
            }
        }
        for (const child of this.getChildTransformNodes(true)) {
            child.instantiateHierarchy(clone, options, onNewNodeCreated);
        }
        return clone;
    }
    /**
     * Prevents the World matrix to be computed any longer
     * @param newWorldMatrix defines an optional matrix to use as world matrix
     * @param decompose defines whether to decompose the given newWorldMatrix or directly assign
     * @returns the TransformNode.
     */
    freezeWorldMatrix(newWorldMatrix = null, decompose = false) {
        if (newWorldMatrix) {
            if (decompose) {
                this._rotation.setAll(0);
                this._rotationQuaternion = this._rotationQuaternion || Quaternion.Identity();
                newWorldMatrix.decompose(this._scaling, this._rotationQuaternion, this._position);
                this.computeWorldMatrix(true);
            }
            else {
                this._worldMatrix = newWorldMatrix;
                this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);
                this._afterComputeWorldMatrix();
            }
        }
        else {
            this._isWorldMatrixFrozen = false; // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
        }
        this._isDirty = false;
        this._isWorldMatrixFrozen = true;
        return this;
    }
    /**
     * Allows back the World matrix computation.
     * @returns the TransformNode.
     */
    unfreezeWorldMatrix() {
        this._isWorldMatrixFrozen = false;
        this.computeWorldMatrix(true);
        return this;
    }
    /**
     * True if the World matrix has been frozen.
     */
    get isWorldMatrixFrozen() {
        return this._isWorldMatrixFrozen;
    }
    /**
     * Returns the mesh absolute position in the World.
     * @returns a Vector3.
     */
    getAbsolutePosition() {
        this.computeWorldMatrix();
        return this._absolutePosition;
    }
    /**
     * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
     * @param absolutePosition the absolute position to set
     * @returns the TransformNode.
     */
    setAbsolutePosition(absolutePosition) {
        if (!absolutePosition) {
            return this;
        }
        let absolutePositionX;
        let absolutePositionY;
        let absolutePositionZ;
        if (absolutePosition.x === undefined) {
            if (arguments.length < 3) {
                return this;
            }
            absolutePositionX = arguments[0];
            absolutePositionY = arguments[1];
            absolutePositionZ = arguments[2];
        }
        else {
            absolutePositionX = absolutePosition.x;
            absolutePositionY = absolutePosition.y;
            absolutePositionZ = absolutePosition.z;
        }
        if (this.parent) {
            const invertParentWorldMatrix = TmpVectors.Matrix[0];
            this.parent.getWorldMatrix().invertToRef(invertParentWorldMatrix);
            Vector3.TransformCoordinatesFromFloatsToRef(absolutePositionX, absolutePositionY, absolutePositionZ, invertParentWorldMatrix, this.position);
        }
        else {
            this.position.x = absolutePositionX;
            this.position.y = absolutePositionY;
            this.position.z = absolutePositionZ;
        }
        this._absolutePosition.copyFrom(absolutePosition);
        return this;
    }
    /**
     * Sets the mesh position in its local space.
     * @param vector3 the position to set in localspace
     * @returns the TransformNode.
     */
    setPositionWithLocalVector(vector3) {
        this.computeWorldMatrix();
        this.position = Vector3.TransformNormal(vector3, this._localMatrix);
        return this;
    }
    /**
     * Returns the mesh position in the local space from the current World matrix values.
     * @returns a new Vector3.
     */
    getPositionExpressedInLocalSpace() {
        this.computeWorldMatrix();
        const invLocalWorldMatrix = TmpVectors.Matrix[0];
        this._localMatrix.invertToRef(invLocalWorldMatrix);
        return Vector3.TransformNormal(this.position, invLocalWorldMatrix);
    }
    /**
     * Translates the mesh along the passed Vector3 in its local space.
     * @param vector3 the distance to translate in localspace
     * @returns the TransformNode.
     */
    locallyTranslate(vector3) {
        this.computeWorldMatrix(true);
        this.position = Vector3.TransformCoordinates(vector3, this._localMatrix);
        return this;
    }
    /**
     * Orients a mesh towards a target point. Mesh must be drawn facing user.
     * @param targetPoint the position (must be in same space as current mesh) to look at
     * @param yawCor optional yaw (y-axis) correction in radians
     * @param pitchCor optional pitch (x-axis) correction in radians
     * @param rollCor optional roll (z-axis) correction in radians
     * @param space the chosen space of the target
     * @returns the TransformNode.
     */
    lookAt(targetPoint, yawCor = 0, pitchCor = 0, rollCor = 0, space = 0 /* Space.LOCAL */) {
        const dv = TransformNode._LookAtVectorCache;
        const pos = space === 0 /* Space.LOCAL */ ? this.position : this.getAbsolutePosition();
        targetPoint.subtractToRef(pos, dv);
        this.setDirection(dv, yawCor, pitchCor, rollCor);
        // Correct for parent's rotation offset
        if (space === 1 /* Space.WORLD */ && this.parent) {
            if (this.rotationQuaternion) {
                // Get local rotation matrix of the looking object
                const rotationMatrix = TmpVectors.Matrix[0];
                this.rotationQuaternion.toRotationMatrix(rotationMatrix);
                // Offset rotation by parent's inverted rotation matrix to correct in world space
                const parentRotationMatrix = TmpVectors.Matrix[1];
                this.parent.getWorldMatrix().getRotationMatrixToRef(parentRotationMatrix);
                parentRotationMatrix.invert();
                rotationMatrix.multiplyToRef(parentRotationMatrix, rotationMatrix);
                this.rotationQuaternion.fromRotationMatrix(rotationMatrix);
            }
            else {
                // Get local rotation matrix of the looking object
                const quaternionRotation = TmpVectors.Quaternion[0];
                Quaternion.FromEulerVectorToRef(this.rotation, quaternionRotation);
                const rotationMatrix = TmpVectors.Matrix[0];
                quaternionRotation.toRotationMatrix(rotationMatrix);
                // Offset rotation by parent's inverted rotation matrix to correct in world space
                const parentRotationMatrix = TmpVectors.Matrix[1];
                this.parent.getWorldMatrix().getRotationMatrixToRef(parentRotationMatrix);
                parentRotationMatrix.invert();
                rotationMatrix.multiplyToRef(parentRotationMatrix, rotationMatrix);
                quaternionRotation.fromRotationMatrix(rotationMatrix);
                quaternionRotation.toEulerAnglesToRef(this.rotation);
            }
        }
        return this;
    }
    /**
     * Returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
     * This Vector3 is expressed in the World space.
     * @param localAxis axis to rotate
     * @returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
     */
    getDirection(localAxis) {
        const result = Vector3.Zero();
        this.getDirectionToRef(localAxis, result);
        return result;
    }
    /**
     * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
     * localAxis is expressed in the mesh local space.
     * result is computed in the World space from the mesh World matrix.
     * @param localAxis axis to rotate
     * @param result the resulting transformnode
     * @returns this TransformNode.
     */
    getDirectionToRef(localAxis, result) {
        Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
        return this;
    }
    /**
     * Sets this transform node rotation to the given local axis.
     * @param localAxis the axis in local space
     * @param yawCor optional yaw (y-axis) correction in radians
     * @param pitchCor optional pitch (x-axis) correction in radians
     * @param rollCor optional roll (z-axis) correction in radians
     * @returns this TransformNode
     */
    setDirection(localAxis, yawCor = 0, pitchCor = 0, rollCor = 0) {
        const yaw = -Math.atan2(localAxis.z, localAxis.x) + Math.PI / 2;
        const len = Math.sqrt(localAxis.x * localAxis.x + localAxis.z * localAxis.z);
        const pitch = -Math.atan2(localAxis.y, len);
        if (this.rotationQuaternion) {
            Quaternion.RotationYawPitchRollToRef(yaw + yawCor, pitch + pitchCor, rollCor, this.rotationQuaternion);
        }
        else {
            this.rotation.x = pitch + pitchCor;
            this.rotation.y = yaw + yawCor;
            this.rotation.z = rollCor;
        }
        return this;
    }
    /**
     * Sets a new pivot point to the current node
     * @param point defines the new pivot point to use
     * @param space defines if the point is in world or local space (local by default)
     * @returns the current TransformNode
     */
    setPivotPoint(point, space = 0 /* Space.LOCAL */) {
        if (this.getScene().getRenderId() == 0) {
            this.computeWorldMatrix(true);
        }
        const wm = this.getWorldMatrix();
        if (space == 1 /* Space.WORLD */) {
            const tmat = TmpVectors.Matrix[0];
            wm.invertToRef(tmat);
            point = Vector3.TransformCoordinates(point, tmat);
        }
        return this.setPivotMatrix(Matrix.Translation(-point.x, -point.y, -point.z), true);
    }
    /**
     * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.
     * @returns the pivot point
     */
    getPivotPoint() {
        const point = Vector3.Zero();
        this.getPivotPointToRef(point);
        return point;
    }
    /**
     * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.
     * @param result the vector3 to store the result
     * @returns this TransformNode.
     */
    getPivotPointToRef(result) {
        result.x = -this._pivotMatrix.m[12];
        result.y = -this._pivotMatrix.m[13];
        result.z = -this._pivotMatrix.m[14];
        return this;
    }
    /**
     * Returns a new Vector3 set with the mesh pivot point World coordinates.
     * @returns a new Vector3 set with the mesh pivot point World coordinates.
     */
    getAbsolutePivotPoint() {
        const point = Vector3.Zero();
        this.getAbsolutePivotPointToRef(point);
        return point;
    }
    /**
     * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.
     * @param result vector3 to store the result
     * @returns this TransformNode.
     */
    getAbsolutePivotPointToRef(result) {
        this.getPivotPointToRef(result);
        Vector3.TransformCoordinatesToRef(result, this.getWorldMatrix(), result);
        return this;
    }
    /**
     * Flag the transform node as dirty (Forcing it to update everything)
     * @param property if set to "rotation" the objects rotationQuaternion will be set to null
     * @returns this  node
     */
    markAsDirty(property) {
        if (this._isDirty) {
            return this;
        }
        // We need to explicitly update the children
        // as the scene.evaluateActiveMeshes will not poll the transform nodes
        if (this._children) {
            for (const child of this._children) {
                child.markAsDirty(property);
            }
        }
        return super.markAsDirty(property);
    }
    /**
     * Defines the passed node as the parent of the current node.
     * The node will remain exactly where it is and its position / rotation will be updated accordingly.
     * If you don't want to preserve the current rotation / position, assign the parent through parent accessor.
     * Note that if the mesh has a pivot matrix / point defined it will be applied after the parent was updated.
     * In that case the node will not remain in the same space as it is, as the pivot will be applied.
     * To avoid this, you can set updatePivot to true and the pivot will be updated to identity
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/parent
     * @param node the node ot set as the parent
     * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
     * @param updatePivot if true, update the pivot matrix to keep the node in the same space as before
     * @returns this TransformNode.
     */
    setParent(node, preserveScalingSign = false, updatePivot = false) {
        if (!node && !this.parent) {
            return this;
        }
        const quatRotation = TmpVectors.Quaternion[0];
        const position = TmpVectors.Vector3[0];
        const scale = TmpVectors.Vector3[1];
        const invParentMatrix = TmpVectors.Matrix[1];
        Matrix.IdentityToRef(invParentMatrix);
        const composedMatrix = TmpVectors.Matrix[0];
        this.computeWorldMatrix(true);
        let currentRotation = this.rotationQuaternion;
        if (!currentRotation) {
            currentRotation = TransformNode._TmpRotation;
            Quaternion.RotationYawPitchRollToRef(this._rotation.y, this._rotation.x, this._rotation.z, currentRotation);
        }
        // current global transformation without pivot
        Matrix.ComposeToRef(this.scaling, currentRotation, this.position, composedMatrix);
        if (this.parent) {
            composedMatrix.multiplyToRef(this.parent.computeWorldMatrix(true), composedMatrix);
        }
        // is a node was set, calculate the difference between this and the node
        if (node) {
            node.computeWorldMatrix(true).invertToRef(invParentMatrix);
            composedMatrix.multiplyToRef(invParentMatrix, composedMatrix);
        }
        composedMatrix.decompose(scale, quatRotation, position, preserveScalingSign ? this : undefined);
        if (this.rotationQuaternion) {
            this.rotationQuaternion.copyFrom(quatRotation);
        }
        else {
            quatRotation.toEulerAnglesToRef(this.rotation);
        }
        this.scaling.copyFrom(scale);
        this.position.copyFrom(position);
        this.parent = node;
        if (updatePivot) {
            this.setPivotMatrix(Matrix.Identity());
        }
        return this;
    }
    /**
     * Adds the passed mesh as a child to the current mesh.
     * The node will remain exactly where it is and its position / rotation will be updated accordingly.
     * This method is equivalent to calling setParent().
     * @param mesh defines the child mesh
     * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
     * @returns the current mesh
     */
    addChild(mesh, preserveScalingSign = false) {
        mesh.setParent(this, preserveScalingSign);
        return this;
    }
    /**
     * Removes the passed mesh from the current mesh children list
     * @param mesh defines the child mesh
     * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
     * @returns the current mesh
     */
    removeChild(mesh, preserveScalingSign = false) {
        if (mesh.parent !== this)
            return this;
        mesh.setParent(null, preserveScalingSign);
        return this;
    }
    /**
     * True if the scaling property of this object is non uniform eg. (1,2,1)
     */
    get nonUniformScaling() {
        return this._nonUniformScaling;
    }
    /**
     * @internal
     */
    _updateNonUniformScalingState(value) {
        if (this._nonUniformScaling === value) {
            return false;
        }
        this._nonUniformScaling = value;
        return true;
    }
    /**
     * Attach the current TransformNode to another TransformNode associated with a bone
     * @param bone Bone affecting the TransformNode
     * @param affectedTransformNode TransformNode associated with the bone
     * @returns this object
     */
    attachToBone(bone, affectedTransformNode) {
        this._currentParentWhenAttachingToBone = this.parent;
        this._transformToBoneReferal = affectedTransformNode;
        this.parent = bone;
        bone.getSkeleton().prepare(true); // make sure bone.getFinalMatrix() is up to date
        if (bone.getFinalMatrix().determinant() < 0) {
            this.scalingDeterminant *= -1;
        }
        return this;
    }
    /**
     * Detach the transform node if its associated with a bone
     * @param resetToPreviousParent Indicates if the parent that was in effect when attachToBone was called should be set back or if we should set parent to null instead (defaults to the latter)
     * @returns this object
     */
    detachFromBone(resetToPreviousParent = false) {
        if (!this.parent) {
            if (resetToPreviousParent) {
                this.parent = this._currentParentWhenAttachingToBone;
            }
            return this;
        }
        if (this.parent.getWorldMatrix().determinant() < 0) {
            this.scalingDeterminant *= -1;
        }
        this._transformToBoneReferal = null;
        if (resetToPreviousParent) {
            this.parent = this._currentParentWhenAttachingToBone;
        }
        else {
            this.parent = null;
        }
        return this;
    }
    /**
     * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.
     * space (default LOCAL) can be either Space.LOCAL, either Space.WORLD.
     * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
     * The passed axis is also normalized.
     * @param axis the axis to rotate around
     * @param amount the amount to rotate in radians
     * @param space Space to rotate in (Default: local)
     * @returns the TransformNode.
     */
    rotate(axis, amount, space) {
        axis.normalize();
        if (!this.rotationQuaternion) {
            this.rotationQuaternion = this.rotation.toQuaternion();
            this.rotation.setAll(0);
        }
        let rotationQuaternion;
        if (!space || space === 0 /* Space.LOCAL */) {
            rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, TransformNode._RotationAxisCache);
            this.rotationQuaternion.multiplyToRef(rotationQuaternion, this.rotationQuaternion);
        }
        else {
            if (this.parent) {
                const parentWorldMatrix = this.parent.getWorldMatrix();
                const invertParentWorldMatrix = TmpVectors.Matrix[0];
                parentWorldMatrix.invertToRef(invertParentWorldMatrix);
                axis = Vector3.TransformNormal(axis, invertParentWorldMatrix);
                if (parentWorldMatrix.determinant() < 0) {
                    amount *= -1;
                }
            }
            rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, TransformNode._RotationAxisCache);
            rotationQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
        }
        return this;
    }
    /**
     * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.
     * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
     * The passed axis is also normalized. .
     * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
     * @param point the point to rotate around
     * @param axis the axis to rotate around
     * @param amount the amount to rotate in radians
     * @returns the TransformNode
     */
    rotateAround(point, axis, amount) {
        axis.normalize();
        if (!this.rotationQuaternion) {
            this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
            this.rotation.setAll(0);
        }
        const tmpVector = TmpVectors.Vector3[0];
        const finalScale = TmpVectors.Vector3[1];
        const finalTranslation = TmpVectors.Vector3[2];
        const finalRotation = TmpVectors.Quaternion[0];
        const translationMatrix = TmpVectors.Matrix[0]; // T
        const translationMatrixInv = TmpVectors.Matrix[1]; // T'
        const rotationMatrix = TmpVectors.Matrix[2]; // R
        const finalMatrix = TmpVectors.Matrix[3]; // T' x R x T
        point.subtractToRef(this.position, tmpVector);
        Matrix.TranslationToRef(tmpVector.x, tmpVector.y, tmpVector.z, translationMatrix); // T
        Matrix.TranslationToRef(-tmpVector.x, -tmpVector.y, -tmpVector.z, translationMatrixInv); // T'
        Matrix.RotationAxisToRef(axis, amount, rotationMatrix); // R
        translationMatrixInv.multiplyToRef(rotationMatrix, finalMatrix); // T' x R
        finalMatrix.multiplyToRef(translationMatrix, finalMatrix); // T' x R x T
        finalMatrix.decompose(finalScale, finalRotation, finalTranslation);
        this.position.addInPlace(finalTranslation);
        finalRotation.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
        return this;
    }
    /**
     * Translates the mesh along the axis vector for the passed distance in the given space.
     * space (default LOCAL) can be either Space.LOCAL, either Space.WORLD.
     * @param axis the axis to translate in
     * @param distance the distance to translate
     * @param space Space to rotate in (Default: local)
     * @returns the TransformNode.
     */
    translate(axis, distance, space) {
        const displacementVector = axis.scale(distance);
        if (!space || space === 0 /* Space.LOCAL */) {
            const tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
            this.setPositionWithLocalVector(tempV3);
        }
        else {
            this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
        }
        return this;
    }
    /**
     * Adds a rotation step to the mesh current rotation.
     * x, y, z are Euler angles expressed in radians.
     * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.
     * This means this rotation is made in the mesh local space only.
     * It's useful to set a custom rotation order different from the BJS standard one YXZ.
     * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.
     * ```javascript
     * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
     * ```
     * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.
     * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.
     * @param x Rotation to add
     * @param y Rotation to add
     * @param z Rotation to add
     * @returns the TransformNode.
     */
    addRotation(x, y, z) {
        let rotationQuaternion;
        if (this.rotationQuaternion) {
            rotationQuaternion = this.rotationQuaternion;
        }
        else {
            rotationQuaternion = TmpVectors.Quaternion[1];
            Quaternion.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, rotationQuaternion);
        }
        const accumulation = TmpVectors.Quaternion[0];
        Quaternion.RotationYawPitchRollToRef(y, x, z, accumulation);
        rotationQuaternion.multiplyInPlace(accumulation);
        if (!this.rotationQuaternion) {
            rotationQuaternion.toEulerAnglesToRef(this.rotation);
        }
        return this;
    }
    /**
     * @internal
     */
    _getEffectiveParent() {
        return this.parent;
    }
    /**
     * Returns whether the transform node world matrix computation needs the camera information to be computed.
     * This is the case when the node is a billboard or has an infinite distance for instance.
     * @returns true if the world matrix computation needs the camera information to be computed
     */
    isWorldMatrixCameraDependent() {
        return (this._infiniteDistance && !this.parent) || (this._billboardMode !== TransformNode.BILLBOARDMODE_NONE && !this.preserveParentRotationForBillboard);
    }
    /**
     * Computes the world matrix of the node
     * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
     * @param camera defines the camera used if different from the scene active camera (This is used with modes like Billboard or infinite distance)
     * @returns the world matrix
     */
    computeWorldMatrix(force = false, camera = null) {
        if (this._isWorldMatrixFrozen && !this._isDirty) {
            return this._worldMatrix;
        }
        const currentRenderId = this.getScene().getRenderId();
        if (!this._isDirty && !force && (this._currentRenderId === currentRenderId || this.isSynchronized())) {
            this._currentRenderId = currentRenderId;
            return this._worldMatrix;
        }
        camera = camera || this.getScene().activeCamera;
        this._updateCache();
        const cache = this._cache;
        cache.pivotMatrixUpdated = false;
        cache.billboardMode = this.billboardMode;
        cache.infiniteDistance = this.infiniteDistance;
        cache.parent = this._parentNode;
        this._currentRenderId = currentRenderId;
        this._childUpdateId += 1;
        this._isDirty = false;
        this._position._isDirty = false;
        this._rotation._isDirty = false;
        this._scaling._isDirty = false;
        const parent = this._getEffectiveParent();
        // Scaling
        const scaling = TransformNode._TmpScaling;
        let translation = this._position;
        // Translation
        if (this._infiniteDistance) {
            if (!this.parent && camera) {
                const cameraWorldMatrix = camera.getWorldMatrix();
                const cameraGlobalPosition = new Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);
                translation = TransformNode._TmpTranslation;
                translation.copyFromFloats(this._position.x + cameraGlobalPosition.x, this._position.y + cameraGlobalPosition.y, this._position.z + cameraGlobalPosition.z);
            }
        }
        // Scaling
        scaling.copyFromFloats(this._scaling.x * this.scalingDeterminant, this._scaling.y * this.scalingDeterminant, this._scaling.z * this.scalingDeterminant);
        // Rotation
        let rotation;
        if (this._rotationQuaternion) {
            this._rotationQuaternion._isDirty = false;
            rotation = this._rotationQuaternion;
            if (this.reIntegrateRotationIntoRotationQuaternion) {
                const len = this.rotation.lengthSquared();
                if (len) {
                    this._rotationQuaternion.multiplyInPlace(Quaternion.RotationYawPitchRoll(this._rotation.y, this._rotation.x, this._rotation.z));
                    this._rotation.copyFromFloats(0, 0, 0);
                }
            }
        }
        else {
            rotation = TransformNode._TmpRotation;
            Quaternion.RotationYawPitchRollToRef(this._rotation.y, this._rotation.x, this._rotation.z, rotation);
        }
        // Compose
        if (this._usePivotMatrix) {
            const scaleMatrix = TmpVectors.Matrix[1];
            Matrix.ScalingToRef(scaling.x, scaling.y, scaling.z, scaleMatrix);
            // Rotation
            const rotationMatrix = TmpVectors.Matrix[0];
            rotation.toRotationMatrix(rotationMatrix);
            // Composing transformations
            this._pivotMatrix.multiplyToRef(scaleMatrix, TmpVectors.Matrix[4]);
            TmpVectors.Matrix[4].multiplyToRef(rotationMatrix, this._localMatrix);
            // Post multiply inverse of pivotMatrix
            if (this._postMultiplyPivotMatrix) {
                this._localMatrix.multiplyToRef(this._pivotMatrixInverse, this._localMatrix);
            }
            this._localMatrix.addTranslationFromFloats(translation.x, translation.y, translation.z);
        }
        else {
            Matrix.ComposeToRef(scaling, rotation, translation, this._localMatrix);
        }
        // Parent
        if (parent && parent.getWorldMatrix) {
            if (force) {
                parent.computeWorldMatrix(force);
            }
            if (cache.useBillboardPath) {
                if (this._transformToBoneReferal) {
                    const bone = this.parent;
                    bone.getSkeleton().prepare();
                    bone.getFinalMatrix().multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), TmpVectors.Matrix[7]);
                }
                else {
                    TmpVectors.Matrix[7].copyFrom(parent.getWorldMatrix());
                }
                // Extract scaling and translation from parent
                const translation = TmpVectors.Vector3[5];
                const scale = TmpVectors.Vector3[6];
                const orientation = TmpVectors.Quaternion[0];
                TmpVectors.Matrix[7].decompose(scale, orientation, translation);
                Matrix.ScalingToRef(scale.x, scale.y, scale.z, TmpVectors.Matrix[7]);
                TmpVectors.Matrix[7].setTranslation(translation);
                if (TransformNode.BillboardUseParentOrientation) {
                    // set localMatrix translation to be transformed against parent's orientation.
                    this._position.applyRotationQuaternionToRef(orientation, translation);
                    this._localMatrix.setTranslation(translation);
                }
                this._localMatrix.multiplyToRef(TmpVectors.Matrix[7], this._worldMatrix);
            }
            else {
                if (this._transformToBoneReferal) {
                    const bone = this.parent;
                    bone.getSkeleton().prepare();
                    this._localMatrix.multiplyToRef(bone.getFinalMatrix(), TmpVectors.Matrix[6]);
                    TmpVectors.Matrix[6].multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), this._worldMatrix);
                }
                else {
                    this._localMatrix.multiplyToRef(parent.getWorldMatrix(), this._worldMatrix);
                }
            }
            this._markSyncedWithParent();
        }
        else {
            this._worldMatrix.copyFrom(this._localMatrix);
        }
        // Billboarding based on camera orientation (testing PG:http://www.babylonjs-playground.com/#UJEIL#13)
        if (cache.useBillboardPath && camera && this.billboardMode && !cache.useBillboardPosition) {
            const storedTranslation = TmpVectors.Vector3[0];
            this._worldMatrix.getTranslationToRef(storedTranslation); // Save translation
            // Cancel camera rotation
            TmpVectors.Matrix[1].copyFrom(camera.getViewMatrix());
            if (this._scene.useRightHandedSystem) {
                TmpVectors.Matrix[1].multiplyToRef(convertRHSToLHS, TmpVectors.Matrix[1]);
            }
            TmpVectors.Matrix[1].setTranslationFromFloats(0, 0, 0);
            TmpVectors.Matrix[1].invertToRef(TmpVectors.Matrix[0]);
            if ((this.billboardMode & TransformNode.BILLBOARDMODE_ALL) !== TransformNode.BILLBOARDMODE_ALL) {
                TmpVectors.Matrix[0].decompose(undefined, TmpVectors.Quaternion[0], undefined);
                const eulerAngles = TmpVectors.Vector3[1];
                TmpVectors.Quaternion[0].toEulerAnglesToRef(eulerAngles);
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_X) !== TransformNode.BILLBOARDMODE_X) {
                    eulerAngles.x = 0;
                }
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_Y) !== TransformNode.BILLBOARDMODE_Y) {
                    eulerAngles.y = 0;
                }
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_Z) !== TransformNode.BILLBOARDMODE_Z) {
                    eulerAngles.z = 0;
                }
                Matrix.RotationYawPitchRollToRef(eulerAngles.y, eulerAngles.x, eulerAngles.z, TmpVectors.Matrix[0]);
            }
            this._worldMatrix.setTranslationFromFloats(0, 0, 0);
            this._worldMatrix.multiplyToRef(TmpVectors.Matrix[0], this._worldMatrix);
            // Restore translation
            this._worldMatrix.setTranslation(TmpVectors.Vector3[0]);
        }
        // Billboarding based on camera position
        else if (cache.useBillboardPath && camera && cache.useBillboardPosition) {
            const storedTranslation = TmpVectors.Vector3[0];
            // Save translation
            this._worldMatrix.getTranslationToRef(storedTranslation);
            // Compute camera position in local space
            const cameraPosition = camera.globalPosition;
            this._worldMatrix.invertToRef(TmpVectors.Matrix[1]);
            const camInObjSpace = TmpVectors.Vector3[1];
            Vector3.TransformCoordinatesToRef(cameraPosition, TmpVectors.Matrix[1], camInObjSpace);
            camInObjSpace.normalize();
            // Find the lookAt info in local space
            const yaw = -Math.atan2(camInObjSpace.z, camInObjSpace.x) + Math.PI / 2;
            const len = Math.sqrt(camInObjSpace.x * camInObjSpace.x + camInObjSpace.z * camInObjSpace.z);
            const pitch = -Math.atan2(camInObjSpace.y, len);
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, 0, TmpVectors.Quaternion[0]);
            if ((this.billboardMode & TransformNode.BILLBOARDMODE_ALL) !== TransformNode.BILLBOARDMODE_ALL) {
                const eulerAngles = TmpVectors.Vector3[1];
                TmpVectors.Quaternion[0].toEulerAnglesToRef(eulerAngles);
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_X) !== TransformNode.BILLBOARDMODE_X) {
                    eulerAngles.x = 0;
                }
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_Y) !== TransformNode.BILLBOARDMODE_Y) {
                    eulerAngles.y = 0;
                }
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_Z) !== TransformNode.BILLBOARDMODE_Z) {
                    eulerAngles.z = 0;
                }
                Matrix.RotationYawPitchRollToRef(eulerAngles.y, eulerAngles.x, eulerAngles.z, TmpVectors.Matrix[0]);
            }
            else {
                Matrix.FromQuaternionToRef(TmpVectors.Quaternion[0], TmpVectors.Matrix[0]);
            }
            // Cancel translation
            this._worldMatrix.setTranslationFromFloats(0, 0, 0);
            // Rotate according to lookat (diff from local to lookat)
            this._worldMatrix.multiplyToRef(TmpVectors.Matrix[0], this._worldMatrix);
            // Restore translation
            this._worldMatrix.setTranslation(TmpVectors.Vector3[0]);
        }
        // Normal matrix
        if (!this.ignoreNonUniformScaling) {
            if (this._scaling.isNonUniformWithinEpsilon(0.000001)) {
                this._updateNonUniformScalingState(true);
            }
            else if (parent && parent._nonUniformScaling) {
                this._updateNonUniformScalingState(parent._nonUniformScaling);
            }
            else {
                this._updateNonUniformScalingState(false);
            }
        }
        else {
            this._updateNonUniformScalingState(false);
        }
        this._afterComputeWorldMatrix();
        // Absolute position
        this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);
        this._isAbsoluteSynced = false;
        // Callbacks
        this.onAfterWorldMatrixUpdateObservable.notifyObservers(this);
        if (!this._poseMatrix) {
            this._poseMatrix = Matrix.Invert(this._worldMatrix);
        }
        // Cache the determinant
        this._worldMatrixDeterminantIsDirty = true;
        return this._worldMatrix;
    }
    /**
     * Resets this nodeTransform's local matrix to Matrix.Identity().
     * @param independentOfChildren indicates if all child nodeTransform's world-space transform should be preserved.
     */
    resetLocalMatrix(independentOfChildren = true) {
        this.computeWorldMatrix();
        if (independentOfChildren) {
            const children = this.getChildren();
            for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                if (child) {
                    child.computeWorldMatrix();
                    const bakedMatrix = TmpVectors.Matrix[0];
                    child._localMatrix.multiplyToRef(this._localMatrix, bakedMatrix);
                    const tmpRotationQuaternion = TmpVectors.Quaternion[0];
                    bakedMatrix.decompose(child.scaling, tmpRotationQuaternion, child.position);
                    if (child.rotationQuaternion) {
                        child.rotationQuaternion.copyFrom(tmpRotationQuaternion);
                    }
                    else {
                        tmpRotationQuaternion.toEulerAnglesToRef(child.rotation);
                    }
                }
            }
        }
        this.scaling.copyFromFloats(1, 1, 1);
        this.position.copyFromFloats(0, 0, 0);
        this.rotation.copyFromFloats(0, 0, 0);
        //only if quaternion is already set
        if (this.rotationQuaternion) {
            this.rotationQuaternion = Quaternion.Identity();
        }
        this._worldMatrix = Matrix.Identity();
    }
    _afterComputeWorldMatrix() { }
    /**
     * If you'd like to be called back after the mesh position, rotation or scaling has been updated.
     * @param func callback function to add
     *
     * @returns the TransformNode.
     */
    registerAfterWorldMatrixUpdate(func) {
        this.onAfterWorldMatrixUpdateObservable.add(func);
        return this;
    }
    /**
     * Removes a registered callback function.
     * @param func callback function to remove
     * @returns the TransformNode.
     */
    unregisterAfterWorldMatrixUpdate(func) {
        this.onAfterWorldMatrixUpdateObservable.removeCallback(func);
        return this;
    }
    /**
     * Gets the position of the current mesh in camera space
     * @param camera defines the camera to use
     * @returns a position
     */
    getPositionInCameraSpace(camera = null) {
        if (!camera) {
            camera = this.getScene().activeCamera;
        }
        return Vector3.TransformCoordinates(this.getAbsolutePosition(), camera.getViewMatrix());
    }
    /**
     * Returns the distance from the mesh to the active camera
     * @param camera defines the camera to use
     * @returns the distance
     */
    getDistanceToCamera(camera = null) {
        if (!camera) {
            camera = this.getScene().activeCamera;
        }
        return this.getAbsolutePosition().subtract(camera.globalPosition).length();
    }
    /**
     * Clone the current transform node
     * @param name Name of the new clone
     * @param newParent New parent for the clone
     * @param doNotCloneChildren Do not clone children hierarchy
     * @returns the new transform node
     */
    clone(name, newParent, doNotCloneChildren) {
        const result = SerializationHelper.Clone(() => new TransformNode(name, this.getScene()), this);
        result.name = name;
        result.id = name;
        if (newParent) {
            result.parent = newParent;
        }
        if (!doNotCloneChildren) {
            // Children
            const directDescendants = this.getDescendants(true);
            for (let index = 0; index < directDescendants.length; index++) {
                const child = directDescendants[index];
                if (child.clone) {
                    child.clone(name + "." + child.name, result);
                }
            }
        }
        return result;
    }
    /**
     * Serializes the objects information.
     * @param currentSerializationObject defines the object to serialize in
     * @returns the serialized object
     */
    serialize(currentSerializationObject) {
        const serializationObject = SerializationHelper.Serialize(this, currentSerializationObject);
        serializationObject.type = this.getClassName();
        serializationObject.uniqueId = this.uniqueId;
        // Parent
        if (this.parent) {
            this.parent._serializeAsParent(serializationObject);
        }
        serializationObject.localMatrix = this.getPivotMatrix().asArray();
        serializationObject.isEnabled = this.isEnabled();
        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
        serializationObject.ranges = this.serializeAnimationRanges();
        return serializationObject;
    }
    // Statics
    /**
     * Returns a new TransformNode object parsed from the source provided.
     * @param parsedTransformNode is the source.
     * @param scene the scene the object belongs to
     * @param rootUrl is a string, it's the root URL to prefix the `delayLoadingFile` property with
     * @returns a new TransformNode object parsed from the source provided.
     */
    static Parse(parsedTransformNode, scene, rootUrl) {
        const transformNode = SerializationHelper.Parse(() => new TransformNode(parsedTransformNode.name, scene), parsedTransformNode, scene, rootUrl);
        if (parsedTransformNode.localMatrix) {
            transformNode.setPreTransformMatrix(Matrix.FromArray(parsedTransformNode.localMatrix));
        }
        else if (parsedTransformNode.pivotMatrix) {
            transformNode.setPivotMatrix(Matrix.FromArray(parsedTransformNode.pivotMatrix));
        }
        transformNode.setEnabled(parsedTransformNode.isEnabled);
        transformNode._waitingParsedUniqueId = parsedTransformNode.uniqueId;
        // Parent
        if (parsedTransformNode.parentId !== undefined) {
            transformNode._waitingParentId = parsedTransformNode.parentId;
        }
        if (parsedTransformNode.parentInstanceIndex !== undefined) {
            transformNode._waitingParentInstanceIndex = parsedTransformNode.parentInstanceIndex;
        }
        // Animations
        if (parsedTransformNode.animations) {
            for (let animationIndex = 0; animationIndex < parsedTransformNode.animations.length; animationIndex++) {
                const parsedAnimation = parsedTransformNode.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    transformNode.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
            Node.ParseAnimationRanges(transformNode, parsedTransformNode, scene);
        }
        if (parsedTransformNode.autoAnimate) {
            scene.beginAnimation(transformNode, parsedTransformNode.autoAnimateFrom, parsedTransformNode.autoAnimateTo, parsedTransformNode.autoAnimateLoop, parsedTransformNode.autoAnimateSpeed || 1.0);
        }
        return transformNode;
    }
    /**
     * Get all child-transformNodes of this node
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns an array of TransformNode
     */
    getChildTransformNodes(directDescendantsOnly, predicate) {
        const results = [];
        this._getDescendants(results, directDescendantsOnly, (node) => {
            return (!predicate || predicate(node)) && node instanceof TransformNode;
        });
        return results;
    }
    /**
     * Releases resources associated with this transform node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    dispose(doNotRecurse, disposeMaterialAndTextures = false) {
        // Animations
        this.getScene().stopAnimation(this);
        // Remove from scene
        this.getScene().removeTransformNode(this);
        if (this._parentContainer) {
            const index = this._parentContainer.transformNodes.indexOf(this);
            if (index > -1) {
                this._parentContainer.transformNodes.splice(index, 1);
            }
            this._parentContainer = null;
        }
        this.onAfterWorldMatrixUpdateObservable.clear();
        if (doNotRecurse) {
            const transformNodes = this.getChildTransformNodes(true);
            for (const transformNode of transformNodes) {
                transformNode.parent = null;
                transformNode.computeWorldMatrix(true);
            }
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    /**
     * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units)
     * @param includeDescendants Use the hierarchy's bounding box instead of the mesh's bounding box. Default is false
     * @param ignoreRotation ignore rotation when computing the scale (ie. object will be axis aligned). Default is false
     * @param predicate predicate that is passed in to getHierarchyBoundingVectors when selecting which object should be included when scaling
     * @returns the current mesh
     */
    normalizeToUnitCube(includeDescendants = true, ignoreRotation = false, predicate) {
        let storedRotation = null;
        let storedRotationQuaternion = null;
        if (ignoreRotation) {
            if (this.rotationQuaternion) {
                storedRotationQuaternion = this.rotationQuaternion.clone();
                this.rotationQuaternion.copyFromFloats(0, 0, 0, 1);
            }
            else if (this.rotation) {
                storedRotation = this.rotation.clone();
                this.rotation.copyFromFloats(0, 0, 0);
            }
        }
        const boundingVectors = this.getHierarchyBoundingVectors(includeDescendants, predicate);
        const sizeVec = boundingVectors.max.subtract(boundingVectors.min);
        const maxDimension = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
        if (maxDimension === 0) {
            return this;
        }
        const scale = 1 / maxDimension;
        this.scaling.scaleInPlace(scale);
        if (ignoreRotation) {
            if (this.rotationQuaternion && storedRotationQuaternion) {
                this.rotationQuaternion.copyFrom(storedRotationQuaternion);
            }
            else if (this.rotation && storedRotation) {
                this.rotation.copyFrom(storedRotation);
            }
        }
        return this;
    }
    _syncAbsoluteScalingAndRotation() {
        if (!this._isAbsoluteSynced) {
            this._worldMatrix.decompose(this._absoluteScaling, this._absoluteRotationQuaternion);
            this._isAbsoluteSynced = true;
        }
    }
}
// Statics
/**
 * Object will not rotate to face the camera
 */
TransformNode.BILLBOARDMODE_NONE = 0;
/**
 * Object will rotate to face the camera but only on the x axis
 */
TransformNode.BILLBOARDMODE_X = 1;
/**
 * Object will rotate to face the camera but only on the y axis
 */
TransformNode.BILLBOARDMODE_Y = 2;
/**
 * Object will rotate to face the camera but only on the z axis
 */
TransformNode.BILLBOARDMODE_Z = 4;
/**
 * Object will rotate to face the camera
 */
TransformNode.BILLBOARDMODE_ALL = 7;
/**
 * Object will rotate to face the camera's position instead of orientation
 */
TransformNode.BILLBOARDMODE_USE_POSITION = 128;
/**
 * Child transform with Billboard flags should or should not apply parent rotation (default if off)
 */
TransformNode.BillboardUseParentOrientation = false;
TransformNode._TmpRotation = Quaternion.Zero();
TransformNode._TmpScaling = Vector3.Zero();
TransformNode._TmpTranslation = Vector3.Zero();
TransformNode._LookAtVectorCache = new Vector3(0, 0, 0);
TransformNode._RotationAxisCache = new Quaternion();
__decorate([
    serializeAsVector3("position")
], TransformNode.prototype, "_position", void 0);
__decorate([
    serializeAsVector3("rotation")
], TransformNode.prototype, "_rotation", void 0);
__decorate([
    serializeAsQuaternion("rotationQuaternion")
], TransformNode.prototype, "_rotationQuaternion", void 0);
__decorate([
    serializeAsVector3("scaling")
], TransformNode.prototype, "_scaling", void 0);
__decorate([
    serialize("billboardMode")
], TransformNode.prototype, "_billboardMode", void 0);
__decorate([
    serialize()
], TransformNode.prototype, "scalingDeterminant", void 0);
__decorate([
    serialize("infiniteDistance")
], TransformNode.prototype, "_infiniteDistance", void 0);
__decorate([
    serialize()
], TransformNode.prototype, "ignoreNonUniformScaling", void 0);
__decorate([
    serialize()
], TransformNode.prototype, "reIntegrateRotationIntoRotationQuaternion", void 0);
//# sourceMappingURL=transformNode.js.map