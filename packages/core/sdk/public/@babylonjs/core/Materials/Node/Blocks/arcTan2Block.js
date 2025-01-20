import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to compute arc tangent of 2 values
 */
export class ArcTan2Block extends NodeMaterialBlock {
    /**
     * Creates a new ArcTan2Block
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("y", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ArcTan2Block";
    }
    /**
     * Gets the x operand input component
     */
    get x() {
        return this._inputs[0];
    }
    /**
     * Gets the y operand input component
     */
    get y() {
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
        const func = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "atan2" : "atan";
        state.compilationString += state._declareOutput(output) + ` = ${func}(${this.x.associatedVariableName}, ${this.y.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.ArcTan2Block", ArcTan2Block);
//# sourceMappingURL=arcTan2Block.js.map