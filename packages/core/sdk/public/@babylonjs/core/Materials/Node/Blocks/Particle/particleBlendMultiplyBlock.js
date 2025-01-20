import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used for the particle blend multiply section
 */
export class ParticleBlendMultiplyBlock extends NodeMaterialBlock {
    /**
     * Create a new ParticleBlendMultiplyBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this._isUnique = true;
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("alphaTexture", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("alphaColor", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("blendColor", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ParticleBlendMultiplyBlock";
    }
    /**
     * Gets the color input component
     */
    get color() {
        return this._inputs[0];
    }
    /**
     * Gets the alphaTexture input component
     */
    get alphaTexture() {
        return this._inputs[1];
    }
    /**
     * Gets the alphaColor input component
     */
    get alphaColor() {
        return this._inputs[2];
    }
    /**
     * Gets the blendColor output component
     */
    get blendColor() {
        return this._outputs[0];
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("sourceAlpha");
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }
        state.compilationString += `
            #ifdef BLENDMULTIPLYMODE
                ${state._declareOutput(this.blendColor)};
                ${state._declareLocalVar("sourceAlpha", NodeMaterialBlockConnectionPointTypes.Float)}  = ${this.alphaColor.associatedVariableName} * ${this.alphaTexture.associatedVariableName};
                ${this.blendColor.associatedVariableName} = vec4${state.fSuffix}(${this.color.associatedVariableName}.rgb * sourceAlpha + vec3(1.0) * (1.0 - sourceAlpha), ${this.color.associatedVariableName}.a);
            #else
                ${state._declareOutput(this.blendColor)} = ${this.color.associatedVariableName};
            #endif
        `;
        return this;
    }
}
RegisterClass("BABYLON.ParticleBlendMultiplyBlock", ParticleBlendMultiplyBlock);
//# sourceMappingURL=particleBlendMultiplyBlock.js.map