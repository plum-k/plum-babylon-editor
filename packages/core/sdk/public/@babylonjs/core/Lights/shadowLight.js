import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsVector3 } from "../Misc/decorators.js";
import { Matrix, TmpVectors, Vector3 } from "../Maths/math.vector.js";
import { Light } from "./light.js";
import { Axis } from "../Maths/math.axis.js";

/**
 * Base implementation IShadowLight
 * It groups all the common behaviour in order to reduce duplication and better follow the DRY pattern.
 */
export class ShadowLight extends Light {
    constructor() {
        super(...arguments);
        this._needProjectionMatrixCompute = true;
        this._viewMatrix = Matrix.Identity();
        this._projectionMatrix = Matrix.Identity();
    }
    _setPosition(value) {
        this._position = value;
    }
    /**
     * Sets the position the shadow will be casted from. Also use as the light position for both
     * point and spot lights.
     */
    get position() {
        return this._position;
    }
    /**
     * Sets the position the shadow will be casted from. Also use as the light position for both
     * point and spot lights.
     */
    set position(value) {
        this._setPosition(value);
    }
    _setDirection(value) {
        this._direction = value;
    }
    /**
     * In 2d mode (needCube being false), gets the direction used to cast the shadow.
     * Also use as the light direction on spot and directional lights.
     */
    get direction() {
        return this._direction;
    }
    /**
     * In 2d mode (needCube being false), sets the direction used to cast the shadow.
     * Also use as the light direction on spot and directional lights.
     */
    set direction(value) {
        this._setDirection(value);
    }
    /**
     * Gets the shadow projection clipping minimum z value.
     */
    get shadowMinZ() {
        return this._shadowMinZ;
    }
    /**
     * Sets the shadow projection clipping minimum z value.
     */
    set shadowMinZ(value) {
        this._shadowMinZ = value;
        this.forceProjectionMatrixCompute();
    }
    /**
     * Sets the shadow projection clipping maximum z value.
     */
    get shadowMaxZ() {
        return this._shadowMaxZ;
    }
    /**
     * Gets the shadow projection clipping maximum z value.
     */
    set shadowMaxZ(value) {
        this._shadowMaxZ = value;
        this.forceProjectionMatrixCompute();
    }
    /**
     * Computes the transformed information (transformedPosition and transformedDirection in World space) of the current light
     * @returns true if the information has been computed, false if it does not need to (no parenting)
     */
    computeTransformedInformation() {
        if (this.parent && this.parent.getWorldMatrix) {
            if (!this.transformedPosition) {
                this.transformedPosition = Vector3.Zero();
            }
            Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);
            // In case the direction is present.
            if (this.direction) {
                if (!this.transformedDirection) {
                    this.transformedDirection = Vector3.Zero();
                }
                Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this.transformedDirection);
            }
            return true;
        }
        return false;
    }
    /**
     * Return the depth scale used for the shadow map.
     * @returns the depth scale.
     */
    getDepthScale() {
        return 50.0;
    }
    /**
     * Get the direction to use to render the shadow map. In case of cube texture, the face index can be passed.
     * @param faceIndex The index of the face we are computed the direction to generate shadow
     * @returns The set direction in 2d mode otherwise the direction to the cubemap face if needCube() is true
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getShadowDirection(faceIndex) {
        return this.transformedDirection ? this.transformedDirection : this.direction;
    }
    /**
     * If computeTransformedInformation has been called, returns the ShadowLight absolute position in the world. Otherwise, returns the local position.
     * @returns the position vector in world space
     */
    getAbsolutePosition() {
        return this.transformedPosition ? this.transformedPosition : this.position;
    }
    /**
     * Sets the ShadowLight direction toward the passed target.
     * @param target The point to target in local space
     * @returns the updated ShadowLight direction
     */
    setDirectionToTarget(target) {
        this.direction = Vector3.Normalize(target.subtract(this.position));
        return this.direction;
    }
    /**
     * Returns the light rotation in euler definition.
     * @returns the x y z rotation in local space.
     */
    getRotation() {
        this.direction.normalize();
        const xaxis = Vector3.Cross(this.direction, Axis.Y);
        const yaxis = Vector3.Cross(xaxis, this.direction);
        return Vector3.RotationFromAxis(xaxis, yaxis, this.direction);
    }
    /**
     * Returns whether or not the shadow generation require a cube texture or a 2d texture.
     * @returns true if a cube texture needs to be use
     */
    needCube() {
        return false;
    }
    /**
     * Detects if the projection matrix requires to be recomputed this frame.
     * @returns true if it requires to be recomputed otherwise, false.
     */
    needProjectionMatrixCompute() {
        return this._needProjectionMatrixCompute;
    }
    /**
     * Forces the shadow generator to recompute the projection matrix even if position and direction did not changed.
     */
    forceProjectionMatrixCompute() {
        this._needProjectionMatrixCompute = true;
    }
    /** @internal */
    _initCache() {
        super._initCache();
        this._cache.position = Vector3.Zero();
    }
    /** @internal */
    _isSynchronized() {
        if (!this._cache.position.equals(this.position)) {
            return false;
        }
        return true;
    }
    /**
     * Computes the world matrix of the node
     * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
     * @returns the world matrix
     */
    computeWorldMatrix(force) {
        if (!force && this.isSynchronized()) {
            this._currentRenderId = this.getScene().getRenderId();
            return this._worldMatrix;
        }
        this._updateCache();
        this._cache.position.copyFrom(this.position);
        if (!this._worldMatrix) {
            this._worldMatrix = Matrix.Identity();
        }
        Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);
        if (this.parent && this.parent.getWorldMatrix) {
            this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
            this._markSyncedWithParent();
        }
        // Cache the determinant
        this._worldMatrixDeterminantIsDirty = true;
        return this._worldMatrix;
    }
    /**
     * Gets the minZ used for shadow according to both the scene and the light.
     * @param activeCamera The camera we are returning the min for
     * @returns the depth min z
     */
    getDepthMinZ(activeCamera) {
        return this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera?.minZ || 0;
    }
    /**
     * Gets the maxZ used for shadow according to both the scene and the light.
     * @param activeCamera The camera we are returning the max for
     * @returns the depth max z
     */
    getDepthMaxZ(activeCamera) {
        return this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera?.maxZ || 10000;
    }
    /**
     * Sets the shadow projection matrix in parameter to the generated projection matrix.
     * @param matrix The matrix to updated with the projection information
     * @param viewMatrix The transform matrix of the light
     * @param renderList The list of mesh to render in the map
     * @returns The current light
     */
    setShadowProjectionMatrix(matrix, viewMatrix, renderList) {
        if (this.customProjectionMatrixBuilder) {
            this.customProjectionMatrixBuilder(viewMatrix, renderList, matrix);
        }
        else {
            this._setDefaultShadowProjectionMatrix(matrix, viewMatrix, renderList);
        }
        return this;
    }
    /** @internal */
    _syncParentEnabledState() {
        super._syncParentEnabledState();
        if (!this.parent || !this.parent.getWorldMatrix) {
            this.transformedPosition = null;
            this.transformedDirection = null;
        }
    }
    /**
     * Returns the view matrix.
     * @param faceIndex The index of the face for which we want to extract the view matrix. Only used for point light types.
     * @returns The view matrix. Can be null, if a view matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
     */
    getViewMatrix(faceIndex) {
        const lightDirection = TmpVectors.Vector3[0];
        let lightPosition = this.position;
        if (this.computeTransformedInformation()) {
            lightPosition = this.transformedPosition;
        }
        Vector3.NormalizeToRef(this.getShadowDirection(faceIndex), lightDirection);
        if (Math.abs(Vector3.Dot(lightDirection, Vector3.Up())) === 1.0) {
            lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }
        const lightTarget = TmpVectors.Vector3[1];
        lightPosition.addToRef(lightDirection, lightTarget);
        Matrix.LookAtLHToRef(lightPosition, lightTarget, Vector3.Up(), this._viewMatrix);
        return this._viewMatrix;
    }
    /**
     * Returns the projection matrix.
     * Note that viewMatrix and renderList are optional and are only used by lights that calculate the projection matrix from a list of meshes (e.g. directional lights with automatic extents calculation).
     * @param viewMatrix The view transform matrix of the light (optional).
     * @param renderList The list of meshes to take into account when calculating the projection matrix (optional).
     * @returns The projection matrix. Can be null, if a projection matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
     */
    getProjectionMatrix(viewMatrix, renderList) {
        this.setShadowProjectionMatrix(this._projectionMatrix, viewMatrix ?? this._viewMatrix, renderList ?? []);
        return this._projectionMatrix;
    }
}
__decorate([
    serializeAsVector3()
], ShadowLight.prototype, "position", null);
__decorate([
    serializeAsVector3()
], ShadowLight.prototype, "direction", null);
__decorate([
    serialize()
], ShadowLight.prototype, "shadowMinZ", null);
__decorate([
    serialize()
], ShadowLight.prototype, "shadowMaxZ", null);
//# sourceMappingURL=shadowLight.js.map