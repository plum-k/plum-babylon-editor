import { RegisterClass } from "../../../Misc/typeStore.js";
import { BaseMathBlock } from "./baseMathBlock.js";
/**
 * Block used to divide 2 vectors
 */
export class DivideBlock extends BaseMathBlock {
    /**
     * Creates a new DivideBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "DivideBlock";
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} / ${this.right.associatedVariableName};\n`;
        return this;
    }
}
RegisterClass("BABYLON.DivideBlock", DivideBlock);
//# sourceMappingURL=divideBlock.js.map