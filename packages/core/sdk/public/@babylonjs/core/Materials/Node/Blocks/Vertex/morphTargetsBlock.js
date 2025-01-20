import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { VertexBuffer } from "../../../../Buffers/buffer.js";
import { InputBlock } from "../Input/inputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { BindMorphTargetParameters, PrepareDefinesForMorphTargets } from "../../../materialHelper.functions.js";
/**
 * Block used to add morph targets support to vertex shader
 */
export class MorphTargetsBlock extends NodeMaterialBlock {
    /**
     * Create a new MorphTargetsBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Vertex);
        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("tangent", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.tangent.addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Color4 | NodeMaterialBlockConnectionPointTypes.Vector4 | NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("uv2", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("positionOutput", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("normalOutput", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("tangentOutput", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("uvOutput", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("uv2Output", NodeMaterialBlockConnectionPointTypes.Vector2);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MorphTargetsBlock";
    }
    /**
     * Gets the position input component
     */
    get position() {
        return this._inputs[0];
    }
    /**
     * Gets the normal input component
     */
    get normal() {
        return this._inputs[1];
    }
    /**
     * Gets the tangent input component
     */
    get tangent() {
        return this._inputs[2];
    }
    /**
     * Gets the uv input component
     */
    get uv() {
        return this._inputs[3];
    }
    /**
     * Gets the uv2 input component
     */
    get uv2() {
        return this._inputs[4];
    }
    /**
     * Gets the position output component
     */
    get positionOutput() {
        return this._outputs[0];
    }
    /**
     * Gets the normal output component
     */
    get normalOutput() {
        return this._outputs[1];
    }
    /**
     * Gets the tangent output component
     */
    get tangentOutput() {
        return this._outputs[2];
    }
    /**
     * Gets the uv output component
     */
    get uvOutput() {
        return this._outputs[3];
    }
    /**
     * Gets the uv2 output component
     */
    get uv2Output() {
        return this._outputs[4];
    }
    initialize(state) {
        state._excludeVariableName("morphTargetInfluences");
        this._initShaderSourceAsync(state.shaderLanguage);
    }
    async _initShaderSourceAsync(shaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/morphTargetsVertex.js"),
                import("../../../../ShadersWGSL/ShadersInclude/morphTargetsVertexDeclaration.js"),
                import("../../../../ShadersWGSL/ShadersInclude/morphTargetsVertexGlobal.js"),
                import("../../../../ShadersWGSL/ShadersInclude/morphTargetsVertexGlobalDeclaration.js"),
            ]);
        }
        else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/morphTargetsVertex.js"),
                import("../../../../Shaders/ShadersInclude/morphTargetsVertexDeclaration.js"),
                import("../../../../Shaders/ShadersInclude/morphTargetsVertexGlobal.js"),
                import("../../../../Shaders/ShadersInclude/morphTargetsVertexGlobalDeclaration.js"),
            ]);
        }
        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }
    autoConfigure(material, additionalFilteringInfo = () => true) {
        if (!this.position.isConnected) {
            let positionInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "position" && additionalFilteringInfo(b));
            if (!positionInput) {
                positionInput = new InputBlock("position");
                positionInput.setAsAttribute();
            }
            positionInput.output.connectTo(this.position);
        }
        if (!this.normal.isConnected) {
            let normalInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "normal" && additionalFilteringInfo(b));
            if (!normalInput) {
                normalInput = new InputBlock("normal");
                normalInput.setAsAttribute("normal");
            }
            normalInput.output.connectTo(this.normal);
        }
        if (!this.tangent.isConnected) {
            let tangentInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "tangent" && additionalFilteringInfo(b));
            if (!tangentInput) {
                tangentInput = new InputBlock("tangent");
                tangentInput.setAsAttribute("tangent");
            }
            tangentInput.output.connectTo(this.tangent);
        }
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv" && additionalFilteringInfo(b));
            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute("uv");
            }
            uvInput.output.connectTo(this.uv);
        }
        if (!this.uv2.isConnected) {
            let uv2Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv2" && additionalFilteringInfo(b));
            if (!uv2Input) {
                uv2Input = new InputBlock("uv2");
                uv2Input.setAsAttribute("uv2");
            }
            uv2Input.output.connectTo(this.uv2);
        }
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        if (mesh.morphTargetManager) {
            const morphTargetManager = mesh.morphTargetManager;
            if (morphTargetManager?.isUsingTextureForTargets && (morphTargetManager.numMaxInfluencers || morphTargetManager.numInfluencers) !== defines["NUM_MORPH_INFLUENCERS"]) {
                defines.markAsAttributesDirty();
            }
        }
        if (!defines._areAttributesDirty) {
            return;
        }
        PrepareDefinesForMorphTargets(mesh, defines);
    }
    bind(effect, nodeMaterial, mesh) {
        if (mesh && mesh.morphTargetManager && mesh.morphTargetManager.numInfluencers > 0) {
            BindMorphTargetParameters(mesh, effect);
            if (mesh.morphTargetManager.isUsingTextureForTargets) {
                mesh.morphTargetManager._bind(effect);
            }
        }
    }
    replaceRepeatableContent(vertexShaderState, fragmentShaderState, mesh, defines) {
        const position = this.position;
        const normal = this.normal;
        const tangent = this.tangent;
        const uv = this.uv;
        const uv2 = this.uv2;
        const positionOutput = this.positionOutput;
        const normalOutput = this.normalOutput;
        const tangentOutput = this.tangentOutput;
        const uvOutput = this.uvOutput;
        const uv2Output = this.uv2Output;
        const state = vertexShaderState;
        const repeatCount = defines.NUM_MORPH_INFLUENCERS;
        const manager = mesh.morphTargetManager;
        const supportPositions = manager && manager.supportsPositions;
        const supportNormals = manager && manager.supportsNormals;
        const supportTangents = manager && manager.supportsTangents;
        const supportUVs = manager && manager.supportsUVs;
        const supportUV2s = manager && manager.supportsUV2s;
        let injectionCode = "";
        if (manager?.isUsingTextureForTargets && repeatCount > 0) {
            injectionCode += `${state._declareLocalVar("vertexID", NodeMaterialBlockConnectionPointTypes.Float)};\n`;
        }
        injectionCode += `#ifdef MORPHTARGETS\n`;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        const uniformsPrefix = isWebGPU ? "uniforms." : "";
        if (manager?.isUsingTextureForTargets) {
            injectionCode += `for (${isWebGPU ? "var" : "int"} i = 0; i < NUM_MORPH_INFLUENCERS; i++) {\n`;
            injectionCode += `if (i >= ${uniformsPrefix}morphTargetCount) { break; }\n`;
            injectionCode += `vertexID = ${isWebGPU ? "f32(vertexInputs.vertexIndex" : "float(gl_VertexID"}) * ${uniformsPrefix}morphTargetTextureInfo.x;\n`;
            if (supportPositions) {
                injectionCode += `#ifdef MORPHTARGETS_POSITION\n`;
                injectionCode += `${positionOutput.associatedVariableName} += (readVector3FromRawSampler(i, vertexID) - ${position.associatedVariableName}) * ${uniformsPrefix}morphTargetInfluences[i];\n`;
                injectionCode += `#endif\n`;
            }
            injectionCode += `#ifdef MORPHTARGETTEXTURE_HASPOSITIONS\n`;
            injectionCode += `vertexID += 1.0;\n`;
            injectionCode += `#endif\n`;
            if (supportNormals) {
                injectionCode += `#ifdef MORPHTARGETS_NORMAL\n`;
                injectionCode += `${normalOutput.associatedVariableName} += (readVector3FromRawSampler(i, vertexID) - ${normal.associatedVariableName}) * ${uniformsPrefix}morphTargetInfluences[i];\n`;
                injectionCode += `#endif\n`;
            }
            injectionCode += `#ifdef MORPHTARGETTEXTURE_HASNORMALS\n`;
            injectionCode += `vertexID += 1.0;\n`;
            injectionCode += `#endif\n`;
            if (supportUVs) {
                injectionCode += `#ifdef MORPHTARGETS_UV\n`;
                injectionCode += `${uvOutput.associatedVariableName} += (readVector3FromRawSampler(i, vertexID).xy - ${uv.associatedVariableName}) * ${uniformsPrefix}morphTargetInfluences[i];\n`;
                injectionCode += `#endif\n`;
            }
            injectionCode += `#ifdef MORPHTARGETTEXTURE_HASUVS\n`;
            injectionCode += `vertexID += 1.0;\n`;
            injectionCode += `#endif\n`;
            if (supportTangents) {
                injectionCode += `#ifdef MORPHTARGETS_TANGENT\n`;
                injectionCode += `${tangentOutput.associatedVariableName}.xyz += (readVector3FromRawSampler(i, vertexID) - ${tangent.associatedVariableName}.xyz) * ${uniformsPrefix}morphTargetInfluences[i];\n`;
                if (tangent.type === NodeMaterialBlockConnectionPointTypes.Vector4) {
                    injectionCode += `${tangentOutput.associatedVariableName}.w = ${tangent.associatedVariableName}.w;\n`;
                }
                else {
                    injectionCode += `${tangentOutput.associatedVariableName}.w = 1.;\n`;
                }
                injectionCode += `#endif\n`;
            }
            injectionCode += `#ifdef MORPHTARGETTEXTURE_HASTANGENTS\n`;
            injectionCode += `vertexID += 1.0;\n`;
            injectionCode += `#endif\n`;
            if (supportUV2s) {
                injectionCode += `#ifdef MORPHTARGETS_UV2\n`;
                injectionCode += `${uv2Output.associatedVariableName} += (readVector3FromRawSampler(i, vertexID).xy - ${uv2.associatedVariableName}) * morphTargetInfluences[i];\n`;
                injectionCode += `#endif\n`;
            }
            injectionCode += "}\n";
        }
        else {
            for (let index = 0; index < repeatCount; index++) {
                if (supportPositions) {
                    injectionCode += `#ifdef MORPHTARGETS_POSITION\n`;
                    injectionCode += `${positionOutput.associatedVariableName} += (position${index} - ${position.associatedVariableName}) * ${uniformsPrefix}morphTargetInfluences[${index}];\n`;
                    injectionCode += `#endif\n`;
                }
                if (supportNormals && defines["NORMAL"]) {
                    injectionCode += `#ifdef MORPHTARGETS_NORMAL\n`;
                    injectionCode += `${normalOutput.associatedVariableName} += (normal${index} - ${normal.associatedVariableName}) * ${uniformsPrefix}morphTargetInfluences[${index}];\n`;
                    injectionCode += `#endif\n`;
                }
                if (supportUVs && defines["UV1"]) {
                    injectionCode += `#ifdef MORPHTARGETS_UV\n`;
                    injectionCode += `${uvOutput.associatedVariableName}.xy += (uv_${index} - ${uv.associatedVariableName}.xy) * ${uniformsPrefix}morphTargetInfluences[${index}];\n`;
                    injectionCode += `#endif\n`;
                }
                if (supportTangents && defines["TANGENT"]) {
                    injectionCode += `#ifdef MORPHTARGETS_TANGENT\n`;
                    injectionCode += `${tangentOutput.associatedVariableName}.xyz += (tangent${index} - ${tangent.associatedVariableName}.xyz) * ${uniformsPrefix}morphTargetInfluences[${index}];\n`;
                    if (tangent.type === NodeMaterialBlockConnectionPointTypes.Vector4) {
                        injectionCode += `${tangentOutput.associatedVariableName}.w = ${tangent.associatedVariableName}.w;\n`;
                    }
                    else {
                        injectionCode += `${tangentOutput.associatedVariableName}.w = 1.;\n`;
                    }
                    injectionCode += `#endif\n`;
                }
                if (supportUV2s && defines["UV2"]) {
                    injectionCode += `#ifdef MORPHTARGETS_UV2\n`;
                    injectionCode += `${uv2Output.associatedVariableName}.xy += (uv2_${index} - ${uv2.associatedVariableName}.xy) * morphTargetInfluences[${index}];\n`;
                    injectionCode += `#endif\n`;
                }
            }
        }
        injectionCode += `#endif\n`;
        state.compilationString = state.compilationString.replace(this._repeatableContentAnchor, injectionCode);
        if (repeatCount > 0) {
            for (let index = 0; index < repeatCount; index++) {
                if (supportPositions) {
                    state.attributes.push(VertexBuffer.PositionKind + index);
                }
                if (supportNormals && defines["NORMAL"]) {
                    state.attributes.push(VertexBuffer.NormalKind + index);
                }
                if (supportTangents && defines["TANGENT"]) {
                    state.attributes.push(VertexBuffer.TangentKind + index);
                }
                if (supportUVs && defines["UV1"]) {
                    state.attributes.push(VertexBuffer.UVKind + "_" + index);
                }
                if (supportUV2s && defines["UV2"]) {
                    state.attributes.push(VertexBuffer.UV2Kind + "_" + index);
                }
            }
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        // Register for defines
        state.sharedData.blocksWithDefines.push(this);
        // Register for binding
        state.sharedData.bindableBlocks.push(this);
        // Register for repeatable content generation
        state.sharedData.repeatableContentBlocks.push(this);
        // Emit code
        const position = this.position;
        const normal = this.normal;
        const tangent = this.tangent;
        const uv = this.uv;
        const uv2 = this.uv2;
        const positionOutput = this.positionOutput;
        const normalOutput = this.normalOutput;
        const tangentOutput = this.tangentOutput;
        const uvOutput = this.uvOutput;
        const uv2Output = this.uv2Output;
        const comments = `//${this.name}`;
        state.uniforms.push("morphTargetInfluences");
        state.uniforms.push("morphTargetCount");
        state.uniforms.push("morphTargetTextureInfo");
        state.uniforms.push("morphTargetTextureIndices");
        state.samplers.push("morphTargets");
        state._emitFunctionFromInclude("morphTargetsVertexGlobalDeclaration", comments);
        state._emitFunctionFromInclude("morphTargetsVertexDeclaration", comments, {
            repeatKey: "maxSimultaneousMorphTargets",
        });
        state.compilationString += `${state._declareOutput(positionOutput)} = ${position.associatedVariableName};\n`;
        state.compilationString += `#ifdef NORMAL\n`;
        state.compilationString += `${state._declareOutput(normalOutput)} = ${normal.associatedVariableName};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += `${state._declareOutput(normalOutput)} = vec3(0., 0., 0.);\n`;
        state.compilationString += `#endif\n`;
        state.compilationString += `#ifdef TANGENT\n`;
        state.compilationString += `${state._declareOutput(tangentOutput)} = ${tangent.associatedVariableName};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += `${state._declareOutput(tangentOutput)} = vec4(0., 0., 0., 0.);\n`;
        state.compilationString += `#endif\n`;
        state.compilationString += `#ifdef UV1\n`;
        state.compilationString += `${state._declareOutput(uvOutput)} = ${uv.associatedVariableName};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += `${state._declareOutput(uvOutput)} = vec2(0., 0.);\n`;
        state.compilationString += `#endif\n`;
        state.compilationString += `#ifdef UV2\n`;
        state.compilationString += `${state._declareOutput(uv2Output)} = ${uv2.associatedVariableName};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += `${state._declareOutput(uv2Output)} = vec2(0., 0.);\n`;
        state.compilationString += `#endif\n`;
        // Repeatable content
        this._repeatableContentAnchor = state._repeatableContentAnchor;
        state.compilationString += this._repeatableContentAnchor;
        return this;
    }
}
RegisterClass("BABYLON.MorphTargetsBlock", MorphTargetsBlock);
//# sourceMappingURL=morphTargetsBlock.js.map