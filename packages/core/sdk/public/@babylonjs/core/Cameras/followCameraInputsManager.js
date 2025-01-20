import { Logger } from "../Misc/logger.js";
import { CameraInputsManager } from "./cameraInputsManager.js";
import { FollowCameraKeyboardMoveInput } from "./Inputs/followCameraKeyboardMoveInput.js";
import { FollowCameraMouseWheelInput } from "./Inputs/followCameraMouseWheelInput.js";
import { FollowCameraPointersInput } from "./Inputs/followCameraPointersInput.js";
/**
 * Default Inputs manager for the FollowCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FollowCameraInputsManager extends CameraInputsManager {
    /**
     * Instantiates a new FollowCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera) {
        super(camera);
    }
    /**
     * Add keyboard input support to the input manager.
     * @returns the current input manager
     */
    addKeyboard() {
        this.add(new FollowCameraKeyboardMoveInput());
        return this;
    }
    /**
     * Add mouse wheel input support to the input manager.
     * @returns the current input manager
     */
    addMouseWheel() {
        this.add(new FollowCameraMouseWheelInput());
        return this;
    }
    /**
     * Add pointers input support to the input manager.
     * @returns the current input manager
     */
    addPointers() {
        this.add(new FollowCameraPointersInput());
        return this;
    }
    /**
     * Add orientation input support to the input manager.
     * @returns the current input manager
     */
    addVRDeviceOrientation() {
        Logger.Warn("DeviceOrientation support not yet implemented for FollowCamera.");
        return this;
    }
}
//# sourceMappingURL=followCameraInputsManager.js.map