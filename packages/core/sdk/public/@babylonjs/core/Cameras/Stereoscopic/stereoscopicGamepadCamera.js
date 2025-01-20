import { Camera } from "../../Cameras/camera.js";
import { GamepadCamera } from "../../Cameras/gamepadCamera.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Node } from "../../node.js";
import { setStereoscopicRigMode } from "../RigModes/stereoscopicRigMode.js";
Node.AddNodeConstructor("StereoscopicGamepadCamera", (name, scene, options) => {
    return () => new StereoscopicGamepadCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
/**
 * Camera used to simulate stereoscopic rendering (based on GamepadCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
 */
export class StereoscopicGamepadCamera extends GamepadCamera {
    /**
     * Creates a new StereoscopicGamepadCamera
     * @param name defines camera name
     * @param position defines initial position
     * @param interaxialDistance defines distance between each color axis
     * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
     * @param scene defines the hosting scene
     */
    constructor(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
        super(name, position, scene);
        this._setRigMode = () => setStereoscopicRigMode(this);
        this.interaxialDistance = interaxialDistance;
        this.isStereoscopicSideBySide = isStereoscopicSideBySide;
        this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
            interaxialDistance: interaxialDistance,
        });
    }
    /**
     * Gets camera class name
     * @returns StereoscopicGamepadCamera
     */
    getClassName() {
        return "StereoscopicGamepadCamera";
    }
}
//# sourceMappingURL=stereoscopicGamepadCamera.js.map