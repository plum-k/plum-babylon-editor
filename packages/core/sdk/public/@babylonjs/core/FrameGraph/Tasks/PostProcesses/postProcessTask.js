
import { FrameGraphTask } from "../../frameGraphTask.js";
/**
 * Task which applies a post process.
 */
export class FrameGraphPostProcessTask extends FrameGraphTask {
    /**
     * Constructs a new post process task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param postProcess The post process to apply.
     */
    constructor(name, frameGraph, postProcess) {
        super(name, frameGraph);
        /**
         * The sampling mode to use for the source texture.
         */
        this.sourceSamplingMode = 2;
        this.postProcess = postProcess;
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    isReady() {
        return this.postProcess.isReady();
    }
    record(skipCreationOfDisabledPasses = false, additionalExecute, additionalBindings) {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphPostProcessTask "${this.name}": sourceTexture is required`);
        }
        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);
        sourceTextureCreationOptions.options.samples = 1;
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this.name, sourceTextureCreationOptions);
        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.outputTexture);
        this._outputWidth = outputTextureDescription.size.width;
        this._outputHeight = outputTextureDescription.size.height;
        this._internalDependencies.push(this.sourceTexture);
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.sourceTexture, this.sourceSamplingMode);
            additionalExecute?.(context);
            context.applyFullScreenEffect(this._postProcessDrawWrapper, () => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect, "textureSampler", this.sourceTexture);
                additionalBindings?.(context);
                this.postProcess.bind();
            });
        });
        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
            passDisabled.setRenderTarget(this.outputTexture);
            passDisabled.setExecuteFunc((context) => {
                context.copyTexture(this.sourceTexture);
            });
        }
        return pass;
    }
    dispose() {
        this.postProcess.dispose();
        super.dispose();
    }
}
//# sourceMappingURL=postProcessTask.js.map