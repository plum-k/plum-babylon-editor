/**
 * States of the webXR experience
 */
export var WebXRState;
(function (WebXRState) {
    /**
     * Transitioning to being in XR mode
     */
    WebXRState[WebXRState["ENTERING_XR"] = 0] = "ENTERING_XR";
    /**
     * Transitioning to non XR mode
     */
    WebXRState[WebXRState["EXITING_XR"] = 1] = "EXITING_XR";
    /**
     * In XR mode and presenting
     */
    WebXRState[WebXRState["IN_XR"] = 2] = "IN_XR";
    /**
     * Not entered XR mode
     */
    WebXRState[WebXRState["NOT_IN_XR"] = 3] = "NOT_IN_XR";
})(WebXRState || (WebXRState = {}));
/**
 * The state of the XR camera's tracking
 */
export var WebXRTrackingState;
(function (WebXRTrackingState) {
    /**
     * No transformation received, device is not being tracked
     */
    WebXRTrackingState[WebXRTrackingState["NOT_TRACKING"] = 0] = "NOT_TRACKING";
    /**
     * Tracking lost - using emulated position
     */
    WebXRTrackingState[WebXRTrackingState["TRACKING_LOST"] = 1] = "TRACKING_LOST";
    /**
     * Transformation tracking works normally
     */
    WebXRTrackingState[WebXRTrackingState["TRACKING"] = 2] = "TRACKING";
})(WebXRTrackingState || (WebXRTrackingState = {}));
//# sourceMappingURL=webXRTypes.js.map