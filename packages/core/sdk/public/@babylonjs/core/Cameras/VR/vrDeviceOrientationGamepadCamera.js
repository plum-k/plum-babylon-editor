import { VRDeviceOrientationFreeCamera } from "./vrDeviceOrientationFreeCamera.js";
import { VRCameraMetrics } from "./vrCameraMetrics.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Node } from "../../node.js";
import { setVRRigMode } from "../RigModes/vrRigMode.js";
import "../../Gamepads/gamepadSceneComponent.js";
Node.AddNodeConstructor("VRDeviceOrientationGamepadCamera", (name, scene) => {
    return () => new VRDeviceOrientationGamepadCamera(name, Vector3.Zero(), scene);
});
/**
 * Camera used to simulate VR rendering (based on VRDeviceOrientationFreeCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#vr-device-orientation-cameras
 */
export class VRDeviceOrientationGamepadCamera extends VRDeviceOrientationFreeCamera {
    /**
     * Creates a new VRDeviceOrientationGamepadCamera
     * @param name defines camera name
     * @param position defines the start position of the camera
     * @param scene defines the scene the camera belongs to
     * @param compensateDistortion defines if the camera needs to compensate the lens distortion
     * @param vrCameraMetrics defines the vr metrics associated to the camera
     */
    constructor(name, position, scene, compensateDistortion = true, vrCameraMetrics = VRCameraMetrics.GetDefault()) {
        super(name, position, scene, compensateDistortion, vrCameraMetrics);
        this._setRigMode = (rigParams) => setVRRigMode(this, rigParams);
        this.inputs.addGamepad();
    }
    /**
     * Gets camera class name
     * @returns VRDeviceOrientationGamepadCamera
     */
    getClassName() {
        return "VRDeviceOrientationGamepadCamera";
    }
}
//# sourceMappingURL=vrDeviceOrientationGamepadCamera.js.map