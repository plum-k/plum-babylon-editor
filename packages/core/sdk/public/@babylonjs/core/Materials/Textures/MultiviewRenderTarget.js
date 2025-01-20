import { RenderTargetTexture } from "../Textures/renderTargetTexture.js";

/**
 * Renders to multiple views with a single draw call
 * Only for WebGL backends
 * @see https://www.khronos.org/registry/webgl/extensions/OVR_multiview2/
 */
export class MultiviewRenderTarget extends RenderTargetTexture {
    set samples(value) {
        // We override this setter because multisampling is handled by framebufferTextureMultisampleMultiviewOVR
        this._samples = value;
    }
    get samples() {
        return this._samples;
    }
    /**
     * Creates a multiview render target
     * @param scene scene used with the render target
     * @param size the size of the render target (used for each view)
     */
    constructor(scene, size = 512) {
        super("multiview rtt", size, scene, false, true, 0, false, undefined, false, false, true, undefined, true);
        this._renderTarget = this.getScene().getEngine().createMultiviewRenderTargetTexture(this.getRenderWidth(), this.getRenderHeight());
        this._texture = this._renderTarget.texture;
        this._texture.isMultiview = true;
        this._texture.format = 5;
        this.samples = this._getEngine().getCaps().maxSamples || this.samples;
        this._texture.samples = this._samples;
    }
    /**
     * @internal
     */
    _bindFrameBuffer() {
        if (!this._renderTarget) {
            return;
        }
        this.getScene().getEngine().bindMultiviewFramebuffer(this._renderTarget);
    }
    /**
     * Gets the number of views the corresponding to the texture (eg. a MultiviewRenderTarget will have > 1)
     * @returns the view count
     */
    getViewCount() {
        return 2;
    }
}
//# sourceMappingURL=MultiviewRenderTarget.js.map