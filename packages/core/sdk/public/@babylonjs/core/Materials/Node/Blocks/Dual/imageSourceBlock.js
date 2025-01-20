import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { Texture } from "../../../Textures/texture.js";

import { NodeMaterial } from "../../nodeMaterial.js";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject.js";
import { EngineStore } from "../../../../Engines/engineStore.js";
/**
 * Block used to provide an image for a TextureBlock
 */
export class ImageSourceBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the texture associated with the node
     */
    get texture() {
        return this._texture;
    }
    set texture(texture) {
        if (this._texture === texture) {
            return;
        }
        const scene = texture?.getScene() ?? EngineStore.LastCreatedScene;
        if (!texture && scene) {
            scene.markAllMaterialsAsDirty(1, (mat) => {
                return mat.hasTexture(this._texture);
            });
        }
        this._texture = texture;
        if (texture && scene) {
            scene.markAllMaterialsAsDirty(1, (mat) => {
                return mat.hasTexture(texture);
            });
        }
    }
    /**
     * Gets the sampler name associated with this image source
     */
    get samplerName() {
        return this._samplerName;
    }
    /**
     * Creates a new ImageSourceBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);
        this.registerOutput("source", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.VertexAndFragment, new NodeMaterialConnectionPointCustomObject("source", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ImageSourceBlock, "ImageSourceBlock"));
        this.registerOutput("dimensions", NodeMaterialBlockConnectionPointTypes.Vector2);
    }
    bind(effect) {
        if (!this.texture) {
            return;
        }
        effect.setTexture(this._samplerName, this.texture);
    }
    isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }
        return true;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ImageSourceBlock";
    }
    /**
     * Gets the output component
     */
    get source() {
        return this._outputs[0];
    }
    /**
     * Gets the dimension component
     */
    get dimensions() {
        return this._outputs[1];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            this._samplerName = state._getFreeVariableName(this.name + "Texture");
            // Declarations
            state.sharedData.blockingBlocks.push(this);
            state.sharedData.textureBlocks.push(this);
            state.sharedData.bindableBlocks.push(this);
        }
        if (this.dimensions.isConnected) {
            let affect = "";
            if (state.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                affect = `vec2f(textureDimensions(${this._samplerName}, 0).xy)`;
            }
            else {
                affect = `vec2(textureSize(${this._samplerName}, 0).xy)`;
            }
            state.compilationString += `${state._declareOutput(this.dimensions)} = ${affect};\n`;
        }
        state._emit2DSampler(this._samplerName);
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        if (!this.texture) {
            return codeString;
        }
        codeString += `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}", null, ${this.texture.noMipmap}, ${this.texture.invertY}, ${this.texture.samplingMode});\n`;
        codeString += `${this._codeVariableName}.texture.wrapU = ${this.texture.wrapU};\n`;
        codeString += `${this._codeVariableName}.texture.wrapV = ${this.texture.wrapV};\n`;
        codeString += `${this._codeVariableName}.texture.uAng = ${this.texture.uAng};\n`;
        codeString += `${this._codeVariableName}.texture.vAng = ${this.texture.vAng};\n`;
        codeString += `${this._codeVariableName}.texture.wAng = ${this.texture.wAng};\n`;
        codeString += `${this._codeVariableName}.texture.uOffset = ${this.texture.uOffset};\n`;
        codeString += `${this._codeVariableName}.texture.vOffset = ${this.texture.vOffset};\n`;
        codeString += `${this._codeVariableName}.texture.uScale = ${this.texture.uScale};\n`;
        codeString += `${this._codeVariableName}.texture.vScale = ${this.texture.vScale};\n`;
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        if (this.texture && !this.texture.isRenderTarget && this.texture.getClassName() !== "VideoTexture") {
            serializationObject.texture = this.texture.serialize();
        }
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl, urlRewriter) {
        super._deserialize(serializationObject, scene, rootUrl, urlRewriter);
        if (serializationObject.texture && !NodeMaterial.IgnoreTexturesAtLoadTime && serializationObject.texture.url !== undefined) {
            if (serializationObject.texture.url.indexOf("data:") === 0) {
                rootUrl = "";
            }
            else if (urlRewriter) {
                serializationObject.texture.url = urlRewriter(serializationObject.texture.url);
                serializationObject.texture.name = serializationObject.texture.url;
            }
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl);
        }
    }
}
RegisterClass("BABYLON.ImageSourceBlock", ImageSourceBlock);
//# sourceMappingURL=imageSourceBlock.js.map