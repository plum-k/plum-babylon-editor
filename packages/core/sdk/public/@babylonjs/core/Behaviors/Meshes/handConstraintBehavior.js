import { WebXRFeatureName } from "../../XR/webXRFeaturesManager.js";
import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector.js";
import { Tools } from "../../Misc/tools.js";
/**
 * Zones around the hand
 */
export var HandConstraintZone;
(function (HandConstraintZone) {
    /**
     * Above finger tips
     */
    HandConstraintZone[HandConstraintZone["ABOVE_FINGER_TIPS"] = 0] = "ABOVE_FINGER_TIPS";
    /**
     * Next to the thumb
     */
    HandConstraintZone[HandConstraintZone["RADIAL_SIDE"] = 1] = "RADIAL_SIDE";
    /**
     * Next to the pinky finger
     */
    HandConstraintZone[HandConstraintZone["ULNAR_SIDE"] = 2] = "ULNAR_SIDE";
    /**
     * Below the wrist
     */
    HandConstraintZone[HandConstraintZone["BELOW_WRIST"] = 3] = "BELOW_WRIST";
})(HandConstraintZone || (HandConstraintZone = {}));
/**
 * Orientations for the hand zones and for the attached node
 */
export var HandConstraintOrientation;
(function (HandConstraintOrientation) {
    /**
     * Orientation is towards the camera
     */
    HandConstraintOrientation[HandConstraintOrientation["LOOK_AT_CAMERA"] = 0] = "LOOK_AT_CAMERA";
    /**
     * Orientation is determined by the rotation of the palm
     */
    HandConstraintOrientation[HandConstraintOrientation["HAND_ROTATION"] = 1] = "HAND_ROTATION";
})(HandConstraintOrientation || (HandConstraintOrientation = {}));
/**
 * Orientations for the hand zones and for the attached node
 */
export var HandConstraintVisibility;
(function (HandConstraintVisibility) {
    /**
     * Constraint is always visible
     */
    HandConstraintVisibility[HandConstraintVisibility["ALWAYS_VISIBLE"] = 0] = "ALWAYS_VISIBLE";
    /**
     * Constraint is only visible when the palm is up
     */
    HandConstraintVisibility[HandConstraintVisibility["PALM_UP"] = 1] = "PALM_UP";
    /**
     * Constraint is only visible when the user is looking at the constraint.
     * Uses XR Eye Tracking if enabled/available, otherwise uses camera direction
     */
    HandConstraintVisibility[HandConstraintVisibility["GAZE_FOCUS"] = 2] = "GAZE_FOCUS";
    /**
     * Constraint is only visible when the palm is up and the user is looking at it
     */
    HandConstraintVisibility[HandConstraintVisibility["PALM_AND_GAZE"] = 3] = "PALM_AND_GAZE";
})(HandConstraintVisibility || (HandConstraintVisibility = {}));
/**
 * Hand constraint behavior that makes the attached `TransformNode` follow hands in XR experiences.
 * @since 5.0.0
 */
