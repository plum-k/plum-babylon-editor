import { Observable } from "../../Misc/observable.js";
import { Logger } from "../../Misc/logger.js";
/**
 * This is the base class for all WebXR features.
 * Since most features require almost the same resources and callbacks, this class can be used to simplify the development
 * Note that since the features manager is using the `IWebXRFeature` you are in no way obligated to use this class
 */
export class WebXRAbstractFeature {
    /**
     * The name of the native xr feature name (like anchor, hit-test, or hand-tracking)
     */
    get xrNativeFeatureName() {
        return this._xrNativeFeatureName;
    }
    set xrNativeFeatureName(name) {
        // check if feature was initialized while in session but needs to be initialized before the session starts
        if (!this._xrSessionManager.isNative && name && this._xrSessionManager.inXRSession && this._xrSessionManager.enabledFeatures?.indexOf(name) === -1) {
            Logger.Warn(`The feature ${name} needs to be enabled before starting the XR session. Note - It is still possible it is not supported.`);
        }
        this._xrNativeFeatureName = name;
    }
    /**
     * Construct a new (abstract) WebXR feature
     * @param _xrSessionManager the xr session manager for this feature
     */
    constructor(_xrSessionManager) {
        this._xrSessionManager = _xrSessionManager;
        this._attached = false;
        this._removeOnDetach = [];
        /**
         * Is this feature disposed?
         */
        this.isDisposed = false;
        /**
         * Should auto-attach be disabled?
         */
        this.disableAutoAttach = false;
        this._xrNativeFeatureName = "";
        /**
         * Observers registered here will be executed when the feature is attached
         */
        this.onFeatureAttachObservable = new Observable();
        /**
         * Observers registered here will be executed when the feature is detached
         */
        this.onFeatureDetachObservable = new Observable();
    }
    /**
     * Is this feature attached
     */
    get attached() {
        return this._attached;
    }
    /**
     * attach this feature
     *
     * @param force should attachment be forced (even when already attached)
     * @returns true if successful, false is failed or already attached
     */
    attach(force) {
        // do not attach a disposed feature
        if (this.isDisposed) {
            return false;
        }
        if (!force) {
            if (this.attached) {
                return false;
            }
        }
        else {
            if (this.attached) {
                // detach first, to be sure
                this.detach();
            }
        }
        // if this is a native WebXR feature, check if it is enabled on the session
        // For now only check if not using babylon native
        // vision OS doesn't support the enabledFeatures array, so just warn instead of failing
        if (!this._xrSessionManager.enabledFeatures) {
            Logger.Warn("session.enabledFeatures is not available on this device. It is possible that this feature is not supported.");
        }
        else if (!this._xrSessionManager.isNative && this.xrNativeFeatureName && this._xrSessionManager.enabledFeatures.indexOf(this.xrNativeFeatureName) === -1) {
            return false;
        }
        this._attached = true;
        this._addNewAttachObserver(this._xrSessionManager.onXRFrameObservable, (frame) => this._onXRFrame(frame));
        this.onFeatureAttachObservable.notifyObservers(this);
        return true;
    }
    /**
     * detach this feature.
     *
     * @returns true if successful, false if failed or already detached
     */
    detach() {
        if (!this._attached) {
            this.disableAutoAttach = true;
            return false;
        }
        this._attached = false;
        this._removeOnDetach.forEach((toRemove) => {
            toRemove.observable.remove(toRemove.observer);
        });
        this.onFeatureDetachObservable.notifyObservers(this);
        return true;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        this.detach();
        this.isDisposed = true;
        this.onFeatureAttachObservable.clear();
        this.onFeatureDetachObservable.clear();
    }
    /**
     * This function will be executed during before enabling the feature and can be used to not-allow enabling it.
     * Note that at this point the session has NOT started, so this is purely checking if the browser supports it
     *
     * @returns whether or not the feature is compatible in this environment
     */
    isCompatible() {
        return true;
    }
    /**
     * This is used to register callbacks that will automatically be removed when detach is called.
     * @param observable the observable to which the observer will be attached
     * @param callback the callback to register
     * @param insertFirst should the callback be executed as soon as it is registered
     */
    _addNewAttachObserver(observable, callback, insertFirst) {
        this._removeOnDetach.push({
            observable,
            observer: observable.add(callback, undefined, insertFirst),
        });
    }
}
//# sourceMappingURL=WebXRAbstractFeature.js.map