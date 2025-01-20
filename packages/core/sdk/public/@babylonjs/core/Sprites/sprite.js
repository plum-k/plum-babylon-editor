import { Vector3 } from "../Maths/math.vector.js";
import { Color4 } from "../Maths/math.color.js";
import { Observable } from "../Misc/observable.js";
import { ThinSprite } from "./thinSprite.js";
/**
 * Class used to represent a sprite
 * @see https://doc.babylonjs.com/features/featuresDeepDive/sprites
 */
export class Sprite extends ThinSprite {
    /**
     * Gets or sets the sprite size
     */
    get size() {
        return this.width;
    }
    set size(value) {
        this.width = value;
        this.height = value;
    }
    /**
     * Gets the manager of this sprite
     */
    get manager() {
        return this._manager;
    }
    /**
     * Creates a new Sprite
     * @param name defines the name
     * @param manager defines the manager
     */
    constructor(
    /** defines the name */
    name, manager) {
        super();
        this.name = name;
        /** Gets the list of attached animations */
        this.animations = new Array();
        /** Gets or sets a boolean indicating if the sprite can be picked */
        this.isPickable = false;
        /** Gets or sets a boolean indicating that sprite texture alpha will be used for precise picking (false by default) */
        this.useAlphaForPicking = false;
        /**
         * An event triggered when the control has been disposed
         */
        this.onDisposeObservable = new Observable();
        this._onAnimationEnd = null;
        this._endAnimation = () => {
            if (this._onAnimationEnd) {
                this._onAnimationEnd();
            }
            if (this.disposeWhenFinishedAnimating) {
                this.dispose();
            }
        };
        this.color = new Color4(1.0, 1.0, 1.0, 1.0);
        this.position = Vector3.Zero();
        this._manager = manager;
        this._manager.sprites.push(this);
        this.uniqueId = this._manager.scene.getUniqueId();
    }
    /**
     * Returns the string "Sprite"
     * @returns "Sprite"
     */
    getClassName() {
        return "Sprite";
    }
    /** Gets or sets the initial key for the animation (setting it will restart the animation)  */
    get fromIndex() {
        return this._fromIndex;
    }
    set fromIndex(value) {
        this.playAnimation(value, this._toIndex, this._loopAnimation, this._delay, this._onAnimationEnd);
    }
    /** Gets or sets the end key for the animation (setting it will restart the animation)  */
    get toIndex() {
        return this._toIndex;
    }
    set toIndex(value) {
        this.playAnimation(this._fromIndex, value, this._loopAnimation, this._delay, this._onAnimationEnd);
    }
    /** Gets or sets a boolean indicating if the animation is looping (setting it will restart the animation)  */
    get loopAnimation() {
        return this._loopAnimation;
    }
    set loopAnimation(value) {
        this.playAnimation(this._fromIndex, this._toIndex, value, this._delay, this._onAnimationEnd);
    }
    /** Gets or sets the delay between cell changes (setting it will restart the animation)  */
    get delay() {
        return Math.max(this._delay, 1);
    }
    set delay(value) {
        this.playAnimation(this._fromIndex, this._toIndex, this._loopAnimation, value, this._onAnimationEnd);
    }
    /**
     * Starts an animation
     * @param from defines the initial key
     * @param to defines the end key
     * @param loop defines if the animation must loop
     * @param delay defines the start delay (in ms)
     * @param onAnimationEnd defines a callback to call when animation ends
     */
    playAnimation(from, to, loop, delay, onAnimationEnd = null) {
        this._onAnimationEnd = onAnimationEnd;
        super.playAnimation(from, to, loop, delay, this._endAnimation);
    }
    /** Release associated resources */
    dispose() {
        for (let i = 0; i < this._manager.sprites.length; i++) {
            if (this._manager.sprites[i] == this) {
                this._manager.sprites.splice(i, 1);
            }
        }
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }
    /**
     * Serializes the sprite to a JSON object
     * @returns the JSON object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.name = this.name;
        serializationObject.position = this.position.asArray();
        serializationObject.color = this.color.asArray();
        serializationObject.width = this.width;
        serializationObject.height = this.height;
        serializationObject.angle = this.angle;
        serializationObject.cellIndex = this.cellIndex;
        serializationObject.cellRef = this.cellRef;
        serializationObject.invertU = this.invertU;
        serializationObject.invertV = this.invertV;
        serializationObject.disposeWhenFinishedAnimating = this.disposeWhenFinishedAnimating;
        serializationObject.isPickable = this.isPickable;
        serializationObject.isVisible = this.isVisible;
        serializationObject.useAlphaForPicking = this.useAlphaForPicking;
        serializationObject.animationStarted = this.animationStarted;
        serializationObject.fromIndex = this.fromIndex;
        serializationObject.toIndex = this.toIndex;
        serializationObject.loopAnimation = this.loopAnimation;
        serializationObject.delay = this.delay;
        return serializationObject;
    }
    /**
     * Parses a JSON object to create a new sprite
     * @param parsedSprite The JSON object to parse
     * @param manager defines the hosting manager
     * @returns the new sprite
     */
    static Parse(parsedSprite, manager) {
        const sprite = new Sprite(parsedSprite.name, manager);
        sprite.position = Vector3.FromArray(parsedSprite.position);
        sprite.color = Color4.FromArray(parsedSprite.color);
        sprite.width = parsedSprite.width;
        sprite.height = parsedSprite.height;
        sprite.angle = parsedSprite.angle;
        sprite.cellIndex = parsedSprite.cellIndex;
        sprite.cellRef = parsedSprite.cellRef;
        sprite.invertU = parsedSprite.invertU;
        sprite.invertV = parsedSprite.invertV;
        sprite.disposeWhenFinishedAnimating = parsedSprite.disposeWhenFinishedAnimating;
        sprite.isPickable = parsedSprite.isPickable;
        sprite.isVisible = parsedSprite.isVisible;
        sprite.useAlphaForPicking = parsedSprite.useAlphaForPicking;
        sprite._fromIndex = parsedSprite.fromIndex;
        sprite._toIndex = parsedSprite.toIndex;
        sprite._loopAnimation = parsedSprite.loopAnimation;
        sprite._delay = parsedSprite.delay;
        if (parsedSprite.animationStarted) {
            sprite.playAnimation(sprite.fromIndex, sprite.toIndex, sprite.loopAnimation, sprite.delay);
        }
        return sprite;
    }
}
//# sourceMappingURL=sprite.js.map