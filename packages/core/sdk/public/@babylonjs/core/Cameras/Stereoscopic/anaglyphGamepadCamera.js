import { Camera } from "../../Cameras/camera.js";
import { GamepadCamera } from "../../Cameras/gamepadCamera.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Node } from "../../node.js";
import { setStereoscopicAnaglyphRigMode } from "../RigModes/stereoscopicAnaglyphRigMode.js";
Node.AddNodeConstructor("AnaglyphGamepadCamera", (name, scene, options) => {
    return () => new AnaglyphGamepadCamera(name, Vector3.Zero(), options.interaxial_distance, scene);
});
/**
 * Camera used to simulate anaglyphic rendering (based on GamepadCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#anaglyph-cameras
 */
export class AnaglyphGamepadCamera extends GamepadCamera {
    /**
     * Creates a new AnaglyphGamepadCamera
     * @param name defines camera name
     * @param position defines initial position
     * @param interaxialDistance defines distance between each color axis
     * @param scene defines the hosting scene
     */
    constructor(name, position, interaxialDistance, scene) {
        super(name, position, scene);
        this._setRigMode = () => setStereoscopicAnaglyphRigMode(this);
        this.interaxialDistance = interaxialDistance;
        this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
    }
    /**
     * Gets camera class name
     * @returns AnaglyphGamepadCamera
     */
    getClassName() {
        return "AnaglyphGamepadCamera";
    }
}
//# sourceMappingURL=anaglyphGamepadCamera.js.map