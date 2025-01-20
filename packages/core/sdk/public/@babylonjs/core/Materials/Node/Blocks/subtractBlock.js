import { RegisterClass } from "../../../Misc/typeStore.js";
import { BaseMathBlock } from "./baseMathBlock.js";
/**
 * Block used to subtract 2 vectors
 */
export class SubtractBlock extends BaseMathBlock {
    /**
     * Creates a new SubtractBlock
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
        return "SubtractBlock";
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} - ${this.right.associatedVariableName};\n`;
        return this;
    }
}
RegisterClass("BABYLON.SubtractBlock", SubtractBlock);
//# sourceMappingURL=subtractBlock.js.map