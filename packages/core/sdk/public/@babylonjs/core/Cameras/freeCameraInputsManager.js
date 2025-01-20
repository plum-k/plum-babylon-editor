import { CameraInputsManager } from "./cameraInputsManager.js";
import { FreeCameraKeyboardMoveInput } from "../Cameras/Inputs/freeCameraKeyboardMoveInput.js";
import { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput.js";
import { FreeCameraMouseWheelInput } from "../Cameras/Inputs/freeCameraMouseWheelInput.js";
import { FreeCameraTouchInput } from "../Cameras/Inputs/freeCameraTouchInput.js";
/**
 * Default Inputs manager for the FreeCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraInputsManager extends CameraInputsManager {
    /**
     * Instantiates a new FreeCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera) {
        super(camera);
        /**
         * @internal
         */
        this._mouseInput = null;
        /**
         * @internal
         */
        this._mouseWheelInput = null;
    }
    /**
     * Add keyboard input support to the input manager.
     * @returns the current input manager
     */
    addKeyboard() {
        this.add(new FreeCameraKeyboardMoveInput());
        return this;
    }
    /**
     * Add mouse input support to the input manager.
     * @param touchEnabled if the FreeCameraMouseInput should support touch (default: true)
     * @returns the current input manager
     */
    addMouse(touchEnabled = true) {
        if (!this._mouseInput) {
            this._mouseInput = new FreeCameraMouseInput(touchEnabled);
            this.add(this._mouseInput);
        }
        return this;
    }
    /**
     * Removes the mouse input support from the manager
     * @returns the current input manager
     */
    removeMouse() {
        if (this._mouseInput) {
            this.remove(this._mouseInput);
        }
        return this;
    }
    /**
     * Add mouse wheel input support to the input manager.
     * @returns the current input manager
     */
    addMouseWheel() {
        if (!this._mouseWheelInput) {
            this._mouseWheelInput = new FreeCameraMouseWheelInput();
            this.add(this._mouseWheelInput);
        }
        return this;
    }
    /**
     * Removes the mouse wheel input support from the manager
     * @returns the current input manager
     */
    removeMouseWheel() {
        if (this._mouseWheelInput) {
            this.remove(this._mouseWheelInput);
        }
        return this;
    }
    /**
     * Add touch input support to the input manager.
     * @returns the current input manager
     */
    addTouch() {
        this.add(new FreeCameraTouchInput());
        return this;
    }
    /**
     * Remove all attached input methods from a camera
     */
    clear() {
        super.clear();
        this._mouseInput = null;
    }
}
//# sourceMappingURL=freeCameraInputsManager.js.map