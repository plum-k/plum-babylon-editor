import { RegisterClass } from "../../../Misc/typeStore.js";
import { BaseMathBlock } from "./baseMathBlock.js";
/**
 * Block used to multiply 2 values
 */
export class MultiplyBlock extends BaseMathBlock {
    /**
     * Creates a new MultiplyBlock
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
        return "MultiplyBlock";
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} * ${this.right.associatedVariableName};\n`;
        return this;
    }
}
RegisterClass("BABYLON.MultiplyBlock", MultiplyBlock);
//# sourceMappingURL=multiplyBlock.js.map