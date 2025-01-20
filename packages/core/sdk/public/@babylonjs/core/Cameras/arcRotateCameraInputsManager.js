import { ArcRotateCameraPointersInput } from "../Cameras/Inputs/arcRotateCameraPointersInput.js";
import { ArcRotateCameraKeyboardMoveInput } from "../Cameras/Inputs/arcRotateCameraKeyboardMoveInput.js";
import { ArcRotateCameraMouseWheelInput } from "../Cameras/Inputs/arcRotateCameraMouseWheelInput.js";
import { CameraInputsManager } from "../Cameras/cameraInputsManager.js";
/**
 * Default Inputs manager for the ArcRotateCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraInputsManager extends CameraInputsManager {
    /**
     * Instantiates a new ArcRotateCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera) {
        super(camera);
    }
    /**
     * Add mouse wheel input support to the input manager.
     * @returns the current input manager
     */
    addMouseWheel() {
        this.add(new ArcRotateCameraMouseWheelInput());
        return this;
    }
    /**
     * Add pointers input support to the input manager.
     * @returns the current input manager
     */
    addPointers() {
        this.add(new ArcRotateCameraPointersInput());
        return this;
    }
    /**
     * Add keyboard input support to the input manager.
     * @returns the current input manager
     */
    addKeyboard() {
        this.add(new ArcRotateCameraKeyboardMoveInput());
        return this;
    }
}
//# sourceMappingURL=arcRotateCameraInputsManager.js.map