import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeMaterialSystemValues } from "../Enums/nodeMaterialSystemValues.js";
import { InputBlock } from "./Input/inputBlock.js";
/**
 * Block used to get the view direction
 */
export class ViewDirectionBlock extends NodeMaterialBlock {
    /**
     * Creates a new ViewDirectionBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ViewDirectionBlock";
    }
    /**
     * Gets the world position component
     */
    get worldPosition() {
        return this._inputs[0];
    }
    /**
     * Gets the camera position component
     */
    get cameraPosition() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    autoConfigure(material, additionalFilteringInfo = () => true) {
        if (!this.cameraPosition.isConnected) {
            let cameraPositionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.CameraPosition && additionalFilteringInfo(b));
            if (!cameraPositionInput) {
                cameraPositionInput = new InputBlock("cameraPosition");
                cameraPositionInput.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
            }
            cameraPositionInput.output.connectTo(this.cameraPosition);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        state.compilationString +=
            state._declareOutput(output) + ` = normalize(${this.cameraPosition.associatedVariableName} - ${this.worldPosition.associatedVariableName}.xyz);\n`;
        return this;
    }
}
RegisterClass("BABYLON.ViewDirectionBlock", ViewDirectionBlock);
//# sourceMappingURL=viewDirectionBlock.js.map