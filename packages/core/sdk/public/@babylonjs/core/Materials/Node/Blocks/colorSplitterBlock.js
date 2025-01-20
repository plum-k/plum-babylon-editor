import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to expand a Color3/4 into 4 outputs (one for each component)
 */
export class ColorSplitterBlock extends NodeMaterialBlock {
    /**
     * Create a new ColorSplitterBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb ", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float);
        this.inputsAreExclusive = true;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ColorSplitterBlock";
    }
    /**
     * Gets the rgba component (input)
     */
    get rgba() {
        return this._inputs[0];
    }
    /**
     * Gets the rgb component (input)
     */
    get rgbIn() {
        return this._inputs[1];
    }
    /**
     * Gets the rgb component (output)
     */
    get rgbOut() {
        return this._outputs[0];
    }
    /**
     * Gets the r component (output)
     */
    get r() {
        return this._outputs[1];
    }
    /**
     * Gets the g component (output)
     */
    get g() {
        return this._outputs[2];
    }
    /**
     * Gets the b component (output)
     */
    get b() {
        return this._outputs[3];
    }
    /**
     * Gets the a component (output)
     */
    get a() {
        return this._outputs[4];
    }
    _inputRename(name) {
        if (name === "rgb ") {
            return "rgbIn";
        }
        return name;
    }
    _outputRename(name) {
        if (name === "rgb") {
            return "rgbOut";
        }
        return name;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const input = this.rgba.isConnected ? this.rgba : this.rgbIn;
        if (!input.isConnected) {
            return;
        }
        const rgbOutput = this._outputs[0];
        const rOutput = this._outputs[1];
        const gOutput = this._outputs[2];
        const bOutput = this._outputs[3];
        const aOutput = this._outputs[4];
        if (rgbOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(rgbOutput) + ` = ${input.associatedVariableName}.rgb;\n`;
        }
        if (rOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(rOutput) + ` = ${input.associatedVariableName}.r;\n`;
        }
        if (gOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(gOutput) + ` = ${input.associatedVariableName}.g;\n`;
        }
        if (bOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(bOutput) + ` = ${input.associatedVariableName}.b;\n`;
        }
        if (aOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(aOutput) + ` = ${input.associatedVariableName}.a;\n`;
        }
        return this;
    }
}
RegisterClass("BABYLON.ColorSplitterBlock", ColorSplitterBlock);
//# sourceMappingURL=colorSplitterBlock.js.map