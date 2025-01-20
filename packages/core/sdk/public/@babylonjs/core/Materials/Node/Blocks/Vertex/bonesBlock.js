import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { InputBlock } from "../Input/inputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { BindBonesParameters, PrepareDefinesForBones } from "../../../materialHelper.functions.js";
/**
 * Block used to add support for vertex skinning (bones)
 */
export class BonesBlock extends NodeMaterialBlock {
    /**
     * Creates a new BonesBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Vertex);
        this.registerInput("matricesIndices", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("matricesWeights", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("matricesIndicesExtra", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("matricesWeightsExtra", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("boneSampler");
        state._excludeVariableName("boneTextureWidth");
        state._excludeVariableName("mBones");
        state._excludeVariableName("BonesPerMesh");
        this._initShaderSourceAsync(state.shaderLanguage);
    }
    async _initShaderSourceAsync(shaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([import("../../../../ShadersWGSL/ShadersInclude/bonesDeclaration.js"), import("../../../../ShadersWGSL/ShadersInclude/bonesVertex.js")]);
        }
        else {
            await Promise.all([import("../../../../Shaders/ShadersInclude/bonesDeclaration.js"), import("../../../../Shaders/ShadersInclude/bonesVertex.js")]);
        }
        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "BonesBlock";
    }
    /**
     * Gets the matrix indices input component
     */
    get matricesIndices() {
        return this._inputs[0];
    }
    /**
     * Gets the matrix weights input component
     */
    get matricesWeights() {
        return this._inputs[1];
    }
    /**
     * Gets the extra matrix indices input component
     */
    get matricesIndicesExtra() {
        return this._inputs[2];
    }
    /**
     * Gets the extra matrix weights input component
     */
    get matricesWeightsExtra() {
        return this._inputs[3];
    }
    /**
     * Gets the world input component
     */
    get world() {
        return this._inputs[4];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    autoConfigure(material, additionalFilteringInfo = () => true) {
        if (!this.matricesIndices.isConnected) {
            let matricesIndicesInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "matricesIndices" && additionalFilteringInfo(b));
            if (!matricesIndicesInput) {
                matricesIndicesInput = new InputBlock("matricesIndices");
                matricesIndicesInput.setAsAttribute("matricesIndices");
            }
            matricesIndicesInput.output.connectTo(this.matricesIndices);
        }
        if (!this.matricesWeights.isConnected) {
            let matricesWeightsInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "matricesWeights" && additionalFilteringInfo(b));
            if (!matricesWeightsInput) {
                matricesWeightsInput = new InputBlock("matricesWeights");
                matricesWeightsInput.setAsAttribute("matricesWeights");
            }
            matricesWeightsInput.output.connectTo(this.matricesWeights);
        }
        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.World && additionalFilteringInfo(b));
            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
        }
    }
    provideFallbacks(mesh, fallbacks) {
        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            fallbacks.addCPUSkinningFallback(0, mesh);
        }
    }
    bind(effect, nodeMaterial, mesh) {
        BindBonesParameters(mesh, effect);
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        if (!defines._areAttributesDirty) {
            return;
        }
        PrepareDefinesForBones(mesh, defines);
    }
    _buildBlock(state) {
        super._buildBlock(state);
        // Register for compilation fallbacks
        state.sharedData.blocksWithFallbacks.push(this);
        // Register for binding
        state.sharedData.forcedBindableBlocks.push(this);
        // Register for defines
        state.sharedData.blocksWithDefines.push(this);
        // Register internal uniforms and samplers
        state.uniforms.push("boneTextureWidth");
        state.uniforms.push("mBones");
        state.samplers.push("boneSampler");
        // Emit code
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("bonesDeclaration", comments, {
            removeAttributes: true,
            removeUniforms: false,
            removeVaryings: true,
            removeIfDef: false,
        });
        const influenceVariablename = state._getFreeVariableName("influence");
        state.compilationString += state._emitCodeFromInclude("bonesVertex", comments, {
            replaceStrings: [
                {
                    search: /finalWorld=finalWorld\*influence;/,
                    replace: "",
                },
                {
                    search: /influence/gm,
                    replace: influenceVariablename,
                },
            ],
        });
        const output = this._outputs[0];
        const worldInput = this.world;
        state.compilationString += `#if NUM_BONE_INFLUENCERS>0\n`;
        state.compilationString += state._declareOutput(output) + ` = ${worldInput.associatedVariableName} * ${influenceVariablename};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += state._declareOutput(output) + ` = ${worldInput.associatedVariableName};\n`;
        state.compilationString += `#endif\n`;
        return this;
    }
}
RegisterClass("BABYLON.BonesBlock", BonesBlock);
//# sourceMappingURL=bonesBlock.js.map