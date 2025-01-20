import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used to discard a pixel if a value is smaller than a cutoff
 */
export class DiscardBlock extends NodeMaterialBlock {
    /**
     * Create a new DiscardBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment, true);
        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("cutoff", NodeMaterialBlockConnectionPointTypes.Float, true);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "DiscardBlock";
    }
    /**
     * Gets the color input component
     */
    get value() {
        return this._inputs[0];
    }
    /**
     * Gets the cutoff input component
     */
    get cutoff() {
        return this._inputs[1];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        state.sharedData.hints.needAlphaTesting = true;
        if (!this.cutoff.isConnected || !this.value.isConnected) {
            return;
        }
        state.compilationString += `if (${this.value.associatedVariableName} < ${this.cutoff.associatedVariableName}) { discard; }\n`;
        return this;
    }
}
RegisterClass("BABYLON.DiscardBlock", DiscardBlock);
//# sourceMappingURL=discardBlock.js.map