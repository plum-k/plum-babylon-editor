import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to transpose a matrix
 */
export class MatrixTransposeBlock extends NodeMaterialBlock {
    /**
     * Creates a new MatrixTransposeBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MatrixTransposeBlock";
    }
    /**
     * Gets the input matrix
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
        const output = this.output;
        const input = this.input;
        state.compilationString += state._declareOutput(output) + ` = transpose(${input.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.MatrixTransposeBlock", MatrixTransposeBlock);
//# sourceMappingURL=matrixTransposeBlock.js.map