import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used to get the derivative value on x and y of a given input
 */
export class DerivativeBlock extends NodeMaterialBlock {
    /**
     * Create a new DerivativeBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect, false);
        this.registerOutput("dx", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("dy", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[1]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "DerivativeBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the derivative output on x
     */
    get dx() {
        return this._outputs[0];
    }
    /**
     * Gets the derivative output on y
     */
    get dy() {
        return this._outputs[1];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const dx = this._outputs[0];
        const dy = this._outputs[1];
        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");
        let dpdx = "dFdx";
        let dpdy = "dFdy";
        if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            dpdx = "dpdx";
            dpdy = "dpdy";
        }
        if (dx.hasEndpoints) {
            state.compilationString += state._declareOutput(dx) + ` = ${dpdx}(${this.input.associatedVariableName});\n`;
        }
        if (dy.hasEndpoints) {
            state.compilationString += state._declareOutput(dy) + ` = ${dpdy}(${this.input.associatedVariableName});\n`;
        }
        return this;
    }
}
RegisterClass("BABYLON.DerivativeBlock", DerivativeBlock);
//# sourceMappingURL=derivativeBlock.js.map