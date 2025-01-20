import { Observable } from "../Misc/observable.js";
import { WebXRSessionManager } from "./webXRSessionManager.js";
import { WebXRCamera } from "./webXRCamera.js";
import { WebXRFeatureName, WebXRFeaturesManager } from "./webXRFeaturesManager.js";
import { Logger } from "../Misc/logger.js";
import { UniversalCamera } from "../Cameras/universalCamera.js";
import { Quaternion, Vector3 } from "../Maths/math.vector.js";
import { AbstractEngine } from "../Engines/abstractEngine.js";
/**
 * Base set of functionality needed to create an XR experience (WebXRSessionManager, Camera, StateManagement, etc.)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRExperienceHelpers
 */
export class WebXRExperienceHelper {
    /**
     * Creates a WebXRExperienceHelper
     * @param _scene The scene the helper should be created in
     */
    constructor(_scene) {
        this._scene = _scene;
        this._nonVRCamera = null;
        this._attachedToElement = false;
        this._spectatorCamera = null;
        this._originalSceneAutoClear = true;
        this._supported = false;
        this._spectatorMode = false;
        this._lastTimestamp = 0;
        /**
         * Observers registered here will be triggered after the camera's initial transformation is set
         * This can be used to set a different ground level or an extra rotation.
         *
         * Note that ground level is considered to be at 0. The height defined by the XR camera will be added
         * to the position set after this observable is done executing.
         */
        this.onInitialXRPoseSetObservable = new Observable();
        /**
         * Fires when the state of the experience helper has changed
         */
        this.onStateChangedObservable = new Observable();
        /**
         * The current state of the XR experience (eg. transitioning, in XR or not in XR)
         */
        this.state = 3 /* WebXRState.NOT_IN_XR */;
        this.sessionManager = new WebXRSessionManager(_scene);
        this.camera = new WebXRCamera("webxr", _scene, this.sessionManager);
        this.featuresManager = new WebXRFeaturesManager(this.sessionManager);
        _scene.onDisposeObservable.addOnce(() => {
            this.dispose();
        });
    }
    /**
     * Creates the experience helper
     * @param scene the scene to attach the experience helper to
     * @returns a promise for the experience helper
     */
    static CreateAsync(scene) {
        const helper = new WebXRExperienceHelper(scene);
        return helper.sessionManager
            .initializeAsync()
            .then(() => {
            helper._supported = true;
            return helper;
        })
            .catch((e) => {
            helper._setState(3 /* WebXRState.NOT_IN_XR */);
            helper.dispose();
            throw e;
        });
    }
    /**
     * Disposes of the experience helper
     */
    dispose() {
        this.exitXRAsync();
        this.camera.dispose();
        this.onStateChangedObservable.clear();
        this.onInitialXRPoseSetObservable.clear();
        this.sessionManager.dispose();
        this._spectatorCamera?.dispose();
        if (this._nonVRCamera) {
            this._scene.activeCamera = this._nonVRCamera;
        }
    }
    /**
     * Enters XR mode (This must be done within a user interaction in most browsers eg. button click)
     * @param sessionMode options for the XR session
     * @param referenceSpaceType frame of reference of the XR session
     * @param renderTarget the output canvas that will be used to enter XR mode
     * @param sessionCreationOptions optional XRSessionInit object to init the session with
     * @returns promise that resolves after xr mode has entered
     */
    async enterXRAsync(sessionMode, referenceSpaceType, renderTarget = this.sessionManager.getWebXRRenderTarget(), sessionCreationOptions = {}) {
        if (!this._supported) {
            // eslint-disable-next-line no-throw-literal
            throw "WebXR not supported in this browser or environment";
        }
        this._setState(0 /* WebXRState.ENTERING_XR */);
        if (referenceSpaceType !== "viewer" && referenceSpaceType !== "local") {
            sessionCreationOptions.optionalFeatures = sessionCreationOptions.optionalFeatures || [];
            sessionCreationOptions.optionalFeatures.push(referenceSpaceType);
        }
        sessionCreationOptions = await this.featuresManager._extendXRSessionInitObject(sessionCreationOptions);
        // we currently recommend "unbounded" space in AR (#7959)
        if (sessionMode === "immersive-ar" && referenceSpaceType !== "unbounded") {
            Logger.Warn("We recommend using 'unbounded' reference space type when using 'immersive-ar' session mode");
        }
        // make sure that the session mode is supported
        try {
            await this.sessionManager.initializeSessionAsync(sessionMode, sessionCreationOptions);
            await this.sessionManager.setReferenceSpaceTypeAsync(referenceSpaceType);
            const xrRenderState = {
                // if maxZ is 0 it should be "Infinity", but it doesn't work with the WebXR API. Setting to a large number.
                depthFar: this.camera.maxZ || 10000,
                depthNear: this.camera.minZ,
            };
            // The layers feature will have already initialized the xr session's layers on session init.
            if (!this.featuresManager.getEnabledFeature(WebXRFeatureName.LAYERS)) {
                const baseLayer = await renderTarget.initializeXRLayerAsync(this.sessionManager.session);
                xrRenderState.baseLayer = baseLayer;
            }
            this.sessionManager.updateRenderState(xrRenderState);
            // run the render loop
            this.sessionManager.runXRRenderLoop();
            // Cache pre xr scene settings
            this._originalSceneAutoClear = this._scene.autoClear;
            this._nonVRCamera = this._scene.activeCamera;
            this._attachedToElement = !!this._nonVRCamera?.inputs?.attachedToElement;
            this._nonVRCamera?.detachControl();
            this._scene.activeCamera = this.camera;
            // do not compensate when AR session is used
            if (sessionMode !== "immersive-ar") {
                this._nonXRToXRCamera();
            }
            else {
                // Kept here, TODO - check if needed
                this._scene.autoClear = false;
                this.camera.compensateOnFirstFrame = false;
                // reset the camera's position to the origin
                this.camera.position.set(0, 0, 0);
                this.camera.rotationQuaternion.set(0, 0, 0, 1);
                this.onInitialXRPoseSetObservable.notifyObservers(this.camera);
            }
            // Vision Pro suspends the audio context when entering XR, so we resume it here if needed.
            AbstractEngine.audioEngine?._resumeAudioContextOnStateChange();
            this.sessionManager.onXRSessionEnded.addOnce(() => {
                // when using the back button and not the exit button (default on mobile), the session is ending but the EXITING state was not set
                if (this.state !== 1 /* WebXRState.EXITING_XR */) {
                    this._setState(1 /* WebXRState.EXITING_XR */);
                }
                // Reset camera rigs output render target to ensure sessions render target is not drawn after it ends
                this.camera.rigCameras.forEach((c) => {
                    c.outputRenderTarget = null;
                });
                // Restore scene settings
                this._scene.autoClear = this._originalSceneAutoClear;
                this._scene.activeCamera = this._nonVRCamera;
                if (this._attachedToElement && this._nonVRCamera) {
                    this._nonVRCamera.attachControl(!!this._nonVRCamera.inputs.noPreventDefault);
                }
                if (sessionMode !== "immersive-ar" && this.camera.compensateOnFirstFrame) {
                    if (this._nonVRCamera.setPosition) {
                        this._nonVRCamera.setPosition(this.camera.position);
                    }
                    else {
                        this._nonVRCamera.position.copyFrom(this.camera.position);
                    }
                }
                this._setState(3 /* WebXRState.NOT_IN_XR */);
            });
            // Wait until the first frame arrives before setting state to in xr
            this.sessionManager.onXRFrameObservable.addOnce(() => {
                this._setState(2 /* WebXRState.IN_XR */);
            });
            return this.sessionManager;
        }
        catch (e) {
            Logger.Log(e);
            Logger.Log(e.message);
            this._setState(3 /* WebXRState.NOT_IN_XR */);
            throw e;
        }
    }
    /**
     * Exits XR mode and returns the scene to its original state
     * @returns promise that resolves after xr mode has exited
     */
    exitXRAsync() {
        // only exit if state is IN_XR
        if (this.state !== 2 /* WebXRState.IN_XR */) {
            return Promise.resolve();
        }
        this._setState(1 /* WebXRState.EXITING_XR */);
        return this.sessionManager.exitXRAsync();
    }
    /**
     * Enable spectator mode for desktop VR experiences.
     * When spectator mode is enabled a camera will be attached to the desktop canvas and will
     * display the first rig camera's view on the desktop canvas.
     * Please note that this will degrade performance, as it requires another camera render.
     * It is also not recommended to enable this in devices like the quest, as it brings no benefit there.
     * @param options giving WebXRSpectatorModeOption for specutator camera to setup when the spectator mode is enabled.
     */
    enableSpectatorMode(options) {
        if (!this._spectatorMode) {
            this._spectatorMode = true;
            this._switchSpectatorMode(options);
        }
    }
    /**
     * Disable spectator mode for desktop VR experiences.
     */
    disableSpecatatorMode() {
        if (this._spectatorMode) {
            this._spectatorMode = false;
            this._switchSpectatorMode();
        }
    }
    _switchSpectatorMode(options) {
        const fps = options?.fps ? options.fps : 1000.0;
        const refreshRate = (1.0 / fps) * 1000.0;
        const cameraIndex = options?.preferredCameraIndex ? options?.preferredCameraIndex : 0;
        const updateSpectatorCamera = () => {
            if (this._spectatorCamera) {
                const delta = this.sessionManager.currentTimestamp - this._lastTimestamp;
                if (delta >= refreshRate) {
                    this._lastTimestamp = this.sessionManager.currentTimestamp;
                    this._spectatorCamera.position.copyFrom(this.camera.rigCameras[cameraIndex].globalPosition);
                    this._spectatorCamera.rotationQuaternion.copyFrom(this.camera.rigCameras[cameraIndex].absoluteRotation);
                }
            }
        };
        if (this._spectatorMode) {
            if (cameraIndex >= this.camera.rigCameras.length) {
                throw new Error("the preferred camera index is beyond the length of rig camera array.");
            }
            const onStateChanged = () => {
                if (this.state === 2 /* WebXRState.IN_XR */) {
                    this._spectatorCamera = new UniversalCamera("webxr-spectator", Vector3.Zero(), this._scene);
                    this._spectatorCamera.rotationQuaternion = new Quaternion();
                    this._scene.activeCameras = [this.camera, this._spectatorCamera];
                    this.sessionManager.onXRFrameObservable.add(updateSpectatorCamera);
                    this._scene.onAfterRenderCameraObservable.add((camera) => {
                        if (camera === this.camera) {
                            // reset the dimensions object for correct resizing
                            this._scene.getEngine().framebufferDimensionsObject = null;
                        }
                    });
                }
                else if (this.state === 1 /* WebXRState.EXITING_XR */) {
                    this.sessionManager.onXRFrameObservable.removeCallback(updateSpectatorCamera);
                    this._scene.activeCameras = null;
                }
            };
            this.onStateChangedObservable.add(onStateChanged);
            onStateChanged();
        }
        else {
            this.sessionManager.onXRFrameObservable.removeCallback(updateSpectatorCamera);
            this._scene.activeCameras = [this.camera];
        }
    }
    _nonXRToXRCamera() {
        this.camera.setTransformationFromNonVRCamera(this._nonVRCamera);
        this.onInitialXRPoseSetObservable.notifyObservers(this.camera);
    }
    _setState(val) {
        if (this.state === val) {
            return;
        }
        this.state = val;
        this.onStateChangedObservable.notifyObservers(this.state);
    }
}
//# sourceMappingURL=webXRExperienceHelper.js.map