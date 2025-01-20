import { __decorate } from "../../../../tslib.es6.js";
import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { BindLogDepth } from "../../../materialHelper.functions.js";
/**
 * Color spaces supported by the fragment output block
 */
export var FragmentOutputBlockColorSpace;
(function (FragmentOutputBlockColorSpace) {
    /** Unspecified */
    FragmentOutputBlockColorSpace[FragmentOutputBlockColorSpace["NoColorSpace"] = 0] = "NoColorSpace";
    /** Gamma */
    FragmentOutputBlockColorSpace[FragmentOutputBlockColorSpace["Gamma"] = 1] = "Gamma";
    /** Linear */
    FragmentOutputBlockColorSpace[FragmentOutputBlockColorSpace["Linear"] = 2] = "Linear";
})(FragmentOutputBlockColorSpace || (FragmentOutputBlockColorSpace = {}));
/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment, true);
        /** Gets or sets a boolean indicating if content needs to be converted to gamma space */
        this.convertToGammaSpace = false;
        /** Gets or sets a boolean indicating if content needs to be converted to linear space */
        this.convertToLinearSpace = false;
        /** Gets or sets a boolean indicating if logarithmic depth should be used */
        this.useLogarithmicDepth = false;
        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("glow", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.rgb.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this.rgb.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this.additionalColor.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this.additionalColor.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
    }
    /**
     * Gets or sets the color space used for the block
     */
    get colorSpace() {
        if (this.convertToGammaSpace) {
            return FragmentOutputBlockColorSpace.Gamma;
        }
        if (this.convertToLinearSpace) {
            return FragmentOutputBlockColorSpace.Linear;
        }
        return FragmentOutputBlockColorSpace.NoColorSpace;
    }
    set colorSpace(value) {
        this.convertToGammaSpace = value === FragmentOutputBlockColorSpace.Gamma;
        this.convertToLinearSpace = value === FragmentOutputBlockColorSpace.Linear;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "FragmentOutputBlock";
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("logarithmicDepthConstant");
        state._excludeVariableName("vFragmentDepth");
    }
    /**
     * Gets the rgba input component
     */
    get rgba() {
        return this._inputs[0];
    }
    /**
     * Gets the rgb input component
     */
    get rgb() {
        return this._inputs[1];
    }
    /**
     * Gets the a input component
     */
    get a() {
        return this._inputs[2];
    }
    /**
     * Gets the additionalColor input component (named glow in the UI for now)
     */
    get additionalColor() {
        return this._inputs[3];
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        defines.setValue(this._linearDefineName, this.convertToLinearSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToGammaSpace, true);
        defines.setValue(this._additionalColorDefineName, this.additionalColor.connectedPoint && nodeMaterial._useAdditionalColor, true);
    }
    bind(effect, nodeMaterial, mesh) {
        if ((this.useLogarithmicDepth || nodeMaterial.useLogarithmicDepth) && mesh) {
            BindLogDepth(undefined, effect, mesh.getScene());
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const rgba = this.rgba;
        const rgb = this.rgb;
        const a = this.a;
        const additionalColor = this.additionalColor;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        state.sharedData.hints.needAlphaBlending = rgba.isConnected || a.isConnected;
        state.sharedData.blocksWithDefines.push(this);
        if (this.useLogarithmicDepth || state.sharedData.nodeMaterial.useLogarithmicDepth) {
            state._emitUniformFromString("logarithmicDepthConstant", NodeMaterialBlockConnectionPointTypes.Float);
            state._emitVaryingFromString("vFragmentDepth", NodeMaterialBlockConnectionPointTypes.Float);
            state.sharedData.bindableBlocks.push(this);
        }
        if (additionalColor.connectedPoint) {
            state._excludeVariableName("useAdditionalColor");
            state._emitUniformFromString("useAdditionalColor", NodeMaterialBlockConnectionPointTypes.Float);
            this._additionalColorDefineName = state._getFreeDefineName("USEADDITIONALCOLOR");
        }
        this._linearDefineName = state._getFreeDefineName("CONVERTTOLINEAR");
        this._gammaDefineName = state._getFreeDefineName("CONVERTTOGAMMA");
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);
        let outputString = "gl_FragColor";
        if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            state.compilationString += `var fragmentOutputsColor : vec4<f32>;\r\n`;
            outputString = "fragmentOutputsColor";
        }
        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);
        if (additionalColor.connectedPoint) {
            let aValue = "1.0";
            if (a.connectedPoint) {
                aValue = a.associatedVariableName;
            }
            state.compilationString += `#ifdef ${this._additionalColorDefineName}\n`;
            if (additionalColor.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
                state.compilationString += `${outputString}  = ${vec4}(${additionalColor.associatedVariableName}, ${additionalColor.associatedVariableName}, ${additionalColor.associatedVariableName}, ${aValue});\n`;
            }
            else {
                state.compilationString += `${outputString}  = ${vec4}(${additionalColor.associatedVariableName}, ${aValue});\n`;
            }
            state.compilationString += `#else\n`;
        }
        if (rgba.connectedPoint) {
            if (a.isConnected) {
                state.compilationString += `${outputString} = ${vec4}(${rgba.associatedVariableName}.rgb, ${a.associatedVariableName});\n`;
            }
            else {
                state.compilationString += `${outputString}  = ${rgba.associatedVariableName};\n`;
            }
        }
        else if (rgb.connectedPoint) {
            let aValue = "1.0";
            if (a.connectedPoint) {
                aValue = a.associatedVariableName;
            }
            if (rgb.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
                state.compilationString += `${outputString}  = ${vec4}(${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${aValue});\n`;
            }
            else {
                state.compilationString += `${outputString}  = ${vec4}(${rgb.associatedVariableName}, ${aValue});\n`;
            }
        }
        else {
            state.sharedData.checks.notConnectedNonOptionalInputs.push(rgba);
        }
        if (additionalColor.connectedPoint) {
            state.compilationString += `#endif\n`;
        }
        state.compilationString += `#ifdef ${this._linearDefineName}\n`;
        state.compilationString += `${outputString}  = toLinearSpace(${outputString});\n`;
        state.compilationString += `#endif\n`;
        state.compilationString += `#ifdef ${this._gammaDefineName}\n`;
        state.compilationString += `${outputString}  = toGammaSpace(${outputString});\n`;
        state.compilationString += `#endif\n`;
        if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            state.compilationString += `#if !defined(PREPASS)\r\n`;
            state.compilationString += `fragmentOutputs.color = fragmentOutputsColor;\r\n`;
            state.compilationString += `#endif\r\n`;
        }
        if (this.useLogarithmicDepth || state.sharedData.nodeMaterial.useLogarithmicDepth) {
            const fragDepth = isWebGPU ? "input.vFragmentDepth" : "vFragmentDepth";
            const uniformP = isWebGPU ? "uniforms." : "";
            const output = isWebGPU ? "fragmentOutputs.fragDepth" : "gl_FragDepthEXT";
            state.compilationString += `${output} = log2(${fragDepth}) * ${uniformP}logarithmicDepthConstant * 0.5;\n`;
        }
        state.compilationString += `#if defined(PREPASS)\r\n`;
        state.compilationString += `${isWebGPU ? "fragmentOutputs.fragData0" : "gl_FragData[0]"} = ${outputString};\r\n`;
        state.compilationString += `#endif\r\n`;
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\n`;
        codeString += `${this._codeVariableName}.useLogarithmicDepth = ${this.useLogarithmicDepth};\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        serializationObject.useLogarithmicDepth = this.useLogarithmicDepth;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.convertToGammaSpace = !!serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;
        this.useLogarithmicDepth = serializationObject.useLogarithmicDepth ?? false;
    }
}
__decorate([
    editableInPropertyPage("Use logarithmic depth", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES", { embedded: true })
], FragmentOutputBlock.prototype, "useLogarithmicDepth", void 0);
__decorate([
    editableInPropertyPage("Color space", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "No color space", value: FragmentOutputBlockColorSpace.NoColorSpace },
            { label: "Gamma", value: FragmentOutputBlockColorSpace.Gamma },
            { label: "Linear", value: FragmentOutputBlockColorSpace.Linear },
        ],
    })
], FragmentOutputBlock.prototype, "colorSpace", null);
RegisterClass("BABYLON.FragmentOutputBlock", FragmentOutputBlock);
//# sourceMappingURL=fragmentOutputBlock.js.map