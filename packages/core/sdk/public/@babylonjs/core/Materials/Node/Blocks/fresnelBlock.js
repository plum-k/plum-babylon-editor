import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { InputBlock } from "./Input/inputBlock.js";
import "../../../Shaders/ShadersInclude/fresnelFunction.js";
import { ViewDirectionBlock } from "./viewDirectionBlock.js";
/**
 * Block used to compute fresnel value
 */
export class FresnelBlock extends NodeMaterialBlock {
    /**
     * Create a new FresnelBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("viewDirection", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("bias", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("power", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("fresnel", NodeMaterialBlockConnectionPointTypes.Float);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "FresnelBlock";
    }
    /**
     * Gets the world normal input component
     */
    get worldNormal() {
        return this._inputs[0];
    }
    /**
     * Gets the view direction input component
     */
    get viewDirection() {
        return this._inputs[1];
    }
    /**
     * Gets the bias input component
     */
    get bias() {
        return this._inputs[2];
    }
    /**
     * Gets the camera (or eye) position component
     */
    get power() {
        return this._inputs[3];
    }
    /**
     * Gets the fresnel output component
     */
    get fresnel() {
        return this._outputs[0];
    }
    autoConfigure(material) {
        if (!this.viewDirection.isConnected) {
            const viewDirectionInput = new ViewDirectionBlock("View direction");
            viewDirectionInput.output.connectTo(this.viewDirection);
            viewDirectionInput.autoConfigure(material);
        }
        if (!this.bias.isConnected) {
            const biasInput = new InputBlock("bias");
            biasInput.value = 0;
            biasInput.output.connectTo(this.bias);
        }
        if (!this.power.isConnected) {
            const powerInput = new InputBlock("power");
            powerInput.value = 1;
            powerInput.output.connectTo(this.power);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("fresnelFunction", comments, { removeIfDef: true });
        state.compilationString +=
            state._declareOutput(this.fresnel) +
                ` = computeFresnelTerm(${this.viewDirection.associatedVariableName}.xyz, ${this.worldNormal.associatedVariableName}.xyz, ${this.bias.associatedVariableName}, ${this.power.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.FresnelBlock", FresnelBlock);
//# sourceMappingURL=fresnelBlock.js.map