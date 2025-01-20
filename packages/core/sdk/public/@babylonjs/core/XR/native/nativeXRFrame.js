import { RegisterNativeTypeAsync } from "../../Engines/nativeEngine.js";
/** @internal */
export class NativeXRFrame {
    get session() {
        return this._nativeImpl.session;
    }
    constructor(_nativeImpl) {
        this._nativeImpl = _nativeImpl;
        this._xrTransform = new XRRigidTransform();
        this._xrPose = {
            transform: this._xrTransform,
            emulatedPosition: false,
        };
        // Enough space for position, orientation
        this._xrPoseVectorData = new Float32Array(4 + 4);
        this.fillPoses = this._nativeImpl.fillPoses.bind(this._nativeImpl);
        this.getViewerPose = this._nativeImpl.getViewerPose.bind(this._nativeImpl);
        this.getHitTestResults = this._nativeImpl.getHitTestResults.bind(this._nativeImpl);
        this.getHitTestResultsForTransientInput = () => {
            throw new Error("XRFrame.getHitTestResultsForTransientInput not supported on native.");
        };
        this.createAnchor = this._nativeImpl.createAnchor.bind(this._nativeImpl);
        this.getJointPose = this._nativeImpl.getJointPose.bind(this._nativeImpl);
        this.fillJointRadii = this._nativeImpl.fillJointRadii.bind(this._nativeImpl);
        this.getLightEstimate = () => {
            throw new Error("XRFrame.getLightEstimate not supported on native.");
        };
        this.getImageTrackingResults = () => {
            return this._nativeImpl._imageTrackingResults ?? [];
        };
    }
    getPose(space, baseSpace) {
        if (!this._nativeImpl.getPoseData(space, baseSpace, this._xrPoseVectorData.buffer, this._xrTransform.matrix.buffer)) {
            return undefined;
        }
        const position = this._xrTransform.position;
        position.x = this._xrPoseVectorData[0];
        position.y = this._xrPoseVectorData[1];
        position.z = this._xrPoseVectorData[2];
        position.w = this._xrPoseVectorData[3];
        const orientation = this._xrTransform.orientation;
        orientation.x = this._xrPoseVectorData[4];
        orientation.y = this._xrPoseVectorData[5];
        orientation.z = this._xrPoseVectorData[6];
        orientation.w = this._xrPoseVectorData[7];
        return this._xrPose;
    }
    get trackedAnchors() {
        return this._nativeImpl.trackedAnchors;
    }
    get worldInformation() {
        return this._nativeImpl.worldInformation;
    }
    get detectedPlanes() {
        return this._nativeImpl.detectedPlanes;
    }
    get featurePointCloud() {
        return this._nativeImpl.featurePointCloud;
    }
    getDepthInformation(view) {
        throw new Error("This function is not available in Babylon Native");
        // return this._nativeImpl.getDepthInformation(view);
    }
}
RegisterNativeTypeAsync("NativeXRFrame", NativeXRFrame);
//# sourceMappingURL=nativeXRFrame.js.map