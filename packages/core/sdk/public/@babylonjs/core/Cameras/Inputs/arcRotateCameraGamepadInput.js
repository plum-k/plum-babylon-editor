import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { Gamepad } from "../../Gamepads/gamepad.js";
/**
 * Manage the gamepad inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraGamepadInput {
    constructor() {
        /**
         * Defines the gamepad rotation sensibility.
         * This is the threshold from when rotation starts to be accounted for to prevent jittering.
         */
        this.gamepadRotationSensibility = 80;
        /**
         * Defines the gamepad move sensibility.
         * This is the threshold from when moving starts to be accounted for for to prevent jittering.
         */
        this.gamepadMoveSensibility = 40;
        this._yAxisScale = 1.0;
    }
    /**
     * Gets or sets a boolean indicating that Yaxis (for right stick) should be inverted
     */
    get invertYAxis() {
        return this._yAxisScale !== 1.0;
    }
    set invertYAxis(value) {
        this._yAxisScale = value ? -1.0 : 1.0;
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     */
    attachControl() {
        const manager = this.camera.getScene().gamepadManager;
        this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add((gamepad) => {
            if (gamepad.type !== Gamepad.POSE_ENABLED) {
                // prioritize XBOX gamepads.
                if (!this.gamepad || gamepad.type === Gamepad.XBOX) {
                    this.gamepad = gamepad;
                }
            }
        });
        this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add((gamepad) => {
            if (this.gamepad === gamepad) {
                this.gamepad = null;
            }
        });
        this.gamepad = manager.getGamepadByType(Gamepad.XBOX);
        // if no xbox controller was found, but there are gamepad controllers, take the first one
        if (!this.gamepad && manager.gamepads.length) {
            this.gamepad = manager.gamepads[0];
        }
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
        this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
        this.gamepad = null;
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this.gamepad) {
            const camera = this.camera;
            const rsValues = this.gamepad.rightStick;
            if (rsValues) {
                if (rsValues.x != 0) {
                    const normalizedRX = rsValues.x / this.gamepadRotationSensibility;
                    if (normalizedRX != 0 && Math.abs(normalizedRX) > 0.005) {
                        camera.inertialAlphaOffset += normalizedRX;
                    }
                }
                if (rsValues.y != 0) {
                    const normalizedRY = (rsValues.y / this.gamepadRotationSensibility) * this._yAxisScale;
                    if (normalizedRY != 0 && Math.abs(normalizedRY) > 0.005) {
                        camera.inertialBetaOffset += normalizedRY;
                    }
                }
            }
            const lsValues = this.gamepad.leftStick;
            if (lsValues && lsValues.y != 0) {
                const normalizedLY = lsValues.y / this.gamepadMoveSensibility;
                if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                    this.camera.inertialRadiusOffset -= normalizedLY;
                }
            }
        }
    }
    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    getClassName() {
        return "ArcRotateCameraGamepadInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "gamepad";
    }
}
__decorate([
    serialize()
], ArcRotateCameraGamepadInput.prototype, "gamepadRotationSensibility", void 0);
__decorate([
    serialize()
], ArcRotateCameraGamepadInput.prototype, "gamepadMoveSensibility", void 0);
CameraInputTypes["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
//# sourceMappingURL=arcRotateCameraGamepadInput.js.map