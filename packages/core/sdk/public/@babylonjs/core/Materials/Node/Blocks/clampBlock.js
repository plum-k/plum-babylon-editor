import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Block used to clamp a float
 */
export class ClampBlock extends NodeMaterialBlock {
    /**
     * Creates a new ClampBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /** Gets or sets the minimum range */
        this.minimum = 0.0;
        /** Gets or sets the maximum range */
        this.maximum = 1.0;
        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ClampBlock";
    }
    /**
     * Gets the value input component
     */
    get value() {
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
        const cast = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? state._getShaderType(this.value.type) : "";
        state.compilationString +=
            state._declareOutput(output) +
                ` = clamp(${this.value.associatedVariableName}, ${cast}(${this._writeFloat(this.minimum)}), ${cast}(${this._writeFloat(this.maximum)}));\n`;
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.minimum = ${this.minimum};\n`;
        codeString += `${this._codeVariableName}.maximum = ${this.maximum};\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.minimum = this.minimum;
        serializationObject.maximum = this.maximum;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.minimum = serializationObject.minimum;
        this.maximum = serializationObject.maximum;
    }
}
__decorate([
    editableInPropertyPage("Minimum", 1 /* PropertyTypeForEdition.Float */, undefined, { embedded: true })
], ClampBlock.prototype, "minimum", void 0);
__decorate([
    editableInPropertyPage("Maximum", 1 /* PropertyTypeForEdition.Float */, undefined, { embedded: true })
], ClampBlock.prototype, "maximum", void 0);
RegisterClass("BABYLON.ClampBlock", ClampBlock);
//# sourceMappingURL=clampBlock.js.map