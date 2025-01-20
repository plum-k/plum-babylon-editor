import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector.js";
import { Clamp } from "../../Maths/math.scalar.functions.js";
import { Epsilon } from "../../Maths/math.constants.js";
/**
 * A behavior that when attached to a mesh will follow a camera
 * @since 5.0.0
 */
export class FollowBehavior {
    constructor() {
        // Memory cache to avoid GC usage
        this._tmpQuaternion = new Quaternion();
        this._tmpVectors = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
        this._tmpMatrix = new Matrix();
        this._tmpInvertView = new Matrix();
        this._tmpForward = new Vector3();
        this._tmpNodeForward = new Vector3();
        this._tmpPosition = new Vector3();
        this._workingPosition = new Vector3();
        this._workingQuaternion = new Quaternion();
        this._lastTick = -1;
        this._recenterNextUpdate = true;
        /**
         * Set to false if the node should strictly follow the camera without any interpolation time
         */
        this.interpolatePose = true;
        /**
         * Rate of interpolation of position and rotation of the attached node.
         * Higher values will give a slower interpolation.
         */
        this.lerpTime = 500;
        /**
         * If the behavior should ignore the pitch and roll of the camera.
         */
        this.ignoreCameraPitchAndRoll = false;
        /**
         * Pitch offset from camera (relative to Max Distance)
         * Is only effective if `ignoreCameraPitchAndRoll` is set to `true`.
         */
        this.pitchOffset = 15;
        /**
         * The vertical angle from the camera forward axis to the owner will not exceed this value
         */
        this.maxViewVerticalDegrees = 30;
        /**
         * The horizontal angle from the camera forward axis to the owner will not exceed this value
         */
        this.maxViewHorizontalDegrees = 30;
        /**
         * The attached node will not reorient until the angle between its forward vector and the vector to the camera is greater than this value
         */
        this.orientToCameraDeadzoneDegrees = 60;
        /**
         * Option to ignore distance clamping
         */
        this.ignoreDistanceClamp = false;
        /**
         * Option to ignore angle clamping
         */
        this.ignoreAngleClamp = false;
        /**
         * Max vertical distance between the attachedNode and camera
         */
        this.verticalMaxDistance = 0;
        /**
         *  Default distance from eye to attached node, i.e. the sphere radius
         */
        this.defaultDistance = 0.8;
        /**
         *  Max distance from eye to attached node, i.e. the sphere radius
         */
        this.maximumDistance = 2;
        /**
         *  Min distance from eye to attached node, i.e. the sphere radius
         */
        this.minimumDistance = 0.3;
        /**
         * Ignore vertical movement and lock the Y position of the object.
         */
        this.useFixedVerticalOffset = false;
        /**
         * Fixed vertical position offset distance.
         */
        this.fixedVerticalOffset = 0;
        /**
         * Enables/disables the behavior
         * @internal
         */
        this._enabled = true;
    }
    /**
     * The camera that should be followed by this behavior
     */
    get followedCamera() {
        return this._followedCamera || this._scene.activeCamera;
    }
    set followedCamera(camera) {
        this._followedCamera = camera;
    }
    /**
     *  The name of the behavior
     */
    get name() {
        return "Follow";
    }
    /**
     *  Initializes the behavior
     */
    init() { }
    /**
     * Attaches the follow behavior
     * @param ownerNode The mesh that will be following once attached
     * @param followedCamera The camera that should be followed by the node
     */
    attach(ownerNode, followedCamera) {
        this._scene = ownerNode.getScene();
        this.attachedNode = ownerNode;
        if (followedCamera) {
            this.followedCamera = followedCamera;
        }
        this._addObservables();
    }
    /**
     *  Detaches the behavior from the mesh
     */
    detach() {
        this.attachedNode = null;
        this._removeObservables();
    }
    /**
     * Recenters the attached node in front of the camera on the next update
     */
    recenter() {
        this._recenterNextUpdate = true;
    }
    _angleBetweenVectorAndPlane(vector, normal) {
        // Work on copies
        this._tmpVectors[0].copyFrom(vector);
        vector = this._tmpVectors[0];
        this._tmpVectors[1].copyFrom(normal);
        normal = this._tmpVectors[1];
        vector.normalize();
        normal.normalize();
        return Math.PI / 2 - Math.acos(Vector3.Dot(vector, normal));
    }
    _length2D(vector) {
        return Math.sqrt(vector.x * vector.x + vector.z * vector.z);
    }
    _distanceClamp(currentToTarget, moveToDefault = false) {
        let minDistance = this.minimumDistance;
        let maxDistance = this.maximumDistance;
        const defaultDistance = this.defaultDistance;
        const direction = this._tmpVectors[0];
        direction.copyFrom(currentToTarget);
        let currentDistance = direction.length();
        direction.normalizeFromLength(currentDistance);
        if (this.ignoreCameraPitchAndRoll) {
            // If we don't account for pitch offset, the casted object will float up/down as the reference
            // gets closer to it because we will still be casting in the direction of the pitched offset.
            // To fix this, only modify the XZ position of the object.
            minDistance = this._length2D(direction) * minDistance;
            maxDistance = this._length2D(direction) * maxDistance;
            const currentDistance2D = this._length2D(currentToTarget);
            direction.scaleInPlace(currentDistance / currentDistance2D);
            currentDistance = currentDistance2D;
        }
        let clampedDistance = currentDistance;
        if (moveToDefault) {
            clampedDistance = defaultDistance;
        }
        else {
            clampedDistance = Clamp(currentDistance, minDistance, maxDistance);
        }
        currentToTarget.copyFrom(direction).scaleInPlace(clampedDistance);
        return currentDistance !== clampedDistance;
    }
    _applyVerticalClamp(currentToTarget) {
        if (this.verticalMaxDistance !== 0) {
            currentToTarget.y = Clamp(currentToTarget.y, -this.verticalMaxDistance, this.verticalMaxDistance);
        }
    }
    _toOrientationQuatToRef(vector, quaternion) {
        Quaternion.RotationYawPitchRollToRef(Math.atan2(vector.x, vector.z), Math.atan2(vector.y, Math.sqrt(vector.z * vector.z + vector.x * vector.x)), 0, quaternion);
    }
    _applyPitchOffset(invertView) {
        const forward = this._tmpVectors[0];
        const right = this._tmpVectors[1];
        forward.copyFromFloats(0, 0, this._scene.useRightHandedSystem ? -1 : 1);
        right.copyFromFloats(1, 0, 0);
        Vector3.TransformNormalToRef(forward, invertView, forward);
        forward.y = 0;
        forward.normalize();
        Vector3.TransformNormalToRef(right, invertView, right);
        Quaternion.RotationAxisToRef(right, (this.pitchOffset * Math.PI) / 180, this._tmpQuaternion);
        forward.rotateByQuaternionToRef(this._tmpQuaternion, forward);
        this._toOrientationQuatToRef(forward, this._tmpQuaternion);
        this._tmpQuaternion.toRotationMatrix(this._tmpMatrix);
        // Since we already extracted position from the invert view matrix, we can
        // disregard the position part of the matrix in the copy
        invertView.copyFrom(this._tmpMatrix);
    }
    _angularClamp(invertView, currentToTarget) {
        const forward = this._tmpVectors[5];
        forward.copyFromFloats(0, 0, this._scene.useRightHandedSystem ? -1 : 1);
        const right = this._tmpVectors[6];
        right.copyFromFloats(1, 0, 0);
        // forward and right are related to camera frame of reference
        Vector3.TransformNormalToRef(forward, invertView, forward);
        Vector3.TransformNormalToRef(right, invertView, right);
        // Up is global Z
        const up = Vector3.UpReadOnly;
        const dist = currentToTarget.length();
        if (dist < Epsilon) {
            return false;
        }
        let angularClamped = false;
        const rotationQuat = this._tmpQuaternion;
        // X-axis leashing
        if (this.ignoreCameraPitchAndRoll) {
            const angle = Vector3.GetAngleBetweenVectorsOnPlane(currentToTarget, forward, right);
            Quaternion.RotationAxisToRef(right, angle, rotationQuat);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
        }
        else {
            const angle = -Vector3.GetAngleBetweenVectorsOnPlane(currentToTarget, forward, right);
            const minMaxAngle = ((this.maxViewVerticalDegrees * Math.PI) / 180) * 0.5;
            if (angle < -minMaxAngle) {
                Quaternion.RotationAxisToRef(right, -angle - minMaxAngle, rotationQuat);
                currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
                angularClamped = true;
            }
            else if (angle > minMaxAngle) {
                Quaternion.RotationAxisToRef(right, -angle + minMaxAngle, rotationQuat);
                currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
                angularClamped = true;
            }
        }
        // Y-axis leashing
        const angle = this._angleBetweenVectorAndPlane(currentToTarget, right) * (this._scene.useRightHandedSystem ? -1 : 1);
        const minMaxAngle = ((this.maxViewHorizontalDegrees * Math.PI) / 180) * 0.5;
        if (angle < -minMaxAngle) {
            Quaternion.RotationAxisToRef(up, -angle - minMaxAngle, rotationQuat);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
            angularClamped = true;
        }
        else if (angle > minMaxAngle) {
            Quaternion.RotationAxisToRef(up, -angle + minMaxAngle, rotationQuat);
            currentToTarget.rotateByQuaternionToRef(rotationQuat, currentToTarget);
            angularClamped = true;
        }
        return angularClamped;
    }
    _orientationClamp(currentToTarget, rotationQuaternion) {
        // Construct a rotation quat from up vector and target vector
        const toFollowed = this._tmpVectors[0];
        toFollowed.copyFrom(currentToTarget).scaleInPlace(-1).normalize();
        const up = this._tmpVectors[1];
        const right = this._tmpVectors[2];
        // We use global up vector to orient the following node (global +Y)
        up.copyFromFloats(0, 1, 0);
        // Gram-Schmidt to create an orthonormal frame
        Vector3.CrossToRef(toFollowed, up, right);
        const length = right.length();
        if (length < Epsilon) {
            return;
        }
        right.normalizeFromLength(length);
        Vector3.CrossToRef(right, toFollowed, up);
        if (this.attachedNode?.getScene().useRightHandedSystem) {
            Quaternion.FromLookDirectionRHToRef(toFollowed, up, rotationQuaternion);
        }
        else {
            Quaternion.FromLookDirectionLHToRef(toFollowed, up, rotationQuaternion);
        }
    }
    _passedOrientationDeadzone(currentToTarget, forward) {
        const leashToFollow = this._tmpVectors[5];
        leashToFollow.copyFrom(currentToTarget);
        leashToFollow.normalize();
        const angle = Math.abs(Vector3.GetAngleBetweenVectorsOnPlane(forward, leashToFollow, Vector3.UpReadOnly));
        return (angle * 180) / Math.PI > this.orientToCameraDeadzoneDegrees;
    }
    _updateLeashing(camera) {
        if (this.attachedNode && this._enabled) {
            const oldParent = this.attachedNode.parent;
            this.attachedNode.setParent(null);
            const worldMatrix = this.attachedNode.getWorldMatrix();
            const currentToTarget = this._workingPosition;
            const rotationQuaternion = this._workingQuaternion;
            const pivot = this.attachedNode.getPivotPoint();
            const invertView = this._tmpInvertView;
            invertView.copyFrom(camera.getViewMatrix());
            invertView.invert();
            Vector3.TransformCoordinatesToRef(pivot, worldMatrix, currentToTarget);
            const position = this._tmpPosition;
            position.copyFromFloats(0, 0, 0);
            Vector3.TransformCoordinatesToRef(position, worldMatrix, position);
            position.scaleInPlace(-1).subtractInPlace(pivot);
            currentToTarget.subtractInPlace(camera.globalPosition);
            if (this.ignoreCameraPitchAndRoll) {
                this._applyPitchOffset(invertView);
            }
            let angularClamped = false;
            const forward = this._tmpForward;
            forward.copyFromFloats(0, 0, this._scene.useRightHandedSystem ? -1 : 1);
            Vector3.TransformNormalToRef(forward, invertView, forward);
            const nodeForward = this._tmpNodeForward;
            nodeForward.copyFromFloats(0, 0, this._scene.useRightHandedSystem ? -1 : 1);
            Vector3.TransformNormalToRef(nodeForward, worldMatrix, nodeForward);
            if (this._recenterNextUpdate) {
                currentToTarget.copyFrom(forward).scaleInPlace(this.defaultDistance);
            }
            else {
                if (this.ignoreAngleClamp) {
                    const currentDistance = currentToTarget.length();
                    currentToTarget.copyFrom(forward).scaleInPlace(currentDistance);
                }
                else {
                    angularClamped = this._angularClamp(invertView, currentToTarget);
                }
            }
            let distanceClamped = false;
            if (!this.ignoreDistanceClamp) {
                distanceClamped = this._distanceClamp(currentToTarget, angularClamped);
                this._applyVerticalClamp(currentToTarget);
            }
            if (this.useFixedVerticalOffset) {
                currentToTarget.y = position.y - camera.globalPosition.y + this.fixedVerticalOffset;
            }
            if (angularClamped || distanceClamped || this._passedOrientationDeadzone(currentToTarget, nodeForward) || this._recenterNextUpdate) {
                this._orientationClamp(currentToTarget, rotationQuaternion);
            }
            this._workingPosition.subtractInPlace(pivot);
            this._recenterNextUpdate = false;
            this.attachedNode.setParent(oldParent);
        }
    }
    _updateTransformToGoal(elapsed) {
        if (!this.attachedNode || !this.followedCamera || !this._enabled) {
            return;
        }
        if (!this.attachedNode.rotationQuaternion) {
            this.attachedNode.rotationQuaternion = Quaternion.Identity();
        }
        const oldParent = this.attachedNode.parent;
        this.attachedNode.setParent(null);
        if (!this.interpolatePose) {
            this.attachedNode.position.copyFrom(this.followedCamera.globalPosition).addInPlace(this._workingPosition);
            this.attachedNode.rotationQuaternion.copyFrom(this._workingQuaternion);
            return;
        }
        // position
        const currentDirection = new Vector3();
        currentDirection.copyFrom(this.attachedNode.position).subtractInPlace(this.followedCamera.globalPosition);
        Vector3.SmoothToRef(currentDirection, this._workingPosition, elapsed, this.lerpTime, currentDirection);
        currentDirection.addInPlace(this.followedCamera.globalPosition);
        this.attachedNode.position.copyFrom(currentDirection);
        // rotation
        const currentRotation = new Quaternion();
        currentRotation.copyFrom(this.attachedNode.rotationQuaternion);
        Quaternion.SmoothToRef(currentRotation, this._workingQuaternion, elapsed, this.lerpTime, this.attachedNode.rotationQuaternion);
        this.attachedNode.setParent(oldParent);
    }
    _addObservables() {
        this._lastTick = Date.now();
        this._onBeforeRender = this._scene.onBeforeRenderObservable.add(() => {
            if (!this.followedCamera) {
                return;
            }
            const tick = Date.now();
            this._updateLeashing(this.followedCamera);
            this._updateTransformToGoal(tick - this._lastTick);
            this._lastTick = tick;
        });
    }
    _removeObservables() {
        if (this._onBeforeRender) {
            this._scene.onBeforeRenderObservable.remove(this._onBeforeRender);
        }
    }
}
//# sourceMappingURL=followBehavior.js.map