import { Scene } from "../scene.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { GamepadManager } from "./gamepadManager.js";
import { FreeCameraInputsManager } from "../Cameras/freeCameraInputsManager.js";
import { FreeCameraGamepadInput } from "../Cameras/Inputs/freeCameraGamepadInput.js";
import { ArcRotateCameraInputsManager } from "../Cameras/arcRotateCameraInputsManager.js";
import { ArcRotateCameraGamepadInput } from "../Cameras/Inputs/arcRotateCameraGamepadInput.js";
Object.defineProperty(Scene.prototype, "gamepadManager", {
    get: function () {
        if (!this._gamepadManager) {
            this._gamepadManager = new GamepadManager(this);
            let component = this._getComponent(SceneComponentConstants.NAME_GAMEPAD);
            if (!component) {
                component = new GamepadSystemSceneComponent(this);
                this._addComponent(component);
            }
        }
        return this._gamepadManager;
    },
    enumerable: true,
    configurable: true,
});
/**
 * Adds a gamepad to the free camera inputs manager
 * @returns the FreeCameraInputsManager
 */
FreeCameraInputsManager.prototype.addGamepad = function () {
    this.add(new FreeCameraGamepadInput());
    return this;
};
/**
 * Adds a gamepad to the arc rotate camera inputs manager
 * @returns the camera inputs manager
 */
ArcRotateCameraInputsManager.prototype.addGamepad = function () {
    this.add(new ArcRotateCameraGamepadInput());
    return this;
};
/**
 * Defines the gamepad scene component responsible to manage gamepads in a given scene
 */
export class GamepadSystemSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_GAMEPAD;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        // Nothing to do for gamepads
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        // Nothing to do for gamepads
    }
    /**
     * Disposes the component and the associated resources
     */
    dispose() {
        const gamepadManager = this.scene._gamepadManager;
        if (gamepadManager) {
            gamepadManager.dispose();
            this.scene._gamepadManager = null;
        }
    }
}
//# sourceMappingURL=gamepadSceneComponent.js.map