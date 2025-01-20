import { Camera } from "../../Cameras/camera.js";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Node } from "../../node.js";
import { setStereoscopicRigMode } from "../RigModes/stereoscopicRigMode.js";
Node.AddNodeConstructor("StereoscopicArcRotateCamera", (name, scene, options) => {
    return () => new StereoscopicArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), options.interaxial_distance, options.isStereoscopicSideBySide, scene);
});
/**
 * Camera used to simulate stereoscopic rendering (based on ArcRotateCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
 */
export class StereoscopicArcRotateCamera extends ArcRotateCamera {
    /**
     * Creates a new StereoscopicArcRotateCamera
     * @param name defines camera name
     * @param alpha defines alpha angle (in radians)
     * @param beta defines beta angle (in radians)
     * @param radius defines radius
     * @param target defines camera target
     * @param interaxialDistance defines distance between each color axis
     * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
     * @param scene defines the hosting scene
     */
    constructor(name, alpha, beta, radius, target, interaxialDistance, isStereoscopicSideBySide, scene) {
        super(name, alpha, beta, radius, target, scene);
        this._setRigMode = () => setStereoscopicRigMode(this);
        this.interaxialDistance = interaxialDistance;
        this.isStereoscopicSideBySide = isStereoscopicSideBySide;
        this.setCameraRigMode(isStereoscopicSideBySide ? Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
            interaxialDistance: interaxialDistance,
        });
    }
    /**
     * Gets camera class name
     * @returns StereoscopicArcRotateCamera
     */
    getClassName() {
        return "StereoscopicArcRotateCamera";
    }
}
//# sourceMappingURL=stereoscopicArcRotateCamera.js.map