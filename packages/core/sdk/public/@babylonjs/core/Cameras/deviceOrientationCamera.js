import { FreeCamera } from "./freeCamera.js";
import { Quaternion, Vector3 } from "../Maths/math.vector.js";
import { Node } from "../node.js";
import "./Inputs/freeCameraDeviceOrientationInput.js";
import { Axis } from "../Maths/math.axis.js";
Node.AddNodeConstructor("DeviceOrientationCamera", (name, scene) => {
    return () => new DeviceOrientationCamera(name, Vector3.Zero(), scene);
});
// We're mainly based on the logic defined into the FreeCamera code
/**
 * This is a camera specifically designed to react to device orientation events such as a modern mobile device
 * being tilted forward or back and left or right.
 */
export class DeviceOrientationCamera extends FreeCamera {
    /**
     * Creates a new device orientation camera
     * @param name The name of the camera
     * @param position The start position camera
     * @param scene The scene the camera belongs to
     */
    constructor(name, position, scene) {
        super(name, position, scene);
        this._tmpDragQuaternion = new Quaternion();
        this._disablePointerInputWhenUsingDeviceOrientation = true;
        this._dragFactor = 0;
        this._quaternionCache = new Quaternion();
        this.inputs.addDeviceOrientation();
        // When the orientation sensor fires it's first event, disable mouse input
        if (this.inputs._deviceOrientationInput) {
            this.inputs._deviceOrientationInput._onDeviceOrientationChangedObservable.addOnce(() => {
                if (this._disablePointerInputWhenUsingDeviceOrientation) {
                    if (this.inputs._mouseInput) {
                        this.inputs._mouseInput._allowCameraRotation = false;
                        this.inputs._mouseInput.onPointerMovedObservable.add((e) => {
                            if (this._dragFactor != 0) {
                                if (!this._initialQuaternion) {
                                    this._initialQuaternion = new Quaternion();
                                }
                                // Rotate the initial space around the y axis to allow users to "turn around" via touch/mouse
                                Quaternion.FromEulerAnglesToRef(0, e.offsetX * this._dragFactor, 0, this._tmpDragQuaternion);
                                this._initialQuaternion.multiplyToRef(this._tmpDragQuaternion, this._initialQuaternion);
                            }
                        });
                    }
                }
            });
        }
    }
    /**
     * Gets or sets a boolean indicating that pointer input must be disabled on first orientation sensor update (Default: true)
     */
    get disablePointerInputWhenUsingDeviceOrientation() {
        return this._disablePointerInputWhenUsingDeviceOrientation;
    }
    set disablePointerInputWhenUsingDeviceOrientation(value) {
        this._disablePointerInputWhenUsingDeviceOrientation = value;
    }
    /**
     * Enabled turning on the y axis when the orientation sensor is active
     * @param dragFactor the factor that controls the turn speed (default: 1/300)
     */
    enableHorizontalDragging(dragFactor = 1 / 300) {
        this._dragFactor = dragFactor;
    }
    /**
     * Gets the current instance class name ("DeviceOrientationCamera").
     * This helps avoiding instanceof at run time.
     * @returns the class name
     */
    getClassName() {
        return "DeviceOrientationCamera";
    }
    /**
     * @internal
     * Checks and applies the current values of the inputs to the camera. (Internal use only)
     */
    _checkInputs() {
        super._checkInputs();
        this._quaternionCache.copyFrom(this.rotationQuaternion);
        if (this._initialQuaternion) {
            this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
        }
    }
    /**
     * Reset the camera to its default orientation on the specified axis only.
     * @param axis The axis to reset
     */
    resetToCurrentRotation(axis = Axis.Y) {
        //can only work if this camera has a rotation quaternion already.
        if (!this.rotationQuaternion) {
            return;
        }
        if (!this._initialQuaternion) {
            this._initialQuaternion = new Quaternion();
        }
        this._initialQuaternion.copyFrom(this._quaternionCache || this.rotationQuaternion);
        ["x", "y", "z"].forEach((axisName) => {
            if (!axis[axisName]) {
                this._initialQuaternion[axisName] = 0;
            }
            else {
                this._initialQuaternion[axisName] *= -1;
            }
        });
        this._initialQuaternion.normalize();
        //force rotation update
        this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
    }
}
//# sourceMappingURL=deviceOrientationCamera.js.map