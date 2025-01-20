import { WebGLHardwareTexture } from "../Engines/WebGL/webGLHardwareTexture.js";
import { InternalTexture } from "../Materials/Textures/internalTexture.js";
import { MultiviewRenderTarget } from "../Materials/Textures/MultiviewRenderTarget.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
/**
 * Provides render target textures and other important rendering information for a given XRLayer.
 * @internal
 */
export class WebXRLayerRenderTargetTextureProvider {
    constructor(_scene, layerWrapper) {
        this._scene = _scene;
        this.layerWrapper = layerWrapper;
        this._renderTargetTextures = new Array();
        this._engine = _scene.getEngine();
    }
    _createInternalTexture(textureSize, texture) {
        const internalTexture = new InternalTexture(this._engine, 0 /* InternalTextureSource.Unknown */, true);
        internalTexture.width = textureSize.width;
        internalTexture.height = textureSize.height;
        internalTexture._hardwareTexture = new WebGLHardwareTexture(texture, this._engine._gl);
        internalTexture.isReady = true;
        return internalTexture;
    }
    _createRenderTargetTexture(width, height, framebuffer, colorTexture, depthStencilTexture, multiview) {
        if (!this._engine) {
            throw new Error("Engine is disposed");
        }
        const textureSize = { width, height };
        // Create render target texture from the internal texture
        const renderTargetTexture = multiview ? new MultiviewRenderTarget(this._scene, textureSize) : new RenderTargetTexture("XR renderTargetTexture", textureSize, this._scene);
        const renderTargetWrapper = renderTargetTexture.renderTarget;
        renderTargetWrapper._samples = renderTargetTexture.samples;
        // Set the framebuffer, make sure it works in all scenarios - emulator, no layers and layers
        if (framebuffer || !colorTexture) {
            renderTargetWrapper._framebuffer = framebuffer;
        }
        // Create internal texture
        if (colorTexture) {
            if (multiview) {
                renderTargetWrapper._colorTextureArray = colorTexture;
            }
            else {
                const internalTexture = this._createInternalTexture(textureSize, colorTexture);
                renderTargetWrapper.setTexture(internalTexture, 0);
                renderTargetTexture._texture = internalTexture;
            }
        }
        if (depthStencilTexture) {
            if (multiview) {
                renderTargetWrapper._depthStencilTextureArray = depthStencilTexture;
            }
            else {
                renderTargetWrapper._depthStencilTexture = this._createInternalTexture(textureSize, depthStencilTexture);
            }
        }
        renderTargetTexture.disableRescaling();
        this._renderTargetTextures.push(renderTargetTexture);
        return renderTargetTexture;
    }
    _destroyRenderTargetTexture(renderTargetTexture) {
        this._renderTargetTextures.splice(this._renderTargetTextures.indexOf(renderTargetTexture), 1);
        renderTargetTexture.dispose();
    }
    getFramebufferDimensions() {
        return this._framebufferDimensions;
    }
    dispose() {
        this._renderTargetTextures.forEach((rtt) => rtt.dispose());
        this._renderTargetTextures.length = 0;
    }
}
//# sourceMappingURL=webXRRenderTargetTextureProvider.js.map