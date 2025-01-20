import { WebXRCompositionLayerRenderTargetTextureProvider, WebXRCompositionLayerWrapper } from "./WebXRCompositionLayer.js";
/**
 * Wraps xr projection layers.
 * @internal
 */
export class WebXRProjectionLayerWrapper extends WebXRCompositionLayerWrapper {
    constructor(layer, isMultiview, xrGLBinding) {
        super(() => layer.textureWidth, () => layer.textureHeight, layer, "XRProjectionLayer", isMultiview, (sessionManager) => new WebXRProjectionLayerRenderTargetTextureProvider(sessionManager, xrGLBinding, this));
        this.layer = layer;
    }
}
/**
 * Provides render target textures and other important rendering information for a given XRProjectionLayer.
 * @internal
 */
class WebXRProjectionLayerRenderTargetTextureProvider extends WebXRCompositionLayerRenderTargetTextureProvider {
    constructor(_xrSessionManager, _xrWebGLBinding, layerWrapper) {
        super(_xrSessionManager, _xrWebGLBinding, layerWrapper);
        this.layerWrapper = layerWrapper;
        this._projectionLayer = layerWrapper.layer;
    }
    _getSubImageForView(view) {
        return this._xrWebGLBinding.getViewSubImage(this._projectionLayer, view);
    }
    getRenderTargetTextureForView(view) {
        return this._getRenderTargetForSubImage(this._getSubImageForView(view), view.eye);
    }
    getRenderTargetTextureForEye(eye) {
        const lastSubImage = this._lastSubImages.get(eye);
        if (lastSubImage) {
            return this._getRenderTargetForSubImage(lastSubImage, eye);
        }
        return null;
    }
    trySetViewportForView(viewport, view) {
        const subImage = this._lastSubImages.get(view.eye) || this._getSubImageForView(view);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
}
export const defaultXRProjectionLayerInit = {
    textureType: "texture",
    colorFormat: 0x1908 /* WebGLRenderingContext.RGBA */,
    depthFormat: 0x88f0 /* WebGLRenderingContext.DEPTH24_STENCIL8 */,
    scaleFactor: 1.0,
    clearOnAccess: false,
};
//# sourceMappingURL=WebXRProjectionLayer.js.map