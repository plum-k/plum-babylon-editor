import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject.js";

import { ImageSourceBlock } from "../Dual/imageSourceBlock.js";
/**
 * Block used to read from prepass textures
 */
export class PrePassTextureBlock extends NodeMaterialBlock {
    /**
     * The texture associated with the node is the prepass texture
     */
    get texture() {
        return null;
    }
    set texture(value) {
        return;
    }
    /**
     * Creates a new PrePassTextureBlock
     * @param name defines the block name
     * @param target defines the target of that block (VertexAndFragment by default)
     */
    constructor(name, target = NodeMaterialBlockTargets.VertexAndFragment) {
        super(name, target, false);
        this.registerOutput("position", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("position", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
        this.registerOutput("localPosition", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("localPosition", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("depth", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
        this.registerOutput("screenDepth", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("screenDepth", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
        this.registerOutput("normal", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("normal", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
        this.registerOutput("worldNormal", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("worldNormal", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
    }
    /**
     * Returns the sampler name associated with the node connection point
     * @param output defines the connection point to get the associated sampler name
     * @returns
     */
    getSamplerName(output) {
        if (output === this._outputs[0]) {
            return this._positionSamplerName;
        }
        if (output === this._outputs[1]) {
            return this._localPositionSamplerName;
        }
        if (output === this._outputs[2]) {
            return this._depthSamplerName;
        }
        if (output === this._outputs[3]) {
            return this._screenSpaceDepthSamplerName;
        }
        if (output === this._outputs[4]) {
            return this._normalSamplerName;
        }
        if (output === this._outputs[5]) {
            return this._worldNormalSamplerName;
        }
        return "";
    }
    /**
     * Gets the position texture
     */
    get position() {
        return this._outputs[0];
    }
    /**
     * Gets the local position texture
     */
    get localPosition() {
        return this._outputs[1];
    }
    /**
     * Gets the depth texture
     */
    get depth() {
        return this._outputs[2];
    }
    /**
     * Gets the screen depth texture
     */
    get screenDepth() {
        return this._outputs[3];
    }
    /**
     * Gets the normal texture
     */
    get normal() {
        return this._outputs[4];
    }
    /**
     * Gets the world normal texture
     */
    get worldNormal() {
        return this._outputs[5];
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get positionSamplerName() {
        return this._positionSamplerName;
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get localPositionSamplerName() {
        return this._localPositionSamplerName;
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get normalSamplerName() {
        return this._normalSamplerName;
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get worldNormalSamplerName() {
        return this._worldNormalSamplerName;
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get depthSamplerName() {
        return this._depthSamplerName;
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get linearDepthSamplerName() {
        return this._screenSpaceDepthSamplerName;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "PrePassTextureBlock";
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }
        this._positionSamplerName = "prepassPositionSampler";
        this._depthSamplerName = "prepassDepthSampler";
        this._normalSamplerName = "prepassNormalSampler";
        this._worldNormalSamplerName = "prepassWorldNormalSampler";
        this._localPositionSamplerName = "prepassLocalPositionSampler";
        this._screenSpaceDepthSamplerName = "prepassScreenSpaceDepthSampler";
        // Unique sampler names for every prepasstexture block
        state.sharedData.variableNames.prepassPositionSampler = 0;
        state.sharedData.variableNames.prepassDepthSampler = 0;
        state.sharedData.variableNames.prepassNormalSampler = 0;
        state.sharedData.variableNames.prepassWorldNormalSampler = 0;
        state.sharedData.variableNames.prepassLocalPositionSampler = 0;
        state.sharedData.variableNames.prepassScreenSpaceDepthSampler = 0;
        // Declarations
        state.sharedData.textureBlocks.push(this);
        state.sharedData.bindableBlocks.push(this);
        if (this.position.isConnected) {
            state._emit2DSampler(this._positionSamplerName);
        }
        if (this.depth.isConnected) {
            state._emit2DSampler(this._depthSamplerName);
        }
        if (this.normal.isConnected) {
            state._emit2DSampler(this._normalSamplerName);
        }
        if (this.worldNormal.isConnected) {
            state._emit2DSampler(this._worldNormalSamplerName);
        }
        if (this.localPosition.isConnected) {
            state._emit2DSampler(this._localPositionSamplerName);
        }
        if (this.screenDepth.isConnected) {
            state._emit2DSampler(this._screenSpaceDepthSamplerName);
        }
        return this;
    }
    bind(effect, nodeMaterial) {
        const scene = nodeMaterial.getScene();
        const prePassRenderer = scene.enablePrePassRenderer();
        if (!prePassRenderer) {
            return;
        }
        const sceneRT = prePassRenderer.defaultRT;
        if (!sceneRT.textures) {
            return;
        }
        if (this.position.isConnected) {
            effect.setTexture(this._positionSamplerName, sceneRT.textures[prePassRenderer.getIndex(1)]);
        }
        if (this.localPosition.isConnected) {
            effect.setTexture(this._localPositionSamplerName, sceneRT.textures[prePassRenderer.getIndex(9)]);
        }
        if (this.depth.isConnected) {
            effect.setTexture(this._depthSamplerName, sceneRT.textures[prePassRenderer.getIndex(5)]);
        }
        if (this.screenDepth.isConnected) {
            effect.setTexture(this._screenSpaceDepthSamplerName, sceneRT.textures[prePassRenderer.getIndex(10)]);
        }
        if (this.normal.isConnected) {
            effect.setTexture(this._normalSamplerName, sceneRT.textures[prePassRenderer.getIndex(6)]);
        }
        if (this.worldNormal.isConnected) {
            effect.setTexture(this._worldNormalSamplerName, sceneRT.textures[prePassRenderer.getIndex(8)]);
        }
    }
}
RegisterClass("BABYLON.PrePassTextureBlock", PrePassTextureBlock);
//# sourceMappingURL=prePassTextureBlock.js.map