import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used to output the depth to a shadow map
 */
export class ShadowMapBlock extends NodeMaterialBlock {
    /**
     * Create a new ShadowMapBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("viewProjection", NodeMaterialBlockConnectionPointTypes.Matrix, false);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.worldNormal.addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ShadowMapBlock";
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("vPositionWSM");
        state._excludeVariableName("lightDataSM");
        state._excludeVariableName("biasAndScaleSM");
        state._excludeVariableName("depthValuesSM");
        state._excludeVariableName("clipPos");
        state._excludeVariableName("worldPos");
        state._excludeVariableName("zSM");
        this._initShaderSourceAsync(state.shaderLanguage);
    }
    async _initShaderSourceAsync(shaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/shadowMapVertexMetric.js"),
                import("../../../../ShadersWGSL/ShadersInclude/packingFunctions.js"),
                import("../../../../ShadersWGSL/ShadersInclude/shadowMapFragment.js"),
            ]);
        }
        else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/shadowMapVertexMetric.js"),
                import("../../../../Shaders/ShadersInclude/packingFunctions.js"),
                import("../../../../Shaders/ShadersInclude/shadowMapFragment.js"),
            ]);
        }
        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }
    /**
     * Gets the world position input component
     */
    get worldPosition() {
        return this._inputs[0];
    }
    /**
     * Gets the view x projection input component
     */
    get viewProjection() {
        return this._inputs[1];
    }
    /**
     * Gets the world normal input component
     */
    get worldNormal() {
        return this._inputs[2];
    }
    /**
     * Gets the depth output component
     */
    get depth() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const comments = `//${this.name}`;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        state._emitUniformFromString("biasAndScaleSM", NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString("lightDataSM", NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString("depthValuesSM", NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emitFunctionFromInclude("packingFunctions", comments);
        state.compilationString += `${state._declareLocalVar("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.worldPosition.associatedVariableName};\n`;
        state.compilationString += `${state._declareLocalVar("vPositionWSM", NodeMaterialBlockConnectionPointTypes.Vector3)};\n`;
        state.compilationString += `${state._declareLocalVar("vDepthMetricSM", NodeMaterialBlockConnectionPointTypes.Float)} = 0.0;\n`;
        state.compilationString += `${state._declareLocalVar("zSM", NodeMaterialBlockConnectionPointTypes.Float)};\n`;
        if (this.worldNormal.isConnected) {
            state.compilationString += `${state._declareLocalVar("vNormalW", NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this.worldNormal.associatedVariableName}.xyz;\n`;
            state.compilationString += state._emitCodeFromInclude("shadowMapVertexNormalBias", comments);
        }
        state.compilationString += `${state._declareLocalVar("clipPos", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.viewProjection.associatedVariableName} * worldPos;\n`;
        state.compilationString += state._emitCodeFromInclude("shadowMapVertexMetric", comments, {
            replaceStrings: [
                {
                    search: /gl_Position/g,
                    replace: "clipPos",
                },
                {
                    search: /vertexOutputs.position/g,
                    replace: "clipPos",
                },
            ],
        });
        state.compilationString += state._emitCodeFromInclude("shadowMapFragment", comments, {
            replaceStrings: [
                {
                    search: /return;/g,
                    replace: "",
                },
            ],
        });
        const output = isWebGPU ? "fragmentOutputs.fragDepth" : "gl_FragDepth";
        state.compilationString += `
            #if SM_DEPTHTEXTURE == 1
                #ifdef IS_NDC_HALF_ZRANGE
                    ${output} = (clipPos.z / clipPos.w);
                #else
                    ${output} = (clipPos.z / clipPos.w) * 0.5 + 0.5;
                #endif
            #endif
        `;
        state.compilationString += `${state._declareOutput(this.depth)} = vec3${state.fSuffix}(depthSM, 1., 1.);\n`;
        return this;
    }
}
RegisterClass("BABYLON.ShadowMapBlock", ShadowMapBlock);
//# sourceMappingURL=shadowMapBlock.js.map