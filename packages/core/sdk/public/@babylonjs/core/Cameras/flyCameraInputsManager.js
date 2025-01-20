import { CameraInputsManager } from "./cameraInputsManager.js";
import { FlyCameraMouseInput } from "../Cameras/Inputs/flyCameraMouseInput.js";
import { FlyCameraKeyboardInput } from "../Cameras/Inputs/flyCameraKeyboardInput.js";
/**
 * Default Inputs manager for the FlyCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FlyCameraInputsManager extends CameraInputsManager {
    /**
     * Instantiates a new FlyCameraInputsManager.
     * @param camera Defines the camera the inputs belong to.
     */
    constructor(camera) {
        super(camera);
    }
    /**
     * Add keyboard input support to the input manager.
     * @returns the new FlyCameraKeyboardMoveInput().
     */
    addKeyboard() {
        this.add(new FlyCameraKeyboardInput());
        return this;
    }
    /**
     * Add mouse input support to the input manager.
     * @returns the new FlyCameraMouseInput().
     */
    addMouse() {
        this.add(new FlyCameraMouseInput());
        return this;
    }
}
//# sourceMappingURL=flyCameraInputsManager.js.map