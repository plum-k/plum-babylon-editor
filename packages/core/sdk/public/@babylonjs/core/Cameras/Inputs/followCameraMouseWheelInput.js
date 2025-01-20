import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { PointerEventTypes } from "../../Events/pointerEvents.js";
import { Tools } from "../../Misc/tools.js";
import { Logger } from "../../Misc/logger.js";
/**
 * Manage the mouse wheel inputs to control a follow camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FollowCameraMouseWheelInput {
    constructor() {
        /**
         * Moue wheel controls zoom. (Mouse wheel modifies camera.radius value.)
         */
        this.axisControlRadius = true;
        /**
         * Moue wheel controls height. (Mouse wheel modifies camera.heightOffset value.)
         */
        this.axisControlHeight = false;
        /**
         * Moue wheel controls angle. (Mouse wheel modifies camera.rotationOffset value.)
         */
        this.axisControlRotation = false;
        /**
         * Gets or Set the mouse wheel precision or how fast is the camera moves in
         * relation to mouseWheel events.
         */
        this.wheelPrecision = 3.0;
        /**
         * wheelDeltaPercentage will be used instead of wheelPrecision if different from 0.
         * It defines the percentage of current camera.radius to use as delta when wheel is used.
         */
        this.wheelDeltaPercentage = 0;
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(noPreventDefault) {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._wheel = (p) => {
            // sanity check - this should be a PointerWheel event.
            if (p.type !== PointerEventTypes.POINTERWHEEL) {
                return;
            }
            const event = p.event;
            let delta = 0;
            const wheelDelta = Math.max(-1, Math.min(1, event.deltaY));
            if (this.wheelDeltaPercentage) {
                if (+this.axisControlRadius + +this.axisControlHeight + +this.axisControlRotation) {
                    Logger.Warn("wheelDeltaPercentage only usable when mouse wheel " +
                        "controls ONE axis. " +
                        "Currently enabled: " +
                        "axisControlRadius: " +
                        this.axisControlRadius +
                        ", axisControlHeightOffset: " +
                        this.axisControlHeight +
                        ", axisControlRotationOffset: " +
                        this.axisControlRotation);
                }
                if (this.axisControlRadius) {
                    delta = wheelDelta * 0.01 * this.wheelDeltaPercentage * this.camera.radius;
                }
                else if (this.axisControlHeight) {
                    delta = wheelDelta * 0.01 * this.wheelDeltaPercentage * this.camera.heightOffset;
                }
                else if (this.axisControlRotation) {
                    delta = wheelDelta * 0.01 * this.wheelDeltaPercentage * this.camera.rotationOffset;
                }
            }
            else {
                delta = wheelDelta * this.wheelPrecision;
            }
            if (delta) {
                if (this.axisControlRadius) {
                    this.camera.radius += delta;
                }
                else if (this.axisControlHeight) {
                    this.camera.heightOffset -= delta;
                }
                else if (this.axisControlRotation) {
                    this.camera.rotationOffset -= delta;
                }
            }
            if (event.preventDefault) {
                if (!noPreventDefault) {
                    event.preventDefault();
                }
            }
        };
        this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._wheel, PointerEventTypes.POINTERWHEEL);
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        if (this._observer) {
            this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);
            this._observer = null;
            this._wheel = null;
        }
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "ArcRotateCameraMouseWheelInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "mousewheel";
    }
}
__decorate([
    serialize()
], FollowCameraMouseWheelInput.prototype, "axisControlRadius", void 0);
__decorate([
    serialize()
], FollowCameraMouseWheelInput.prototype, "axisControlHeight", void 0);
__decorate([
    serialize()
], FollowCameraMouseWheelInput.prototype, "axisControlRotation", void 0);
__decorate([
    serialize()
], FollowCameraMouseWheelInput.prototype, "wheelPrecision", void 0);
__decorate([
    serialize()
], FollowCameraMouseWheelInput.prototype, "wheelDeltaPercentage", void 0);
CameraInputTypes["FollowCameraMouseWheelInput"] = FollowCameraMouseWheelInput;
//# sourceMappingURL=followCameraMouseWheelInput.js.map