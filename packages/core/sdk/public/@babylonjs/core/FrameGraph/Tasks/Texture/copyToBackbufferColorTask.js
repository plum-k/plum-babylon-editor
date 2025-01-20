import { backbufferColorTextureHandle } from "../../frameGraphTypes.js";
import { FrameGraphTask } from "../../frameGraphTask.js";
/**
 * Task which copies a texture to the backbuffer color texture.
 */
export class FrameGraphCopyToBackbufferColorTask extends FrameGraphTask {
    record() {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphCopyToBackbufferColorTask "${this.name}": sourceTexture is required`);
        }
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(backbufferColorTextureHandle);
        pass.setExecuteFunc((context) => {
            if (!context.isBackbuffer(this.sourceTexture)) {
                context.copyTexture(this.sourceTexture);
            }
        });
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(backbufferColorTextureHandle);
        passDisabled.setExecuteFunc((_context) => { });
    }
}
//# sourceMappingURL=copyToBackbufferColorTask.js.map