import { RenderTargetWrapper } from "../renderTargetWrapper.js";
export class NativeRenderTargetWrapper extends RenderTargetWrapper {
    get _framebuffer() {
        return this.__framebuffer;
    }
    set _framebuffer(framebuffer) {
        if (this.__framebuffer) {
            this._engine._releaseFramebufferObjects(this.__framebuffer);
        }
        this.__framebuffer = framebuffer;
    }
    get _framebufferDepthStencil() {
        return this.__framebufferDepthStencil;
    }
    set _framebufferDepthStencil(framebufferDepthStencil) {
        if (this.__framebufferDepthStencil) {
            this._engine._releaseFramebufferObjects(this.__framebufferDepthStencil);
        }
        this.__framebufferDepthStencil = framebufferDepthStencil;
    }
    constructor(isMulti, isCube, size, engine) {
        super(isMulti, isCube, size, engine);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.__framebuffer = null;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.__framebufferDepthStencil = null;
        this._engine = engine;
    }
    dispose(disposeOnlyFramebuffers = false) {
        this._framebuffer = null;
        this._framebufferDepthStencil = null;
        super.dispose(disposeOnlyFramebuffers);
    }
}
//# sourceMappingURL=nativeRenderTargetWrapper.js.map