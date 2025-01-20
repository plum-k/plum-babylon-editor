import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to smooth step a value
 */
export class SmoothStepBlock extends NodeMaterialBlock {
    /**
     * Creates a new SmoothStepBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge0", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("edge1", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "SmoothStepBlock";
    }
    /**
     * Gets the value operand input component
     */
    get value() {
        return this._inputs[0];
    }
    /**
     * Gets the first edge operand input component
     */
    get edge0() {
        return this._inputs[1];
    }
    /**
     * Gets the second edge operand input component
     */
    get edge1() {
        return this._inputs[2];
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
        const cast = state._getShaderType(this.value.type);
        state.compilationString +=
            state._declareOutput(output) +
                ` = smoothstep(${cast}(${this.edge0.associatedVariableName}), ${cast}(${this.edge1.associatedVariableName}), ${this.value.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.SmoothStepBlock", SmoothStepBlock);
//# sourceMappingURL=smoothStepBlock.js.map