import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { InputBlock } from "../Input/inputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { Texture } from "../../../Textures/texture.js";
/**
 * Base block used for the particle texture
 */
export class ParticleTextureBlock extends NodeMaterialBlock {
    /**
     * Create a new ParticleTextureBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this._samplerName = "diffuseSampler";
        /**
         * Gets or sets a boolean indicating if content needs to be converted to gamma space
         */
        this.convertToGammaSpace = false;
        /**
         * Gets or sets a boolean indicating if content needs to be converted to linear space
         */
        this.convertToLinearSpace = false;
        this._isUnique = false;
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.VertexAndFragment);
        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector2 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ParticleTextureBlock";
    }
    /**
     * Gets the uv input component
     */
    get uv() {
        return this._inputs[0];
    }
    /**
     * Gets the rgba output component
     */
    get rgba() {
        return this._outputs[0];
    }
    /**
     * Gets the rgb output component
     */
    get rgb() {
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
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("diffuseSampler");
    }
    autoConfigure(material, additionalFilteringInfo = () => true) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "particle_uv" && additionalFilteringInfo(b));
            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute("particle_uv");
            }
            uvInput.output.connectTo(this.uv);
        }
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        defines.setValue(this._linearDefineName, this.convertToGammaSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToLinearSpace, true);
    }
    isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }
        return true;
    }
    _writeOutput(state, output, swizzle) {
        state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
        state.compilationString += `#ifdef ${this._linearDefineName}\n`;
        state.compilationString += `${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});\n`;
        state.compilationString += `#endif\n`;
        state.compilationString += `#ifdef ${this._gammaDefineName}\n`;
        state.compilationString += `${output.associatedVariableName} = toLinearSpace(${output.associatedVariableName});\n`;
        state.compilationString += `#endif\n`;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }
        this._tempTextureRead = state._getFreeVariableName("tempTextureRead");
        state._emit2DSampler(this._samplerName);
        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);
        this._linearDefineName = state._getFreeDefineName("ISLINEAR");
        this._gammaDefineName = state._getFreeDefineName("ISGAMMA");
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);
        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${state._generateTextureSample(this.uv.associatedVariableName, this._samplerName)};\n`;
        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, output.name);
            }
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        if (this.texture && !this.texture.isRenderTarget) {
            serializationObject.texture = this.texture.serialize();
        }
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;
        if (serializationObject.texture) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl);
        }
    }
}
RegisterClass("BABYLON.ParticleTextureBlock", ParticleTextureBlock);
//# sourceMappingURL=particleTextureBlock.js.map