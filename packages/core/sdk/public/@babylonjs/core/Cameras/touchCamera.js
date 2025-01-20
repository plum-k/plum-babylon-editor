import { FreeCamera } from "./freeCamera.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Node } from "../node.js";
Node.AddNodeConstructor("TouchCamera", (name, scene) => {
    return () => new TouchCamera(name, Vector3.Zero(), scene);
});
/**
 * This represents a FPS type of camera controlled by touch.
 * This is like a universal camera minus the Gamepad controls.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
 */
export class TouchCamera extends FreeCamera {
    /**
     * Defines the touch sensibility for rotation.
     * The higher the faster.
     */
    get touchAngularSensibility() {
        const touch = this.inputs.attached["touch"];
        if (touch) {
            return touch.touchAngularSensibility;
        }
        return 0;
    }
    set touchAngularSensibility(value) {
        const touch = this.inputs.attached["touch"];
        if (touch) {
            touch.touchAngularSensibility = value;
        }
    }
    /**
     * Defines the touch sensibility for move.
     * The higher the faster.
     */
    get touchMoveSensibility() {
        const touch = this.inputs.attached["touch"];
        if (touch) {
            return touch.touchMoveSensibility;
        }
        return 0;
    }
    set touchMoveSensibility(value) {
        const touch = this.inputs.attached["touch"];
        if (touch) {
            touch.touchMoveSensibility = value;
        }
    }
    /**
     * Instantiates a new touch camera.
     * This represents a FPS type of camera controlled by touch.
     * This is like a universal camera minus the Gamepad controls.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
     * @param name Define the name of the camera in the scene
     * @param position Define the start position of the camera in the scene
     * @param scene Define the scene the camera belongs to
     */
    constructor(name, position, scene) {
        super(name, position, scene);
        this.inputs.addTouch();
        this._setupInputs();
    }
    /**
     * Gets the current object class name.
     * @returns the class name
     */
    getClassName() {
        return "TouchCamera";
    }
    /** @internal */
    _setupInputs() {
        const touch = this.inputs.attached["touch"];
        const mouse = this.inputs.attached["mouse"];
        if (mouse) {
            // enable touch in mouse input if touch module is not enabled
            mouse.touchEnabled = !touch;
        }
        else {
            // allow mouse in touch input if mouse module is not available
            touch.allowMouse = !mouse;
        }
    }
}
//# sourceMappingURL=touchCamera.js.map