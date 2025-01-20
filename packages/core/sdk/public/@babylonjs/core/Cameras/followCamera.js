import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsMeshReference } from "../Misc/decorators.js";
import { Tools } from "../Misc/tools.js";
import { TargetCamera } from "./targetCamera.js";
import { TmpVectors, Vector3 } from "../Maths/math.vector.js";
import { Node } from "../node.js";
import { FollowCameraInputsManager } from "./followCameraInputsManager.js";
import { RegisterClass } from "../Misc/typeStore.js";
Node.AddNodeConstructor("FollowCamera", (name, scene) => {
    return () => new FollowCamera(name, Vector3.Zero(), scene);
});
Node.AddNodeConstructor("ArcFollowCamera", (name, scene) => {
    return () => new ArcFollowCamera(name, 0, 0, 1.0, null, scene);
});
/**
 * A follow camera takes a mesh as a target and follows it as it moves. Both a free camera version followCamera and
 * an arc rotate version arcFollowCamera are available.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
 */
export class FollowCamera extends TargetCamera {
    /**
     * Instantiates the follow camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
     * @param name Define the name of the camera in the scene
     * @param position Define the position of the camera
     * @param scene Define the scene the camera belong to
     * @param lockedTarget Define the target of the camera
     */
    constructor(name, position, scene, lockedTarget = null) {
        super(name, position, scene);
        /**
         * Distance the follow camera should follow an object at
         */
        this.radius = 12;
        /**
         * Minimum allowed distance of the camera to the axis of rotation
         * (The camera can not get closer).
         * This can help limiting how the Camera is able to move in the scene.
         */
        this.lowerRadiusLimit = null;
        /**
         * Maximum allowed distance of the camera to the axis of rotation
         * (The camera can not get further).
         * This can help limiting how the Camera is able to move in the scene.
         */
        this.upperRadiusLimit = null;
        /**
         * Define a rotation offset between the camera and the object it follows
         */
        this.rotationOffset = 0;
        /**
         * Minimum allowed angle to camera position relative to target object.
         * This can help limiting how the Camera is able to move in the scene.
         */
        this.lowerRotationOffsetLimit = null;
        /**
         * Maximum allowed angle to camera position relative to target object.
         * This can help limiting how the Camera is able to move in the scene.
         */
        this.upperRotationOffsetLimit = null;
        /**
         * Define a height offset between the camera and the object it follows.
         * It can help following an object from the top (like a car chasing a plane)
         */
        this.heightOffset = 4;
        /**
         * Minimum allowed height of camera position relative to target object.
         * This can help limiting how the Camera is able to move in the scene.
         */
        this.lowerHeightOffsetLimit = null;
        /**
         * Maximum allowed height of camera position relative to target object.
         * This can help limiting how the Camera is able to move in the scene.
         */
        this.upperHeightOffsetLimit = null;
        /**
         * Define how fast the camera can accelerate to follow it s target.
         */
        this.cameraAcceleration = 0.05;
        /**
         * Define the speed limit of the camera following an object.
         */
        this.maxCameraSpeed = 20;
        this.lockedTarget = lockedTarget;
        this.inputs = new FollowCameraInputsManager(this);
        this.inputs.addKeyboard().addMouseWheel().addPointers();
        // Uncomment the following line when the relevant handlers have been implemented.
        // this.inputs.addKeyboard().addMouseWheel().addPointers().addVRDeviceOrientation();
    }
    _follow(cameraTarget) {
        if (!cameraTarget) {
            return;
        }
        const rotMatrix = TmpVectors.Matrix[0];
        cameraTarget.absoluteRotationQuaternion.toRotationMatrix(rotMatrix);
        const yRotation = Math.atan2(rotMatrix.m[8], rotMatrix.m[10]);
        const radians = Tools.ToRadians(this.rotationOffset) + yRotation;
        const targetPosition = cameraTarget.getAbsolutePosition();
        const targetX = targetPosition.x + Math.sin(radians) * this.radius;
        const targetZ = targetPosition.z + Math.cos(radians) * this.radius;
        const dx = targetX - this.position.x;
        const dy = targetPosition.y + this.heightOffset - this.position.y;
        const dz = targetZ - this.position.z;
        let vx = dx * this.cameraAcceleration * 2; //this is set to .05
        let vy = dy * this.cameraAcceleration;
        let vz = dz * this.cameraAcceleration * 2;
        if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
            vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }
        if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
            vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }
        if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
            vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }
        this.position = new Vector3(this.position.x + vx, this.position.y + vy, this.position.z + vz);
        this.setTarget(targetPosition);
    }
    /**
     * Attached controls to the current camera.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(ignored, noPreventDefault) {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this.inputs.attachElement(noPreventDefault);
        this._reset = () => { };
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        this.inputs.detachElement();
        if (this._reset) {
            this._reset();
        }
    }
    /** @internal */
    _checkInputs() {
        this.inputs.checkInputs();
        this._checkLimits();
        super._checkInputs();
        if (this.lockedTarget) {
            this._follow(this.lockedTarget);
        }
    }
    _checkLimits() {
        if (this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit) {
            this.radius = this.lowerRadiusLimit;
        }
        if (this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit) {
            this.radius = this.upperRadiusLimit;
        }
        if (this.lowerHeightOffsetLimit !== null && this.heightOffset < this.lowerHeightOffsetLimit) {
            this.heightOffset = this.lowerHeightOffsetLimit;
        }
        if (this.upperHeightOffsetLimit !== null && this.heightOffset > this.upperHeightOffsetLimit) {
            this.heightOffset = this.upperHeightOffsetLimit;
        }
        if (this.lowerRotationOffsetLimit !== null && this.rotationOffset < this.lowerRotationOffsetLimit) {
            this.rotationOffset = this.lowerRotationOffsetLimit;
        }
        if (this.upperRotationOffsetLimit !== null && this.rotationOffset > this.upperRotationOffsetLimit) {
            this.rotationOffset = this.upperRotationOffsetLimit;
        }
    }
    /**
     * Gets the camera class name.
     * @returns the class name
     */
    getClassName() {
        return "FollowCamera";
    }
}
__decorate([
    serialize()
], FollowCamera.prototype, "radius", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "lowerRadiusLimit", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "upperRadiusLimit", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "rotationOffset", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "lowerRotationOffsetLimit", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "upperRotationOffsetLimit", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "heightOffset", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "lowerHeightOffsetLimit", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "upperHeightOffsetLimit", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "cameraAcceleration", void 0);
__decorate([
    serialize()
], FollowCamera.prototype, "maxCameraSpeed", void 0);
__decorate([
    serializeAsMeshReference("lockedTargetId")
], FollowCamera.prototype, "lockedTarget", void 0);
/**
 * Arc Rotate version of the follow camera.
 * It still follows a Defined mesh but in an Arc Rotate Camera fashion.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
 */
