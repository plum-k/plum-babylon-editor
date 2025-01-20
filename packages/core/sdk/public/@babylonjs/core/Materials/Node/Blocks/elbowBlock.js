import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used as a pass through
 */
export class ElbowBlock extends NodeMaterialBlock {
    /**
     * Creates a new ElbowBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ElbowBlock";
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
    /**
     * Gets or sets the target of the block
     */
    get target() {
        const input = this._inputs[0];
        if (input.isConnected) {
            const block = input.connectedPoint.ownerBlock;
            if (block.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return block.target;
            }
            if (input.connectedPoint.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return input.connectedPoint.target;
            }
        }
        return this._target;
    }
    set target(value) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const input = this._inputs[0];
        state.compilationString += state._declareOutput(output) + ` = ${input.associatedVariableName};\n`;
        return this;
    }
}
RegisterClass("BABYLON.ElbowBlock", ElbowBlock);
//# sourceMappingURL=elbowBlock.js.map