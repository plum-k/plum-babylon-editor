import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { ArcRotateCameraInputsManager } from "../../Cameras/arcRotateCameraInputsManager.js";
import { Tools } from "../../Misc/tools.js";
/**
 * Add orientation input support to the input manager.
 * @returns the current input manager
 */
ArcRotateCameraInputsManager.prototype.addVRDeviceOrientation = function () {
    this.add(new ArcRotateCameraVRDeviceOrientationInput());
    return this;
};
/**
 * Manage the device orientation inputs (gyroscope) to control an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraVRDeviceOrientationInput {
    /**
     * Instantiate a new ArcRotateCameraVRDeviceOrientationInput.
     */
    constructor() {
        /**
         * Defines a correction factor applied on the alpha value retrieved from the orientation events.
         */
        this.alphaCorrection = 1;
        /**
         * Defines a correction factor applied on the gamma value retrieved from the orientation events.
         */
        this.gammaCorrection = 1;
        this._alpha = 0;
        this._gamma = 0;
        this._dirty = false;
        this._deviceOrientationHandler = (evt) => this._onOrientationEvent(evt);
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(noPreventDefault) {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this.camera.attachControl(noPreventDefault);
        const hostWindow = this.camera.getScene().getEngine().getHostWindow();
        if (hostWindow) {
            // check iOS 13+ support
            if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
                DeviceOrientationEvent
                    .requestPermission()
                    .then((response) => {
                    if (response === "granted") {
                        hostWindow.addEventListener("deviceorientation", this._deviceOrientationHandler);
                    }
                    else {
                        Tools.Warn("Permission not granted.");
                    }
                })
                    .catch((error) => {
                    Tools.Error(error);
                });
            }
            else {
                hostWindow.addEventListener("deviceorientation", this._deviceOrientationHandler);
            }
        }
    }
    /**
     * @internal
     */
    _onOrientationEvent(evt) {
        if (evt.alpha !== null) {
            this._alpha = (+evt.alpha | 0) * this.alphaCorrection;
        }
        if (evt.gamma !== null) {
            this._gamma = (+evt.gamma | 0) * this.gammaCorrection;
        }
        this._dirty = true;
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this._dirty) {
            this._dirty = false;
            if (this._gamma < 0) {
                this._gamma = 180 + this._gamma;
            }
            this.camera.alpha = (((-this._alpha / 180.0) * Math.PI) % Math.PI) * 2;
            this.camera.beta = (this._gamma / 180.0) * Math.PI;
        }
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "ArcRotateCameraVRDeviceOrientationInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "VRDeviceOrientation";
    }
}
CameraInputTypes["ArcRotateCameraVRDeviceOrientationInput"] = ArcRotateCameraVRDeviceOrientationInput;
//# sourceMappingURL=arcRotateCameraVRDeviceOrientationInput.js.map