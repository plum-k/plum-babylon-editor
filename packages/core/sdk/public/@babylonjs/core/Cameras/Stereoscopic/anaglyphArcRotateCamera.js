import { Camera } from "../../Cameras/camera.js";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Node } from "../../node.js";
import { setStereoscopicAnaglyphRigMode } from "../RigModes/stereoscopicAnaglyphRigMode.js";
Node.AddNodeConstructor("AnaglyphArcRotateCamera", (name, scene, options) => {
    return () => new AnaglyphArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), options.interaxial_distance, scene);
});
/**
 * Camera used to simulate anaglyphic rendering (based on ArcRotateCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#anaglyph-cameras
 */
export class AnaglyphArcRotateCamera extends ArcRotateCamera {
    /**
     * Creates a new AnaglyphArcRotateCamera
     * @param name defines camera name
     * @param alpha defines alpha angle (in radians)
     * @param beta defines beta angle (in radians)
     * @param radius defines radius
     * @param target defines camera target
     * @param interaxialDistance defines distance between each color axis
     * @param scene defines the hosting scene
     */
    constructor(name, alpha, beta, radius, target, interaxialDistance, scene) {
        super(name, alpha, beta, radius, target, scene);
        this._setRigMode = () => setStereoscopicAnaglyphRigMode(this);
        this.interaxialDistance = interaxialDistance;
        this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
    }
    /**
     * Gets camera class name
     * @returns AnaglyphArcRotateCamera
     */
    getClassName() {
        return "AnaglyphArcRotateCamera";
    }
}
//# sourceMappingURL=anaglyphArcRotateCamera.js.map