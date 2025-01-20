/**
 * ThinSprite Class used to represent a thin sprite
 * This is the base class for sprites but can also directly be used with ThinEngine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/sprites
 */
export class ThinSprite {
    /**
     * Returns a boolean indicating if the animation is started
     */
    get animationStarted() {
        return this._animationStarted;
    }
    /** Gets the initial key for the animation (setting it will restart the animation)  */
    get fromIndex() {
        return this._fromIndex;
    }
    /** Gets or sets the end key for the animation (setting it will restart the animation)  */
    get toIndex() {
        return this._toIndex;
    }
    /** Gets or sets a boolean indicating if the animation is looping (setting it will restart the animation)  */
    get loopAnimation() {
        return this._loopAnimation;
    }
    /** Gets or sets the delay between cell changes (setting it will restart the animation)  */
    get delay() {
        return Math.max(this._delay, 1);
    }
    /**
     * Creates a new Thin Sprite
     */
    constructor() {
        /** Gets or sets the width */
        this.width = 1.0;
        /** Gets or sets the height */
        this.height = 1.0;
        /** Gets or sets rotation angle */
        this.angle = 0;
        /** Gets or sets a boolean indicating if UV coordinates should be inverted in U axis */
        this.invertU = false;
        /** Gets or sets a boolean indicating if UV coordinates should be inverted in B axis */
        this.invertV = false;
        /** Gets or sets a boolean indicating if the sprite is visible (renderable). Default is true */
        this.isVisible = true;
        this._animationStarted = false;
        this._loopAnimation = false;
        this._fromIndex = 0;
        this._toIndex = 0;
        this._delay = 0;
        this._direction = 1;
        this._time = 0;
        this._onBaseAnimationEnd = null;
        this.position = { x: 1.0, y: 1.0, z: 1.0 };
        this.color = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
    }
    /**
     * Starts an animation
     * @param from defines the initial key
     * @param to defines the end key
     * @param loop defines if the animation must loop
     * @param delay defines the start delay (in ms)
     * @param onAnimationEnd defines a callback for when the animation ends
     */
    playAnimation(from, to, loop, delay, onAnimationEnd) {
        this._fromIndex = from;
        this._toIndex = to;
        this._loopAnimation = loop;
        this._delay = delay || 1;
        this._animationStarted = true;
        this._onBaseAnimationEnd = onAnimationEnd;
        if (from < to) {
            this._direction = 1;
        }
        else {
            this._direction = -1;
            this._toIndex = from;
            this._fromIndex = to;
        }
        this.cellIndex = from;
        this._time = 0;
    }
    /** Stops current animation (if any) */
    stopAnimation() {
        this._animationStarted = false;
    }
    /**
     * @internal
     */
    _animate(deltaTime) {
        if (!this._animationStarted) {
            return;
        }
        this._time += deltaTime;
        if (this._time > this._delay) {
            this._time = this._time % this._delay;
            this.cellIndex += this._direction;
            if ((this._direction > 0 && this.cellIndex > this._toIndex) || (this._direction < 0 && this.cellIndex < this._fromIndex)) {
                if (this._loopAnimation) {
                    this.cellIndex = this._direction > 0 ? this._fromIndex : this._toIndex;
                }
                else {
                    this.cellIndex = this._toIndex;
                    this._animationStarted = false;
                    if (this._onBaseAnimationEnd) {
                        this._onBaseAnimationEnd();
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=thinSprite.js.map