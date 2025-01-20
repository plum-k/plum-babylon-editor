import { WebXRLayerWrapper } from "../webXRLayerWrapper.js";
import { WebXRLayerRenderTargetTextureProvider } from "../webXRRenderTargetTextureProvider.js";
/**
 * Wraps XRWebGLLayer's created by Babylon Native.
 * @internal
 */
export class NativeXRLayerWrapper extends WebXRLayerWrapper {
    constructor(layer) {
        super(() => layer.framebufferWidth, () => layer.framebufferHeight, layer, "XRWebGLLayer", (sessionManager) => new NativeXRLayerRenderTargetTextureProvider(sessionManager, this));
        this.layer = layer;
    }
}
/**
 * Provides render target textures for layers created by Babylon Native.
 * @internal
 */
export class NativeXRLayerRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    constructor(sessionManager, layerWrapper) {
        super(sessionManager.scene, layerWrapper);
        this.layerWrapper = layerWrapper;
        this._nativeRTTProvider = navigator.xr.getNativeRenderTargetProvider(sessionManager.session, this._createRenderTargetTexture.bind(this), this._destroyRenderTargetTexture.bind(this));
        this._nativeLayer = layerWrapper.layer;
    }
    trySetViewportForView(viewport) {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = 1;
        viewport.height = 1;
        return true;
    }
    getRenderTargetTextureForEye(eye) {
        // TODO (rgerd): Update the contract on the BabylonNative side to call this "getRenderTargetTextureForEye"
        return this._nativeRTTProvider.getRenderTargetForEye(eye);
    }
    getRenderTargetTextureForView(view) {
        return this._nativeRTTProvider.getRenderTargetForEye(view.eye);
    }
    getFramebufferDimensions() {
        return {
            framebufferWidth: this._nativeLayer.framebufferWidth,
            framebufferHeight: this._nativeLayer.framebufferHeight,
        };
    }
}
/**
 * Creates the xr layer that will be used as the xr session's base layer.
 * @internal
 */
export class NativeXRRenderTarget {
    constructor(_xrSessionManager) {
        this._nativeRenderTarget = navigator.xr.getWebXRRenderTarget(_xrSessionManager.scene.getEngine());
    }
    async initializeXRLayerAsync(xrSession) {
        await this._nativeRenderTarget.initializeXRLayerAsync(xrSession);
        this.xrLayer = this._nativeRenderTarget.xrLayer;
        return this.xrLayer;
    }
    dispose() {
        /* empty */
    }
}
//# sourceMappingURL=nativeXRRenderTarget.js.map