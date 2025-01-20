import { Observable } from "../Misc/observable.js";
import { Quaternion, Vector3 } from "../Maths/math.vector.js";
import { WebXRMotionControllerManager } from "./motionController/webXRMotionControllerManager.js";
import { Tools } from "../Misc/tools.js";
import { Mesh } from "../Meshes/mesh.js";
let idCount = 0;
/**
 * Represents an XR controller
 */
export class WebXRInputSource {
    /**
     * Creates the input source object
     * @see https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRInputControllerSupport
     * @param _scene the scene which the controller should be associated to
     * @param inputSource the underlying input source for the controller
     * @param _options options for this controller creation
     */
    constructor(_scene, 
    /** The underlying input source for the controller  */
    inputSource, _options = {}) {
        this._scene = _scene;
        this.inputSource = inputSource;
        this._options = _options;
        this._tmpVector = new Vector3();
        this._disposed = false;
        /**
         * Event that fires when the controller is removed/disposed.
         * The object provided as event data is this controller, after associated assets were disposed.
         * uniqueId is still available.
         */
        this.onDisposeObservable = new Observable();
        /**
         * Will be triggered when the mesh associated with the motion controller is done loading.
         * It is also possible that this will never trigger (!) if no mesh was loaded, or if the developer decides to load a different mesh
         * A shortened version of controller -> motion controller -> on mesh loaded.
         */
        this.onMeshLoadedObservable = new Observable();
        /**
         * Observers registered here will trigger when a motion controller profile was assigned to this xr controller
         */
        this.onMotionControllerInitObservable = new Observable();
        this._uniqueId = `controller-${idCount++}-${inputSource.targetRayMode}-${inputSource.handedness}`;
        this.pointer = new Mesh(`${this._uniqueId}-pointer`, _scene);
        this.pointer.rotationQuaternion = new Quaternion();
        if (this.inputSource.gripSpace) {
            this.grip = new Mesh(`${this._uniqueId}-grip`, this._scene);
            this.grip.rotationQuaternion = new Quaternion();
        }
        this._tmpVector.set(0, 0, this._scene.useRightHandedSystem ? -1.0 : 1.0);
        // for now only load motion controllers if gamepad object available
        if (this.inputSource.gamepad && this.inputSource.targetRayMode === "tracked-pointer") {
            WebXRMotionControllerManager.GetMotionControllerWithXRInput(inputSource, _scene, this._options.forceControllerProfile).then((motionController) => {
                this.motionController = motionController;
                this.onMotionControllerInitObservable.notifyObservers(motionController);
                // should the model be loaded?
                if (!this._options.doNotLoadControllerMesh && !this.motionController._doNotLoadControllerMesh) {
                    this.motionController.loadModel().then((success) => {
                        if (success && this.motionController && this.motionController.rootMesh) {
                            if (this._options.renderingGroupId) {
                                // anything other than 0?
                                this.motionController.rootMesh.renderingGroupId = this._options.renderingGroupId;
                                this.motionController.rootMesh.getChildMeshes(false).forEach((mesh) => (mesh.renderingGroupId = this._options.renderingGroupId));
                            }
                            this.onMeshLoadedObservable.notifyObservers(this.motionController.rootMesh);
                            this.motionController.rootMesh.parent = this.grip || this.pointer;
                            this.motionController.disableAnimation = !!this._options.disableMotionControllerAnimation;
                        }
                        // make sure to dispose is the controller is already disposed
                        if (this._disposed) {
                            this.motionController?.dispose();
                        }
                    });
                }
            }, () => {
                Tools.Warn(`Could not find a matching motion controller for the registered input source`);
            });
        }
    }
    /**
     * Get this controllers unique id
     */
    get uniqueId() {
        return this._uniqueId;
    }
    /**
     * Disposes of the object
     */
    dispose() {
        if (this.grip) {
            this.grip.dispose(true);
        }
        if (this.motionController) {
            this.motionController.dispose();
        }
        this.pointer.dispose(true);
        this.onMotionControllerInitObservable.clear();
        this.onMeshLoadedObservable.clear();
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this._disposed = true;
    }
    /**
     * Gets a world space ray coming from the pointer or grip
     * @param result the resulting ray
     * @param gripIfAvailable use the grip mesh instead of the pointer, if available
     */
    getWorldPointerRayToRef(result, gripIfAvailable = false) {
        const object = gripIfAvailable && this.grip ? this.grip : this.pointer;
        Vector3.TransformNormalToRef(this._tmpVector, object.getWorldMatrix(), result.direction);
        result.direction.normalize();
        result.origin.copyFrom(object.absolutePosition);
        result.length = 1000;
    }
    /**
     * Updates the controller pose based on the given XRFrame
     * @param xrFrame xr frame to update the pose with
     * @param referenceSpace reference space to use
     * @param xrCamera the xr camera, used for parenting
     * @param xrSessionManager the session manager used to get the world reference system
     */
    updateFromXRFrame(xrFrame, referenceSpace, xrCamera, xrSessionManager) {
        const pose = xrFrame.getPose(this.inputSource.targetRaySpace, referenceSpace);
        this._lastXRPose = pose;
        // Update the pointer mesh
        if (pose) {
            const pos = pose.transform.position;
            this.pointer.position.set(pos.x, pos.y, pos.z).scaleInPlace(xrSessionManager.worldScalingFactor);
            const orientation = pose.transform.orientation;
            this.pointer.rotationQuaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
            if (!this._scene.useRightHandedSystem) {
                this.pointer.position.z *= -1;
                this.pointer.rotationQuaternion.z *= -1;
                this.pointer.rotationQuaternion.w *= -1;
            }
            this.pointer.parent = xrCamera.parent;
            this.pointer.scaling.setAll(xrSessionManager.worldScalingFactor);
        }
        // Update the grip mesh if it exists
        if (this.inputSource.gripSpace && this.grip) {
            const pose = xrFrame.getPose(this.inputSource.gripSpace, referenceSpace);
            if (pose) {
                const pos = pose.transform.position;
                const orientation = pose.transform.orientation;
                this.grip.position.set(pos.x, pos.y, pos.z).scaleInPlace(xrSessionManager.worldScalingFactor);
                this.grip.rotationQuaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
                if (!this._scene.useRightHandedSystem) {
                    this.grip.position.z *= -1;
                    this.grip.rotationQuaternion.z *= -1;
                    this.grip.rotationQuaternion.w *= -1;
                }
            }
            this.grip.parent = xrCamera.parent;
            this.grip.scaling.setAll(xrSessionManager.worldScalingFactor);
        }
        if (this.motionController) {
            // either update buttons only or also position, if in gamepad mode
            this.motionController.updateFromXRFrame(xrFrame);
        }
    }
}
//# sourceMappingURL=webXRInputSource.js.map