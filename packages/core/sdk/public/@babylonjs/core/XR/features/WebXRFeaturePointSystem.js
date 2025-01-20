import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { Observable } from "../../Misc/observable.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
/**
 * The feature point system is used to detect feature points from real world geometry.
 * This feature is currently experimental and only supported on BabylonNative, and should not be used in the browser.
 * The newly introduced API can be seen in webxr.nativeextensions.d.ts and described in FeaturePoints.md.
 */
export class WebXRFeaturePointSystem extends WebXRAbstractFeature {
    /**
     * The current feature point cloud maintained across frames.
     */
    get featurePointCloud() {
        return this._featurePointCloud;
    }
    /**
     * construct the feature point system
     * @param _xrSessionManager an instance of xr Session manager
     */
    constructor(_xrSessionManager) {
        super(_xrSessionManager);
        this._enabled = false;
        this._featurePointCloud = [];
        /**
         * Observers registered here will be executed whenever new feature points are added (on XRFrame while the session is tracking).
         * Will notify the observers about which feature points have been added.
         */
        this.onFeaturePointsAddedObservable = new Observable();
        /**
         * Observers registered here will be executed whenever a feature point has been updated (on XRFrame while the session is tracking).
         * Will notify the observers about which feature points have been updated.
         */
        this.onFeaturePointsUpdatedObservable = new Observable();
        this.xrNativeFeatureName = "bjsfeature-points";
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
     * Detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach() {
        if (!super.detach()) {
            return false;
        }
        this.featurePointCloud.length = 0;
        return true;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        super.dispose();
        this._featurePointCloud.length = 0;
        this.onFeaturePointsUpdatedObservable.clear();
        this.onFeaturePointsAddedObservable.clear();
    }
    /**
     * On receiving a new XR frame if this feature is attached notify observers new feature point data is available.
     * @param frame
     */
    _onXRFrame(frame) {
        if (!this.attached || !this._enabled || !frame) {
            return;
        }
        const featurePointRawData = frame.featurePointCloud;
        if (!featurePointRawData || featurePointRawData.length === 0) {
            return;
        }
        else {
            if (featurePointRawData.length % 5 !== 0) {
                throw new Error("Received malformed feature point cloud of length: " + featurePointRawData.length);
            }
            const numberOfFeaturePoints = featurePointRawData.length / 5;
            const updatedFeaturePoints = [];
            const addedFeaturePoints = [];
            for (let i = 0; i < numberOfFeaturePoints; i++) {
                const rawIndex = i * 5;
                const id = featurePointRawData[rawIndex + 4];
                // IDs should be durable across frames and strictly increasing from 0 up, so use them as indexing into the feature point array.
                if (!this._featurePointCloud[id]) {
                    this._featurePointCloud[id] = { position: new Vector3(), confidenceValue: 0 };
                    addedFeaturePoints.push(id);
                }
                else {
                    updatedFeaturePoints.push(id);
                }
                // Set the feature point values.
                this._featurePointCloud[id].position.x = featurePointRawData[rawIndex];
                this._featurePointCloud[id].position.y = featurePointRawData[rawIndex + 1];
                this._featurePointCloud[id].position.z = featurePointRawData[rawIndex + 2];
                this._featurePointCloud[id].confidenceValue = featurePointRawData[rawIndex + 3];
            }
            // Signal observers that feature points have been added if necessary.
            if (addedFeaturePoints.length > 0) {
                this.onFeaturePointsAddedObservable.notifyObservers(addedFeaturePoints);
            }
            // Signal observers that feature points have been updated if necessary.
            if (updatedFeaturePoints.length > 0) {
                this.onFeaturePointsUpdatedObservable.notifyObservers(updatedFeaturePoints);
            }
        }
    }
    /**
     * Initializes the feature. If the feature point feature is not available for this environment do not mark the feature as enabled.
     */
    _init() {
        if (!this._xrSessionManager.session.trySetFeaturePointCloudEnabled || !this._xrSessionManager.session.trySetFeaturePointCloudEnabled(true)) {
            // fail silently
            return;
        }
        this._enabled = true;
    }
}
/**
 * The module's name
 */
WebXRFeaturePointSystem.Name = WebXRFeatureName.FEATURE_POINTS;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRFeaturePointSystem.Version = 1;
// register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRFeaturePointSystem.Name, (xrSessionManager) => {
    return () => new WebXRFeaturePointSystem(xrSessionManager);
}, WebXRFeaturePointSystem.Version);
//# sourceMappingURL=WebXRFeaturePointSystem.js.map