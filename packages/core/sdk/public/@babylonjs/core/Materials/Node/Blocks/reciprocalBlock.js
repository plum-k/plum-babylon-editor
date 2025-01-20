import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to get the reciprocal (1 / x) of a value
 */
export class ReciprocalBlock extends NodeMaterialBlock {
    /**
     * Creates a new ReciprocalBlock
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
        return "ReciprocalBlock";
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
        if (this.input.type === NodeMaterialBlockConnectionPointTypes.Matrix) {
            state.compilationString += state._declareOutput(output) + ` = inverse(${this.input.associatedVariableName});\n`;
        }
        else {
            state.compilationString += state._declareOutput(output) + ` = 1. / ${this.input.associatedVariableName};\n`;
        }
        return this;
    }
}
RegisterClass("BABYLON.ReciprocalBlock", ReciprocalBlock);
//# sourceMappingURL=reciprocalBlock.js.map