import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import "../../../Shaders/ShadersInclude/helperFunctions.js";
/**
 * Block used to get a random number
 */
export class RandomNumberBlock extends NodeMaterialBlock {
    /**
     * Creates a new RandomNumberBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("seed", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector2 |
            NodeMaterialBlockConnectionPointTypes.Vector3 |
            NodeMaterialBlockConnectionPointTypes.Vector4 |
            NodeMaterialBlockConnectionPointTypes.Color3 |
            NodeMaterialBlockConnectionPointTypes.Color4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "RandomNumberBlock";
    }
    /**
     * Gets the seed input component
     */
    get seed() {
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
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);
        state.compilationString += state._declareOutput(output) + ` = getRand(${this.seed.associatedVariableName}.xy);\n`;
        return this;
    }
}
RegisterClass("BABYLON.RandomNumberBlock", RandomNumberBlock);
//# sourceMappingURL=randomNumberBlock.js.map