import { PointerEventTypes } from "../../Events/pointerEvents.js";
import { PrecisionDate } from "../../Misc/precisionDate.js";
import { Epsilon } from "../../Maths/math.constants.js";
/**
 * The autoRotation behavior (AutoRotationBehavior) is designed to create a smooth rotation of an ArcRotateCamera when there is no user interaction.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#autorotation-behavior
 */
export class AutoRotationBehavior {
    constructor() {
        this._zoomStopsAnimation = false;
        this._idleRotationSpeed = 0.05;
        this._idleRotationWaitTime = 2000;
        this._idleRotationSpinupTime = 2000;
        /**
         * Target alpha
         */
        this.targetAlpha = null;
        this._isPointerDown = false;
        this._lastFrameTime = null;
        this._lastInteractionTime = -Infinity;
        this._cameraRotationSpeed = 0;
        this._lastFrameRadius = 0;
    }
    /**
     * Gets the name of the behavior.
     */
    get name() {
        return "AutoRotation";
    }
    /**
     * Sets the flag that indicates if user zooming should stop animation.
     */
    set zoomStopsAnimation(flag) {
        this._zoomStopsAnimation = flag;
    }
    /**
     * Gets the flag that indicates if user zooming should stop animation.
     */
    get zoomStopsAnimation() {
        return this._zoomStopsAnimation;
    }
    /**
     * Sets the default speed at which the camera rotates around the model.
     */
    set idleRotationSpeed(speed) {
        this._idleRotationSpeed = speed;
    }
    /**
     * Gets the default speed at which the camera rotates around the model.
     */
    get idleRotationSpeed() {
        return this._idleRotationSpeed;
    }
    /**
     * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
     */
    set idleRotationWaitTime(time) {
        this._idleRotationWaitTime = time;
    }
    /**
     * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
     */
    get idleRotationWaitTime() {
        return this._idleRotationWaitTime;
    }
    /**
     * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
     */
    set idleRotationSpinupTime(time) {
        this._idleRotationSpinupTime = time;
    }
    /**
     * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
     */
    get idleRotationSpinupTime() {
        return this._idleRotationSpinupTime;
    }
    /**
     * Gets a value indicating if the camera is currently rotating because of this behavior
     */
    get rotationInProgress() {
        return Math.abs(this._cameraRotationSpeed) > 0;
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
        const scene = this._attachedCamera.getScene();
        this._onPrePointerObservableObserver = scene.onPrePointerObservable.add((pointerInfoPre) => {
            if (pointerInfoPre.type === PointerEventTypes.POINTERDOWN) {
                this._isPointerDown = true;
                return;
            }
            if (pointerInfoPre.type === PointerEventTypes.POINTERUP) {
                this._isPointerDown = false;
            }
        });
        this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(() => {
            if (this._reachTargetAlpha()) {
                return;
            }
            const now = PrecisionDate.Now;
            let dt = 0;
            if (this._lastFrameTime != null) {
                dt = now - this._lastFrameTime;
            }
            this._lastFrameTime = now;
            // Stop the animation if there is user interaction and the animation should stop for this interaction
            this._applyUserInteraction();
            const timeToRotation = now - this._lastInteractionTime - this._idleRotationWaitTime;
            const scale = Math.max(Math.min(timeToRotation / this._idleRotationSpinupTime, 1), 0);
            this._cameraRotationSpeed = this._idleRotationSpeed * scale;
            // Step camera rotation by rotation speed
            if (this._attachedCamera) {
                this._attachedCamera.alpha -= this._cameraRotationSpeed * (dt / 1000);
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
        const scene = this._attachedCamera.getScene();
        if (this._onPrePointerObservableObserver) {
            scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
        }
        this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
        this._attachedCamera = null;
        this._lastFrameTime = null;
    }
    /**
     * Force-reset the last interaction time
     * @param customTime an optional time that will be used instead of the current last interaction time. For example `Date.now()`
     */
    resetLastInteractionTime(customTime) {
        this._lastInteractionTime = customTime ?? PrecisionDate.Now;
    }
    /**
     * Returns true if camera alpha reaches the target alpha
     * @returns true if camera alpha reaches the target alpha
     */
    _reachTargetAlpha() {
        if (this._attachedCamera && this.targetAlpha) {
            return Math.abs(this._attachedCamera.alpha - this.targetAlpha) < Epsilon;
        }
        return false;
    }
    /**
     * Returns true if user is scrolling.
     * @returns true if user is scrolling.
     */
    _userIsZooming() {
        if (!this._attachedCamera) {
            return false;
        }
        return this._attachedCamera.inertialRadiusOffset !== 0;
    }
    _shouldAnimationStopForInteraction() {
        if (!this._attachedCamera) {
            return false;
        }
        let zoomHasHitLimit = false;
        if (this._lastFrameRadius === this._attachedCamera.radius && this._attachedCamera.inertialRadiusOffset !== 0) {
            zoomHasHitLimit = true;
        }
        // Update the record of previous radius - works as an approx. indicator of hitting radius limits
        this._lastFrameRadius = this._attachedCamera.radius;
        return this._zoomStopsAnimation ? zoomHasHitLimit : this._userIsZooming();
    }
    /**
     *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
     */
    _applyUserInteraction() {
        if (this._userIsMoving() && !this._shouldAnimationStopForInteraction()) {
            this._lastInteractionTime = PrecisionDate.Now;
        }
    }
    // Tools
    _userIsMoving() {
        if (!this._attachedCamera) {
            return false;
        }
        return (this._attachedCamera.inertialAlphaOffset !== 0 ||
            this._attachedCamera.inertialBetaOffset !== 0 ||
            this._attachedCamera.inertialRadiusOffset !== 0 ||
            this._attachedCamera.inertialPanningX !== 0 ||
            this._attachedCamera.inertialPanningY !== 0 ||
            this._isPointerDown);
    }
}
//# sourceMappingURL=autoRotationBehavior.js.map