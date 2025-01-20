/**
 * Wrapper over subclasses of XRLayer.
 * @internal
 */
export class WebXRLayerWrapper {
    /**
     * Check if fixed foveation is supported on this device
     */
    get isFixedFoveationSupported() {
        return this.layerType == "XRWebGLLayer" && typeof this.layer.fixedFoveation == "number";
    }
    /**
     * Get the fixed foveation currently set, as specified by the webxr specs
     * If this returns null, then fixed foveation is not supported
     */
    get fixedFoveation() {
        if (this.isFixedFoveationSupported) {
            return this.layer.fixedFoveation;
        }
        return null;
    }
    /**
     * Set the fixed foveation to the specified value, as specified by the webxr specs
     * This value will be normalized to be between 0 and 1, 1 being max foveation, 0 being no foveation
     */
    set fixedFoveation(value) {
        if (this.isFixedFoveationSupported) {
            const val = Math.max(0, Math.min(1, value || 0));
            this.layer.fixedFoveation = val;
        }
    }
    /**
     * Create a render target provider for the wrapped layer.
     * @param xrSessionManager The XR Session Manager
     * @returns A new render target texture provider for the wrapped layer.
     */
    createRenderTargetTextureProvider(xrSessionManager) {
        this._rttWrapper = this._createRenderTargetTextureProvider(xrSessionManager);
        return this._rttWrapper;
    }
    dispose() {
        if (this._rttWrapper) {
            this._rttWrapper.dispose();
            this._rttWrapper = null;
        }
    }
    constructor(
    /** The width of the layer's framebuffer. */
    getWidth, 
    /** The height of the layer's framebuffer. */
    getHeight, 
    /** The XR layer that this WebXRLayerWrapper wraps. */
    layer, 
    /** The type of XR layer that is being wrapped. */
    layerType, 
    /** Create a render target provider for the wrapped layer. */
    _createRenderTargetTextureProvider) {
        this.getWidth = getWidth;
        this.getHeight = getHeight;
        this.layer = layer;
        this.layerType = layerType;
        this._createRenderTargetTextureProvider = _createRenderTargetTextureProvider;
        this._rttWrapper = null;
    }
}
//# sourceMappingURL=webXRLayerWrapper.js.map