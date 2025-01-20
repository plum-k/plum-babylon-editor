import { __decorate } from "../../../../tslib.es6.js";
import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { Logger } from "../../../../Misc/logger.js";
/**
 * Block used to convert a height vector to a normal
 */
export class HeightToNormalBlock extends NodeMaterialBlock {
    /**
     * Creates a new HeightToNormalBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        /**
         * Defines if the output should be generated in world or tangent space.
         * Note that in tangent space the result is also scaled by 0.5 and offsetted by 0.5 so that it can directly be used as a PerturbNormal.normalMapColor input
         */
        this.generateInWorldSpace = false;
        /**
         * Defines that the worldNormal input will be normalized by the HeightToNormal block before being used
         */
        this.automaticNormalizationNormal = true;
        /**
         * Defines that the worldTangent input will be normalized by the HeightToNormal block before being used
         */
        this.automaticNormalizationTangent = true;
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[3].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "HeightToNormalBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the position component
     */
    get worldPosition() {
        return this._inputs[1];
    }
    /**
     * Gets the normal component
     */
    get worldNormal() {
        return this._inputs[2];
    }
    /**
     * Gets the tangent component
     */
    get worldTangent() {
        return this._inputs[3];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    /**
     * Gets the xyz component
     */
    get xyz() {
        return this._outputs[1];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        const fPrefix = state.fSuffix;
        if (!this.generateInWorldSpace && !this.worldTangent.isConnected) {
            Logger.Error(`You must connect the 'worldTangent' input of the ${this.name} block!`);
        }
        const startCode = this.generateInWorldSpace
            ? ""
            : `
            vec3 biTangent = cross(norm, tgt);
            mat3 TBN = mat3(tgt, biTangent, norm);
            `;
        const endCode = this.generateInWorldSpace
            ? ""
            : `
            result = TBN * result;
            result = result * vec3(0.5) + vec3(0.5);
            `;
        let heightToNormal = `
            vec4 heightToNormal(float height, vec3 position, vec3 tangent, vec3 normal) {
                vec3 tgt = ${this.automaticNormalizationTangent ? "normalize(tangent);" : "tangent;"}
                vec3 norm = ${this.automaticNormalizationNormal ? "normalize(normal);" : "normal;"}
                ${startCode}
                vec3 worlddX = dFdx(position);
                vec3 worlddY = dFdy(position);
                vec3 crossX = cross(norm, worlddX);
                vec3 crossY = cross(worlddY, norm);
                float d = abs(dot(crossY, worlddX));
                vec3 inToNormal = vec3(((((height + dFdx(height)) - height) * crossY) + (((height + dFdy(height)) - height) * crossX)) * sign(d));
                inToNormal.y *= -1.0;
                vec3 result = normalize((d * norm) - inToNormal);
                ${endCode}
                return vec4(result, 0.);
            }`;
        if (isWebGPU) {
            heightToNormal = state._babylonSLtoWGSL(heightToNormal);
        }
        else {
            state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");
        }
        state._emitFunction("heightToNormal", heightToNormal, "// heightToNormal");
        state.compilationString +=
            state._declareOutput(output) +
                ` = heightToNormal(${this.input.associatedVariableName}, ${this.worldPosition.associatedVariableName}, ${this.worldTangent.isConnected ? this.worldTangent.associatedVariableName : `vec3${fPrefix}(0.)`}.xyz, ${this.worldNormal.associatedVariableName});\n`;
        if (this.xyz.hasEndpoints) {
            state.compilationString += state._declareOutput(this.xyz) + ` = ${this.output.associatedVariableName}.xyz;\n`;
        }
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.generateInWorldSpace = ${this.generateInWorldSpace};\n`;
        codeString += `${this._codeVariableName}.automaticNormalizationNormal = ${this.automaticNormalizationNormal};\n`;
        codeString += `${this._codeVariableName}.automaticNormalizationTangent = ${this.automaticNormalizationTangent};\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.generateInWorldSpace = this.generateInWorldSpace;
        serializationObject.automaticNormalizationNormal = this.automaticNormalizationNormal;
        serializationObject.automaticNormalizationTangent = this.automaticNormalizationTangent;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.generateInWorldSpace = serializationObject.generateInWorldSpace;
        this.automaticNormalizationNormal = serializationObject.automaticNormalizationNormal;
        this.automaticNormalizationTangent = serializationObject.automaticNormalizationTangent;
    }
}
__decorate([
    editableInPropertyPage("Generate in world space instead of tangent space", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES", { notifiers: { update: true } })
], HeightToNormalBlock.prototype, "generateInWorldSpace", void 0);
__decorate([
    editableInPropertyPage("Force normalization for the worldNormal input", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES", { notifiers: { update: true } })
], HeightToNormalBlock.prototype, "automaticNormalizationNormal", void 0);
__decorate([
    editableInPropertyPage("Force normalization for the worldTangent input", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES", { notifiers: { update: true } })
], HeightToNormalBlock.prototype, "automaticNormalizationTangent", void 0);
RegisterClass("BABYLON.HeightToNormalBlock", HeightToNormalBlock);
//# sourceMappingURL=heightToNormalBlock.js.map