import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { Vector2 } from "../../../Maths/math.vector.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Block used to remap a float from a range to a new one
 */
export class RemapBlock extends NodeMaterialBlock {
    /**
     * Creates a new RemapBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets the source range
         */
        this.sourceRange = new Vector2(-1, 1);
        /**
         * Gets or sets the target range
         */
        this.targetRange = new Vector2(0, 1);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("sourceMin", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("sourceMax", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("targetMin", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("targetMax", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "RemapBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the source min input component
     */
    get sourceMin() {
        return this._inputs[1];
    }
    /**
     * Gets the source max input component
     */
    get sourceMax() {
        return this._inputs[2];
    }
    /**
     * Gets the target min input component
     */
    get targetMin() {
        return this._inputs[3];
    }
    /**
     * Gets the target max input component
     */
    get targetMax() {
        return this._inputs[4];
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
        const sourceMin = this.sourceMin.isConnected ? this.sourceMin.associatedVariableName : this._writeFloat(this.sourceRange.x);
        const sourceMax = this.sourceMax.isConnected ? this.sourceMax.associatedVariableName : this._writeFloat(this.sourceRange.y);
        const targetMin = this.targetMin.isConnected ? this.targetMin.associatedVariableName : this._writeFloat(this.targetRange.x);
        const targetMax = this.targetMax.isConnected ? this.targetMax.associatedVariableName : this._writeFloat(this.targetRange.y);
        state.compilationString +=
            state._declareOutput(output) +
                ` = ${targetMin} + (${this._inputs[0].associatedVariableName} - ${sourceMin}) * (${targetMax} - ${targetMin}) / (${sourceMax} - ${sourceMin});\n`;
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.sourceRange = new BABYLON.Vector2(${this.sourceRange.x}, ${this.sourceRange.y});\n`;
        codeString += `${this._codeVariableName}.targetRange = new BABYLON.Vector2(${this.targetRange.x}, ${this.targetRange.y});\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.sourceRange = this.sourceRange.asArray();
        serializationObject.targetRange = this.targetRange.asArray();
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.sourceRange = Vector2.FromArray(serializationObject.sourceRange);
        this.targetRange = Vector2.FromArray(serializationObject.targetRange);
    }
}
__decorate([
    editableInPropertyPage("From", 3 /* PropertyTypeForEdition.Vector2 */)
], RemapBlock.prototype, "sourceRange", void 0);
__decorate([
    editableInPropertyPage("To", 3 /* PropertyTypeForEdition.Vector2 */)
], RemapBlock.prototype, "targetRange", void 0);
RegisterClass("BABYLON.RemapBlock", RemapBlock);
//# sourceMappingURL=remapBlock.js.map