export class ArcFollowCamera extends TargetCamera {
    /**
     * Instantiates a new ArcFollowCamera
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
     * @param name Define the name of the camera
     * @param alpha Define the rotation angle of the camera around the longitudinal axis
     * @param beta Define the rotation angle of the camera around the elevation axis
     * @param radius Define the radius of the camera from its target point
     * @param target Define the target of the camera
     * @param scene Define the scene the camera belongs to
     */
    constructor(name, 
    /** The longitudinal angle of the camera */
    alpha, 
    /** The latitudinal angle of the camera */
    beta, 
    /** The radius of the camera from its target */
    radius, 
    /** Define the camera target (the mesh it should follow) */
    target, scene) {
        super(name, Vector3.Zero(), scene);
        this.alpha = alpha;
        this.beta = beta;
        this.radius = radius;
        this._cartesianCoordinates = Vector3.Zero();
        this.setMeshTarget(target);
    }
    /**
     * Sets the mesh to follow with this camera.
     * @param target the target to follow
     */
    setMeshTarget(target) {
        this._meshTarget = target;
        this._follow();
    }
    _follow() {
        if (!this._meshTarget) {
            return;
        }
        this._cartesianCoordinates.x = this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
        this._cartesianCoordinates.y = this.radius * Math.sin(this.beta);
        this._cartesianCoordinates.z = this.radius * Math.sin(this.alpha) * Math.cos(this.beta);
        const targetPosition = this._meshTarget.getAbsolutePosition();
        this.position = targetPosition.add(this._cartesianCoordinates);
        this.setTarget(targetPosition);
    }
    /** @internal */
    _checkInputs() {
        super._checkInputs();
        this._follow();
    }
    /**
     * Returns the class name of the object.
     * It is mostly used internally for serialization purposes.
     * @returns the class name
     */
    getClassName() {
        return "ArcFollowCamera";
    }
}
// Register Class Name
RegisterClass("BABYLON.FollowCamera", FollowCamera);
RegisterClass("BABYLON.ArcFollowCamera", ArcFollowCamera);
//# sourceMappingURL=followCamera.js.map