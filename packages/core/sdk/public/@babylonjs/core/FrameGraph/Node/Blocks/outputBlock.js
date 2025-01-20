import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes.js";
import { FrameGraphCopyToBackbufferColorTask } from "../../Tasks/Texture/copyToBackbufferColorTask.js";
/**
 * Block used to generate the final graph
 */
export class NodeRenderGraphOutputBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphOutputBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._isUnique = true;
        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this._frameGraphTask = new FrameGraphCopyToBackbufferColorTask(name, frameGraph);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphOutputBlock";
    }
    /**
     * Gets the texture input component
     */
    get texture() {
        return this._inputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this._frameGraphTask.name = this.name;
        const textureConnectedPoint = this.texture.connectedPoint;
        if (textureConnectedPoint) {
            this._frameGraphTask.sourceTexture = textureConnectedPoint.value;
        }
    }
}
RegisterClass("BABYLON.NodeRenderGraphOutputBlock", NodeRenderGraphOutputBlock);
//# sourceMappingURL=outputBlock.js.map