import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { Observable } from "../../Misc/observable.js";
import { Vector3, Matrix } from "../../Maths/math.vector.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
let planeIdProvider = 0;
/**
 * The plane detector is used to detect planes in the real world when in AR
 * For more information see https://github.com/immersive-web/real-world-geometry/
 */
export class WebXRPlaneDetector extends WebXRAbstractFeature {
    /**
     * construct a new Plane Detector
     * @param _xrSessionManager an instance of xr Session manager
     * @param _options configuration to use when constructing this feature
     */
    constructor(_xrSessionManager, _options = {}) {
        super(_xrSessionManager);
        this._options = _options;
        this._detectedPlanes = [];
        this._enabled = false;
        this._lastFrameDetected = new Set();
        /**
         * Observers registered here will be executed when a new plane was added to the session
         */
        this.onPlaneAddedObservable = new Observable();
        /**
         * Observers registered here will be executed when a plane is no longer detected in the session
         */
        this.onPlaneRemovedObservable = new Observable();
        /**
         * Observers registered here will be executed when an existing plane updates (for example - expanded)
         * This can execute N times every frame
         */
        this.onPlaneUpdatedObservable = new Observable();
        this.xrNativeFeatureName = "plane-detection";
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
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach() {
        if (!super.detach()) {
            return false;
        }
        if (!this._options.doNotRemovePlanesOnSessionEnded) {
            while (this._detectedPlanes.length) {
                const toRemove = this._detectedPlanes.pop();
                if (toRemove) {
                    this.onPlaneRemovedObservable.notifyObservers(toRemove);
                }
            }
        }
        return true;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        super.dispose();
        this.onPlaneAddedObservable.clear();
        this.onPlaneRemovedObservable.clear();
        this.onPlaneUpdatedObservable.clear();
    }
    /**
     * Check if the needed objects are defined.
     * This does not mean that the feature is enabled, but that the objects needed are well defined.
     * @returns true if the initial compatibility test passed
     */
    isCompatible() {
        return typeof XRPlane !== "undefined";
    }
    /**
     * Enable room capture mode.
     * When enabled and supported by the system,
     * the detectedPlanes array will be populated with the detected room boundaries
     * @see https://immersive-web.github.io/real-world-geometry/plane-detection.html#dom-xrsession-initiateroomcapture
     * @returns true if plane detection is enabled and supported. Will reject if not supported.
     */
    async initiateRoomCapture() {
        if (this._xrSessionManager.session.initiateRoomCapture) {
            return this._xrSessionManager.session.initiateRoomCapture();
        }
        return Promise.reject("initiateRoomCapture is not supported on this session");
    }
    _onXRFrame(frame) {
        if (!this.attached || !this._enabled || !frame) {
            return;
        }
        const detectedPlanes = frame.detectedPlanes || frame.worldInformation?.detectedPlanes;
        if (detectedPlanes) {
            // remove all planes that are not currently detected in the frame
            for (let planeIdx = 0; planeIdx < this._detectedPlanes.length; planeIdx++) {
                const plane = this._detectedPlanes[planeIdx];
                if (!detectedPlanes.has(plane.xrPlane)) {
                    this._detectedPlanes.splice(planeIdx--, 1);
                    this.onPlaneRemovedObservable.notifyObservers(plane);
                }
            }
            // now check for new ones
            detectedPlanes.forEach((xrPlane) => {
                if (!this._lastFrameDetected.has(xrPlane)) {
                    const newPlane = {
                        id: planeIdProvider++,
                        xrPlane: xrPlane,
                        polygonDefinition: [],
                    };
                    const plane = this._updatePlaneWithXRPlane(xrPlane, newPlane, frame);
                    this._detectedPlanes.push(plane);
                    this.onPlaneAddedObservable.notifyObservers(plane);
                }
                else {
                    // updated?
                    if (xrPlane.lastChangedTime === this._xrSessionManager.currentTimestamp) {
                        const index = this._findIndexInPlaneArray(xrPlane);
                        const plane = this._detectedPlanes[index];
                        this._updatePlaneWithXRPlane(xrPlane, plane, frame);
                        this.onPlaneUpdatedObservable.notifyObservers(plane);
                    }
                }
            });
            this._lastFrameDetected = detectedPlanes;
        }
    }
    _init() {
        const internalInit = () => {
            this._enabled = true;
            if (this._detectedPlanes.length) {
                this._detectedPlanes.length = 0;
            }
        };
        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNative && !!this._options.preferredDetectorOptions && !!this._xrSessionManager.session.trySetPreferredPlaneDetectorOptions) {
            this._xrSessionManager.session.trySetPreferredPlaneDetectorOptions(this._options.preferredDetectorOptions);
        }
        if (!this._xrSessionManager.session.updateWorldTrackingState) {
            internalInit();
            return;
        }
        this._xrSessionManager.session.updateWorldTrackingState({ planeDetectionState: { enabled: true } });
        internalInit();
    }
    _updatePlaneWithXRPlane(xrPlane, plane, xrFrame) {
        plane.polygonDefinition = xrPlane.polygon.map((xrPoint) => {
            const rightHandedSystem = this._xrSessionManager.scene.useRightHandedSystem ? 1 : -1;
            return new Vector3(xrPoint.x, xrPoint.y, xrPoint.z * rightHandedSystem);
        });
        // matrix
        const pose = xrFrame.getPose(xrPlane.planeSpace, this._xrSessionManager.referenceSpace);
        if (pose) {
            const mat = plane.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            plane.transformationMatrix = mat;
            if (this._options.worldParentNode) {
                mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
            }
        }
        return plane;
    }
    /**
     * avoiding using Array.find for global support.
     * @param xrPlane the plane to find in the array
     * @returns the index of the plane in the array or -1 if not found
     */
    _findIndexInPlaneArray(xrPlane) {
        for (let i = 0; i < this._detectedPlanes.length; ++i) {
            if (this._detectedPlanes[i].xrPlane === xrPlane) {
                return i;
            }
        }
        return -1;
    }
}
/**
 * The module's name
 */
WebXRPlaneDetector.Name = WebXRFeatureName.PLANE_DETECTION;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRPlaneDetector.Version = 1;
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRPlaneDetector.Name, (xrSessionManager, options) => {
    return () => new WebXRPlaneDetector(xrSessionManager, options);
}, WebXRPlaneDetector.Version);
//# sourceMappingURL=WebXRPlaneDetector.js.map