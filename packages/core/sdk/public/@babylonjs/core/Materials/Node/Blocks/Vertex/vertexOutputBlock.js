import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used to output the vertex position
 */
export class VertexOutputBlock extends NodeMaterialBlock {
    /**
     * Creates a new VertexOutputBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Vertex, true);
        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "VertexOutputBlock";
    }
    /**
     * Gets the vector input component
     */
    get vector() {
        return this._inputs[0];
    }
    _isLogarithmicDepthEnabled(nodeList, useLogarithmicDepth) {
        if (useLogarithmicDepth) {
            return true;
        }
        for (const node of nodeList) {
            if (node.useLogarithmicDepth) {
                return true;
            }
        }
        return false;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const input = this.vector;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            state.compilationString += `vertexOutputs.position = ${input.associatedVariableName};\n`;
        }
        else {
            state.compilationString += `gl_Position = ${input.associatedVariableName};\n`;
        }
        // TODOWGSL
        if (this._isLogarithmicDepthEnabled(state.sharedData.fragmentOutputNodes, state.sharedData.nodeMaterial.useLogarithmicDepth)) {
            state._emitUniformFromString("logarithmicDepthConstant", NodeMaterialBlockConnectionPointTypes.Float);
            state._emitVaryingFromString("vFragmentDepth", NodeMaterialBlockConnectionPointTypes.Float);
            const fragDepth = isWebGPU ? "vertexOutputs.vFragmentDepth" : "vFragmentDepth";
            const uniformP = isWebGPU ? "uniforms." : "";
            const position = isWebGPU ? "vertexOutputs.position" : "gl_Position";
            state.compilationString += `${fragDepth} = 1.0 + ${position}.w;\n`;
            state.compilationString += `${position}.z = log2(max(0.000001, ${fragDepth})) * ${uniformP}logarithmicDepthConstant;\n`;
        }
        return this;
    }
}
RegisterClass("BABYLON.VertexOutputBlock", VertexOutputBlock);
//# sourceMappingURL=vertexOutputBlock.js.map