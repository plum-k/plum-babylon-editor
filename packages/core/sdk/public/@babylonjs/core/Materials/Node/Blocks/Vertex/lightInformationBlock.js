import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { PointLight } from "../../../../Lights/pointLight.js";
/**
 * Block used to get data information from a light
 */
export class LightInformationBlock extends NodeMaterialBlock {
    /**
     * Creates a new LightInformationBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerOutput("direction", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("color", NodeMaterialBlockConnectionPointTypes.Color3);
        this.registerOutput("intensity", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowBias", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowNormalBias", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowDepthScale", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowDepthRange", NodeMaterialBlockConnectionPointTypes.Vector2);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "LightInformationBlock";
    }
    /**
     * Gets the world position input component
     */
    get worldPosition() {
        return this._inputs[0];
    }
    /**
     * Gets the direction output component
     */
    get direction() {
        return this._outputs[0];
    }
    /**
     * Gets the direction output component
     */
    get color() {
        return this._outputs[1];
    }
    /**
     * Gets the direction output component
     */
    get intensity() {
        return this._outputs[2];
    }
    /**
     * Gets the shadow bias output component
     */
    get shadowBias() {
        return this._outputs[3];
    }
    /**
     * Gets the shadow normal bias output component
     */
    get shadowNormalBias() {
        return this._outputs[4];
    }
    /**
     * Gets the shadow depth scale component
     */
    get shadowDepthScale() {
        return this._outputs[5];
    }
    /**
     * Gets the shadow depth range component
     */
    get shadowDepthRange() {
        return this._outputs[6];
    }
    bind(effect, nodeMaterial, mesh) {
        if (!mesh) {
            return;
        }
        if (this.light && this.light.isDisposed()) {
            this.light = null;
        }
        let light = this.light;
        const scene = nodeMaterial.getScene();
        if (!light && scene.lights.length) {
            light = this.light = scene.lights[0];
            this._forcePrepareDefines = true;
        }
        if (!light || !light.isEnabled) {
            effect.setFloat3(this._lightDataUniformName, 0, 0, 0);
            effect.setFloat4(this._lightColorUniformName, 0, 0, 0, 0);
            return;
        }
        light.transferToNodeMaterialEffect(effect, this._lightDataUniformName);
        effect.setColor4(this._lightColorUniformName, light.diffuse, light.intensity);
        const generator = light.getShadowGenerator();
        if (this.shadowBias.hasEndpoints || this.shadowNormalBias.hasEndpoints || this.shadowDepthScale.hasEndpoints) {
            if (generator) {
                effect.setFloat3(this._lightShadowUniformName, generator.bias, generator.normalBias, generator.depthScale);
            }
            else {
                effect.setFloat3(this._lightShadowUniformName, 0, 0, 0);
            }
        }
        if (this.shadowDepthRange) {
            if (generator && scene.activeCamera) {
                const shadowLight = light;
                effect.setFloat2(this._lightShadowExtraUniformName, shadowLight.getDepthMinZ(scene.activeCamera), shadowLight.getDepthMinZ(scene.activeCamera) + shadowLight.getDepthMaxZ(scene.activeCamera));
            }
            else {
                effect.setFloat2(this._lightShadowExtraUniformName, 0, 0);
            }
        }
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        if (!defines._areLightsDirty && !this._forcePrepareDefines) {
            return;
        }
        this._forcePrepareDefines = false;
        const light = this.light;
        defines.setValue(this._lightTypeDefineName, light && light instanceof PointLight ? true : false, true);
    }
    _buildBlock(state) {
        super._buildBlock(state);
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);
        const direction = this.direction;
        const color = this.color;
        const intensity = this.intensity;
        const shadowBias = this.shadowBias;
        const shadowNormalBias = this.shadowNormalBias;
        const shadowDepthScale = this.shadowDepthScale;
        const shadowDepthRange = this.shadowDepthRange;
        this._lightDataUniformName = state._getFreeVariableName("lightData");
        this._lightColorUniformName = state._getFreeVariableName("lightColor");
        this._lightShadowUniformName = state._getFreeVariableName("shadowData");
        this._lightShadowExtraUniformName = state._getFreeVariableName("shadowExtraData");
        this._lightTypeDefineName = state._getFreeDefineName("LIGHTPOINTTYPE");
        const uniformAdd = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "uniforms." : "";
        state._emitUniformFromString(this._lightDataUniformName, NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString(this._lightColorUniformName, NodeMaterialBlockConnectionPointTypes.Vector4);
        state.compilationString += `#ifdef ${this._lightTypeDefineName}\n`;
        state.compilationString +=
            state._declareOutput(direction) + ` = normalize(${this.worldPosition.associatedVariableName}.xyz - ${uniformAdd}${this._lightDataUniformName});\n`;
        state.compilationString += `#else\n`;
        state.compilationString += state._declareOutput(direction) + ` = ${uniformAdd}${this._lightDataUniformName};\n`;
        state.compilationString += `#endif\n`;
        state.compilationString += state._declareOutput(color) + ` = ${uniformAdd}${this._lightColorUniformName}.rgb;\n`;
        state.compilationString += state._declareOutput(intensity) + ` = ${uniformAdd}${this._lightColorUniformName}.a;\n`;
        if (shadowBias.hasEndpoints || shadowNormalBias.hasEndpoints || shadowDepthScale.hasEndpoints) {
            state._emitUniformFromString(this._lightShadowUniformName, NodeMaterialBlockConnectionPointTypes.Vector3);
            if (shadowBias.hasEndpoints) {
                state.compilationString += state._declareOutput(shadowBias) + ` = ${uniformAdd}${this._lightShadowUniformName}.x;\n`;
            }
            if (shadowNormalBias.hasEndpoints) {
                state.compilationString += state._declareOutput(shadowNormalBias) + ` = ${uniformAdd}${this._lightShadowUniformName}.y;\n`;
            }
            if (shadowDepthScale.hasEndpoints) {
                state.compilationString += state._declareOutput(shadowDepthScale) + ` = ${uniformAdd}${this._lightShadowUniformName}.z;\n`;
            }
        }
        if (shadowDepthRange.hasEndpoints) {
            state._emitUniformFromString(this._lightShadowExtraUniformName, NodeMaterialBlockConnectionPointTypes.Vector2);
            state.compilationString += state._declareOutput(shadowDepthRange) + ` = ${this._lightShadowUniformName};\n`;
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
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
    }
}
RegisterClass("BABYLON.LightInformationBlock", LightInformationBlock);
//# sourceMappingURL=lightInformationBlock.js.map