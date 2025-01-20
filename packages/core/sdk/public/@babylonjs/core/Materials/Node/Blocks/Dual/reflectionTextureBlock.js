import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { InputBlock } from "../Input/inputBlock.js";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues.js";
import { ReflectionTextureBaseBlock } from "./reflectionTextureBaseBlock.js";
import { Logger } from "../../../../Misc/logger.js";
/**
 * Block used to read a reflection texture from a sampler
 */
export class ReflectionTextureBlock extends ReflectionTextureBaseBlock {
    _onGenerateOnlyFragmentCodeChanged() {
        if (this.position.isConnected) {
            this.generateOnlyFragmentCode = !this.generateOnlyFragmentCode;
            Logger.Error("The position input must not be connected to be able to switch!");
            return false;
        }
        if (this.worldPosition.isConnected) {
            this.generateOnlyFragmentCode = !this.generateOnlyFragmentCode;
            Logger.Error("The worldPosition input must not be connected to be able to switch!");
            return false;
        }
        this._setTarget();
        return true;
    }
    _setTarget() {
        super._setTarget();
        this.getInputByName("position").target = this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.Vertex;
        this.getInputByName("worldPosition").target = this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.Vertex;
    }
    /**
     * Create a new ReflectionTextureBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment); // Flagging as fragment as the normal can be changed by fragment code
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ReflectionTextureBlock";
    }
    /**
     * Gets the world position input component
     */
    get position() {
        return this._inputs[0];
    }
    /**
     * Gets the world position input component
     */
    get worldPosition() {
        return this._inputs[1];
    }
    /**
     * Gets the world normal input component
     */
    get worldNormal() {
        return this._inputs[2];
    }
    /**
     * Gets the world input component
     */
    get world() {
        return this._inputs[3];
    }
    /**
     * Gets the camera (or eye) position component
     */
    get cameraPosition() {
        return this._inputs[4];
    }
    /**
     * Gets the view input component
     */
    get view() {
        return this._inputs[5];
    }
    /**
     * Gets the rgb output component
     */
    get rgb() {
        return this._outputs[0];
    }
    /**
     * Gets the rgba output component
     */
    get rgba() {
        return this._outputs[1];
    }
    /**
     * Gets the r output component
     */
    get r() {
        return this._outputs[2];
    }
    /**
     * Gets the g output component
     */
    get g() {
        return this._outputs[3];
    }
    /**
     * Gets the b output component
     */
    get b() {
        return this._outputs[4];
    }
    /**
     * Gets the a output component
     */
    get a() {
        return this._outputs[5];
    }
    autoConfigure(material, additionalFilteringInfo = () => true) {
        super.autoConfigure(material);
        if (!this.cameraPosition.isConnected) {
            let cameraPositionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.CameraPosition && additionalFilteringInfo(b));
            if (!cameraPositionInput) {
                cameraPositionInput = new InputBlock("cameraPosition");
                cameraPositionInput.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
            }
            cameraPositionInput.output.connectTo(this.cameraPosition);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (!this.texture) {
            state.compilationString += this.writeOutputs(state, `vec4${state.fSuffix}(0.)`);
            return this;
        }
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            state.compilationString += this.handleVertexSide(state);
            return this;
        }
        if (this.generateOnlyFragmentCode) {
            state.compilationString += this.handleVertexSide(state);
        }
        this.handleFragmentSideInits(state);
        const normalWUnit = state._getFreeVariableName("normalWUnit");
        state.compilationString += `${state._declareLocalVar(normalWUnit, NodeMaterialBlockConnectionPointTypes.Vector4)} = normalize(${this.worldNormal.associatedVariableName});\n`;
        state.compilationString += this.handleFragmentSideCodeReflectionCoords(state, normalWUnit);
        state.compilationString += this.handleFragmentSideCodeReflectionColor(state, undefined, "");
        state.compilationString += this.writeOutputs(state, this._reflectionColorName);
        return this;
    }
}
RegisterClass("BABYLON.ReflectionTextureBlock", ReflectionTextureBlock);
//# sourceMappingURL=reflectionTextureBlock.js.map