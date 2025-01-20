import { __decorate } from "../../../../tslib.es6.js";
import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";

/**
 * Block used to retrieve the depth (zbuffer) of the scene
 * @since 5.0.0
 */
export class SceneDepthBlock extends NodeMaterialBlock {
    /**
     * Create a new SceneDepthBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);
        /**
         * Defines if the depth renderer should be setup in non linear mode
         */
        this.useNonLinearDepth = false;
        /**
         * Defines if the depth renderer should be setup in camera space Z mode (if set, useNonLinearDepth has no effect)
         */
        this.storeCameraSpaceZ = false;
        /**
         * Defines if the depth renderer should be setup in full 32 bits float mode
         */
        this.force32itsFloat = false;
        this._isUnique = true;
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.VertexAndFragment);
        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Vector2 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
        this._inputs[0]._prioritizeVertex = false;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "SceneDepthBlock";
    }
    /**
     * Gets the uv input component
     */
    get uv() {
        return this._inputs[0];
    }
    /**
     * Gets the depth output component
     */
    get depth() {
        return this._outputs[0];
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("textureSampler");
    }
    get target() {
        if (!this.uv.isConnected) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }
        if (this.uv.sourceBlock.isInput) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }
        return NodeMaterialBlockTargets.Fragment;
    }
    _getTexture(scene) {
        const depthRenderer = scene.enableDepthRenderer(undefined, this.useNonLinearDepth, this.force32itsFloat, undefined, this.storeCameraSpaceZ);
        return depthRenderer.getDepthMap();
    }
    bind(effect, nodeMaterial) {
        const texture = this._getTexture(nodeMaterial.getScene());
        effect.setTexture(this._samplerName, texture);
    }
    _injectVertexCode(state) {
        const uvInput = this.uv;
        if (uvInput.connectedPoint.ownerBlock.isInput) {
            const uvInputOwnerBlock = uvInput.connectedPoint.ownerBlock;
            if (!uvInputOwnerBlock.isAttribute) {
                state._emitUniformFromString(uvInput.associatedVariableName, uvInput.type === NodeMaterialBlockConnectionPointTypes.Vector3
                    ? NodeMaterialBlockConnectionPointTypes.Vector3
                    : uvInput.type === NodeMaterialBlockConnectionPointTypes.Vector4
                        ? NodeMaterialBlockConnectionPointTypes.Vector4
                        : NodeMaterialBlockConnectionPointTypes.Vector2);
            }
        }
        this._mainUVName = "vMain" + uvInput.associatedVariableName;
        state._emitVaryingFromString(this._mainUVName, NodeMaterialBlockConnectionPointTypes.Vector2);
        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\n`;
        if (!this._outputs.some((o) => o.isConnectedInVertexShader)) {
            return;
        }
        this._writeTextureRead(state, true);
        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, "r", true);
            }
        }
    }
    _writeTextureRead(state, vertexMode = false) {
        const uvInput = this.uv;
        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }
            const textureReadFunc = state.shaderLanguage === 0 /* ShaderLanguage.GLSL */
                ? `texture2D(${this._samplerName},`
                : `textureSampleLevel(${this._samplerName}, ${this._samplerName + `Sampler`},`;
            const complement = state.shaderLanguage === 0 /* ShaderLanguage.GLSL */ ? "" : ", 0";
            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)}=  ${textureReadFunc} ${uvInput.associatedVariableName}.xy${complement});\n`;
            return;
        }
        const textureReadFunc = state.shaderLanguage === 0 /* ShaderLanguage.GLSL */
            ? `texture2D(${this._samplerName},`
            : `textureSample(${this._samplerName}, ${this._samplerName + `Sampler`},`;
        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${uvInput.associatedVariableName}.xy);\n`;
            return;
        }
        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${this._mainUVName});\n`;
    }
    _writeOutput(state, output, swizzle, vertexMode = false) {
        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }
            state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
            return;
        }
        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
            return;
        }
        state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this._samplerName = state._getFreeVariableName(this.name + "Sampler");
        this._tempTextureRead = state._getFreeVariableName("tempTextureRead");
        if (state.sharedData.bindableBlocks.indexOf(this) < 0) {
            state.sharedData.bindableBlocks.push(this);
        }
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            state._emit2DSampler(this._samplerName);
            this._injectVertexCode(state);
            return;
        }
        // Fragment
        if (!this._outputs.some((o) => o.isConnectedInFragmentShader)) {
            return;
        }
        state._emit2DSampler(this._samplerName);
        this._writeTextureRead(state);
        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, "r");
            }
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.useNonLinearDepth = this.useNonLinearDepth;
        serializationObject.storeCameraSpaceZ = this.storeCameraSpaceZ;
        serializationObject.force32itsFloat = this.force32itsFloat;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.useNonLinearDepth = serializationObject.useNonLinearDepth;
        this.storeCameraSpaceZ = !!serializationObject.storeCameraSpaceZ;
        this.force32itsFloat = serializationObject.force32itsFloat;
    }
}
__decorate([
    editableInPropertyPage("Use non linear depth", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", {
        embedded: true,
        notifiers: {
            activatePreviewCommand: true,
            callback: (scene, block) => {
                const sceneDepthBlock = block;
                let retVal = false;
                if (sceneDepthBlock.useNonLinearDepth) {
                    sceneDepthBlock.storeCameraSpaceZ = false;
                    retVal = true;
                }
                if (scene) {
                    scene.disableDepthRenderer();
                }
                return retVal;
            },
        },
    })
], SceneDepthBlock.prototype, "useNonLinearDepth", void 0);
__decorate([
    editableInPropertyPage("Store Camera space Z", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", {
        notifiers: {
            activatePreviewCommand: true,
            callback: (scene, block) => {
                const sceneDepthBlock = block;
                let retVal = false;
                if (sceneDepthBlock.storeCameraSpaceZ) {
                    sceneDepthBlock.useNonLinearDepth = false;
                    retVal = true;
                }
                if (scene) {
                    scene.disableDepthRenderer();
                }
                return retVal;
            },
        },
    })
], SceneDepthBlock.prototype, "storeCameraSpaceZ", void 0);
__decorate([
    editableInPropertyPage("Force 32 bits float", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", {
        notifiers: { activatePreviewCommand: true, callback: (scene) => scene?.disableDepthRenderer() },
    })
], SceneDepthBlock.prototype, "force32itsFloat", void 0);
RegisterClass("BABYLON.SceneDepthBlock", SceneDepthBlock);
//# sourceMappingURL=sceneDepthBlock.js.map