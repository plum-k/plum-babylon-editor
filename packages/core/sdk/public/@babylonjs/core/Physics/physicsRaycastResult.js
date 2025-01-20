import { Vector3 } from "../Maths/math.vector.js";
import { CastingResult } from "./castingResult.js";
/**
 * Holds the data for the raycast result
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsRaycastResult extends CastingResult {
    constructor() {
        super(...arguments);
        this._hitDistance = 0;
        this._rayFromWorld = Vector3.Zero();
        this._rayToWorld = Vector3.Zero();
    }
    /**
     * Gets the distance from the hit
     */
    get hitDistance() {
        return this._hitDistance;
    }
    /**
     * Gets the hit normal/direction in the world
     */
    get hitNormalWorld() {
        return this._hitNormal;
    }
    /**
     * Gets the hit point in the world
     */
    get hitPointWorld() {
        return this._hitPoint;
    }
    /**
     * Gets the ray "start point" of the ray in the world
     */
    get rayFromWorld() {
        return this._rayFromWorld;
    }
    /**
     * Gets the ray "end point" of the ray in the world
     */
    get rayToWorld() {
        return this._rayToWorld;
    }
    /**
     * Sets the distance from the start point to the hit point
     * @param distance defines the distance to set
     */
    setHitDistance(distance) {
        this._hitDistance = distance;
    }
    /**
     * Calculates the distance manually
     */
    calculateHitDistance() {
        this._hitDistance = Vector3.Distance(this._rayFromWorld, this._hitPoint);
    }
    /**
     * Resets all the values to default
     * @param from The from point on world space
     * @param to The to point on world space
     */
    reset(from = Vector3.Zero(), to = Vector3.Zero()) {
        super.reset();
        this._rayFromWorld.copyFrom(from);
        this._rayToWorld.copyFrom(to);
        this._hitDistance = 0;
    }
}
//# sourceMappingURL=physicsRaycastResult.js.map