import { Camera } from "../../Cameras/camera.js";
import { FreeCamera } from "../../Cameras/freeCamera.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Node } from "../../node.js";
import { setStereoscopicRigMode } from "../RigModes/stereoscopicRigMode.js";
Node.AddNodeConstructor("StereoscopicFreeCamera", (name, scene, options) => {
    return () => new StereoscopicFreeCamera(name, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
/**
 * Camera used to simulate stereoscopic rendering (based on FreeCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
 */
export class StereoscopicFreeCamera extends FreeCamera {
    /**
     * Creates a new StereoscopicFreeCamera
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
     * @returns StereoscopicFreeCamera
     */
    getClassName() {
        return "StereoscopicFreeCamera";
    }
}
//# sourceMappingURL=stereoscopicFreeCamera.js.map