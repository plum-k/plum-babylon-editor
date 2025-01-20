import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { VertexBuffer } from "../../../../Meshes/buffer.js";
/**
 * Block used for the Gaussian Splatting
 */
export class GaussianSplattingBlock extends NodeMaterialBlock {
    /**
     * Create a new GaussianSplattingBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Vertex);
        this._isUnique = true;
        this.registerInput("splatPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("splatScale", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("projection", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerOutput("splatVertex", NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockTargets.Vertex);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GaussianSplattingBlock";
    }
    /**
     * Gets the position input component
     */
    get splatPosition() {
        return this._inputs[0];
    }
    /**
     * Gets the scale input component
     */
    get splatScale() {
        return this._inputs[1];
    }
    /**
     * Gets the View matrix input component
     */
    get world() {
        return this._inputs[2];
    }
    /**
     * Gets the View matrix input component
     */
    get view() {
        return this._inputs[3];
    }
    /**
     * Gets the projection matrix input component
     */
    get projection() {
        return this._inputs[4];
    }
    /**
     * Gets the splatVertex output component
     */
    get splatVertex() {
        return this._outputs[0];
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("focal");
        state._excludeVariableName("invViewport");
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            return;
        }
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("gaussianSplattingVertexDeclaration", comments);
        state._emitFunctionFromInclude("gaussianSplatting", comments);
        state._emitUniformFromString("focal", NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emitUniformFromString("invViewport", NodeMaterialBlockConnectionPointTypes.Vector2);
        state.attributes.push(VertexBuffer.PositionKind);
        state.sharedData.nodeMaterial.backFaceCulling = false;
        const splatPosition = this.splatPosition;
        const splatScale = this.splatScale;
        const world = this.world;
        const view = this.view;
        const projection = this.projection;
        const output = this.splatVertex;
        const addF = state.fSuffix;
        let splatScaleParameter = `vec2${addF}(1.,1.)`;
        if (splatScale.isConnected) {
            splatScaleParameter = splatScale.associatedVariableName;
        }
        let input = "position";
        let uniforms = "";
        if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            input = "input.position";
            uniforms = ", uniforms.focal, uniforms.invViewport";
        }
        state.compilationString += `${state._declareOutput(output)} = gaussianSplatting(${input}, ${splatPosition.associatedVariableName}, ${splatScaleParameter}, covA, covB, ${world.associatedVariableName}, ${view.associatedVariableName}, ${projection.associatedVariableName}${uniforms});\n`;
        return this;
    }
}
RegisterClass("BABYLON.GaussianSplattingBlock", GaussianSplattingBlock);
//# sourceMappingURL=gaussianSplattingBlock.js.map