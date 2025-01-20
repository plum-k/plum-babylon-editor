import { Tools } from "../../Misc/tools.js";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
/**
 * DOM Overlay Feature
 *
 * @since 5.0.0
 */
export class WebXRDomOverlay extends WebXRAbstractFeature {
    /**
     * Creates a new instance of the dom-overlay feature
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options options to use when constructing this feature
     */
    constructor(_xrSessionManager, 
    /**
     * options to use when constructing this feature
     */
    options) {
        super(_xrSessionManager);
        this.options = options;
        /**
         * Type of overlay - non-null when available
         */
        this._domOverlayType = null;
        /**
         * Event Listener to supress "beforexrselect" events.
         */
        this._beforeXRSelectListener = null;
        /**
         * Element used for overlay
         */
        this._element = null;
        this.xrNativeFeatureName = "dom-overlay";
        // https://immersive-web.github.io/dom-overlays/
        Tools.Warn("dom-overlay is an experimental and unstable feature.");
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
        // Feature not available
        if (!this._xrSessionManager.session.domOverlayState || this._xrSessionManager.session.domOverlayState.type === null) {
            return false;
        }
        this._domOverlayType = this._xrSessionManager.session.domOverlayState.type;
        if (this._element !== null && this.options.supressXRSelectEvents === true) {
            this._beforeXRSelectListener = (ev) => {
                ev.preventDefault();
            };
            this._element.addEventListener("beforexrselect", this._beforeXRSelectListener);
        }
        return true;
    }
    /**
     * The type of DOM overlay (null when not supported).  Provided by UA and remains unchanged for duration of session.
     */
    get domOverlayType() {
        return this._domOverlayType;
    }
    /**
     * Dispose this feature and all of the resources attached
     */
    dispose() {
        super.dispose();
        if (this._element !== null && this._beforeXRSelectListener) {
            this._element.removeEventListener("beforexrselect", this._beforeXRSelectListener);
        }
    }
    _onXRFrame(_xrFrame) {
        /* empty */
    }
    /**
     * Extends the session init object if needed
     * @returns augmentation object for the xr session init object.
     */
    async getXRSessionInitExtension() {
        if (this.options.element === undefined) {
            Tools.Warn('"element" option must be provided to attach xr-dom-overlay feature.');
            return {};
        }
        else if (typeof this.options.element === "string") {
            const selectedElement = document.querySelector(this.options.element);
            if (selectedElement === null) {
                Tools.Warn(`element not found '${this.options.element}' (not requesting xr-dom-overlay)`);
                return {};
            }
            this._element = selectedElement;
        }
        else {
            this._element = this.options.element;
        }
        return {
            domOverlay: {
                root: this._element,
            },
        };
    }
}
/**
 * The module's name
 */
WebXRDomOverlay.Name = WebXRFeatureName.DOM_OVERLAY;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRDomOverlay.Version = 1;
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRDomOverlay.Name, (xrSessionManager, options) => {
    return () => new WebXRDomOverlay(xrSessionManager, options);
}, WebXRDomOverlay.Version, false);
//# sourceMappingURL=WebXRDOMOverlay.js.map