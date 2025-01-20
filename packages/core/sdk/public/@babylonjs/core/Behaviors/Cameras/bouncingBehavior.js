import { BackEase, EasingFunction } from "../../Animations/easing.js";
import { Animation } from "../../Animations/animation.js";
/**
 * Add a bouncing effect to an ArcRotateCamera when reaching a specified minimum and maximum radius
 * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#bouncing-behavior
 */
export class BouncingBehavior {
    constructor() {
        /**
         * The duration of the animation, in milliseconds
         */
        this.transitionDuration = 450;
        /**
         * Length of the distance animated by the transition when lower radius is reached
         */
        this.lowerRadiusTransitionRange = 2;
        /**
         * Length of the distance animated by the transition when upper radius is reached
         */
        this.upperRadiusTransitionRange = -2;
        this._autoTransitionRange = false;
        // Animations
        this._radiusIsAnimating = false;
        this._radiusBounceTransition = null;
        this._animatables = new Array();
    }
    /**
     * Gets the name of the behavior.
     */
    get name() {
        return "Bouncing";
    }
    /**
     * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
     */
    get autoTransitionRange() {
        return this._autoTransitionRange;
    }
    /**
     * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
     * Transition ranges will be set to 5% of the bounding box diagonal in world space
     */
    set autoTransitionRange(value) {
        if (this._autoTransitionRange === value) {
            return;
        }
        this._autoTransitionRange = value;
        const camera = this._attachedCamera;
        if (!camera) {
            return;
        }
        if (value) {
            this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add((transformNode) => {
                if (!transformNode) {
                    return;
                }
                transformNode.computeWorldMatrix(true);
                if (transformNode.getBoundingInfo) {
                    const diagonal = transformNode.getBoundingInfo().diagonalLength;
                    this.lowerRadiusTransitionRange = diagonal * 0.05;
                    this.upperRadiusTransitionRange = diagonal * 0.05;
                }
            });
        }
        else if (this._onMeshTargetChangedObserver) {
            camera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
        }
    }
    /**
     * Initializes the behavior.
     */
    init() {
        // Do nothing
    }
    /**
     * Attaches the behavior to its arc rotate camera.
     * @param camera Defines the camera to attach the behavior to
     */
    attach(camera) {
        this._attachedCamera = camera;
        this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(() => {
            if (!this._attachedCamera) {
                return;
            }
            // Add the bounce animation to the lower radius limit
            if (this._isRadiusAtLimit(this._attachedCamera.lowerRadiusLimit)) {
                this._applyBoundRadiusAnimation(this.lowerRadiusTransitionRange);
            }
            // Add the bounce animation to the upper radius limit
            if (this._isRadiusAtLimit(this._attachedCamera.upperRadiusLimit)) {
                this._applyBoundRadiusAnimation(this.upperRadiusTransitionRange);
            }
        });
    }
    /**
     * Detaches the behavior from its current arc rotate camera.
     */
    detach() {
        if (!this._attachedCamera) {
            return;
        }
        if (this._onAfterCheckInputsObserver) {
            this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
        }
        if (this._onMeshTargetChangedObserver) {
            this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
        }
        this._attachedCamera = null;
    }
    /**
     * Checks if the camera radius is at the specified limit. Takes into account animation locks.
     * @param radiusLimit The limit to check against.
     * @returns Bool to indicate if at limit.
     */
    _isRadiusAtLimit(radiusLimit) {
        if (!this._attachedCamera) {
            return false;
        }
        if (this._attachedCamera.radius === radiusLimit && !this._radiusIsAnimating) {
            return true;
        }
        return false;
    }
    /**
     * Applies an animation to the radius of the camera, extending by the radiusDelta.
     * @param radiusDelta The delta by which to animate to. Can be negative.
     */
    _applyBoundRadiusAnimation(radiusDelta) {
        if (!this._attachedCamera) {
            return;
        }
        if (!this._radiusBounceTransition) {
            BouncingBehavior.EasingFunction.setEasingMode(BouncingBehavior.EasingMode);
            this._radiusBounceTransition = Animation.CreateAnimation("radius", Animation.ANIMATIONTYPE_FLOAT, 60, BouncingBehavior.EasingFunction);
        }
        // Prevent zoom until bounce has completed
        this._cachedWheelPrecision = this._attachedCamera.wheelPrecision;
        this._attachedCamera.wheelPrecision = Infinity;
        this._attachedCamera.inertialRadiusOffset = 0;
        // Animate to the radius limit
        this.stopAllAnimations();
        this._radiusIsAnimating = true;
        const animatable = Animation.TransitionTo("radius", this._attachedCamera.radius + radiusDelta, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusBounceTransition, this.transitionDuration, () => this._clearAnimationLocks());
        if (animatable) {
            this._animatables.push(animatable);
        }
    }
    /**
     * Removes all animation locks. Allows new animations to be added to any of the camera properties.
     */
    _clearAnimationLocks() {
        this._radiusIsAnimating = false;
        if (this._attachedCamera) {
            this._attachedCamera.wheelPrecision = this._cachedWheelPrecision;
        }
    }
    /**
     * Stops and removes all animations that have been applied to the camera
     */
    stopAllAnimations() {
        if (this._attachedCamera) {
            this._attachedCamera.animations = [];
        }
        while (this._animatables.length) {
            this._animatables[0].onAnimationEnd = null;
            this._animatables[0].stop();
            this._animatables.shift();
        }
    }
}
/**
 * The easing function used by animations
 */
BouncingBehavior.EasingFunction = new BackEase(0.3);
/**
 * The easing mode used by animations
 */
BouncingBehavior.EasingMode = EasingFunction.EASINGMODE_EASEOUT;
//# sourceMappingURL=bouncingBehavior.js.map