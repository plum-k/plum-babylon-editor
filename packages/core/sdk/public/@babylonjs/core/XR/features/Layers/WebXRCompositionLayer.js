import { Observable } from "../../../Misc/observable.js";
import { WebXRLayerWrapper } from "../../webXRLayerWrapper.js";
import { WebXRLayerRenderTargetTextureProvider } from "../../webXRRenderTargetTextureProvider.js";
/**
 * Wraps xr composition layers.
 * @internal
 */
export class WebXRCompositionLayerWrapper extends WebXRLayerWrapper {
    constructor(getWidth, getHeight, layer, layerType, isMultiview, createRTTProvider, _originalInternalTexture = null) {
        super(getWidth, getHeight, layer, layerType, createRTTProvider);
        this.getWidth = getWidth;
        this.getHeight = getHeight;
        this.layer = layer;
        this.layerType = layerType;
        this.isMultiview = isMultiview;
        this.createRTTProvider = createRTTProvider;
        this._originalInternalTexture = _originalInternalTexture;
    }
}
/**
 * Provides render target textures and other important rendering information for a given XRCompositionLayer.
 * @internal
 */
export class WebXRCompositionLayerRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    constructor(_xrSessionManager, _xrWebGLBinding, layerWrapper) {
        super(_xrSessionManager.scene, layerWrapper);
        this._xrSessionManager = _xrSessionManager;
        this._xrWebGLBinding = _xrWebGLBinding;
        this.layerWrapper = layerWrapper;
        this._lastSubImages = new Map();
        /**
         * Fires every time a new render target texture is created (either for eye, for view, or for the entire frame)
         */
        this.onRenderTargetTextureCreatedObservable = new Observable();
        this._compositionLayer = layerWrapper.layer;
    }
    _getRenderTargetForSubImage(subImage, eye = "none") {
        const lastSubImage = this._lastSubImages.get(eye);
        const eyeIndex = eye == "right" ? 1 : 0;
        const colorTextureWidth = subImage.colorTextureWidth ?? subImage.textureWidth;
        const colorTextureHeight = subImage.colorTextureHeight ?? subImage.textureHeight;
        if (!this._renderTargetTextures[eyeIndex] || lastSubImage?.textureWidth !== colorTextureWidth || lastSubImage?.textureHeight !== colorTextureHeight) {
            let depthStencilTexture;
            const depthStencilTextureWidth = subImage.depthStencilTextureWidth ?? colorTextureWidth;
            const depthStencilTextureHeight = subImage.depthStencilTextureHeight ?? colorTextureHeight;
            if (colorTextureWidth === depthStencilTextureWidth || colorTextureHeight === depthStencilTextureHeight) {
                depthStencilTexture = subImage.depthStencilTexture;
            }
            this._renderTargetTextures[eyeIndex] = this._createRenderTargetTexture(colorTextureWidth, colorTextureHeight, null, subImage.colorTexture, depthStencilTexture, this.layerWrapper.isMultiview);
            this._framebufferDimensions = {
                framebufferWidth: colorTextureWidth,
                framebufferHeight: colorTextureHeight,
            };
            this.onRenderTargetTextureCreatedObservable.notifyObservers({ texture: this._renderTargetTextures[eyeIndex], eye });
        }
        this._lastSubImages.set(eye, subImage);
        return this._renderTargetTextures[eyeIndex];
    }
    _getSubImageForEye(eye) {
        const currentFrame = this._xrSessionManager.currentFrame;
        if (currentFrame) {
            return this._xrWebGLBinding.getSubImage(this._compositionLayer, currentFrame, eye);
        }
        return null;
    }
    getRenderTargetTextureForEye(eye) {
        const subImage = this._getSubImageForEye(eye);
        if (subImage) {
            return this._getRenderTargetForSubImage(subImage, eye);
        }
        return null;
    }
    getRenderTargetTextureForView(view) {
        return this.getRenderTargetTextureForEye(view?.eye);
    }
    _setViewportForSubImage(viewport, subImage) {
        const textureWidth = subImage.colorTextureWidth ?? subImage.textureWidth;
        const textureHeight = subImage.colorTextureHeight ?? subImage.textureHeight;
        const xrViewport = subImage.viewport;
        viewport.x = xrViewport.x / textureWidth;
        viewport.y = xrViewport.y / textureHeight;
        viewport.width = xrViewport.width / textureWidth;
        viewport.height = xrViewport.height / textureHeight;
    }
    trySetViewportForView(viewport, view) {
        const subImage = this._lastSubImages.get(view.eye) || this._getSubImageForEye(view.eye);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=WebXRCompositionLayer.js.map