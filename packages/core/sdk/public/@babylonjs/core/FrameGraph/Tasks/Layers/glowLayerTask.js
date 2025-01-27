import { ThinGlowLayer } from "../../../Layers/thinGlowLayer.js";
import { FrameGraphBaseLayerTask } from "./baseLayerTask.js";
/**
 * Task which applies a glowing effect to a texture.
 */
export class FrameGraphGlowLayerTask extends FrameGraphBaseLayerTask {
    /**
     * Constructs a new glow layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the glow layer in.
     * @param options Options for the glow layer.
     */
    constructor(name, frameGraph, scene, options) {
        super(name, frameGraph, scene, new ThinGlowLayer(name, scene, options, true), 2);
        this.layer._renderPassId = this._objectRendererForLayer.objectRenderer.renderPassId;
    }
}
//# sourceMappingURL=glowLayerTask.js.map