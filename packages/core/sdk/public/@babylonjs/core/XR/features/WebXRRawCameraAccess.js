import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Observable } from "../../Misc/observable.js";

import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture.js";
import { InternalTexture } from "../../Materials/Textures/internalTexture.js";
import { BaseTexture } from "../../Materials/Textures/baseTexture.js";
/**
 * WebXR Feature for WebXR raw camera access
 * @since 6.31.0
 * @see https://immersive-web.github.io/raw-camera-access/
 */
export class WebXRRawCameraAccess extends WebXRAbstractFeature {
    /**
     * Creates a new instance of the feature
     * @param _xrSessionManager the WebXRSessionManager
     * @param options options for the Feature
     */
    constructor(_xrSessionManager, options = {}) {
        super(_xrSessionManager);
        this.options = options;
        this._cachedInternalTextures = [];
        /**
         * This is an array of camera views
         * Note that mostly the array will contain a single view
         * If you want to know the order of the views, use the `viewIndex` array
         */
        this.texturesData = [];
        /**
         * If needed, this array will contain the eye definition of each texture in `texturesArray`
         */
        this.viewIndex = [];
        /**
         * If needed, this array will contain the camera's intrinsics
         * You can use this data to convert from camera space to screen space and vice versa
         */
        this.cameraIntrinsics = [];
        /**
         * An observable that will notify when the camera's textures are updated
         */
        this.onTexturesUpdatedObservable = new Observable();
        this.xrNativeFeatureName = "camera-access";
    }
    attach(force) {
        if (!super.attach(force)) {
            return false;
        }
        this._glContext = this._xrSessionManager.scene.getEngine()._gl;
        this._glBinding = new XRWebGLBinding(this._xrSessionManager.session, this._glContext);
        return true;
    }
    detach() {
        if (!super.detach()) {
            return false;
        }
        this._glBinding = undefined;
        if (!this.options.doNotDisposeOnDetach) {
            this._cachedInternalTextures.forEach((t) => t.dispose());
            this.texturesData.forEach((t) => t.dispose());
            this._cachedInternalTextures.length = 0;
            this.texturesData.length = 0;
            this.cameraIntrinsics.length = 0;
        }
        return true;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        super.dispose();
        this.onTexturesUpdatedObservable.clear();
    }
    /**
     * @see https://github.com/immersive-web/raw-camera-access/blob/main/explainer.md
     * @param view the XRView to update
     * @param index the index of the view in the views array
     */
    _updateCameraIntrinsics(view, index) {
        const cameraViewport = {
            width: view.camera.width,
            height: view.camera.height,
            x: 0,
            y: 0,
        };
        const p = view.projectionMatrix;
        // Principal point in pixels (typically at or near the center of the viewport)
        const u0 = ((1 - p[8]) * cameraViewport.width) / 2 + cameraViewport.x;
        const v0 = ((1 - p[9]) * cameraViewport.height) / 2 + cameraViewport.y;
        // Focal lengths in pixels (these are equal for square pixels)
        const ax = (cameraViewport.width / 2) * p[0];
        const ay = (cameraViewport.height / 2) * p[5];
        // Skew factor in pixels (nonzero for rhomboid pixels)
        const gamma = (cameraViewport.width / 2) * p[4];
        this.cameraIntrinsics[index] = {
            u0,
            v0,
            ax,
            ay,
            gamma,
            width: cameraViewport.width,
            height: cameraViewport.height,
            viewportX: cameraViewport.x,
            viewportY: cameraViewport.y,
        };
    }
    _updateInternalTextures(view, index = 0) {
        if (!view.camera) {
            return false;
        }
        this.viewIndex[index] = view.eye;
        const lp = this._glBinding?.getCameraImage(view.camera);
        if (!this._cachedInternalTextures[index]) {
            const internalTexture = new InternalTexture(this._xrSessionManager.scene.getEngine(), 0 /* InternalTextureSource.Unknown */, true);
            internalTexture.invertY = false;
            internalTexture.format = 5;
            internalTexture.generateMipMaps = true;
            internalTexture.type = 0;
            internalTexture.samplingMode = 3;
            internalTexture.width = view.camera.width;
            internalTexture.height = view.camera.height;
            internalTexture._cachedWrapU = 1;
            internalTexture._cachedWrapV = 1;
            internalTexture._hardwareTexture = new WebGLHardwareTexture(lp, this._glContext);
            this._cachedInternalTextures[index] = internalTexture;
            // create the base texture
            const texture = new BaseTexture(this._xrSessionManager.scene);
            texture.name = `WebXR Raw Camera Access (${index})`;
            texture._texture = this._cachedInternalTextures[index];
            this.texturesData[index] = texture;
            // get the camera intrinsics
            this._updateCameraIntrinsics(view, index);
        }
        else {
            // make sure the webgl texture is updated. Should happen automatically
            this._cachedInternalTextures[index]._hardwareTexture?.set(lp);
        }
        this._cachedInternalTextures[index].isReady = true;
        return true;
    }
    _onXRFrame(_xrFrame) {
        const referenceSPace = this._xrSessionManager.referenceSpace;
        const pose = _xrFrame.getViewerPose(referenceSPace);
        if (!pose || !pose.views) {
            return;
        }
        let updated = true;
        pose.views.forEach((view, index) => {
            updated = updated && this._updateInternalTextures(view, index);
        });
        if (updated) {
            this.onTexturesUpdatedObservable.notifyObservers(this.texturesData);
        }
    }
}
/**
 * The module's name
 */
WebXRRawCameraAccess.Name = WebXRFeatureName.RAW_CAMERA_ACCESS;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRRawCameraAccess.Version = 1;
WebXRFeaturesManager.AddWebXRFeature(WebXRRawCameraAccess.Name, (xrSessionManager, options) => {
    return () => new WebXRRawCameraAccess(xrSessionManager, options);
}, WebXRRawCameraAccess.Version, false);
//# sourceMappingURL=WebXRRawCameraAccess.js.map