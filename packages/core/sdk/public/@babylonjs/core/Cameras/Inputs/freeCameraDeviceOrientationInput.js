import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { Quaternion } from "../../Maths/math.vector.js";
import { Tools } from "../../Misc/tools.js";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager.js";
import { Observable } from "../../Misc/observable.js";
/**
 * Add orientation input support to the input manager.
 * @param smoothFactor deviceOrientation smoothing. 0: no smoothing, 1: new data ignored, 0.9 recommended for smoothing
 * @returns the current input manager
 */
FreeCameraInputsManager.prototype.addDeviceOrientation = function (smoothFactor) {
    if (!this._deviceOrientationInput) {
        this._deviceOrientationInput = new FreeCameraDeviceOrientationInput();
        if (smoothFactor) {
            this._deviceOrientationInput.smoothFactor = smoothFactor;
        }
        this.add(this._deviceOrientationInput);
    }
    return this;
};
/**
 * Takes information about the orientation of the device as reported by the deviceorientation event to orient the camera.
 * Screen rotation is taken into account.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraDeviceOrientationInput {
    /**
     * Can be used to detect if a device orientation sensor is available on a device
     * @param timeout amount of time in milliseconds to wait for a response from the sensor (default: infinite)
     * @returns a promise that will resolve on orientation change
     */
    static WaitForOrientationChangeAsync(timeout) {
        return new Promise((res, rej) => {
            let gotValue = false;
            const eventHandler = () => {
                window.removeEventListener("deviceorientation", eventHandler);
                gotValue = true;
                res();
            };
            // If timeout is populated reject the promise
            if (timeout) {
                setTimeout(() => {
                    if (!gotValue) {
                        window.removeEventListener("deviceorientation", eventHandler);
                        rej("WaitForOrientationChangeAsync timed out");
                    }
                }, timeout);
            }
            if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
                DeviceOrientationEvent
                    .requestPermission()
                    .then((response) => {
                    if (response == "granted") {
                        window.addEventListener("deviceorientation", eventHandler);
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
                window.addEventListener("deviceorientation", eventHandler);
            }
        });
    }
    /**
     * Instantiates a new input
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
     */
    constructor() {
        this._screenOrientationAngle = 0;
        this._screenQuaternion = new Quaternion();
        this._alpha = 0;
        this._beta = 0;
        this._gamma = 0;
        /** alpha+beta+gamma smoothing. 0: no smoothing, 1: new data ignored, 0.9 recommended for smoothing */
        this.smoothFactor = 0;
        /**
         * @internal
         */
        this._onDeviceOrientationChangedObservable = new Observable();
        this._orientationChanged = () => {
            this._screenOrientationAngle =
                window.orientation !== undefined
                    ? +window.orientation
                    : window.screen.orientation && window.screen.orientation["angle"]
                        ? window.screen.orientation.angle
                        : 0;
            this._screenOrientationAngle = -Tools.ToRadians(this._screenOrientationAngle / 2);
            this._screenQuaternion.copyFromFloats(0, Math.sin(this._screenOrientationAngle), 0, Math.cos(this._screenOrientationAngle));
        };
        this._deviceOrientation = (evt) => {
            if (this.smoothFactor) {
                this._alpha = evt.alpha !== null ? Tools.SmoothAngleChange(this._alpha, evt.alpha, this.smoothFactor) : 0;
                this._beta = evt.beta !== null ? Tools.SmoothAngleChange(this._beta, evt.beta, this.smoothFactor) : 0;
                this._gamma = evt.gamma !== null ? Tools.SmoothAngleChange(this._gamma, evt.gamma, this.smoothFactor) : 0;
            }
            else {
                this._alpha = evt.alpha !== null ? evt.alpha : 0;
                this._beta = evt.beta !== null ? evt.beta : 0;
                this._gamma = evt.gamma !== null ? evt.gamma : 0;
            }
            if (evt.alpha !== null) {
                this._onDeviceOrientationChangedObservable.notifyObservers();
            }
        };
        this._constantTransform = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        this._orientationChanged();
    }
    /**
     * Define the camera controlled by the input.
     */
    get camera() {
        return this._camera;
    }
    set camera(camera) {
        this._camera = camera;
        if (this._camera != null && !this._camera.rotationQuaternion) {
            this._camera.rotationQuaternion = new Quaternion();
        }
        if (this._camera) {
            this._camera.onDisposeObservable.add(() => {
                this._onDeviceOrientationChangedObservable.clear();
            });
        }
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     */
    attachControl() {
        const hostWindow = this.camera.getScene().getEngine().getHostWindow();
        if (hostWindow) {
            const eventHandler = () => {
                hostWindow.addEventListener("orientationchange", this._orientationChanged);
                hostWindow.addEventListener("deviceorientation", this._deviceOrientation);
                //In certain cases, the attach control is called AFTER orientation was changed,
                //So this is needed.
                this._orientationChanged();
            };
            if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
                DeviceOrientationEvent
                    .requestPermission()
                    .then((response) => {
                    if (response === "granted") {
                        eventHandler();
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
                eventHandler();
            }
        }
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        window.removeEventListener("orientationchange", this._orientationChanged);
        window.removeEventListener("deviceorientation", this._deviceOrientation);
        this._alpha = 0;
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        // if no device orientation provided, don't update the rotation.
        // Only testing against alpha under the assumption that orientation will never be so exact when set.
        if (!this._alpha) {
            return;
        }
        Quaternion.RotationYawPitchRollToRef(Tools.ToRadians(this._alpha), Tools.ToRadians(this._beta), -Tools.ToRadians(this._gamma), this.camera.rotationQuaternion);
        this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion);
        this._camera.rotationQuaternion.multiplyInPlace(this._constantTransform);
        if (this._camera.getScene().useRightHandedSystem) {
            this._camera.rotationQuaternion.y *= -1;
        }
        else {
            this._camera.rotationQuaternion.z *= -1;
        }
        this._camera.rotationQuaternion.w *= -1;
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FreeCameraDeviceOrientationInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "deviceOrientation";
    }
}
CameraInputTypes["FreeCameraDeviceOrientationInput"] = FreeCameraDeviceOrientationInput;
//# sourceMappingURL=freeCameraDeviceOrientationInput.js.map