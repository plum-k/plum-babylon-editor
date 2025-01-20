import { VirtualJoystick } from "../../Misc/virtualJoystick.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { Matrix, Vector3 } from "../../Maths/math.vector.js";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager.js";
/**
 * Add virtual joystick input support to the input manager.
 * @returns the current input manager
 */
FreeCameraInputsManager.prototype.addVirtualJoystick = function () {
    this.add(new FreeCameraVirtualJoystickInput());
    return this;
};
/**
 * Manage the Virtual Joystick inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraVirtualJoystickInput {
    /**
     * Gets the left stick of the virtual joystick.
     * @returns The virtual Joystick
     */
    getLeftJoystick() {
        return this._leftjoystick;
    }
    /**
     * Gets the right stick of the virtual joystick.
     * @returns The virtual Joystick
     */
    getRightJoystick() {
        return this._rightjoystick;
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this._leftjoystick) {
            const camera = this.camera;
            const speed = camera._computeLocalCameraSpeed() * 50;
            const cameraTransform = Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);
            const deltaTransform = Vector3.TransformCoordinates(new Vector3(this._leftjoystick.deltaPosition.x * speed, this._leftjoystick.deltaPosition.y * speed, this._leftjoystick.deltaPosition.z * speed), cameraTransform);
            camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
            camera.cameraRotation = camera.cameraRotation.addVector3(this._rightjoystick.deltaPosition);
            if (!this._leftjoystick.pressed) {
                this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this._rightjoystick.pressed) {
                this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9);
            }
        }
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     */
    attachControl() {
        this._leftjoystick = new VirtualJoystick(true);
        this._leftjoystick.setAxisForUpDown(2 /* JoystickAxis.Z */);
        this._leftjoystick.setAxisForLeftRight(0 /* JoystickAxis.X */);
        this._leftjoystick.setJoystickSensibility(0.15);
        this._rightjoystick = new VirtualJoystick(false);
        this._rightjoystick.setAxisForUpDown(0 /* JoystickAxis.X */);
        this._rightjoystick.setAxisForLeftRight(1 /* JoystickAxis.Y */);
        this._rightjoystick.reverseUpDown = true;
        this._rightjoystick.setJoystickSensibility(0.05);
        this._rightjoystick.setJoystickColor("yellow");
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        this._leftjoystick.releaseCanvas();
        this._rightjoystick.releaseCanvas();
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FreeCameraVirtualJoystickInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "virtualJoystick";
    }
}
CameraInputTypes["FreeCameraVirtualJoystickInput"] = FreeCameraVirtualJoystickInput;
//# sourceMappingURL=freeCameraVirtualJoystickInput.js.map