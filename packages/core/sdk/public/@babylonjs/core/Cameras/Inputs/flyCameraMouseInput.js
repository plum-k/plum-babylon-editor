import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { PointerEventTypes } from "../../Events/pointerEvents.js";
import { Quaternion } from "../../Maths/math.vector.js";
import { Axis } from "../../Maths/math.axis.js";
import { Tools } from "../../Misc/tools.js";
/**
 * Listen to mouse events to control the camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FlyCameraMouseInput {
    /**
     * Listen to mouse events to control the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
     */
    constructor() {
        /**
         * Defines the buttons associated with the input to handle camera rotation.
         */
        this.buttons = [0, 1, 2];
        /**
         * Assign buttons for Yaw control.
         */
        this.buttonsYaw = [-1, 0, 1];
        /**
         * Assign buttons for Pitch control.
         */
        this.buttonsPitch = [-1, 0, 1];
        /**
         * Assign buttons for Roll control.
         */
        this.buttonsRoll = [2];
        /**
         * Detect if any button is being pressed while mouse is moved.
         * -1 = Mouse locked.
         * 0 = Left button.
         * 1 = Middle Button.
         * 2 = Right Button.
         */
        this.activeButton = -1;
        /**
         * Defines the pointer's angular sensibility, to control the camera rotation speed.
         * Higher values reduce its sensitivity.
         */
        this.angularSensibility = 1000.0;
        this._previousPosition = null;
    }
    /**
     * Attach the mouse control to the HTML DOM element.
     * @param noPreventDefault Defines whether events caught by the controls should call preventdefault().
     */
    attachControl(noPreventDefault) {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._noPreventDefault = noPreventDefault;
        this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver((p) => {
            this._pointerInput(p);
        }, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);
        // Correct Roll by rate, if enabled.
        this._rollObserver = this.camera.getScene().onBeforeRenderObservable.add(() => {
            if (this.camera.rollCorrect) {
                this.camera.restoreRoll(this.camera.rollCorrect);
            }
        });
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        if (this._observer) {
            this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);
            this.camera.getScene().onBeforeRenderObservable.remove(this._rollObserver);
            this._observer = null;
            this._rollObserver = null;
            this._previousPosition = null;
            this._noPreventDefault = undefined;
        }
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name.
     */
    getClassName() {
        return "FlyCameraMouseInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input's friendly name.
     */
    getSimpleName() {
        return "mouse";
    }
    // Track mouse movement, when the pointer is not locked.
    _pointerInput(p) {
        const e = p.event;
        const camera = this.camera;
        const engine = camera.getEngine();
        if (!this.touchEnabled && e.pointerType === "touch") {
            return;
        }
        // Mouse is moved but an unknown mouse button is pressed.
        if (p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(e.button) === -1) {
            return;
        }
        const srcElement = e.target;
        // Mouse down.
        if (p.type === PointerEventTypes.POINTERDOWN) {
            try {
                srcElement?.setPointerCapture(e.pointerId);
            }
            catch (e) {
                // Nothing to do with the error. Execution continues.
            }
            this._previousPosition = {
                x: e.clientX,
                y: e.clientY,
            };
            this.activeButton = e.button;
            if (!this._noPreventDefault) {
                e.preventDefault();
            }
            // This is required to move while pointer button is down
            if (engine.isPointerLock) {
                this._onMouseMove(p.event);
            }
        }
        // Mouse up.
        else if (p.type === PointerEventTypes.POINTERUP) {
            try {
                srcElement?.releasePointerCapture(e.pointerId);
            }
            catch (e) {
                // Nothing to do with the error. Execution continues.
            }
            this.activeButton = -1;
            this._previousPosition = null;
            if (!this._noPreventDefault) {
                e.preventDefault();
            }
        }
        // Mouse move.
        else if (p.type === PointerEventTypes.POINTERMOVE) {
            if (!this._previousPosition) {
                if (engine.isPointerLock) {
                    this._onMouseMove(p.event);
                }
                return;
            }
            const offsetX = e.clientX - this._previousPosition.x;
            const offsetY = e.clientY - this._previousPosition.y;
            this._rotateCamera(offsetX, offsetY);
            this._previousPosition = {
                x: e.clientX,
                y: e.clientY,
            };
            if (!this._noPreventDefault) {
                e.preventDefault();
            }
        }
    }
    // Track mouse movement, when pointer is locked.
    _onMouseMove(e) {
        const camera = this.camera;
        const engine = camera.getEngine();
        if (!engine.isPointerLock) {
            return;
        }
        const offsetX = e.movementX;
        const offsetY = e.movementY;
        this._rotateCamera(offsetX, offsetY);
        this._previousPosition = null;
        if (!this._noPreventDefault) {
            e.preventDefault();
        }
    }
    /**
     * Rotate camera by mouse offset.
     * @param offsetX
     * @param offsetY
     */
    _rotateCamera(offsetX, offsetY) {
        const camera = this.camera;
        const handednessMultiplier = camera._calculateHandednessMultiplier();
        offsetX *= handednessMultiplier;
        const x = offsetX / this.angularSensibility;
        const y = offsetY / this.angularSensibility;
        // Initialize to current rotation.
        const currentRotation = Quaternion.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, camera.rotation.z);
        let rotationChange;
        // Pitch.
        if (this.buttonsPitch.some((v) => {
            return v === this.activeButton;
        })) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.X, y);
            // Apply Pitch to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
        }
        // Yaw.
        if (this.buttonsYaw.some((v) => {
            return v === this.activeButton;
        })) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.Y, x);
            // Apply Yaw to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
            // Add Roll, if banked turning is enabled, within Roll limit.
            const limit = camera.bankedTurnLimit + camera._trackRoll; // Defaults to 90° plus manual roll.
            if (camera.bankedTurn && -limit < camera.rotation.z && camera.rotation.z < limit) {
                const bankingDelta = camera.bankedTurnMultiplier * -x;
                // Apply change in Radians to vector Angle.
                rotationChange = Quaternion.RotationAxis(Axis.Z, bankingDelta);
                // Apply Yaw to quaternion.
                currentRotation.multiplyInPlace(rotationChange);
            }
        }
        // Roll.
        if (this.buttonsRoll.some((v) => {
            return v === this.activeButton;
        })) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.Z, -x);
            // Track Rolling.
            camera._trackRoll -= x;
            // Apply Pitch to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
        }
        // Apply rotationQuaternion to Euler camera.rotation.
        currentRotation.toEulerAnglesToRef(camera.rotation);
    }
}
__decorate([
    serialize()
], FlyCameraMouseInput.prototype, "buttons", void 0);
__decorate([
    serialize()
], FlyCameraMouseInput.prototype, "angularSensibility", void 0);
CameraInputTypes["FlyCameraMouseInput"] = FlyCameraMouseInput;
//# sourceMappingURL=flyCameraMouseInput.js.map