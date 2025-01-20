import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { Observable } from "../../Misc/observable.js";
import { Vector3, Matrix } from "../../Maths/math.vector.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Tools } from "../../Misc/tools.js";
/**
 * The currently-working hit-test module.
 * Hit test (or Ray-casting) is used to interact with the real world.
 * For further information read here - https://github.com/immersive-web/hit-test
 */
export class WebXRHitTestLegacy extends WebXRAbstractFeature {
    /**
     * Creates a new instance of the (legacy version) hit test feature
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
        // in XR space z-forward is negative
        this._direction = new Vector3(0, 0, -1);
        this._mat = new Matrix();
        this._onSelectEnabled = false;
        this._origin = new Vector3(0, 0, 0);
        /**
         * Populated with the last native XR Hit Results
         */
        this.lastNativeXRHitResults = [];
        /**
         * Triggered when new babylon (transformed) hit test results are available
         */
        this.onHitTestResultObservable = new Observable();
        this._onHitTestResults = (xrResults) => {
            const mats = xrResults.map((result) => {
                const mat = Matrix.FromArray(result.hitMatrix);
                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    mat.toggleModelMatrixHandInPlace();
                }
                // if (this.options.coordinatesSpace === Space.WORLD) {
                if (this.options.worldParentNode) {
                    mat.multiplyToRef(this.options.worldParentNode.getWorldMatrix(), mat);
                }
                return {
                    xrHitResult: result,
                    transformationMatrix: mat,
                };
            });
            this.lastNativeXRHitResults = xrResults;
            this.onHitTestResultObservable.notifyObservers(mats);
        };
        // can be done using pointerdown event, and xrSessionManager.currentFrame
        this._onSelect = (event) => {
            if (!this._onSelectEnabled) {
                return;
            }
            WebXRHitTestLegacy.XRHitTestWithSelectEvent(event, this._xrSessionManager.referenceSpace);
        };
        this.xrNativeFeatureName = "hit-test";
        Tools.Warn("A newer version of this plugin is available");
    }
    /**
     * execute a hit test with an XR Ray
     *
     * @param xrSession a native xrSession that will execute this hit test
     * @param xrRay the ray (position and direction) to use for ray-casting
     * @param referenceSpace native XR reference space to use for the hit-test
     * @param filter filter function that will filter the results
     * @returns a promise that resolves with an array of native XR hit result in xr coordinates system
     */
    static XRHitTestWithRay(xrSession, xrRay, referenceSpace, filter) {
        return xrSession.requestHitTest(xrRay, referenceSpace).then((results) => {
            const filterFunction = filter || ((result) => !!result.hitMatrix);
            return results.filter(filterFunction);
        });
    }
    /**
     * Execute a hit test on the current running session using a select event returned from a transient input (such as touch)
     * @param event the (select) event to use to select with
     * @param referenceSpace the reference space to use for this hit test
     * @returns a promise that resolves with an array of native XR hit result in xr coordinates system
     */
    static XRHitTestWithSelectEvent(event, referenceSpace) {
        const targetRayPose = event.frame.getPose(event.inputSource.targetRaySpace, referenceSpace);
        if (!targetRayPose) {
            return Promise.resolve([]);
        }
        const targetRay = new XRRay(targetRayPose.transform);
        return this.XRHitTestWithRay(event.frame.session, targetRay, referenceSpace);
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
        if (this.options.testOnPointerDownOnly) {
            this._xrSessionManager.session.addEventListener("select", this._onSelect, false);
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
        // disable select
        this._onSelectEnabled = false;
        this._xrSessionManager.session.removeEventListener("select", this._onSelect);
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
        if (!this.attached || this.options.testOnPointerDownOnly) {
            return;
        }
        const pose = frame.getViewerPose(this._xrSessionManager.referenceSpace);
        if (!pose) {
            return;
        }
        Matrix.FromArrayToRef(pose.transform.matrix, 0, this._mat);
        Vector3.TransformCoordinatesFromFloatsToRef(0, 0, 0, this._mat, this._origin);
        Vector3.TransformCoordinatesFromFloatsToRef(0, 0, -1, this._mat, this._direction);
        this._direction.subtractInPlace(this._origin);
        this._direction.normalize();
        const ray = new XRRay({ x: this._origin.x, y: this._origin.y, z: this._origin.z, w: 0 }, { x: this._direction.x, y: this._direction.y, z: this._direction.z, w: 0 });
        WebXRHitTestLegacy.XRHitTestWithRay(this._xrSessionManager.session, ray, this._xrSessionManager.referenceSpace).then(this._onHitTestResults);
    }
}
/**
 * The module's name
 */
WebXRHitTestLegacy.Name = WebXRFeatureName.HIT_TEST;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRHitTestLegacy.Version = 1;
//register the plugin versions
WebXRFeaturesManager.AddWebXRFeature(WebXRHitTestLegacy.Name, (xrSessionManager, options) => {
    return () => new WebXRHitTestLegacy(xrSessionManager, options);
}, WebXRHitTestLegacy.Version, false);
//# sourceMappingURL=WebXRHitTestLegacy.js.map