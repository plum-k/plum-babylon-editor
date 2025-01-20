import { Logger } from "../Misc/logger.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { Camera } from "./camera.js";
/**
 * @ignore
 * This is a list of all the different input types that are available in the application.
 * Fo instance: ArcRotateCameraGamepadInput...
 */
// eslint-disable-next-line no-var, @typescript-eslint/naming-convention
export var CameraInputTypes = {};
/**
 * This represents the input manager used within a camera.
 * It helps dealing with all the different kind of input attached to a camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class CameraInputsManager {
    /**
     * Instantiate a new Camera Input Manager.
     * @param camera Defines the camera the input manager belongs to
     */
    constructor(camera) {
        /**
         * Defines the dom element the camera is collecting inputs from.
         * This is null if the controls have not been attached.
         */
        this.attachedToElement = false;
        this.attached = {};
        this.camera = camera;
        this.checkInputs = () => { };
    }
    /**
     * Add an input method to a camera
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
     * @param input Camera input method
     */
    add(input) {
        const type = input.getSimpleName();
        if (this.attached[type]) {
            Logger.Warn("camera input of type " + type + " already exists on camera");
            return;
        }
        this.attached[type] = input;
        input.camera = this.camera;
        // for checkInputs, we are dynamically creating a function
        // the goal is to avoid the performance penalty of looping for inputs in the render loop
        if (input.checkInputs) {
            this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
        }
        if (this.attachedToElement) {
            input.attachControl(this.noPreventDefault);
        }
    }
    /**
     * Remove a specific input method from a camera
     * example: camera.inputs.remove(camera.inputs.attached.mouse);
     * @param inputToRemove camera input method
     */
    remove(inputToRemove) {
        for (const cam in this.attached) {
            const input = this.attached[cam];
            if (input === inputToRemove) {
                input.detachControl();
                input.camera = null;
                delete this.attached[cam];
                this.rebuildInputCheck();
                return;
            }
        }
    }
    /**
     * Remove a specific input type from a camera
     * example: camera.inputs.remove("ArcRotateCameraGamepadInput");
     * @param inputType the type of the input to remove
     */
    removeByType(inputType) {
        for (const cam in this.attached) {
            const input = this.attached[cam];
            if (input.getClassName() === inputType) {
                input.detachControl();
                input.camera = null;
                delete this.attached[cam];
                this.rebuildInputCheck();
            }
        }
    }
    _addCheckInputs(fn) {
        const current = this.checkInputs;
        return () => {
            current();
            fn();
        };
    }
    /**
     * Attach the input controls to the currently attached dom element to listen the events from.
     * @param input Defines the input to attach
     */
    attachInput(input) {
        if (this.attachedToElement) {
            input.attachControl(this.noPreventDefault);
        }
    }
    /**
     * Attach the current manager inputs controls to a specific dom element to listen the events from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachElement(noPreventDefault = false) {
        if (this.attachedToElement) {
            return;
        }
        noPreventDefault = Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;
        this.attachedToElement = true;
        this.noPreventDefault = noPreventDefault;
        for (const cam in this.attached) {
            this.attached[cam].attachControl(noPreventDefault);
        }
    }
    /**
     * Detach the current manager inputs controls from a specific dom element.
     * @param disconnect Defines whether the input should be removed from the current list of attached inputs
     */
    detachElement(disconnect = false) {
        for (const cam in this.attached) {
            this.attached[cam].detachControl();
            if (disconnect) {
                this.attached[cam].camera = null;
            }
        }
        this.attachedToElement = false;
    }
    /**
     * Rebuild the dynamic inputCheck function from the current list of
     * defined inputs in the manager.
     */
    rebuildInputCheck() {
        this.checkInputs = () => { };
        for (const cam in this.attached) {
            const input = this.attached[cam];
            if (input.checkInputs) {
                this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
            }
        }
    }
    /**
     * Remove all attached input methods from a camera
     */
    clear() {
        if (this.attachedToElement) {
            this.detachElement(true);
        }
        this.attached = {};
        this.attachedToElement = false;
        this.checkInputs = () => { };
    }
    /**
     * Serialize the current input manager attached to a camera.
     * This ensures than once parsed,
     * the input associated to the camera will be identical to the current ones
     * @param serializedCamera Defines the camera serialization JSON the input serialization should write to
     */
    serialize(serializedCamera) {
        const inputs = {};
        for (const cam in this.attached) {
            const input = this.attached[cam];
            const res = SerializationHelper.Serialize(input);
            inputs[input.getClassName()] = res;
        }
        serializedCamera.inputsmgr = inputs;
    }
    /**
     * Parses an input manager serialized JSON to restore the previous list of inputs
     * and states associated to a camera.
     * @param parsedCamera Defines the JSON to parse
     */
    parse(parsedCamera) {
        const parsedInputs = parsedCamera.inputsmgr;
        if (parsedInputs) {
            this.clear();
            for (const n in parsedInputs) {
                const construct = CameraInputTypes[n];
                if (construct) {
                    const parsedinput = parsedInputs[n];
                    const input = SerializationHelper.Parse(() => {
                        return new construct();
                    }, parsedinput, null);
                    this.add(input);
                }
            }
        }
        else {
            //2016-03-08 this part is for managing backward compatibility
            for (const n in this.attached) {
                const construct = CameraInputTypes[this.attached[n].getClassName()];
                if (construct) {
                    const input = SerializationHelper.Parse(() => {
                        return new construct();
                    }, parsedCamera, null);
                    this.remove(this.attached[n]);
                    this.add(input);
                }
            }
        }
    }
}
//# sourceMappingURL=cameraInputsManager.js.map