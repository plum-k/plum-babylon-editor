import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { Observable } from "../../Misc/observable.js";
import { Vector3, Matrix, Quaternion } from "../../Maths/math.vector.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Tools } from "../../Misc/tools.js";
/**
 * The currently-working hit-test module.
 * Hit test (or Ray-casting) is used to interact with the real world.
 * For further information read here - https://github.com/immersive-web/hit-test
 *
 * Tested on chrome (mobile) 80.
 */
export class WebXRHitTest extends WebXRAbstractFeature {
    /**
     * Creates a new instance of the hit test feature
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options options to use when constructing this feature
     */
    constructor(_xrSessionManager, 
    /**
     * [Empty Object] options to use when constructing this feature
     */
    options = {}) {
        super(_xrSessionManager);
        this.options = options;
        this._tmpMat = new Matrix();
        this._tmpPos = new Vector3();
        this._tmpQuat = new Quaternion();
        this._initHitTestSource = (referenceSpace) => {
            if (!referenceSpace) {
                return;
            }
            const offsetRay = new XRRay(this.options.offsetRay || {});
            const hitTestOptions = {
                space: this.options.useReferenceSpace ? referenceSpace : this._xrSessionManager.viewerReferenceSpace,
                offsetRay: offsetRay,
            };
            if (this.options.entityTypes) {
                hitTestOptions.entityTypes = this.options.entityTypes;
            }
            if (!hitTestOptions.space) {
                Tools.Warn("waiting for viewer reference space to initialize");
                return;
            }
            this._xrSessionManager.session.requestHitTestSource(hitTestOptions).then((hitTestSource) => {
                if (this._xrHitTestSource) {
                    this._xrHitTestSource.cancel();
                }
                this._xrHitTestSource = hitTestSource;
            });
        };
        /**
         * When set to true, each hit test will have its own position/rotation objects
         * When set to false, position and rotation objects will be reused for each hit test. It is expected that
         * the developers will clone them or copy them as they see fit.
         */
        this.autoCloneTransformation = false;
        /**
         * Triggered when new babylon (transformed) hit test results are available
         * Note - this will be called when results come back from the device. It can be an empty array!!
         */
        this.onHitTestResultObservable = new Observable();
        /**
         * Use this to temporarily pause hit test checks.
         */
        this.paused = false;
        this.xrNativeFeatureName = "hit-test";
        Tools.Warn("Hit test is an experimental and unstable feature.");
    }
    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    attach() {
        if (!super.attach()) {
            return false;
        }
        // Feature enabled, but not available
        if (!this._xrSessionManager.session.requestHitTestSource) {
            return false;
        }
        if (!this.options.disablePermanentHitTest) {
            if (this._xrSessionManager.referenceSpace) {
                this._initHitTestSource(this._xrSessionManager.referenceSpace);
            }
            this._xrSessionManager.onXRReferenceSpaceChanged.add(this._initHitTestSource);
        }
        if (this.options.enableTransientHitTest) {
            const offsetRay = new XRRay(this.options.transientOffsetRay || {});
            this._xrSessionManager.session.requestHitTestSourceForTransientInput({
                profile: this.options.transientHitTestProfile || "generic-touchscreen",
                offsetRay,
                entityTypes: this.options.entityTypes,
            }).then((hitSource) => {
                this._transientXrHitTestSource = hitSource;
            });
        }
        return true;
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
        if (this._xrHitTestSource) {
            this._xrHitTestSource.cancel();
            this._xrHitTestSource = null;
        }
        this._xrSessionManager.onXRReferenceSpaceChanged.removeCallback(this._initHitTestSource);
        if (this._transientXrHitTestSource) {
            this._transientXrHitTestSource.cancel();
            this._transientXrHitTestSource = null;
        }
        return true;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        super.dispose();
        this.onHitTestResultObservable.clear();
    }
    _onXRFrame(frame) {
        // make sure we do nothing if (async) not attached
        if (!this.attached || this.paused) {
            return;
        }
        if (this._xrHitTestSource) {
            const results = frame.getHitTestResults(this._xrHitTestSource);
            this._processWebXRHitTestResult(results);
        }
        if (this._transientXrHitTestSource) {
            const hitTestResultsPerInputSource = frame.getHitTestResultsForTransientInput(this._transientXrHitTestSource);
            hitTestResultsPerInputSource.forEach((resultsPerInputSource) => {
                this._processWebXRHitTestResult(resultsPerInputSource.results, resultsPerInputSource.inputSource);
            });
        }
    }
    _processWebXRHitTestResult(hitTestResults, inputSource) {
        const results = [];
        hitTestResults.forEach((hitTestResult) => {
            const pose = hitTestResult.getPose(this._xrSessionManager.referenceSpace);
            if (!pose) {
                return;
            }
            const pos = pose.transform.position;
            const quat = pose.transform.orientation;
            this._tmpPos.set(pos.x, pos.y, pos.z).scaleInPlace(this._xrSessionManager.worldScalingFactor);
            this._tmpQuat.set(quat.x, quat.y, quat.z, quat.w);
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                this._tmpPos.z *= -1;
                this._tmpQuat.z *= -1;
                this._tmpQuat.w *= -1;
                this._tmpMat.toggleModelMatrixHandInPlace();
            }
            const result = {
                position: this.autoCloneTransformation ? this._tmpPos.clone() : this._tmpPos,
                rotationQuaternion: this.autoCloneTransformation ? this._tmpQuat.clone() : this._tmpQuat,
                transformationMatrix: this.autoCloneTransformation ? this._tmpMat.clone() : this._tmpMat,
                inputSource: inputSource,
                isTransient: !!inputSource,
                xrHitResult: hitTestResult,
            };
            results.push(result);
        });
        this.onHitTestResultObservable.notifyObservers(results);
    }
}
/**
 * The module's name
 */
WebXRHitTest.Name = WebXRFeatureName.HIT_TEST;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRHitTest.Version = 2;
//register the plugin versions
WebXRFeaturesManager.AddWebXRFeature(WebXRHitTest.Name, (xrSessionManager, options) => {
    return () => new WebXRHitTest(xrSessionManager, options);
}, WebXRHitTest.Version, false);
//# sourceMappingURL=WebXRHitTest.js.map