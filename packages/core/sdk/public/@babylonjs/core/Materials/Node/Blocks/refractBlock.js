import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to get the refracted vector from a direction and a normal
 */
export class RefractBlock extends NodeMaterialBlock {
    /**
     * Creates a new RefractBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("incident", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("ior", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector3 |
            NodeMaterialBlockConnectionPointTypes.Vector4 |
            NodeMaterialBlockConnectionPointTypes.Color3 |
            NodeMaterialBlockConnectionPointTypes.Color4);
        this._inputs[1].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector3 |
            NodeMaterialBlockConnectionPointTypes.Vector4 |
            NodeMaterialBlockConnectionPointTypes.Color3 |
            NodeMaterialBlockConnectionPointTypes.Color4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "RefractBlock";
    }
    /**
     * Gets the incident component
     */
    get incident() {
        return this._inputs[0];
    }
    /**
     * Gets the normal component
     */
    get normal() {
        return this._inputs[1];
    }
    /**
     * Gets the index of refraction component
     */
    get ior() {
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
        state.compilationString +=
            state._declareOutput(output) +
                ` = refract(${this.incident.associatedVariableName}.xyz, ${this.normal.associatedVariableName}.xyz, ${this.ior.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.RefractBlock", RefractBlock);
//# sourceMappingURL=refractBlock.js.map