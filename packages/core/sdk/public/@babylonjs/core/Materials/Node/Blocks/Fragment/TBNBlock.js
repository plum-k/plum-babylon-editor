import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject.js";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues.js";
import { InputBlock } from "../Input/inputBlock.js";
/**
 * Block used to implement TBN matrix
 */
export class TBNBlock extends NodeMaterialBlock {
    /**
     * Create a new TBNBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment, true);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.AutoDetect, false);
        this.normal.addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Color4 | NodeMaterialBlockConnectionPointTypes.Vector4 | NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("tangent", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false);
        this.registerOutput("TBN", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("TBN", this, 1 /* NodeMaterialConnectionPointDirection.Output */, TBNBlock, "TBNBlock"));
        this.registerOutput("row0", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("row1", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("row2", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "TBNBlock";
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("tbnNormal");
        state._excludeVariableName("tbnTangent");
        state._excludeVariableName("tbnBitangent");
        state._excludeVariableName("TBN");
    }
    /**
     * Gets the normal input component
     */
    get normal() {
        return this._inputs[0];
    }
    /**
     * Gets the tangent input component
     */
    get tangent() {
        return this._inputs[1];
    }
    /**
     * Gets the world matrix input component
     */
    get world() {
        return this._inputs[2];
    }
    /**
     * Gets the TBN output component
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    get TBN() {
        return this._outputs[0];
    }
    /**
     * Gets the row0 of the output matrix
     */
    get row0() {
        return this._outputs[1];
    }
    /**
     * Gets the row1 of the output matrix
     */
    get row1() {
        return this._outputs[2];
    }
    /**
     * Gets the row2 of the output matrix
     */
    get row2() {
        return this._outputs[3];
    }
    get target() {
        return NodeMaterialBlockTargets.Fragment;
    }
    set target(value) { }
    autoConfigure(material, additionalFilteringInfo = () => true) {
        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.isSystemValue && b.systemValue === NodeMaterialSystemValues.World && additionalFilteringInfo(b));
            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
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
            let tangentInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "tangent" && b.type === NodeMaterialBlockConnectionPointTypes.Vector4 && additionalFilteringInfo(b));
            if (!tangentInput) {
                tangentInput = new InputBlock("tangent");
                tangentInput.setAsAttribute("tangent");
            }
            tangentInput.output.connectTo(this.tangent);
        }
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        const normal = this.normal;
        const tangent = this.tangent;
        let normalAvailable = normal.isConnected;
        if (normal.connectInputBlock?.isAttribute && !mesh.isVerticesDataPresent(normal.connectInputBlock?.name)) {
            normalAvailable = false;
        }
        let tangentAvailable = tangent.isConnected;
        if (tangent.connectInputBlock?.isAttribute && !mesh.isVerticesDataPresent(tangent.connectInputBlock?.name)) {
            tangentAvailable = false;
        }
        const useTBNBlock = normalAvailable && tangentAvailable;
        defines.setValue("TBNBLOCK", useTBNBlock, true);
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const normal = this.normal;
        const tangent = this.tangent;
        const world = this.world;
        const TBN = this.TBN;
        const row0 = this.row0;
        const row1 = this.row1;
        const row2 = this.row2;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        const mat3 = isWebGPU ? "mat3x3f" : "mat3";
        const fSuffix = isWebGPU ? "f" : "";
        // Fragment
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `
                // ${this.name}
                ${state._declareLocalVar("tbnNormal", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${normal.associatedVariableName}).xyz;
                ${state._declareLocalVar("tbnTangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${tangent.associatedVariableName}.xyz);
                ${state._declareLocalVar("tbnBitangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = cross(tbnNormal, tbnTangent) * ${tangent.associatedVariableName}.w;
                ${isWebGPU ? "var" : "mat3"} ${TBN.associatedVariableName} = ${mat3}(${world.associatedVariableName}[0].xyz, ${world.associatedVariableName}[1].xyz, ${world.associatedVariableName}[2].xyz) * ${mat3}(tbnTangent, tbnBitangent, tbnNormal);
            `;
            if (row0.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(row0) +
                        ` = vec3${fSuffix}(${TBN.associatedVariableName}[0][0], ${TBN.associatedVariableName}[0][1], ${TBN.associatedVariableName}[0][2]);\n`;
            }
            if (row1.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(row1) +
                        ` = vec3${fSuffix}(${TBN.associatedVariableName}[1[0], ${TBN.associatedVariableName}[1][1], ${TBN.associatedVariableName}[1][2]);\n`;
            }
            if (row2.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(row2) +
                        ` = vec3${fSuffix}(${TBN.associatedVariableName}[2][0], ${TBN.associatedVariableName}[2][1], ${TBN.associatedVariableName}[2][2]);\n`;
            }
            state.sharedData.blocksWithDefines.push(this);
        }
        return this;
    }
}
RegisterClass("BABYLON.TBNBlock", TBNBlock);
//# sourceMappingURL=TBNBlock.js.map