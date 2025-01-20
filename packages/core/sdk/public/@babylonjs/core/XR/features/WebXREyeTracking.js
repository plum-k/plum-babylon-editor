import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Observable } from "../../Misc/observable.js";
import { Vector3, TmpVectors } from "../../Maths/math.vector.js";
import { Ray } from "../../Culling/ray.js";
/**
 * The WebXR Eye Tracking feature grabs eye data from the device and provides it in an easy-access format.
 * Currently only enabled for BabylonNative applications.
 */
export class WebXREyeTracking extends WebXRAbstractFeature {
    /**
     * Creates a new instance of the XR eye tracking feature.
     * @param _xrSessionManager An instance of WebXRSessionManager.
     */
    constructor(_xrSessionManager) {
        super(_xrSessionManager);
        /**
         * This observable will notify registered observers when eye tracking starts
         */
        this.onEyeTrackingStartedObservable = new Observable();
        /**
         * This observable will notify registered observers when eye tracking ends
         */
        this.onEyeTrackingEndedObservable = new Observable();
        /**
         * This observable will notify registered observers on each frame that has valid tracking
         */
        this.onEyeTrackingFrameUpdateObservable = new Observable();
        this._eyeTrackingStartListener = (event) => {
            this._latestEyeSpace = event.gazeSpace;
            this._gazeRay = new Ray(Vector3.Zero(), Vector3.Forward());
            this.onEyeTrackingStartedObservable.notifyObservers(this._gazeRay);
        };
        this._eyeTrackingEndListener = () => {
            this._latestEyeSpace = null;
            this._gazeRay = null;
            this.onEyeTrackingEndedObservable.notifyObservers();
        };
        this.xrNativeFeatureName = "eye-tracking";
        if (this._xrSessionManager.session) {
            this._init();
        }
        else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._init();
            });
        }
    }
    /**
     * Dispose this feature and all of the resources attached.
     */
    dispose() {
        super.dispose();
        this._xrSessionManager.session.removeEventListener("eyetrackingstart", this._eyeTrackingStartListener);
        this._xrSessionManager.session.removeEventListener("eyetrackingend", this._eyeTrackingEndListener);
        this.onEyeTrackingStartedObservable.clear();
        this.onEyeTrackingEndedObservable.clear();
        this.onEyeTrackingFrameUpdateObservable.clear();
    }
    /**
     * Returns whether the gaze data is valid or not
     * @returns true if the data is valid
     */
    get isEyeGazeValid() {
        return !!this._gazeRay;
    }
    /**
     * Get a reference to the gaze ray. This data is valid while eye tracking persists, and will be set to null when gaze data is no longer available
     * @returns a reference to the gaze ray if it exists and is valid, returns null otherwise.
     */
    getEyeGaze() {
        return this._gazeRay;
    }
    _onXRFrame(frame) {
        if (!this.attached || !frame) {
            return;
        }
        if (this._latestEyeSpace && this._gazeRay) {
            const pose = frame.getPose(this._latestEyeSpace, this._xrSessionManager.referenceSpace);
            if (pose) {
                this._gazeRay.origin.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z).scaleInPlace(this._xrSessionManager.worldScalingFactor);
                const quat = pose.transform.orientation;
                TmpVectors.Quaternion[0].set(quat.x, quat.y, quat.z, quat.w);
                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    this._gazeRay.origin.z *= -1;
                    TmpVectors.Quaternion[0].z *= -1;
                    TmpVectors.Quaternion[0].w *= -1;
                    Vector3.LeftHandedForwardReadOnly.rotateByQuaternionToRef(TmpVectors.Quaternion[0], this._gazeRay.direction);
                }
                else {
                    Vector3.RightHandedForwardReadOnly.rotateByQuaternionToRef(TmpVectors.Quaternion[0], this._gazeRay.direction);
                }
                this.onEyeTrackingFrameUpdateObservable.notifyObservers(this._gazeRay);
            }
        }
    }
    _init() {
        // Only supported by BabylonNative
        if (this._xrSessionManager.isNative) {
            this._xrSessionManager.session.addEventListener("eyetrackingstart", this._eyeTrackingStartListener);
            this._xrSessionManager.session.addEventListener("eyetrackingend", this._eyeTrackingEndListener);
        }
    }
}
/**
 * The module's name
 */
WebXREyeTracking.Name = WebXRFeatureName.EYE_TRACKING;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXREyeTracking.Version = 1;
WebXRFeaturesManager.AddWebXRFeature(WebXREyeTracking.Name, (xrSessionManager) => {
    return () => new WebXREyeTracking(xrSessionManager);
}, WebXREyeTracking.Version, false);
//# sourceMappingURL=WebXREyeTracking.js.map