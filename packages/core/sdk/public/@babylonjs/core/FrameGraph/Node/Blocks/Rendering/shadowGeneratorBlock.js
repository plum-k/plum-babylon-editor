import { NodeRenderGraphBaseShadowGeneratorBlock } from "./baseShadowGeneratorBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { FrameGraphShadowGeneratorTask } from "../../../Tasks/Rendering/shadowGeneratorTask.js";
/**
 * Block that generate shadows through a shadow generator
 */
export class NodeRenderGraphShadowGeneratorBlock extends NodeRenderGraphBaseShadowGeneratorBlock {
    /**
     * Create a new NodeRenderGraphShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._frameGraphTask = new FrameGraphShadowGeneratorTask(this.name, frameGraph, scene);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphShadowGeneratorBlock";
    }
}
RegisterClass("BABYLON.NodeRenderGraphShadowGeneratorBlock", NodeRenderGraphShadowGeneratorBlock);
//# sourceMappingURL=shadowGeneratorBlock.js.map