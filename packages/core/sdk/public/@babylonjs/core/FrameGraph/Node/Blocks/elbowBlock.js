import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes.js";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock.js";
/**
 * Block used as a pass through
 */
export class NodeRenderGraphElbowBlock extends NodeRenderGraphBlock {
    /**
     * Creates a new NodeRenderGraphElbowBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("input", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphElbowBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const input = this._inputs[0];
        this._propagateInputValueToOutput(input, output);
    }
}
RegisterClass("BABYLON.NodeRenderGraphElbowBlock", NodeRenderGraphElbowBlock);
//# sourceMappingURL=elbowBlock.js.map