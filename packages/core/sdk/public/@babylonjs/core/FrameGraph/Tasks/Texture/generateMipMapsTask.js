import { FrameGraphTask } from "../../frameGraphTask.js";
/**
 * Task which generates mipmaps for a texture.
 */
export class FrameGraphGenerateMipMapsTask extends FrameGraphTask {
    /**
     * Constructs a new FrameGraphGenerateMipMapsTask.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name, frameGraph) {
        super(name, frameGraph);
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    record() {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture is required`);
        }
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.destinationTexture);
        if (!outputTextureDescription.options.createMipMaps) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture must have createMipMaps set to true`);
        }
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.generateMipMaps();
        });
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => { });
    }
}
//# sourceMappingURL=generateMipMapsTask.js.map