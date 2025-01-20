import { __decorate } from "../../../../tslib.es6.js";
import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues.js";
import { InputBlock } from "../Input/inputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { Logger } from "../../../../Misc/logger.js";
import { BindLight, BindLights, PrepareDefinesForLight, PrepareDefinesForLights, PrepareUniformsAndSamplersForLight } from "../../../materialHelper.functions.js";
/**
 * Block used to add light in the fragment shader
 */
export class LightBlock extends NodeMaterialBlock {
    static _OnGenerateOnlyFragmentCodeChanged(block, _propertyName) {
        const that = block;
        if (that.worldPosition.isConnected) {
            that.generateOnlyFragmentCode = !that.generateOnlyFragmentCode;
            Logger.Error("The worldPosition input must not be connected to be able to switch!");
            return false;
        }
        that._setTarget();
        return true;
    }
    _setTarget() {
        this._setInitialTarget(this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.VertexAndFragment);
        this.getInputByName("worldPosition").target = this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.Vertex;
    }
    /**
     * Create a new LightBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);
        this._lightId = 0;
        /** Indicates that no code should be generated in the vertex shader. Can be useful in some specific circumstances (like when doing ray marching for eg) */
        this.generateOnlyFragmentCode = false;
        this._isUnique = true;
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("glossiness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("glossPower", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("diffuseColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("specularColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, true);
        this.registerOutput("diffuseOutput", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularOutput", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("shadow", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "LightBlock";
    }
    /**
     * Gets the world position input component
     */
    get worldPosition() {
        return this._inputs[0];
    }
    /**
     * Gets the world normal input component
     */
    get worldNormal() {
        return this._inputs[1];
    }
    /**
     * Gets the camera (or eye) position component
     */
    get cameraPosition() {
        return this._inputs[2];
    }
    /**
     * Gets the glossiness component
     */
    get glossiness() {
        return this._inputs[3];
    }
    /**
     * Gets the glossiness power component
     */
    get glossPower() {
        return this._inputs[4];
    }
    /**
     * Gets the diffuse color component
     */
    get diffuseColor() {
        return this._inputs[5];
    }
    /**
     * Gets the specular color component
     */
    get specularColor() {
        return this._inputs[6];
    }
    /**
     * Gets the view matrix component
     */
    get view() {
        return this._inputs[7];
    }
    /**
     * Gets the diffuse output component
     */
    get diffuseOutput() {
        return this._outputs[0];
    }
    /**
     * Gets the specular output component
     */
    get specularOutput() {
        return this._outputs[1];
    }
    /**
     * Gets the shadow output component
     */
    get shadow() {
        return this._outputs[2];
    }
    initialize(state) {
        this._initShaderSourceAsync(state.shaderLanguage);
    }
    async _initShaderSourceAsync(shaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/lightFragment.js"),
                import("../../../../ShadersWGSL/ShadersInclude/lightUboDeclaration.js"),
                import("../../../../ShadersWGSL/ShadersInclude/lightVxUboDeclaration.js"),
                import("../../../../ShadersWGSL/ShadersInclude/helperFunctions.js"),
                import("../../../../ShadersWGSL/ShadersInclude/lightsFragmentFunctions.js"),
                import("../../../../ShadersWGSL/ShadersInclude/shadowsFragmentFunctions.js"),
                import("../../../../ShadersWGSL/ShadersInclude/shadowsVertex.js"),
            ]);
        }
        else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/lightFragmentDeclaration.js"),
                import("../../../../Shaders/ShadersInclude/lightFragment.js"),
                import("../../../../Shaders/ShadersInclude/lightUboDeclaration.js"),
                import("../../../../Shaders/ShadersInclude/lightVxUboDeclaration.js"),
                import("../../../../Shaders/ShadersInclude/lightVxFragmentDeclaration.js"),
                import("../../../../Shaders/ShadersInclude/helperFunctions.js"),
                import("../../../../Shaders/ShadersInclude/lightsFragmentFunctions.js"),
                import("../../../../Shaders/ShadersInclude/shadowsFragmentFunctions.js"),
                import("../../../../Shaders/ShadersInclude/shadowsVertex.js"),
            ]);
        }
        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
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
    prepareDefines(mesh, nodeMaterial, defines) {
        if (!defines._areLightsDirty) {
            return;
        }
        const scene = mesh.getScene();
        if (!this.light) {
            PrepareDefinesForLights(scene, mesh, defines, true, nodeMaterial.maxSimultaneousLights);
        }
        else {
            const state = {
                needNormals: false,
                needRebuild: false,
                lightmapMode: false,
                shadowEnabled: false,
                specularEnabled: false,
            };
            PrepareDefinesForLight(scene, mesh, this.light, this._lightId, defines, true, state);
            if (state.needRebuild) {
                defines.rebuild();
            }
        }
    }
    updateUniformsAndSamples(state, nodeMaterial, defines, uniformBuffers) {
        for (let lightIndex = 0; lightIndex < nodeMaterial.maxSimultaneousLights; lightIndex++) {
            if (!defines["LIGHT" + lightIndex]) {
                break;
            }
            const onlyUpdateBuffersList = state.uniforms.indexOf("vLightData" + lightIndex) >= 0;
            PrepareUniformsAndSamplersForLight(lightIndex, state.uniforms, state.samplers, defines["PROJECTEDLIGHTTEXTURE" + lightIndex], uniformBuffers, onlyUpdateBuffersList, defines["IESLIGHTTEXTURE" + lightIndex]);
        }
    }
    bind(effect, nodeMaterial, mesh) {
        if (!mesh) {
            return;
        }
        const scene = mesh.getScene();
        if (!this.light) {
            BindLights(scene, mesh, effect, true, nodeMaterial.maxSimultaneousLights);
        }
        else {
            BindLight(this.light, this._lightId, scene, effect, true);
        }
    }
    _injectVertexCode(state) {
        const worldPos = this.worldPosition;
        const comments = `//${this.name}`;
        // Declaration
        if (!this.light) {
            // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightVxUboDeclaration" : "lightVxFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights",
            });
            this._lightId = 0;
            state.sharedData.dynamicUniformBlocks.push(this);
        }
        else {
            this._lightId = (state.counters["lightCounter"] !== undefined ? state.counters["lightCounter"] : -1) + 1;
            state.counters["lightCounter"] = this._lightId;
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightVxUboDeclaration" : "lightVxFragmentDeclaration", comments, {
                replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }],
            }, this._lightId.toString());
        }
        // Inject code in vertex
        const worldPosVaryingName = "v_" + worldPos.associatedVariableName;
        if (state._emitVaryingFromString(worldPosVaryingName, NodeMaterialBlockConnectionPointTypes.Vector4)) {
            state.compilationString += (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "vertexOutputs." : "") + `${worldPosVaryingName} = ${worldPos.associatedVariableName};\n`;
        }
        if (this.light) {
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                replaceStrings: [
                    { search: /{X}/g, replace: this._lightId.toString() },
                    { search: /worldPos/g, replace: worldPos.associatedVariableName },
                ],
            });
        }
        else {
            state.compilationString += `${state._declareLocalVar("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${worldPos.associatedVariableName};\n`;
            if (this.view.isConnected) {
                state.compilationString += `${state._declareLocalVar("view", NodeMaterialBlockConnectionPointTypes.Matrix)} = ${this.view.associatedVariableName};\n`;
            }
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                repeatKey: "maxSimultaneousLights",
            });
        }
    }
    _injectUBODeclaration(state) {
        const comments = `//${this.name}`;
        if (!this.light) {
            // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights",
                substitutionVars: this.generateOnlyFragmentCode ? "varying," : undefined,
            });
        }
        else {
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }],
            }, this._lightId.toString());
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const isWGSL = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        const addF = isWGSL ? "f" : "";
        const comments = `//${this.name}`;
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);
            return;
        }
        if (this.generateOnlyFragmentCode) {
            state.sharedData.dynamicUniformBlocks.push(this);
        }
        // Fragment
        const accessor = isWGSL ? "fragmentInputs." : "";
        state.sharedData.forcedBindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);
        const worldPos = this.worldPosition;
        let worldPosVariableName = worldPos.associatedVariableName;
        if (this.generateOnlyFragmentCode) {
            worldPosVariableName = state._getFreeVariableName("globalWorldPos");
            state._emitFunction("light_globalworldpos", `${state._declareLocalVar(worldPosVariableName, NodeMaterialBlockConnectionPointTypes.Vector3)};\n`, comments);
            state.compilationString += `${worldPosVariableName} = ${worldPos.associatedVariableName}.xyz;\n`;
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                repeatKey: "maxSimultaneousLights",
                substitutionVars: this.generateOnlyFragmentCode ? `worldPos,${worldPos.associatedVariableName}` : undefined,
            });
        }
        else {
            worldPosVariableName = accessor + "v_" + worldPosVariableName + ".xyz";
        }
        state._emitFunctionFromInclude("helperFunctions", comments);
        let replaceString = { search: /vPositionW/g, replace: worldPosVariableName };
        if (isWGSL) {
            replaceString = { search: /fragmentInputs\.vPositionW/g, replace: worldPosVariableName };
        }
        state._emitFunctionFromInclude("lightsFragmentFunctions", comments, {
            replaceStrings: [replaceString],
        });
        state._emitFunctionFromInclude("shadowsFragmentFunctions", comments, {
            replaceStrings: [replaceString],
        });
        this._injectUBODeclaration(state);
        // Code
        if (this._lightId === 0) {
            if (state._registerTempVariable("viewDirectionW")) {
                state.compilationString += `${state._declareLocalVar("viewDirectionW", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${this.cameraPosition.associatedVariableName} - ${worldPosVariableName});\n`;
            }
            state.compilationString += isWGSL ? `var info: lightingInfo;\n` : `lightingInfo info;\n`;
            state.compilationString += `${state._declareLocalVar("shadow", NodeMaterialBlockConnectionPointTypes.Float)} = 1.;\n`;
            state.compilationString += `${state._declareLocalVar("aggShadow", NodeMaterialBlockConnectionPointTypes.Float)} = 0.;\n`;
            state.compilationString += `${state._declareLocalVar("numLights", NodeMaterialBlockConnectionPointTypes.Float)} = 0.;\n`;
            state.compilationString += `${state._declareLocalVar("glossiness", NodeMaterialBlockConnectionPointTypes.Float)} = ${this.glossiness.isConnected ? this.glossiness.associatedVariableName : "1.0"} * ${this.glossPower.isConnected ? this.glossPower.associatedVariableName : "1024.0"};\n`;
            state.compilationString += `${state._declareLocalVar("diffuseBase", NodeMaterialBlockConnectionPointTypes.Vector3)} = vec3${addF}(0., 0., 0.);\n`;
            state.compilationString += `${state._declareLocalVar("specularBase", NodeMaterialBlockConnectionPointTypes.Vector3)}  = vec3${addF}(0., 0., 0.);\n`;
            state.compilationString += `${state._declareLocalVar("normalW", NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this.worldNormal.associatedVariableName}.xyz;\n`;
        }
        if (this.light) {
            let replaceString = { search: /vPositionW/g, replace: worldPosVariableName + ".xyz" };
            if (isWGSL) {
                replaceString = { search: /fragmentInputs\.vPositionW/g, replace: worldPosVariableName + ".xyz" };
            }
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }, replaceString],
            });
        }
        else {
            let substitutionVars = `vPositionW,${worldPosVariableName}.xyz`;
            if (isWGSL) {
                substitutionVars = `fragmentInputs.vPositionW,${worldPosVariableName}.xyz`;
            }
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                repeatKey: "maxSimultaneousLights",
                substitutionVars: substitutionVars,
            });
        }
        if (this._lightId === 0) {
            state.compilationString += `aggShadow = aggShadow / numLights;\n`;
        }
        const diffuseOutput = this.diffuseOutput;
        const specularOutput = this.specularOutput;
        state.compilationString +=
            state._declareOutput(diffuseOutput) + ` = diffuseBase${this.diffuseColor.isConnected ? " * " + this.diffuseColor.associatedVariableName : ""};\n`;
        if (specularOutput.hasEndpoints) {
            state.compilationString +=
                state._declareOutput(specularOutput) + ` = specularBase${this.specularColor.isConnected ? " * " + this.specularColor.associatedVariableName : ""};\n`;
        }
        if (this.shadow.hasEndpoints) {
            state.compilationString += state._declareOutput(this.shadow) + ` = aggShadow;\n`;
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.generateOnlyFragmentCode = this.generateOnlyFragmentCode;
        if (this.light) {
            serializationObject.lightId = this.light.id;
        }
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        if (serializationObject.lightId) {
            this.light = scene.getLightById(serializationObject.lightId);
        }
        this.generateOnlyFragmentCode = serializationObject.generateOnlyFragmentCode;
        this._setTarget();
    }
}
__decorate([
    editableInPropertyPage("Generate only fragment code", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", {
        notifiers: { rebuild: true, update: true, onValidation: LightBlock._OnGenerateOnlyFragmentCodeChanged },
    })
], LightBlock.prototype, "generateOnlyFragmentCode", void 0);
RegisterClass("BABYLON.LightBlock", LightBlock);
//# sourceMappingURL=lightBlock.js.map