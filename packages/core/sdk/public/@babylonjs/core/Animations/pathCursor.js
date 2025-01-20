import { Vector3 } from "../Maths/math.vector.js";
/**
 * A cursor which tracks a point on a path
 */
export class PathCursor {
    /**
     * Initializes the path cursor
     * @param _path The path to track
     */
    constructor(_path) {
        this._path = _path;
        /**
         * Stores path cursor callbacks for when an onchange event is triggered
         */
        this._onchange = new Array();
        /**
         * The value of the path cursor
         */
        this.value = 0;
        /**
         * The animation array of the path cursor
         */
        this.animations = [];
    }
    /**
     * Gets the cursor point on the path
     * @returns A point on the path cursor at the cursor location
     */
    getPoint() {
        const point = this._path.getPointAtLengthPosition(this.value);
        return new Vector3(point.x, 0, point.y);
    }
    /**
     * Moves the cursor ahead by the step amount
     * @param step The amount to move the cursor forward
     * @returns This path cursor
     */
    moveAhead(step = 0.002) {
        this.move(step);
        return this;
    }
    /**
     * Moves the cursor behind by the step amount
     * @param step The amount to move the cursor back
     * @returns This path cursor
     */
    moveBack(step = 0.002) {
        this.move(-step);
        return this;
    }
    /**
     * Moves the cursor by the step amount
     * If the step amount is greater than one, an exception is thrown
     * @param step The amount to move the cursor
     * @returns This path cursor
     */
    move(step) {
        if (Math.abs(step) > 1) {
            // eslint-disable-next-line no-throw-literal
            throw "step size should be less than 1.";
        }
        this.value += step;
        this._ensureLimits();
        this._raiseOnChange();
        return this;
    }
    /**
     * Ensures that the value is limited between zero and one
     * @returns This path cursor
     */
    _ensureLimits() {
        while (this.value > 1) {
            this.value -= 1;
        }
        while (this.value < 0) {
            this.value += 1;
        }
        return this;
    }
    /**
     * Runs onchange callbacks on change (used by the animation engine)
     * @returns This path cursor
     */
    _raiseOnChange() {
        this._onchange.forEach((f) => f(this));
        return this;
    }
    /**
     * Executes a function on change
     * @param f A path cursor onchange callback
     * @returns This path cursor
     */
    onchange(f) {
        this._onchange.push(f);
        return this;
    }
}
//# sourceMappingURL=pathCursor.js.map