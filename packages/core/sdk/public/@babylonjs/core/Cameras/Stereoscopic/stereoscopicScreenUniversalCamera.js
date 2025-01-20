import { Camera } from "../../Cameras/camera.js";
import { UniversalCamera } from "../../Cameras/universalCamera.js";
import { Matrix, Vector3 } from "../../Maths/math.vector.js";
import { TargetCamera } from "../targetCamera.js";
import { TransformNode } from "../../Meshes/transformNode.js";
import { Viewport } from "../../Maths/math.viewport.js";
/**
 * Camera used to simulate stereoscopic rendering on real screens (based on UniversalCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
 */
export class StereoscopicScreenUniversalCamera extends UniversalCamera {
    set distanceBetweenEyes(newValue) {
        this._distanceBetweenEyes = newValue;
    }
    /**
     * distance between the eyes
     */
    get distanceBetweenEyes() {
        return this._distanceBetweenEyes;
    }
    set distanceToProjectionPlane(newValue) {
        this._distanceToProjectionPlane = newValue;
    }
    /**
     * Distance to projection plane (should be the same units the like distance between the eyes)
     */
    get distanceToProjectionPlane() {
        return this._distanceToProjectionPlane;
    }
    /**
     * Creates a new StereoscopicScreenUniversalCamera
     * @param name defines camera name
     * @param position defines initial position
     * @param scene defines the hosting scene
     * @param distanceToProjectionPlane defines distance between each color axis. The rig cameras will receive this as their negative z position!
     * @param distanceBetweenEyes defines is stereoscopic is done side by side or over under
     */
    constructor(name, position, scene, distanceToProjectionPlane = 1, distanceBetweenEyes = 0.065) {
        super(name, position, scene);
        this._distanceBetweenEyes = distanceBetweenEyes;
        this._distanceToProjectionPlane = distanceToProjectionPlane;
        this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, {
            stereoHalfAngle: 0,
        });
        this._cameraRigParams.stereoHalfAngle = 0;
        this._cameraRigParams.interaxialDistance = distanceBetweenEyes;
    }
    /**
     * Gets camera class name
     * @returns StereoscopicScreenUniversalCamera
     */
    getClassName() {
        return "StereoscopicUniversalCamera";
    }
    /**
     * @internal
     */
    createRigCamera(name) {
        const camera = new TargetCamera(name, Vector3.Zero(), this.getScene());
        const transform = new TransformNode("tm_" + name, this.getScene());
        camera.parent = transform;
        transform.setPivotMatrix(Matrix.Identity(), false);
        camera.isRigCamera = true;
        camera.rigParent = this;
        return camera;
    }
    /**
     * @internal
     */
    _updateRigCameras() {
        for (let cameraIndex = 0; cameraIndex < this._rigCameras.length; cameraIndex++) {
            const cam = this._rigCameras[cameraIndex];
            cam.minZ = this.minZ;
            cam.maxZ = this.maxZ;
            cam.fov = this.fov;
            cam.upVector.copyFrom(this.upVector);
            if (cam.rotationQuaternion) {
                cam.rotationQuaternion.copyFrom(this.rotationQuaternion);
            }
            else {
                cam.rotation.copyFrom(this.rotation);
            }
            this._updateCamera(this._rigCameras[cameraIndex], cameraIndex);
        }
    }
    _updateCamera(camera, cameraIndex) {
        const b = this.distanceBetweenEyes / 2;
        const z = b / this.distanceToProjectionPlane;
        camera.position.copyFrom(this.position);
        camera.position.addInPlaceFromFloats(cameraIndex === 0 ? -b : b, 0, -this._distanceToProjectionPlane);
        const transform = camera.parent;
        const m = transform.getPivotMatrix();
        m.setTranslationFromFloats(cameraIndex === 0 ? b : -b, 0, 0);
        m.setRowFromFloats(2, cameraIndex === 0 ? z : -z, 0, 1, 0);
        transform.setPivotMatrix(m, false);
    }
    _setRigMode() {
        this._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1);
        this._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
        for (let cameraIndex = 0; cameraIndex < this._rigCameras.length; cameraIndex++) {
            this._updateCamera(this._rigCameras[cameraIndex], cameraIndex);
        }
    }
}
//# sourceMappingURL=stereoscopicScreenUniversalCamera.js.map