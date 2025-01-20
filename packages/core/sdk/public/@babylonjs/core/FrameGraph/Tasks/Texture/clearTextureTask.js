import { Color4 } from "../../../Maths/math.color.js";
import { FrameGraphTask } from "../../frameGraphTask.js";
/**
 * Task used to clear a texture.
 */
export class FrameGraphClearTextureTask extends FrameGraphTask {
    /**
     * Constructs a new clear task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name, frameGraph) {
        super(name, frameGraph);
        /**
         * The color to clear the texture with.
         */
        this.color = new Color4(0.2, 0.2, 0.3, 1);
        /**
         * If the color should be cleared.
         */
        this.clearColor = true;
        /**
         * If the depth should be cleared.
         */
        this.clearDepth = false;
        /**
         * If the stencil should be cleared.
         */
        this.clearStencil = false;
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    record() {
        if (this.destinationTexture === undefined && this.depthTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: destinationTexture and depthTexture can't both be undefined.`);
        }
        let textureSamples = 0;
        let depthSamples = 0;
        if (this.destinationTexture !== undefined) {
            textureSamples = this._frameGraph.textureManager.getTextureDescription(this.destinationTexture).options.samples || 1;
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        }
        if (this.depthTexture !== undefined) {
            depthSamples = this._frameGraph.textureManager.getTextureDescription(this.depthTexture).options.samples || 1;
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }
        if (textureSamples !== depthSamples && textureSamples !== 0 && depthSamples !== 0) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: the depth texture and the output texture must have the same number of samples.`);
        }
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this.destinationTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.destinationTexture);
        passDisabled.setRenderTargetDepth(this.depthTexture);
        passDisabled.setExecuteFunc((_context) => { });
    }
}
//# sourceMappingURL=clearTextureTask.js.map