import { Observable } from "../Misc/observable.js";
import { WebXRInputSource } from "./webXRInputSource.js";
import { WebXRMotionControllerManager } from "./motionController/webXRMotionControllerManager.js";
/**
 * XR input used to track XR inputs such as controllers/rays
 */
export class WebXRInput {
    /**
     * Initializes the WebXRInput
     * @param xrSessionManager the xr session manager for this session
     * @param xrCamera the WebXR camera for this session. Mainly used for teleportation
     * @param _options = initialization options for this xr input
     */
    constructor(
    /**
     * the xr session manager for this session
     */
    xrSessionManager, 
    /**
     * the WebXR camera for this session. Mainly used for teleportation
     */
    xrCamera, _options = {}) {
        this.xrSessionManager = xrSessionManager;
        this.xrCamera = xrCamera;
        this._options = _options;
        /**
         * XR controllers being tracked
         */
        this.controllers = [];
        /**
         * Event when a controller has been connected/added
         */
        this.onControllerAddedObservable = new Observable();
        /**
         * Event when a controller has been removed/disconnected
         */
        this.onControllerRemovedObservable = new Observable();
        this._onInputSourcesChange = (event) => {
            this._addAndRemoveControllers(event.added, event.removed);
        };
        // Remove controllers when exiting XR
        this._sessionEndedObserver = this.xrSessionManager.onXRSessionEnded.add(() => {
            this._addAndRemoveControllers([], this.controllers.map((c) => {
                return c.inputSource;
            }));
        });
        this._sessionInitObserver = this.xrSessionManager.onXRSessionInit.add((session) => {
            session.addEventListener("inputsourceschange", this._onInputSourcesChange);
        });
        this._frameObserver = this.xrSessionManager.onXRFrameObservable.add((frame) => {
            // Update controller pose info
            this.controllers.forEach((controller) => {
                controller.updateFromXRFrame(frame, this.xrSessionManager.referenceSpace, this.xrCamera, this.xrSessionManager);
            });
        });
        if (this._options.customControllersRepositoryURL) {
            WebXRMotionControllerManager.BaseRepositoryUrl = this._options.customControllersRepositoryURL;
        }
        WebXRMotionControllerManager.UseOnlineRepository = !this._options.disableOnlineControllerRepository;
        if (WebXRMotionControllerManager.UseOnlineRepository) {
            // pre-load the profiles list to load the controllers quicker afterwards
            try {
                WebXRMotionControllerManager.UpdateProfilesList().catch(() => {
                    WebXRMotionControllerManager.UseOnlineRepository = false;
                });
            }
            catch (e) {
                WebXRMotionControllerManager.UseOnlineRepository = false;
            }
        }
    }
    _addAndRemoveControllers(addInputs, removeInputs) {
        // Add controllers if they don't already exist
        const sources = this.controllers.map((c) => {
            return c.inputSource;
        });
        for (const input of addInputs) {
            if (sources.indexOf(input) === -1) {
                const controller = new WebXRInputSource(this.xrSessionManager.scene, input, {
                    ...(this._options.controllerOptions || {}),
                    forceControllerProfile: this._options.forceInputProfile,
                    doNotLoadControllerMesh: this._options.doNotLoadControllerMeshes,
                    disableMotionControllerAnimation: this._options.disableControllerAnimation,
                });
                this.controllers.push(controller);
                this.onControllerAddedObservable.notifyObservers(controller);
            }
        }
        // Remove and dispose of controllers to be disposed
        const keepControllers = [];
        const removedControllers = [];
        this.controllers.forEach((c) => {
            if (removeInputs.indexOf(c.inputSource) === -1) {
                keepControllers.push(c);
            }
            else {
                removedControllers.push(c);
            }
        });
        this.controllers = keepControllers;
        removedControllers.forEach((c) => {
            this.onControllerRemovedObservable.notifyObservers(c);
            c.dispose();
        });
    }
    /**
     * Disposes of the object
     */
    dispose() {
        this.controllers.forEach((c) => {
            c.dispose();
        });
        this.xrSessionManager.onXRFrameObservable.remove(this._frameObserver);
        this.xrSessionManager.onXRSessionInit.remove(this._sessionInitObserver);
        this.xrSessionManager.onXRSessionEnded.remove(this._sessionEndedObserver);
        this.onControllerAddedObservable.clear();
        this.onControllerRemovedObservable.clear();
        // clear the controller cache
        WebXRMotionControllerManager.ClearControllerCache();
    }
}
//# sourceMappingURL=webXRInput.js.map