import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager.js";
import { Observable } from "../../Misc/observable.js";
import { Matrix, Vector3, Quaternion } from "../../Maths/math.vector.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Tools } from "../../Misc/tools.js";
let anchorIdProvider = 0;
/**
 * An implementation of the anchor system for WebXR.
 * For further information see https://github.com/immersive-web/anchors/
 */
export class WebXRAnchorSystem extends WebXRAbstractFeature {
    /**
     * Set the reference space to use for anchor creation, when not using a hit test.
     * Will default to the session's reference space if not defined
     */
    set referenceSpaceForFrameAnchors(referenceSpace) {
        this._referenceSpaceForFrameAnchors = referenceSpace;
    }
    /**
     * constructs a new anchor system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param _options configuration object for this feature
     */
    constructor(_xrSessionManager, _options = {}) {
        super(_xrSessionManager);
        this._options = _options;
        this._lastFrameDetected = new Set();
        this._trackedAnchors = [];
        this._futureAnchors = [];
        /**
         * Observers registered here will be executed when a new anchor was added to the session
         */
        this.onAnchorAddedObservable = new Observable();
        /**
         * Observers registered here will be executed when an anchor was removed from the session
         */
        this.onAnchorRemovedObservable = new Observable();
        /**
         * Observers registered here will be executed when an existing anchor updates
         * This can execute N times every frame
         */
        this.onAnchorUpdatedObservable = new Observable();
        this._tmpVector = new Vector3();
        this._tmpQuaternion = new Quaternion();
        this.xrNativeFeatureName = "anchors";
        if (this._options.clearAnchorsOnSessionInit) {
            this._xrSessionManager.onXRSessionInit.add(() => {
                this._trackedAnchors.length = 0;
                this._futureAnchors.length = 0;
                this._lastFrameDetected.clear();
            });
        }
    }
    _populateTmpTransformation(position, rotationQuaternion) {
        this._tmpVector.copyFrom(position);
        this._tmpQuaternion.copyFrom(rotationQuaternion);
        if (!this._xrSessionManager.scene.useRightHandedSystem) {
            this._tmpVector.z *= -1;
            this._tmpQuaternion.z *= -1;
            this._tmpQuaternion.w *= -1;
        }
        return {
            position: this._tmpVector,
            rotationQuaternion: this._tmpQuaternion,
        };
    }
    /**
     * Create a new anchor point using a hit test result at a specific point in the scene
     * An anchor is tracked only after it is added to the trackerAnchors in xrFrame. The promise returned here does not yet guaranty that.
     * Use onAnchorAddedObservable to get newly added anchors if you require tracking guaranty.
     *
     * @param hitTestResult The hit test result to use for this anchor creation
     * @param position an optional position offset for this anchor
     * @param rotationQuaternion an optional rotation offset for this anchor
     * @returns A promise that fulfills when babylon has created the corresponding WebXRAnchor object and tracking has begun
     */
    async addAnchorPointUsingHitTestResultAsync(hitTestResult, position = new Vector3(), rotationQuaternion = new Quaternion()) {
        // convert to XR space (right handed) if needed
        this._populateTmpTransformation(position, rotationQuaternion);
        // the matrix that we'll use
        const m = new XRRigidTransform({ x: this._tmpVector.x, y: this._tmpVector.y, z: this._tmpVector.z }, { x: this._tmpQuaternion.x, y: this._tmpQuaternion.y, z: this._tmpQuaternion.z, w: this._tmpQuaternion.w });
        if (!hitTestResult.xrHitResult.createAnchor) {
            this.detach();
            throw new Error("Anchors not enabled in this environment/browser");
        }
        else {
            try {
                const nativeAnchor = await hitTestResult.xrHitResult.createAnchor(m);
                return new Promise((resolve, reject) => {
                    this._futureAnchors.push({
                        nativeAnchor,
                        resolved: false,
                        submitted: true,
                        xrTransformation: m,
                        resolve,
                        reject,
                    });
                });
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    /**
     * Add a new anchor at a specific position and rotation
     * This function will add a new anchor per default in the next available frame. Unless forced, the createAnchor function
     * will be called in the next xrFrame loop to make sure that the anchor can be created correctly.
     * An anchor is tracked only after it is added to the trackerAnchors in xrFrame. The promise returned here does not yet guaranty that.
     * Use onAnchorAddedObservable to get newly added anchors if you require tracking guaranty.
     *
     * @param position the position in which to add an anchor
     * @param rotationQuaternion an optional rotation for the anchor transformation
     * @param forceCreateInCurrentFrame force the creation of this anchor in the current frame. Must be called inside xrFrame loop!
     * @returns A promise that fulfills when babylon has created the corresponding WebXRAnchor object and tracking has begun
     */
    async addAnchorAtPositionAndRotationAsync(position, rotationQuaternion = new Quaternion(), forceCreateInCurrentFrame = false) {
        // convert to XR space (right handed) if needed
        this._populateTmpTransformation(position, rotationQuaternion);
        // the matrix that we'll use
        const xrTransformation = new XRRigidTransform({ x: this._tmpVector.x, y: this._tmpVector.y, z: this._tmpVector.z }, { x: this._tmpQuaternion.x, y: this._tmpQuaternion.y, z: this._tmpQuaternion.z, w: this._tmpQuaternion.w });
        const xrAnchor = forceCreateInCurrentFrame && this.attached && this._xrSessionManager.currentFrame
            ? await this._createAnchorAtTransformation(xrTransformation, this._xrSessionManager.currentFrame)
            : undefined;
        // add the transformation to the future anchors list
        return new Promise((resolve, reject) => {
            this._futureAnchors.push({
                nativeAnchor: xrAnchor,
                resolved: false,
                submitted: false,
                xrTransformation,
                resolve,
                reject,
            });
        });
    }
    /**
     * Get the list of anchors currently being tracked by the system
     */
    get anchors() {
        return this._trackedAnchors;
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
        if (!this._options.doNotRemoveAnchorsOnSessionEnded) {
            while (this._trackedAnchors.length) {
                const toRemove = this._trackedAnchors.pop();
                if (toRemove) {
                    // as the xr frame loop is removed, we need to notify manually
                    this.onAnchorRemovedObservable.notifyObservers(toRemove);
                    // no need to call the remove fn as the anchor is already removed from the session
                }
            }
        }
        return true;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        this._futureAnchors.length = 0;
        super.dispose();
        this.onAnchorAddedObservable.clear();
        this.onAnchorRemovedObservable.clear();
        this.onAnchorUpdatedObservable.clear();
    }
    _onXRFrame(frame) {
        if (!this.attached || !frame) {
            return;
        }
        const trackedAnchors = frame.trackedAnchors;
        if (trackedAnchors) {
            const toRemove = this._trackedAnchors
                .filter((anchor) => !trackedAnchors.has(anchor.xrAnchor))
                .map((anchor) => {
                const index = this._trackedAnchors.indexOf(anchor);
                return index;
            });
            let idxTracker = 0;
            toRemove.forEach((index) => {
                const anchor = this._trackedAnchors.splice(index - idxTracker, 1)[0];
                this.onAnchorRemovedObservable.notifyObservers(anchor);
                idxTracker++;
            });
            // now check for new ones
            trackedAnchors.forEach((xrAnchor) => {
                if (!this._lastFrameDetected.has(xrAnchor)) {
                    const newAnchor = {
                        id: anchorIdProvider++,
                        xrAnchor: xrAnchor,
                        remove: () => xrAnchor.delete(),
                    };
                    const anchor = this._updateAnchorWithXRFrame(xrAnchor, newAnchor, frame);
                    this._trackedAnchors.push(anchor);
                    this.onAnchorAddedObservable.notifyObservers(anchor);
                    // search for the future anchor promise that matches this
                    const results = this._futureAnchors.filter((futureAnchor) => futureAnchor.nativeAnchor === xrAnchor);
                    const result = results[0];
                    if (result) {
                        result.resolve(anchor);
                        result.resolved = true;
                    }
                }
                else {
                    const index = this._findIndexInAnchorArray(xrAnchor);
                    const anchor = this._trackedAnchors[index];
                    try {
                        // anchors update every frame
                        this._updateAnchorWithXRFrame(xrAnchor, anchor, frame);
                        if (anchor.attachedNode) {
                            anchor.attachedNode.rotationQuaternion = anchor.attachedNode.rotationQuaternion || new Quaternion();
                            anchor.transformationMatrix.decompose(anchor.attachedNode.scaling, anchor.attachedNode.rotationQuaternion, anchor.attachedNode.position);
                        }
                        this.onAnchorUpdatedObservable.notifyObservers(anchor);
                    }
                    catch (e) {
                        Tools.Warn(`Anchor could not be updated`);
                    }
                }
            });
            this._lastFrameDetected = trackedAnchors;
        }
        // process future anchors
        this._futureAnchors.forEach((futureAnchor) => {
            if (!futureAnchor.resolved && !futureAnchor.submitted) {
                this._createAnchorAtTransformation(futureAnchor.xrTransformation, frame).then((nativeAnchor) => {
                    futureAnchor.nativeAnchor = nativeAnchor;
                }, (error) => {
                    futureAnchor.resolved = true;
                    futureAnchor.reject(error);
                });
                futureAnchor.submitted = true;
            }
        });
    }
    /**
     * avoiding using Array.find for global support.
     * @param xrAnchor the plane to find in the array
     * @returns the index of the anchor in the array or -1 if not found
     */
    _findIndexInAnchorArray(xrAnchor) {
        for (let i = 0; i < this._trackedAnchors.length; ++i) {
            if (this._trackedAnchors[i].xrAnchor === xrAnchor) {
                return i;
            }
        }
        return -1;
    }
    _updateAnchorWithXRFrame(xrAnchor, anchor, xrFrame) {
        // matrix
        const pose = xrFrame.getPose(xrAnchor.anchorSpace, this._xrSessionManager.referenceSpace);
        if (pose) {
            const mat = anchor.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            anchor.transformationMatrix = mat;
            if (!this._options.worldParentNode) {
                // Logger.Warn("Please provide a world parent node to apply world transformation");
            }
            else {
                mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
            }
        }
        return anchor;
    }
    async _createAnchorAtTransformation(xrTransformation, xrFrame) {
        if (xrFrame.createAnchor) {
            try {
                return xrFrame.createAnchor(xrTransformation, this._referenceSpaceForFrameAnchors ?? this._xrSessionManager.referenceSpace);
            }
            catch (error) {
                throw new Error(error);
            }
        }
        else {
            this.detach();
            throw new Error("Anchors are not enabled in your browser");
        }
    }
}
/**
 * The module's name
 */
WebXRAnchorSystem.Name = WebXRFeatureName.ANCHOR_SYSTEM;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRAnchorSystem.Version = 1;
// register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRAnchorSystem.Name, (xrSessionManager, options) => {
    return () => new WebXRAnchorSystem(xrSessionManager, options);
}, WebXRAnchorSystem.Version);
//# sourceMappingURL=WebXRAnchorSystem.js.map