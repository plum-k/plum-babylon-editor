import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { BaseCameraPointersInput } from "../../Cameras/Inputs/BaseCameraPointersInput.js";
import { Logger } from "../../Misc/logger.js";
/**
 * Manage the pointers inputs to control an follow camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FollowCameraPointersInput extends BaseCameraPointersInput {
    constructor() {
        super(...arguments);
        /**
         * Defines the pointer angular sensibility along the X axis or how fast is
         * the camera rotating.
         * A negative number will reverse the axis direction.
         */
        this.angularSensibilityX = 1;
        /**
         * Defines the pointer angular sensibility along the Y axis or how fast is
         * the camera rotating.
         * A negative number will reverse the axis direction.
         */
        this.angularSensibilityY = 1;
        /**
         * Defines the pointer pinch precision or how fast is the camera zooming.
         * A negative number will reverse the axis direction.
         */
        this.pinchPrecision = 10000.0;
        /**
         * pinchDeltaPercentage will be used instead of pinchPrecision if different
         * from 0.
         * It defines the percentage of current camera.radius to use as delta when
         * pinch zoom is used.
         */
        this.pinchDeltaPercentage = 0;
        /**
         * Pointer X axis controls zoom. (X axis modifies camera.radius value.)
         */
        this.axisXControlRadius = false;
        /**
         * Pointer X axis controls height. (X axis modifies camera.heightOffset value.)
         */
        this.axisXControlHeight = false;
        /**
         * Pointer X axis controls angle. (X axis modifies camera.rotationOffset value.)
         */
        this.axisXControlRotation = true;
        /**
         * Pointer Y axis controls zoom. (Y axis modifies camera.radius value.)
         */
        this.axisYControlRadius = false;
        /**
         * Pointer Y axis controls height. (Y axis modifies camera.heightOffset value.)
         */
        this.axisYControlHeight = true;
        /**
         * Pointer Y axis controls angle. (Y axis modifies camera.rotationOffset value.)
         */
        this.axisYControlRotation = false;
        /**
         * Pinch controls zoom. (Pinch modifies camera.radius value.)
         */
        this.axisPinchControlRadius = true;
        /**
         * Pinch controls height. (Pinch modifies camera.heightOffset value.)
         */
        this.axisPinchControlHeight = false;
        /**
         * Pinch controls angle. (Pinch modifies camera.rotationOffset value.)
         */
        this.axisPinchControlRotation = false;
        /**
         * Log error messages if basic misconfiguration has occurred.
         */
        this.warningEnable = true;
        /* Check for obvious misconfiguration. */
        this._warningCounter = 0;
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FollowCameraPointersInput";
    }
    onTouch(pointA, offsetX, offsetY) {
        this._warning();
        if (this.axisXControlRotation) {
            this.camera.rotationOffset += offsetX / this.angularSensibilityX;
        }
        else if (this.axisYControlRotation) {
            this.camera.rotationOffset += offsetY / this.angularSensibilityX;
        }
        if (this.axisXControlHeight) {
            this.camera.heightOffset += offsetX / this.angularSensibilityY;
        }
        else if (this.axisYControlHeight) {
            this.camera.heightOffset += offsetY / this.angularSensibilityY;
        }
        if (this.axisXControlRadius) {
            this.camera.radius -= offsetX / this.angularSensibilityY;
        }
        else if (this.axisYControlRadius) {
            this.camera.radius -= offsetY / this.angularSensibilityY;
        }
    }
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
        let pinchDelta = (pinchSquaredDistance - previousPinchSquaredDistance) / ((this.pinchPrecision * (this.angularSensibilityX + this.angularSensibilityY)) / 2);
        if (this.pinchDeltaPercentage) {
            pinchDelta *= 0.01 * this.pinchDeltaPercentage;
            if (this.axisPinchControlRotation) {
                this.camera.rotationOffset += pinchDelta * this.camera.rotationOffset;
            }
            if (this.axisPinchControlHeight) {
                this.camera.heightOffset += pinchDelta * this.camera.heightOffset;
            }
            if (this.axisPinchControlRadius) {
                this.camera.radius -= pinchDelta * this.camera.radius;
            }
        }
        else {
            if (this.axisPinchControlRotation) {
                this.camera.rotationOffset += pinchDelta;
            }
            if (this.axisPinchControlHeight) {
                this.camera.heightOffset += pinchDelta;
            }
            if (this.axisPinchControlRadius) {
                this.camera.radius -= pinchDelta;
            }
        }
    }
    _warning() {
        if (!this.warningEnable || this._warningCounter++ % 100 !== 0) {
            return;
        }
        const warn = "It probably only makes sense to control ONE camera " + "property with each pointer axis. Set 'warningEnable = false' " + "if you are sure. Currently enabled: ";
        if (+this.axisXControlRotation + +this.axisXControlHeight + +this.axisXControlRadius <= 1) {
            Logger.Warn(warn +
                "axisXControlRotation: " +
                this.axisXControlRotation +
                ", axisXControlHeight: " +
                this.axisXControlHeight +
                ", axisXControlRadius: " +
                this.axisXControlRadius);
        }
        if (+this.axisYControlRotation + +this.axisYControlHeight + +this.axisYControlRadius <= 1) {
            Logger.Warn(warn +
                "axisYControlRotation: " +
                this.axisYControlRotation +
                ", axisYControlHeight: " +
                this.axisYControlHeight +
                ", axisYControlRadius: " +
                this.axisYControlRadius);
        }
        if (+this.axisPinchControlRotation + +this.axisPinchControlHeight + +this.axisPinchControlRadius <= 1) {
            Logger.Warn(warn +
                "axisPinchControlRotation: " +
                this.axisPinchControlRotation +
                ", axisPinchControlHeight: " +
                this.axisPinchControlHeight +
                ", axisPinchControlRadius: " +
                this.axisPinchControlRadius);
        }
    }
}
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "angularSensibilityX", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "angularSensibilityY", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "pinchPrecision", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "pinchDeltaPercentage", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisXControlRadius", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisXControlHeight", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisXControlRotation", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisYControlRadius", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisYControlHeight", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisYControlRotation", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisPinchControlRadius", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisPinchControlHeight", void 0);
__decorate([
    serialize()
], FollowCameraPointersInput.prototype, "axisPinchControlRotation", void 0);
CameraInputTypes["FollowCameraPointersInput"] = FollowCameraPointersInput;
//# sourceMappingURL=followCameraPointersInput.js.map