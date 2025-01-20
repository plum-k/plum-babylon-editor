import { BuildArray } from "../Misc/arrayTools.js";
import { Matrix, Vector3 } from "../Maths/math.vector.js";
/**
 * Class used to store bounding sphere information
 */
export class BoundingSphere {
    /**
     * Creates a new bounding sphere
     * @param min defines the minimum vector (in local space)
     * @param max defines the maximum vector (in local space)
     * @param worldMatrix defines the new world matrix
     */
    constructor(min, max, worldMatrix) {
        /**
         * Gets the center of the bounding sphere in local space
         */
        this.center = Vector3.Zero();
        /**
         * Gets the center of the bounding sphere in world space
         */
        this.centerWorld = Vector3.Zero();
        /**
         * Gets the minimum vector in local space
         */
        this.minimum = Vector3.Zero();
        /**
         * Gets the maximum vector in local space
         */
        this.maximum = Vector3.Zero();
        this.reConstruct(min, max, worldMatrix);
    }
    /**
     * Recreates the entire bounding sphere from scratch as if we call the constructor in place
     * @param min defines the new minimum vector (in local space)
     * @param max defines the new maximum vector (in local space)
     * @param worldMatrix defines the new world matrix
     */
    reConstruct(min, max, worldMatrix) {
        this.minimum.copyFrom(min);
        this.maximum.copyFrom(max);
        const distance = Vector3.Distance(min, max);
        max.addToRef(min, this.center).scaleInPlace(0.5);
        this.radius = distance * 0.5;
        this._update(worldMatrix || Matrix.IdentityReadOnly);
    }
    /**
     * Scale the current bounding sphere by applying a scale factor
     * @param factor defines the scale factor to apply
     * @returns the current bounding box
     */
    scale(factor) {
        const newRadius = this.radius * factor;
        const tmpVectors = BoundingSphere._TmpVector3;
        const tempRadiusVector = tmpVectors[0].setAll(newRadius);
        const min = this.center.subtractToRef(tempRadiusVector, tmpVectors[1]);
        const max = this.center.addToRef(tempRadiusVector, tmpVectors[2]);
        this.reConstruct(min, max, this._worldMatrix);
        return this;
    }
    /**
     * Gets the world matrix of the bounding box
     * @returns a matrix
     */
    getWorldMatrix() {
        return this._worldMatrix;
    }
    // Methods
    /**
     * @internal
     */
    _update(worldMatrix) {
        if (!worldMatrix.isIdentity()) {
            Vector3.TransformCoordinatesToRef(this.center, worldMatrix, this.centerWorld);
            const tempVector = BoundingSphere._TmpVector3[0];
            Vector3.TransformNormalFromFloatsToRef(1.0, 1.0, 1.0, worldMatrix, tempVector);
            this.radiusWorld = Math.max(Math.abs(tempVector.x), Math.abs(tempVector.y), Math.abs(tempVector.z)) * this.radius;
        }
        else {
            this.centerWorld.copyFrom(this.center);
            this.radiusWorld = this.radius;
        }
    }
    /**
     * Tests if the bounding sphere is intersecting the frustum planes
     * @param frustumPlanes defines the frustum planes to test
     * @returns true if there is an intersection
     */
    isInFrustum(frustumPlanes) {
        const center = this.centerWorld;
        const radius = this.radiusWorld;
        for (let i = 0; i < 6; i++) {
            if (frustumPlanes[i].dotCoordinate(center) <= -radius) {
                return false;
            }
        }
        return true;
    }
    /**
     * Tests if the bounding sphere center is in between the frustum planes.
     * Used for optimistic fast inclusion.
     * @param frustumPlanes defines the frustum planes to test
     * @returns true if the sphere center is in between the frustum planes
     */
    isCenterInFrustum(frustumPlanes) {
        const center = this.centerWorld;
        for (let i = 0; i < 6; i++) {
            if (frustumPlanes[i].dotCoordinate(center) < 0) {
                return false;
            }
        }
        return true;
    }
    /**
     * Tests if a point is inside the bounding sphere
     * @param point defines the point to test
     * @returns true if the point is inside the bounding sphere
     */
    intersectsPoint(point) {
        const squareDistance = Vector3.DistanceSquared(this.centerWorld, point);
        if (this.radiusWorld * this.radiusWorld < squareDistance) {
            return false;
        }
        return true;
    }
    // Statics
    /**
     * Checks if two sphere intersect
     * @param sphere0 sphere 0
     * @param sphere1 sphere 1
     * @returns true if the spheres intersect
     */
    static Intersects(sphere0, sphere1) {
        const squareDistance = Vector3.DistanceSquared(sphere0.centerWorld, sphere1.centerWorld);
        const radiusSum = sphere0.radiusWorld + sphere1.radiusWorld;
        if (radiusSum * radiusSum < squareDistance) {
            return false;
        }
        return true;
    }
    /**
     * Creates a sphere from a center and a radius
     * @param center The center
     * @param radius radius
     * @param matrix Optional worldMatrix
     * @returns The sphere
     */
    static CreateFromCenterAndRadius(center, radius, matrix) {
        this._TmpVector3[0].copyFrom(center);
        this._TmpVector3[1].copyFromFloats(0, 0, radius);
        this._TmpVector3[2].copyFrom(center);
        this._TmpVector3[0].addInPlace(this._TmpVector3[1]);
        this._TmpVector3[2].subtractInPlace(this._TmpVector3[1]);
        const sphere = new BoundingSphere(this._TmpVector3[0], this._TmpVector3[2]);
        if (matrix) {
            sphere._worldMatrix = matrix;
        }
        else {
            sphere._worldMatrix = Matrix.Identity();
        }
        return sphere;
    }
}
BoundingSphere._TmpVector3 = BuildArray(3, Vector3.Zero);
//# sourceMappingURL=boundingSphere.js.map