export class HandConstraintBehavior {
    /**
     * Builds a hand constraint behavior
     */
    constructor() {
        this._sceneRenderObserver = null;
        this._zoneAxis = {};
        /**
         * Sets the HandConstraintVisibility level for the hand constraint
         */
        this.handConstraintVisibility = 3 /* HandConstraintVisibility.PALM_AND_GAZE */;
        /**
         * A number from 0.0 to 1.0, marking how restricted the direction the palm faces is for the attached node to be enabled.
         * A 1 means the palm must be directly facing the user before the node is enabled, a 0 means it is always enabled.
         * Used with HandConstraintVisibility.PALM_UP
         */
        this.palmUpStrictness = 0.95;
        /**
         * The radius in meters around the center of the hand that the user must gaze inside for the attached node to be enabled and appear.
         * Used with HandConstraintVisibility.GAZE_FOCUS
         */
        this.gazeProximityRadius = 0.15;
        /**
         * Offset distance from the hand in meters
         */
        this.targetOffset = 0.1;
        /**
         * Where to place the node regarding the center of the hand.
         */
        this.targetZone = 2 /* HandConstraintZone.ULNAR_SIDE */;
        /**
         * Orientation mode of the 4 zones around the hand
         */
        this.zoneOrientationMode = 1 /* HandConstraintOrientation.HAND_ROTATION */;
        /**
         * Orientation mode of the node attached to this behavior
         */
        this.nodeOrientationMode = 1 /* HandConstraintOrientation.HAND_ROTATION */;
        /**
         * Set the hand this behavior should follow. If set to "none", it will follow any visible hand (prioritising the left one).
         */
        this.handedness = "none";
        /**
         * Rate of interpolation of position and rotation of the attached node.
         * Higher values will give a slower interpolation.
         */
        this.lerpTime = 100;
        // For a right hand
        this._zoneAxis[0 /* HandConstraintZone.ABOVE_FINGER_TIPS */] = new Vector3(0, 1, 0);
        this._zoneAxis[1 /* HandConstraintZone.RADIAL_SIDE */] = new Vector3(-1, 0, 0);
        this._zoneAxis[2 /* HandConstraintZone.ULNAR_SIDE */] = new Vector3(1, 0, 0);
        this._zoneAxis[3 /* HandConstraintZone.BELOW_WRIST */] = new Vector3(0, -1, 0);
    }
    /** gets or sets behavior's name */
    get name() {
        return "HandConstraint";
    }
    /** Enable the behavior */
    enable() {
        this._node.setEnabled(true);
    }
    /** Disable the behavior */
    disable() {
        this._node.setEnabled(false);
    }
    _getHandPose() {
        if (!this._handTracking) {
            return null;
        }
        // Retrieve any available hand, starting by the left
        let hand;
        if (this.handedness === "none") {
            hand = this._handTracking.getHandByHandedness("left") || this._handTracking.getHandByHandedness("right");
        }
        else {
            hand = this._handTracking.getHandByHandedness(this.handedness);
        }
        if (hand) {
            const pinkyMetacarpal = hand.getJointMesh("pinky-finger-metacarpal" /* WebXRHandJoint.PINKY_FINGER_METACARPAL */);
            const middleMetacarpal = hand.getJointMesh("middle-finger-metacarpal" /* WebXRHandJoint.MIDDLE_FINGER_METACARPAL */);
            const wrist = hand.getJointMesh("wrist" /* WebXRHandJoint.WRIST */);
            if (wrist && middleMetacarpal && pinkyMetacarpal) {
                const handPose = { position: middleMetacarpal.absolutePosition, quaternion: new Quaternion(), id: hand.xrController.uniqueId };
                // palm forward
                const up = TmpVectors.Vector3[0];
                const forward = TmpVectors.Vector3[1];
                const left = TmpVectors.Vector3[2];
                up.copyFrom(middleMetacarpal.absolutePosition).subtractInPlace(wrist.absolutePosition).normalize();
                forward.copyFrom(pinkyMetacarpal.absolutePosition).subtractInPlace(middleMetacarpal.absolutePosition).normalize();
                // Create vectors for a rotation quaternion, where forward points out from the palm
                Vector3.CrossToRef(up, forward, forward);
                Vector3.CrossToRef(forward, up, left);
                Quaternion.FromLookDirectionLHToRef(forward, up, handPose.quaternion);
                return handPose;
            }
        }
        return null;
    }
    /**
     * Initializes the hand constraint behavior
     */
    init() { }
    /**
     * Attaches the hand constraint to a `TransformNode`
     * @param node defines the node to attach the behavior to
     */
    attach(node) {
        this._node = node;
        this._scene = node.getScene();
        if (!this._node.rotationQuaternion) {
            this._node.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._node.rotation.y, this._node.rotation.x, this._node.rotation.z);
        }
        let lastTick = Date.now();
        this._sceneRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            const pose = this._getHandPose();
            this._node.reservedDataStore = this._node.reservedDataStore || {};
            this._node.reservedDataStore.nearInteraction = this._node.reservedDataStore.nearInteraction || {};
            this._node.reservedDataStore.nearInteraction.excludedControllerId = null;
            if (pose) {
                const zoneOffset = TmpVectors.Vector3[0];
                const camera = this._scene.activeCamera;
                zoneOffset.copyFrom(this._zoneAxis[this.targetZone]);
                const cameraLookAtQuaternion = TmpVectors.Quaternion[0];
                if (camera && (this.zoneOrientationMode === 0 /* HandConstraintOrientation.LOOK_AT_CAMERA */ || this.nodeOrientationMode === 0 /* HandConstraintOrientation.LOOK_AT_CAMERA */)) {
                    const toCamera = TmpVectors.Vector3[1];
                    toCamera.copyFrom(camera.position).subtractInPlace(pose.position).normalize();
                    if (this._scene.useRightHandedSystem) {
                        Quaternion.FromLookDirectionRHToRef(toCamera, Vector3.UpReadOnly, cameraLookAtQuaternion);
                    }
                    else {
                        Quaternion.FromLookDirectionLHToRef(toCamera, Vector3.UpReadOnly, cameraLookAtQuaternion);
                    }
                }
                if (this.zoneOrientationMode === 1 /* HandConstraintOrientation.HAND_ROTATION */) {
                    pose.quaternion.toRotationMatrix(TmpVectors.Matrix[0]);
                }
                else {
                    cameraLookAtQuaternion.toRotationMatrix(TmpVectors.Matrix[0]);
                }
                Vector3.TransformNormalToRef(zoneOffset, TmpVectors.Matrix[0], zoneOffset);
                zoneOffset.scaleInPlace(this.targetOffset);
                const targetPosition = TmpVectors.Vector3[2];
                const targetRotation = TmpVectors.Quaternion[1];
                targetPosition.copyFrom(pose.position).addInPlace(zoneOffset);
                if (this.nodeOrientationMode === 1 /* HandConstraintOrientation.HAND_ROTATION */) {
                    targetRotation.copyFrom(pose.quaternion);
                }
                else {
                    targetRotation.copyFrom(cameraLookAtQuaternion);
                }
                const elapsed = Date.now() - lastTick;
                Vector3.SmoothToRef(this._node.position, targetPosition, elapsed, this.lerpTime, this._node.position);
                Quaternion.SmoothToRef(this._node.rotationQuaternion, targetRotation, elapsed, this.lerpTime, this._node.rotationQuaternion);
                this._node.reservedDataStore.nearInteraction.excludedControllerId = pose.id;
            }
            this._setVisibility(pose);
            lastTick = Date.now();
        });
    }
    _setVisibility(pose) {
        let palmVisible = true;
        let gazeVisible = true;
        const camera = this._scene.activeCamera;
        if (camera) {
            const cameraForward = camera.getForwardRay();
            if (this.handConstraintVisibility === 2 /* HandConstraintVisibility.GAZE_FOCUS */ || this.handConstraintVisibility === 3 /* HandConstraintVisibility.PALM_AND_GAZE */) {
                gazeVisible = false;
                let gaze;
                if (this._eyeTracking) {
                    gaze = this._eyeTracking.getEyeGaze();
                }
                gaze = gaze || cameraForward;
                const gazeToBehavior = TmpVectors.Vector3[0];
                if (pose) {
                    pose.position.subtractToRef(gaze.origin, gazeToBehavior);
                }
                else {
                    this._node.getAbsolutePosition().subtractToRef(gaze.origin, gazeToBehavior);
                }
                const projectedDistance = Vector3.Dot(gazeToBehavior, gaze.direction);
                const projectedSquared = projectedDistance * projectedDistance;
                if (projectedDistance > 0) {
                    const radiusSquared = gazeToBehavior.lengthSquared() - projectedSquared;
                    if (radiusSquared < this.gazeProximityRadius * this.gazeProximityRadius) {
                        gazeVisible = true;
                    }
                }
            }
            if (this.handConstraintVisibility === 1 /* HandConstraintVisibility.PALM_UP */ || this.handConstraintVisibility === 3 /* HandConstraintVisibility.PALM_AND_GAZE */) {
                palmVisible = false;
                if (pose) {
                    const palmDirection = TmpVectors.Vector3[0];
                    Vector3.LeftHandedForwardReadOnly.rotateByQuaternionToRef(pose.quaternion, palmDirection);
                    if (Vector3.Dot(palmDirection, cameraForward.direction) > this.palmUpStrictness * 2 - 1) {
                        palmVisible = true;
                    }
                }
            }
        }
        this._node.setEnabled(palmVisible && gazeVisible);
    }
    /**
     * Detaches the behavior from the `TransformNode`
     */
    detach() {
        this._scene.onBeforeRenderObservable.remove(this._sceneRenderObserver);
    }
    /**
     * Links the behavior to the XR experience in which to retrieve hand transform information.
     * @param xr xr experience
     */
    linkToXRExperience(xr) {
        const featuresManager = xr.featuresManager ? xr.featuresManager : xr;
        if (!featuresManager) {
            Tools.Error("XR features manager must be available or provided directly for the Hand Menu to work");
        }
        else {
            try {
                this._eyeTracking = featuresManager.getEnabledFeature(WebXRFeatureName.EYE_TRACKING);
            }
            catch { }
            try {
                this._handTracking = featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING);
            }
            catch {
                Tools.Error("Hand tracking must be enabled for the Hand Menu to work");
            }
        }
    }
}
//# sourceMappingURL=handConstraintBehavior.js.map