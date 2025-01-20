import { FrameGraphPass } from "./pass.js";
/**
 * Render pass used to render objects.
 */
export class FrameGraphRenderPass extends FrameGraphPass {
    /**
     * Checks if a pass is a render pass.
     * @param pass The pass to check.
     * @returns True if the pass is a render pass, else false.
     */
    static IsRenderPass(pass) {
        return pass.setRenderTarget !== undefined;
    }
    /**
     * Gets the render target(s) used by the render pass.
     */
    get renderTarget() {
        return this._renderTarget;
    }
    /**
     * Gets the render target depth used by the render pass.
     */
    get renderTargetDepth() {
        return this._renderTargetDepth;
    }
    /** @internal */
    constructor(name, parentTask, context, engine) {
        super(name, parentTask, context);
        this._engine = engine;
    }
    /**
     * Sets the render target(s) to use for rendering.
     * @param renderTargetHandle The render target to use for rendering, or an array of render targets to use for multi render target rendering.
     */
    setRenderTarget(renderTargetHandle) {
        this._renderTarget = renderTargetHandle;
    }
    /**
     * Sets the render target depth to use for rendering.
     * @param renderTargetHandle The render target depth to use for rendering.
     */
    setRenderTargetDepth(renderTargetHandle) {
        this._renderTargetDepth = renderTargetHandle;
    }
    /** @internal */
    _execute() {
        this._frameGraphRenderTarget = this._frameGraphRenderTarget || this._context.createRenderTarget(this.name, this._renderTarget, this._renderTargetDepth);
        this._context.bindRenderTarget(this._frameGraphRenderTarget, `frame graph render pass - ${this.name}`);
        super._execute();
        this._context._flushDebugMessages();
    }
    /** @internal */
    _isValid() {
        const errMsg = super._isValid();
        return errMsg
            ? errMsg
            : this._renderTarget !== undefined || this.renderTargetDepth !== undefined
                ? null
                : "Render target and render target depth cannot both be undefined.";
    }
}
//# sourceMappingURL=renderPass.js.map