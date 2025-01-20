import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { BaseCameraPointersInput } from "../../Cameras/Inputs/BaseCameraPointersInput.js";
/**
 * Manage the pointers inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraPointersInput extends BaseCameraPointersInput {
    constructor() {
        super(...arguments);
        /**
         * Defines the buttons associated with the input to handle camera move.
         */
        this.buttons = [0, 1, 2];
        /**
         * Defines the pointer angular sensibility  along the X axis or how fast is
         * the camera rotating.
         */
        this.angularSensibilityX = 1000.0;
        /**
         * Defines the pointer angular sensibility along the Y axis or how fast is
         * the camera rotating.
         */
        this.angularSensibilityY = 1000.0;
        /**
         * Defines the pointer pinch precision or how fast is the camera zooming.
         */
        this.pinchPrecision = 12.0;
        /**
         * pinchDeltaPercentage will be used instead of pinchPrecision if different
         * from 0.
         * It defines the percentage of current camera.radius to use as delta when
         * pinch zoom is used.
         */
        this.pinchDeltaPercentage = 0;
        /**
         * When useNaturalPinchZoom is true, multi touch zoom will zoom in such
         * that any object in the plane at the camera's target point will scale
         * perfectly with finger motion.
         * Overrides pinchDeltaPercentage and pinchPrecision.
         */
        this.useNaturalPinchZoom = false;
        /**
         * Defines whether zoom (2 fingers pinch) is enabled through multitouch
         */
        this.pinchZoom = true;
        /**
         * Defines the pointer panning sensibility or how fast is the camera moving.
         */
        this.panningSensibility = 1000.0;
        /**
         * Defines whether panning (2 fingers swipe) is enabled through multitouch.
         */
        this.multiTouchPanning = true;
        /**
         * Defines whether panning is enabled for both pan (2 fingers swipe) and
         * zoom (pinch) through multitouch.
         */
        this.multiTouchPanAndZoom = true;
        /**
         * Revers pinch action direction.
         */
        this.pinchInwards = true;
        this._isPanClick = false;
        this._twoFingerActivityCount = 0;
        this._isPinching = false;
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "ArcRotateCameraPointersInput";
    }
    /**
     * Move camera from multi touch panning positions.
     * @param previousMultiTouchPanPosition
     * @param multiTouchPanPosition
     */
    _computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition) {
        if (this.panningSensibility !== 0 && previousMultiTouchPanPosition && multiTouchPanPosition) {
            const moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
            const moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
            this.camera.inertialPanningX += -moveDeltaX / this.panningSensibility;
            this.camera.inertialPanningY += moveDeltaY / this.panningSensibility;
        }
    }
    /**
     * Move camera from pinch zoom distances.
     * @param previousPinchSquaredDistance
     * @param pinchSquaredDistance
     */
    _computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance) {
        const radius = this.camera.radius || ArcRotateCameraPointersInput.MinimumRadiusForPinch;
        if (this.useNaturalPinchZoom) {
            this.camera.radius = (radius * Math.sqrt(previousPinchSquaredDistance)) / Math.sqrt(pinchSquaredDistance);
        }
        else if (this.pinchDeltaPercentage) {
            this.camera.inertialRadiusOffset += (pinchSquaredDistance - previousPinchSquaredDistance) * 0.001 * radius * this.pinchDeltaPercentage;
        }
        else {
            this.camera.inertialRadiusOffset +=
                (pinchSquaredDistance - previousPinchSquaredDistance) /
                    ((this.pinchPrecision * (this.pinchInwards ? 1 : -1) * (this.angularSensibilityX + this.angularSensibilityY)) / 2);
        }
    }
    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * @param point current touch point
     * @param offsetX offset on X
     * @param offsetY offset on Y
     */
    onTouch(point, offsetX, offsetY) {
        if (this.panningSensibility !== 0 && ((this._ctrlKey && this.camera._useCtrlForPanning) || this._isPanClick)) {
            this.camera.inertialPanningX += -offsetX / this.panningSensibility;
            this.camera.inertialPanningY += offsetY / this.panningSensibility;
        }
        else {
            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
        }
    }
    /**
     * Called on pointer POINTERDOUBLETAP event.
     */
    onDoubleTap() {
        if (this.camera.useInputToRestoreState) {
            this.camera.restoreState();
        }
    }
    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     * @param pointA point A
     * @param pointB point B
     * @param previousPinchSquaredDistance distance between points in previous pinch
     * @param pinchSquaredDistance distance between points in current pinch
     * @param previousMultiTouchPanPosition multi-touch position in previous step
     * @param multiTouchPanPosition multi-touch position in current step
     */
    onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition) {
        if (previousPinchSquaredDistance === 0 && previousMultiTouchPanPosition === null) {
            // First time this method is called for new pinch.
            // Next time this is called there will be a
            // previousPinchSquaredDistance and pinchSquaredDistance to compare.
            return;
        }
        if (pinchSquaredDistance === 0 && multiTouchPanPosition === null) {
            // Last time this method is called at the end of a pinch.
            return;
        }
        // Zoom and panning enabled together
        if (this.multiTouchPanAndZoom) {
            this._computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);
            this._computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition);
            // Zoom and panning enabled but only one at a time
        }
        else if (this.multiTouchPanning && this.pinchZoom) {
            this._twoFingerActivityCount++;
            if (this._isPinching ||
                (this._twoFingerActivityCount < 20 && Math.abs(Math.sqrt(pinchSquaredDistance) - Math.sqrt(previousPinchSquaredDistance)) > this.camera.pinchToPanMaxDistance)) {
                // Since pinch has not been active long, assume we intend to zoom.
                this._computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);
                // Since we are pinching, remain pinching on next iteration.
                this._isPinching = true;
            }
            else {
                // Pause between pinch starting and moving implies not a zoom event. Pan instead.
                this._computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition);
            }
            // Panning enabled, zoom disabled
        }
        else if (this.multiTouchPanning) {
            this._computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition);
            // Zoom enabled, panning disabled
        }
        else if (this.pinchZoom) {
            this._computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);
        }
    }
    /**
     * Called each time a new POINTERDOWN event occurs. Ie, for each button
     * press.
     * @param evt Defines the event to track
     */
    onButtonDown(evt) {
        this._isPanClick = evt.button === this.camera._panningMouseButton;
    }
    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * @param _evt Defines the event to track
     */
    onButtonUp(_evt) {
        this._twoFingerActivityCount = 0;
        this._isPinching = false;
    }
    /**
     * Called when window becomes inactive.
     */
    onLostFocus() {
        this._isPanClick = false;
        this._twoFingerActivityCount = 0;
        this._isPinching = false;
    }
}
/**
 * The minimum radius used for pinch, to avoid radius lock at 0
 */
ArcRotateCameraPointersInput.MinimumRadiusForPinch = 0.001;
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "buttons", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "angularSensibilityX", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "angularSensibilityY", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "pinchPrecision", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "pinchDeltaPercentage", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "useNaturalPinchZoom", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "pinchZoom", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "panningSensibility", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "multiTouchPanning", void 0);
__decorate([
    serialize()
], ArcRotateCameraPointersInput.prototype, "multiTouchPanAndZoom", void 0);
CameraInputTypes["ArcRotateCameraPointersInput"] = ArcRotateCameraPointersInput;
//# sourceMappingURL=arcRotateCameraPointersInput.js.map