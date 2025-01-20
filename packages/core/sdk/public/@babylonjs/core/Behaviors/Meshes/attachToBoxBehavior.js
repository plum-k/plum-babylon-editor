import { Vector3, Matrix, Quaternion } from "../../Maths/math.vector.js";
/**
 * @internal
 */
class FaceDirectionInfo {
    constructor(direction, rotatedDirection = new Vector3(), diff = 0, ignore = false) {
        this.direction = direction;
        this.rotatedDirection = rotatedDirection;
        this.diff = diff;
        this.ignore = ignore;
    }
}
/**
 * A behavior that when attached to a mesh will will place a specified node on the meshes face pointing towards the camera
 */
export class AttachToBoxBehavior {
    /**
     * Creates the AttachToBoxBehavior, used to attach UI to the closest face of the box to a camera
     * @param _ui The transform node that should be attached to the mesh
     */
    constructor(_ui) {
        this._ui = _ui;
        /**
         *  ["AttachToBoxBehavior"] The name of the behavior
         */
        this.name = "AttachToBoxBehavior";
        /**
         * [0.15] The distance away from the face of the mesh that the UI should be attached to (default: 0.15)
         */
        this.distanceAwayFromFace = 0.15;
        /**
         * [0.15] The distance from the bottom of the face that the UI should be attached to (default: 0.15)
         */
        this.distanceAwayFromBottomOfFace = 0.15;
        this._faceVectors = [
            new FaceDirectionInfo(Vector3.Up()),
            new FaceDirectionInfo(Vector3.Down()),
            new FaceDirectionInfo(Vector3.Left()),
            new FaceDirectionInfo(Vector3.Right()),
            new FaceDirectionInfo(Vector3.Forward()),
            new FaceDirectionInfo(Vector3.Forward().scaleInPlace(-1)),
        ];
        this._tmpMatrix = new Matrix();
        this._tmpVector = new Vector3();
        this._zeroVector = Vector3.Zero();
        this._lookAtTmpMatrix = new Matrix();
        /* Does nothing */
    }
    /**
     *  Initializes the behavior
     */
    init() {
        /* Does nothing */
    }
    _closestFace(targetDirection) {
        // Go over each face and calculate the angle between the face's normal and targetDirection
        this._faceVectors.forEach((v) => {
            if (!this._target.rotationQuaternion) {
                this._target.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._target.rotation.y, this._target.rotation.x, this._target.rotation.z);
            }
            this._target.rotationQuaternion.toRotationMatrix(this._tmpMatrix);
            Vector3.TransformCoordinatesToRef(v.direction, this._tmpMatrix, v.rotatedDirection);
            v.diff = Vector3.GetAngleBetweenVectors(v.rotatedDirection, targetDirection, Vector3.Cross(v.rotatedDirection, targetDirection));
        });
        // Return the face information of the one with the normal closest to target direction
        return this._faceVectors.reduce((min, p) => {
            if (min.ignore) {
                return p;
            }
            else if (p.ignore) {
                return min;
            }
            else {
                return min.diff < p.diff ? min : p;
            }
        }, this._faceVectors[0]);
    }
    _lookAtToRef(pos, up = new Vector3(0, 1, 0), ref) {
        Matrix.LookAtLHToRef(this._zeroVector, pos, up, this._lookAtTmpMatrix);
        this._lookAtTmpMatrix.invert();
        Quaternion.FromRotationMatrixToRef(this._lookAtTmpMatrix, ref);
    }
    /**
     * Attaches the AttachToBoxBehavior to the passed in mesh
     * @param target The mesh that the specified node will be attached to
     */
    attach(target) {
        this._target = target;
        this._scene = this._target.getScene();
        // Every frame, update the app bars position
        this._onRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            if (!this._scene.activeCamera) {
                return;
            }
            // Find the face closest to the cameras position
            let cameraPos = this._scene.activeCamera.position;
            if (this._scene.activeCamera.devicePosition) {
                cameraPos = this._scene.activeCamera.devicePosition;
            }
            const facing = this._closestFace(cameraPos.subtract(target.position));
            if (this._scene.activeCamera.leftCamera) {
                this._scene.activeCamera.leftCamera.computeWorldMatrix().getRotationMatrixToRef(this._tmpMatrix);
            }
            else {
                this._scene.activeCamera.computeWorldMatrix().getRotationMatrixToRef(this._tmpMatrix);
            }
            // Get camera up direction
            Vector3.TransformCoordinatesToRef(Vector3.Up(), this._tmpMatrix, this._tmpVector);
            // Ignore faces to not select a parallel face for the up vector of the UI
            this._faceVectors.forEach((v) => {
                if (facing.direction.x && v.direction.x) {
                    v.ignore = true;
                }
                if (facing.direction.y && v.direction.y) {
                    v.ignore = true;
                }
                if (facing.direction.z && v.direction.z) {
                    v.ignore = true;
                }
            });
            const facingUp = this._closestFace(this._tmpVector);
            // Unignore faces
            this._faceVectors.forEach((v) => {
                v.ignore = false;
            });
            // Position the app bar on that face
            this._ui.position.copyFrom(target.position);
            if (facing.direction.x) {
                facing.rotatedDirection.scaleToRef(target.scaling.x / 2 + this.distanceAwayFromFace, this._tmpVector);
                this._ui.position.addInPlace(this._tmpVector);
            }
            if (facing.direction.y) {
                facing.rotatedDirection.scaleToRef(target.scaling.y / 2 + this.distanceAwayFromFace, this._tmpVector);
                this._ui.position.addInPlace(this._tmpVector);
            }
            if (facing.direction.z) {
                facing.rotatedDirection.scaleToRef(target.scaling.z / 2 + this.distanceAwayFromFace, this._tmpVector);
                this._ui.position.addInPlace(this._tmpVector);
            }
            // Rotate to be oriented properly to the camera
            if (!this._ui.rotationQuaternion) {
                this._ui.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._ui.rotation.y, this._ui.rotation.x, this._ui.rotation.z);
            }
            facing.rotatedDirection.scaleToRef(-1, this._tmpVector);
            this._lookAtToRef(this._tmpVector, facingUp.rotatedDirection, this._ui.rotationQuaternion);
            // Place ui the correct distance from the bottom of the mesh
            if (facingUp.direction.x) {
                this._ui.up.scaleToRef(this.distanceAwayFromBottomOfFace - target.scaling.x / 2, this._tmpVector);
            }
            if (facingUp.direction.y) {
                this._ui.up.scaleToRef(this.distanceAwayFromBottomOfFace - target.scaling.y / 2, this._tmpVector);
            }
            if (facingUp.direction.z) {
                this._ui.up.scaleToRef(this.distanceAwayFromBottomOfFace - target.scaling.z / 2, this._tmpVector);
            }
            this._ui.position.addInPlace(this._tmpVector);
        });
    }
    /**
     *  Detaches the behavior from the mesh
     */
    detach() {
        this._scene.onBeforeRenderObservable.remove(this._onRenderObserver);
    }
}
//# sourceMappingURL=attachToBoxBehavior.js.map