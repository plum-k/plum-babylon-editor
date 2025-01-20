import { WebXRLayerWrapper } from "./webXRLayerWrapper.js";
import { WebXRLayerRenderTargetTextureProvider } from "./webXRRenderTargetTextureProvider.js";
/**
 * Wraps xr webgl layers.
 * @internal
 */
export class WebXRWebGLLayerWrapper extends WebXRLayerWrapper {
    /**
     * @param layer is the layer to be wrapped.
     * @returns a new WebXRLayerWrapper wrapping the provided XRWebGLLayer.
     */
    constructor(layer) {
        super(() => layer.framebufferWidth, () => layer.framebufferHeight, layer, "XRWebGLLayer", (sessionManager) => new WebXRWebGLLayerRenderTargetTextureProvider(sessionManager.scene, this));
        this.layer = layer;
    }
}
/**
 * Provides render target textures and other important rendering information for a given XRWebGLLayer.
 * @internal
 */
export class WebXRWebGLLayerRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    constructor(scene, layerWrapper) {
        super(scene, layerWrapper);
        this.layerWrapper = layerWrapper;
        this._layer = layerWrapper.layer;
        this._framebufferDimensions = {
            framebufferWidth: this._layer.framebufferWidth,
            framebufferHeight: this._layer.framebufferHeight,
        };
    }
    trySetViewportForView(viewport, view) {
        const xrViewport = this._layer.getViewport(view);
        if (!xrViewport) {
            return false;
        }
        const framebufferWidth = this._framebufferDimensions.framebufferWidth;
        const framebufferHeight = this._framebufferDimensions.framebufferHeight;
        viewport.x = xrViewport.x / framebufferWidth;
        viewport.y = xrViewport.y / framebufferHeight;
        viewport.width = xrViewport.width / framebufferWidth;
        viewport.height = xrViewport.height / framebufferHeight;
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRenderTargetTextureForEye(eye) {
        const layerWidth = this._layer.framebufferWidth;
        const layerHeight = this._layer.framebufferHeight;
        const framebuffer = this._layer.framebuffer;
        if (!this._rtt ||
            layerWidth !== this._framebufferDimensions.framebufferWidth ||
            layerHeight !== this._framebufferDimensions.framebufferHeight ||
            framebuffer !== this._framebuffer) {
            this._rtt = this._createRenderTargetTexture(layerWidth, layerHeight, framebuffer);
            this._framebufferDimensions.framebufferWidth = layerWidth;
            this._framebufferDimensions.framebufferHeight = layerHeight;
            this._framebuffer = framebuffer;
        }
        return this._rtt;
    }
    getRenderTargetTextureForView(view) {
        return this.getRenderTargetTextureForEye(view.eye);
    }
}
//# sourceMappingURL=webXRWebGLLayer.js.map