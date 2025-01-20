import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsVector3 } from "../Misc/decorators.js";
import { Vector3 } from "../Maths/math.vector.js";
import { TargetCamera } from "./targetCamera.js";
import { FlyCameraInputsManager } from "./flyCameraInputsManager.js";
import { Tools } from "../Misc/tools.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { AbstractEngine } from "../Engines/abstractEngine.js";
/**
 * This is a flying camera, designed for 3D movement and rotation in all directions,
 * such as in a 3D Space Shooter or a Flight Simulator.
 */
export class FlyCamera extends TargetCamera {
    /**
     * Gets the input sensibility for mouse input.
     * Higher values reduce sensitivity.
     */
    get angularSensibility() {
        const mouse = this.inputs.attached["mouse"];
        if (mouse) {
            return mouse.angularSensibility;
        }
        return 0;
    }
    /**
     * Sets the input sensibility for a mouse input.
     * Higher values reduce sensitivity.
     */
    set angularSensibility(value) {
        const mouse = this.inputs.attached["mouse"];
        if (mouse) {
            mouse.angularSensibility = value;
        }
    }
    /**
     * Get the keys for camera movement forward.
     */
    get keysForward() {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysForward;
        }
        return [];
    }
    /**
     * Set the keys for camera movement forward.
     */
    set keysForward(value) {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysForward = value;
        }
    }
    /**
     * Get the keys for camera movement backward.
     */
    get keysBackward() {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysBackward;
        }
        return [];
    }
    set keysBackward(value) {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysBackward = value;
        }
    }
    /**
     * Get the keys for camera movement up.
     */
    get keysUp() {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUp;
        }
        return [];
    }
    /**
     * Set the keys for camera movement up.
     */
    set keysUp(value) {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUp = value;
        }
    }
    /**
     * Get the keys for camera movement down.
     */
    get keysDown() {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDown;
        }
        return [];
    }
    /**
     * Set the keys for camera movement down.
     */
    set keysDown(value) {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDown = value;
        }
    }
    /**
     * Get the keys for camera movement left.
     */
    get keysLeft() {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysLeft;
        }
        return [];
    }
    /**
     * Set the keys for camera movement left.
     */
    set keysLeft(value) {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysLeft = value;
        }
    }
    /**
     * Set the keys for camera movement right.
     */
    get keysRight() {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRight;
        }
        return [];
    }
    /**
     * Set the keys for camera movement right.
     */
    set keysRight(value) {
        const keyboard = this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRight = value;
        }
    }
    /**
     * Instantiates a FlyCamera.
     * This is a flying camera, designed for 3D movement and rotation in all directions,
     * such as in a 3D Space Shooter or a Flight Simulator.
     * @param name Define the name of the camera in the scene.
     * @param position Define the starting position of the camera in the scene.
     * @param scene Define the scene the camera belongs to.
     * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active, if no other camera has been defined as active.
     */
    constructor(name, position, scene, setActiveOnSceneIfNoneActive = true) {
        super(name, position, scene, setActiveOnSceneIfNoneActive);
        /**
         * Define the collision ellipsoid of the camera.
         * This is helpful for simulating a camera body, like a player's body.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions#arcrotatecamera
         */
        this.ellipsoid = new Vector3(1, 1, 1);
        /**
         * Define an offset for the position of the ellipsoid around the camera.
         * This can be helpful if the camera is attached away from the player's body center,
         * such as at its head.
         */
        this.ellipsoidOffset = new Vector3(0, 0, 0);
        /**
         * Enable or disable collisions of the camera with the rest of the scene objects.
         */
        this.checkCollisions = false;
        /**
         * Enable or disable gravity on the camera.
         */
        this.applyGravity = false;
        /**
         * Define the current direction the camera is moving to.
         */
        this.cameraDirection = Vector3.Zero();
        /**
         * Track Roll to maintain the wanted Rolling when looking around.
         */
        this._trackRoll = 0;
        /**
         * Slowly correct the Roll to its original value after a Pitch+Yaw rotation.
         */
        this.rollCorrect = 100;
        /**
         * Mimic a banked turn, Rolling the camera when Yawing.
         * It's recommended to use rollCorrect = 10 for faster banking correction.
         */
        this.bankedTurn = false;
        /**
         * Limit in radians for how much Roll banking will add. (Default: 90°)
         */
        this.bankedTurnLimit = Math.PI / 2;
        /**
         * Value of 0 disables the banked Roll.
         * Value of 1 is equal to the Yaw angle in radians.
         */
        this.bankedTurnMultiplier = 1;
        this._needMoveForGravity = false;
        this._oldPosition = Vector3.Zero();
        this._diffPosition = Vector3.Zero();
        this._newPosition = Vector3.Zero();
        // Collisions.
        this._collisionMask = -1;
        /**
         * @internal
         */
        this._onCollisionPositionChange = (collisionId, newPosition, collidedMesh = null) => {
            const updatePosition = (newPos) => {
                this._newPosition.copyFrom(newPos);
                this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);
                if (this._diffPosition.length() > AbstractEngine.CollisionsEpsilon) {
                    this.position.addInPlace(this._diffPosition);
                    if (this.onCollide && collidedMesh) {
                        this.onCollide(collidedMesh);
                    }
                }
            };
            updatePosition(newPosition);
        };
        this.inputs = new FlyCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();
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
    }
    /**
     * Detach a control from the HTML DOM element.
     * The camera will stop reacting to that input.
     */
    detachControl() {
        this.inputs.detachElement();
        this.cameraDirection = new Vector3(0, 0, 0);
    }
    /**
     * Get the mask that the camera ignores in collision events.
     */
    get collisionMask() {
        return this._collisionMask;
    }
    /**
     * Set the mask that the camera ignores in collision events.
     */
    set collisionMask(mask) {
        this._collisionMask = !isNaN(mask) ? mask : -1;
    }
    /**
     * @internal
     */
    _collideWithWorld(displacement) {
        let globalPosition;
        if (this.parent) {
            globalPosition = Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
        }
        else {
            globalPosition = this.position;
        }
        globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
        this._oldPosition.addInPlace(this.ellipsoidOffset);
        const coordinator = this.getScene().collisionCoordinator;
        if (!this._collider) {
            this._collider = coordinator.createCollider();
        }
        this._collider._radius = this.ellipsoid;
        this._collider.collisionMask = this._collisionMask;
        // No need for clone, as long as gravity is not on.
        let actualDisplacement = displacement;
        // Add gravity to direction to prevent dual-collision checking.
        if (this.applyGravity) {
            // This prevents mending with cameraDirection, a global variable of the fly camera class.
            actualDisplacement = displacement.add(this.getScene().gravity);
        }
        coordinator.getNewPosition(this._oldPosition, actualDisplacement, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
    }
    /** @internal */
    _checkInputs() {
        if (!this._localDirection) {
            this._localDirection = Vector3.Zero();
            this._transformedDirection = Vector3.Zero();
        }
        this.inputs.checkInputs();
        super._checkInputs();
    }
    /**
     * Enable movement without a user input. This allows gravity to always be applied.
     */
    set needMoveForGravity(value) {
        this._needMoveForGravity = value;
    }
    /**
     * When true, gravity is applied whether there is user input or not.
     */
    get needMoveForGravity() {
        return this._needMoveForGravity;
    }
    /** @internal */
    _decideIfNeedsToMove() {
        return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
    }
    /** @internal */
    _updatePosition() {
        if (this.checkCollisions && this.getScene().collisionsEnabled) {
            this._collideWithWorld(this.cameraDirection);
        }
        else {
            super._updatePosition();
        }
    }
    /**
     * Restore the Roll to its target value at the rate specified.
     * @param rate - Higher means slower restoring.
     * @internal
     */
    restoreRoll(rate) {
        const limit = this._trackRoll; // Target Roll.
        const z = this.rotation.z; // Current Roll.
        const delta = limit - z; // Difference in Roll.
        const minRad = 0.001; // Tenth of a radian is a barely noticable difference.
        // If the difference is noticable, restore the Roll.
        if (Math.abs(delta) >= minRad) {
            // Change Z rotation towards the target Roll.
            this.rotation.z += delta / rate;
            // Match when near enough.
            if (Math.abs(limit - this.rotation.z) <= minRad) {
                this.rotation.z = limit;
            }
        }
    }
    /**
     * Destroy the camera and release the current resources held by it.
     */
    dispose() {
        this.inputs.clear();
        super.dispose();
    }
    /**
     * Get the current object class name.
     * @returns the class name.
     */
    getClassName() {
        return "FlyCamera";
    }
}
__decorate([
    serializeAsVector3()
], FlyCamera.prototype, "ellipsoid", void 0);
__decorate([
    serializeAsVector3()
], FlyCamera.prototype, "ellipsoidOffset", void 0);
__decorate([
    serialize()
], FlyCamera.prototype, "checkCollisions", void 0);
__decorate([
    serialize()
], FlyCamera.prototype, "applyGravity", void 0);
// Register Class Name
RegisterClass("BABYLON.FlyCamera", FlyCamera);
//# sourceMappingURL=flyCamera.js.map