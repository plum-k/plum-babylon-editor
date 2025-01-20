import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used for the Gaussian Splatting Fragment part
 */
export class GaussianBlock extends NodeMaterialBlock {
    /**
     * Create a new GaussianBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this._isUnique = false;
        this.registerInput("splatColor", NodeMaterialBlockConnectionPointTypes.Color4, false, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GaussianBlock";
    }
    /**
     * Gets the color input component
     */
    get splatColor() {
        return this._inputs[0];
    }
    /**
     * Gets the rgba output component
     */
    get rgba() {
        return this._outputs[0];
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("vPosition");
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }
        // Emit code
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("clipPlaneFragmentDeclaration", comments);
        state._emitFunctionFromInclude("logDepthDeclaration", comments);
        state._emitFunctionFromInclude("fogFragmentDeclaration", comments);
        state._emitFunctionFromInclude("gaussianSplattingFragmentDeclaration", comments);
        state._emitVaryingFromString("vPosition", NodeMaterialBlockConnectionPointTypes.Vector2);
        const color = this.splatColor;
        const output = this._outputs[0];
        if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            state.compilationString += `${state._declareOutput(output)} = gaussianColor(${color.associatedVariableName}, input.vPosition);\n`;
        }
        else {
            state.compilationString += `${state._declareOutput(output)} = gaussianColor(${color.associatedVariableName});\n`;
        }
        return this;
    }
}
RegisterClass("BABYLON.GaussianBlock", GaussianBlock);
//# sourceMappingURL=gaussianBlock.js.map