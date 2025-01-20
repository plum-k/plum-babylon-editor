import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to get the max of 2 values
 */
export class MaxBlock extends NodeMaterialBlock {
    /**
     * Creates a new MaxBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("left", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MaxBlock";
    }
    /**
     * Gets the left operand input component
     */
    get left() {
        return this._inputs[0];
    }
    /**
     * Gets the right operand input component
     */
    get right() {
        return this._inputs[1];
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
        state.compilationString += state._declareOutput(output) + ` = max(${this.left.associatedVariableName}, ${this.right.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.MaxBlock", MaxBlock);
//# sourceMappingURL=maxBlock.js.map