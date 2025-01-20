import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to create a Color3/4 out of individual inputs (one for each component)
 */
export class ColorMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new ColorMergerBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets the swizzle for r (meaning which component to affect to the output.r)
         */
        this.rSwizzle = "r";
        /**
         * Gets or sets the swizzle for g (meaning which component to affect to the output.g)
         */
        this.gSwizzle = "g";
        /**
         * Gets or sets the swizzle for b (meaning which component to affect to the output.b)
         */
        this.bSwizzle = "b";
        /**
         * Gets or sets the swizzle for a (meaning which component to affect to the output.a)
         */
        this.aSwizzle = "a";
        this.registerInput("rgb ", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("r", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("g", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ColorMergerBlock";
    }
    /**
     * Gets the rgb component (input)
     */
    get rgbIn() {
        return this._inputs[0];
    }
    /**
     * Gets the r component (input)
     */
    get r() {
        return this._inputs[1];
    }
    /**
     * Gets the g component (input)
     */
    get g() {
        return this._inputs[2];
    }
    /**
     * Gets the b component (input)
     */
    get b() {
        return this._inputs[3];
    }
    /**
     * Gets the a component (input)
     */
    get a() {
        return this._inputs[4];
    }
    /**
     * Gets the rgba component (output)
     */
    get rgba() {
        return this._outputs[0];
    }
    /**
     * Gets the rgb component (output)
     */
    get rgbOut() {
        return this._outputs[1];
    }
    /**
     * Gets the rgb component (output)
     * @deprecated Please use rgbOut instead.
     */
    get rgb() {
        return this.rgbOut;
    }
    _inputRename(name) {
        if (name === "rgb ") {
            return "rgbIn";
        }
        return name;
    }
    _buildSwizzle(len) {
        const swizzle = this.rSwizzle + this.gSwizzle + this.bSwizzle + this.aSwizzle;
        return "." + swizzle.substring(0, len);
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const rInput = this.r;
        const gInput = this.g;
        const bInput = this.b;
        const aInput = this.a;
        const rgbInput = this.rgbIn;
        const color4Output = this._outputs[0];
        const color3Output = this._outputs[1];
        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);
        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);
        if (rgbInput.isConnected) {
            if (color4Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(color4Output) +
                        ` = ${vec4}(${rgbInput.associatedVariableName}, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"})${this._buildSwizzle(4)};\n`;
            }
            if (color3Output.hasEndpoints) {
                state.compilationString += state._declareOutput(color3Output) + ` = ${rgbInput.associatedVariableName}${this._buildSwizzle(3)};\n`;
            }
        }
        else {
            if (color4Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(color4Output) +
                        ` = ${vec4}(${rInput.isConnected ? this._writeVariable(rInput) : "0.0"}, ${gInput.isConnected ? this._writeVariable(gInput) : "0.0"}, ${bInput.isConnected ? this._writeVariable(bInput) : "0.0"}, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"})${this._buildSwizzle(4)};\n`;
            }
            if (color3Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(color3Output) +
                        ` = ${vec3}(${rInput.isConnected ? this._writeVariable(rInput) : "0.0"}, ${gInput.isConnected ? this._writeVariable(gInput) : "0.0"}, ${bInput.isConnected ? this._writeVariable(bInput) : "0.0"})${this._buildSwizzle(3)};\n`;
            }
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.rSwizzle = this.rSwizzle;
        serializationObject.gSwizzle = this.gSwizzle;
        serializationObject.bSwizzle = this.bSwizzle;
        serializationObject.aSwizzle = this.aSwizzle;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.rSwizzle = serializationObject.rSwizzle ?? "r";
        this.gSwizzle = serializationObject.gSwizzle ?? "g";
        this.bSwizzle = serializationObject.bSwizzle ?? "b";
        this.aSwizzle = serializationObject.aSwizzle ?? "a";
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.rSwizzle = "${this.rSwizzle}";\n`;
        codeString += `${this._codeVariableName}.gSwizzle = "${this.gSwizzle}";\n`;
        codeString += `${this._codeVariableName}.bSwizzle = "${this.bSwizzle}";\n`;
        codeString += `${this._codeVariableName}.aSwizzle = "${this.aSwizzle}";\n`;
        return codeString;
    }
}
RegisterClass("BABYLON.ColorMergerBlock", ColorMergerBlock);
//# sourceMappingURL=colorMergerBlock.js.map