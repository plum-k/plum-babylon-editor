import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { InputBlock } from "./Input/inputBlock.js";
/**
 * Block used to rotate a 2d vector by a given angle
 */
export class Rotate2dBlock extends NodeMaterialBlock {
    /**
     * Creates a new Rotate2dBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("angle", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "Rotate2dBlock";
    }
    /**
     * Gets the input vector
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the input angle
     */
    get angle() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.angle.isConnected) {
            const angleInput = new InputBlock("angle");
            angleInput.value = 0;
            angleInput.output.connectTo(this.angle);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const angle = this.angle;
        const input = this.input;
        state.compilationString +=
            state._declareOutput(output) +
                ` = vec2(cos(${angle.associatedVariableName}) * ${input.associatedVariableName}.x - sin(${angle.associatedVariableName}) * ${input.associatedVariableName}.y, sin(${angle.associatedVariableName}) * ${input.associatedVariableName}.x + cos(${angle.associatedVariableName}) * ${input.associatedVariableName}.y);\n`;
        return this;
    }
}
RegisterClass("BABYLON.Rotate2dBlock", Rotate2dBlock);
//# sourceMappingURL=rotate2dBlock.js.map