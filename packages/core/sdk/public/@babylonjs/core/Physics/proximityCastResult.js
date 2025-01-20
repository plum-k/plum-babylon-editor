import { CastingResult } from "./castingResult.js";
/**
 * Class representing a contact point produced in a proximity cast
 */
export class ProximityCastResult extends CastingResult {
    constructor() {
        super(...arguments);
        this._hitDistance = 0;
    }
    /**
     * Gets the distance from the hit
     */
    get hitDistance() {
        return this._hitDistance;
    }
    /**
     * Sets the distance from the start point to the hit point
     * @param distance
     */
    setHitDistance(distance) {
        this._hitDistance = distance;
    }
    /**
     * Resets all the values to default
     */
    reset() {
        super.reset();
        this._hitDistance = 0;
    }
}
//# sourceMappingURL=proximityCastResult.js.map