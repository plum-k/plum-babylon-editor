import { Vector3 } from "../Maths/math.vector.js";
/**
 * Base class for results of casts.
 */
export class CastingResult {
    constructor() {
        this._hasHit = false;
        this._hitNormal = Vector3.Zero();
        this._hitPoint = Vector3.Zero();
        this._triangleIndex = -1;
    }
    /**
     * Gets the hit point.
     */
    get hitPoint() {
        return this._hitPoint;
    }
    /**
     * Gets the hit normal.
     */
    get hitNormal() {
        return this._hitNormal;
    }
    /**
     * Gets if there was a hit
     */
    get hasHit() {
        return this._hasHit;
    }
    /*
     * The index of the original triangle which was hit. Will be -1 if contact point is not on a mesh shape
     */
    get triangleIndex() {
        return this._triangleIndex;
    }
    /**
     * Sets the hit data
     * @param hitNormal defines the normal in world space
     * @param hitPoint defines the point in world space
     * @param triangleIndex defines the index of the triangle in case of mesh shape
     */
    setHitData(hitNormal, hitPoint, triangleIndex) {
        this._hasHit = true;
        this._hitNormal.set(hitNormal.x, hitNormal.y, hitNormal.z);
        this._hitPoint.set(hitPoint.x, hitPoint.y, hitPoint.z);
        this._triangleIndex = triangleIndex ?? -1;
    }
    /**
     * Resets all the values to default
     */
    reset() {
        this._hasHit = false;
        this._hitNormal.setAll(0);
        this._hitPoint.setAll(0);
        this._triangleIndex = -1;
        this.body = undefined;
        this.bodyIndex = undefined;
        this.shape = undefined;
    }
}
//# sourceMappingURL=castingResult.js.map