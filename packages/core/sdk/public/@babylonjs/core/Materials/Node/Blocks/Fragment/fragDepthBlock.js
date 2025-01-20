import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { Logger } from "../../../../Misc/logger.js";
/**
 * Block used to write the fragment depth
 */
export class FragDepthBlock extends NodeMaterialBlock {
    /**
     * Create a new FragDepthBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment, true);
        this.registerInput("depth", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("viewProjection", NodeMaterialBlockConnectionPointTypes.Matrix, true);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "FragDepthBlock";
    }
    /**
     * Gets the depth input component
     */
    get depth() {
        return this._inputs[0];
    }
    /**
     * Gets the worldPos input component
     */
    get worldPos() {
        return this._inputs[1];
    }
    /**
     * Gets the viewProjection input component
     */
    get viewProjection() {
        return this._inputs[2];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const fragDepth = state.shaderLanguage === 0 /* ShaderLanguage.GLSL */ ? "gl_FragDepth" : "fragmentOutputs.fragDepth";
        if (this.depth.isConnected) {
            state.compilationString += `${fragDepth} = ${this.depth.associatedVariableName};\n`;
        }
        else if (this.worldPos.isConnected && this.viewProjection.isConnected) {
            state.compilationString += `
                ${state._declareLocalVar("p", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.viewProjection.associatedVariableName} * ${this.worldPos.associatedVariableName};
                ${state._declareLocalVar("v", NodeMaterialBlockConnectionPointTypes.Float)} = p.z / p.w;
                #ifndef IS_NDC_HALF_ZRANGE
                    v = v * 0.5 + 0.5;
                #endif
                ${fragDepth} = v;
    
            `;
        }
        else {
            Logger.Warn("FragDepthBlock: either the depth input or both the worldPos and viewProjection inputs must be connected!");
        }
        return this;
    }
}
RegisterClass("BABYLON.FragDepthBlock", FragDepthBlock);
//# sourceMappingURL=fragDepthBlock.js.map