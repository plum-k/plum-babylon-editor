import { ThinHighlightLayer } from "../../../Layers/thinHighlightLayer.js";

import { HasStencilAspect } from "../../../Materials/Textures/internalTexture.js";
import { FrameGraphBaseLayerTask } from "./baseLayerTask.js";
/**
 * Task which applies a highlight effect to a texture.
 */
export class FrameGraphHighlightLayerTask extends FrameGraphBaseLayerTask {
    /**
     * Constructs a new highlight layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the highlight layer in.
     * @param options Options for the highlight layer.
     */
    constructor(name, frameGraph, scene, options) {
        const alphaBlendingMode = options?.alphaBlendingMode ?? 2;
        super(name, frameGraph, scene, new ThinHighlightLayer(name, scene, options, true), 1, alphaBlendingMode === 2, true, true);
    }
    record() {
        if (!this.objectRendererTask.depthTexture) {
            throw new Error(`FrameGraphHighlightLayerTask "${this.name}": objectRendererTask must have a depthTexture input`);
        }
        const depthTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.objectRendererTask.depthTexture);
        if (!depthTextureCreationOptions.options.formats || !HasStencilAspect(depthTextureCreationOptions.options.formats[0])) {
            throw new Error(`FrameGraphHighlightLayerTask "${this.name}": objectRendererTask depthTexture must have a stencil aspect`);
        }
        super.record();
        this.layer._mainObjectRendererRenderPassId = this.objectRendererTask.objectRenderer.renderPassId;
    }
}
//# sourceMappingURL=highlightLayerTask.js.map