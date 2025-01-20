import { __decorate } from "../../../../tslib.es6.js";
import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject.js";
/**
 * Block used to implement the sheen module of the PBR material
 */
export class SheenBlock extends NodeMaterialBlock {
    /**
     * Create a new SheenBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        /**
         * If true, the sheen effect is layered above the base BRDF with the albedo-scaling technique.
         * It allows the strength of the sheen effect to not depend on the base color of the material,
         * making it easier to setup and tweak the effect
         */
        this.albedoScaling = false;
        /**
         * Defines if the sheen is linked to the sheen color.
         */
        this.linkSheenWithAlbedo = false;
        this._isUnique = true;
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheen", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("sheen", this, 1 /* NodeMaterialConnectionPointDirection.Output */, SheenBlock, "SheenBlock"));
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("sheenOut");
        state._excludeVariableName("sheenMapData");
        state._excludeVariableName("vSheenColor");
        state._excludeVariableName("vSheenRoughness");
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "SheenBlock";
    }
    /**
     * Gets the intensity input component
     */
    get intensity() {
        return this._inputs[0];
    }
    /**
     * Gets the color input component
     */
    get color() {
        return this._inputs[1];
    }
    /**
     * Gets the roughness input component
     */
    get roughness() {
        return this._inputs[2];
    }
    /**
     * Gets the sheen object output component
     */
    get sheen() {
        return this._outputs[0];
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        super.prepareDefines(mesh, nodeMaterial, defines);
        defines.setValue("SHEEN", true);
        defines.setValue("SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE", true, true);
        defines.setValue("SHEEN_LINKWITHALBEDO", this.linkSheenWithAlbedo, true);
        defines.setValue("SHEEN_ROUGHNESS", this.roughness.isConnected, true);
        defines.setValue("SHEEN_ALBEDOSCALING", this.albedoScaling, true);
    }
    /**
     * Gets the main code of the block (fragment side)
     * @param reflectionBlock instance of a ReflectionBlock null if the code must be generated without an active reflection module
     * @param state define the build state
     * @returns the shader code
     */
    getCode(reflectionBlock, state) {
        let code = "";
        const color = this.color.isConnected ? this.color.associatedVariableName : `vec3${state.fSuffix}(1.)`;
        const intensity = this.intensity.isConnected ? this.intensity.associatedVariableName : "1.";
        const roughness = this.roughness.isConnected ? this.roughness.associatedVariableName : "0.";
        const texture = `vec4${state.fSuffix}(0.)`;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        code = `#ifdef SHEEN
            ${isWebGPU ? "var sheenOut: sheenOutParams" : "sheenOutParams sheenOut"};

            ${state._declareLocalVar("vSheenColor", NodeMaterialBlockConnectionPointTypes.Vector4)} = vec4${state.fSuffix}(${color}, ${intensity});

            sheenOut = sheenBlock(
                vSheenColor
            #ifdef SHEEN_ROUGHNESS
                , ${roughness}
            #endif
                , roughness
            #ifdef SHEEN_TEXTURE
                , ${texture}
                ${isWebGPU ? `, ${texture}Sampler` : ""}
                , 1.0
            #endif
                , reflectance
            #ifdef SHEEN_LINKWITHALBEDO
                , baseColor
                , surfaceAlbedo
            #endif
            #ifdef ENVIRONMENTBRDF
                , NdotV
                , environmentBrdf
            #endif
            #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
                , AARoughnessFactors
                , ${isWebGPU ? "uniforms." : ""}${reflectionBlock?._vReflectionMicrosurfaceInfosName}
                , ${reflectionBlock?._vReflectionInfosName}
                , ${reflectionBlock?.reflectionColor}
                , ${isWebGPU ? "uniforms." : ""}vLightingIntensity
                #ifdef ${reflectionBlock?._define3DName}
                    , ${reflectionBlock?._cubeSamplerName}                                      
                    ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                #else
                    , ${reflectionBlock?._2DSamplerName}
                    ${isWebGPU ? `, ${reflectionBlock?._2DSamplerName}Sampler` : ""}
                #endif
                , reflectionOut.reflectionCoords
                , NdotVUnclamped
                #ifndef LODBASEDMICROSFURACE
                    #ifdef ${reflectionBlock?._define3DName}
                        , ${reflectionBlock?._cubeSamplerName}                        
                        ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                        , ${reflectionBlock?._cubeSamplerName}
                        ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                    #else
                        , ${reflectionBlock?._2DSamplerName}
                        ${isWebGPU ? `, ${reflectionBlock?._2DSamplerName}Sampler` : ""}
                        , ${reflectionBlock?._2DSamplerName}
                        ${isWebGPU ? `, ${reflectionBlock?._2DSamplerName}Sampler` : ""}
                    #endif
                #endif
                #if !defined(${reflectionBlock?._defineSkyboxName}) && defined(RADIANCEOCCLUSION)
                    , seo
                #endif
                #if !defined(${reflectionBlock?._defineSkyboxName}) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(${reflectionBlock?._define3DName})
                    , eho
                #endif
            #endif
            );

            #ifdef SHEEN_LINKWITHALBEDO
                surfaceAlbedo = sheenOut.surfaceAlbedo;
            #endif
        #endif\n`;
        return code;
    }
    _buildBlock(state) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.albedoScaling = ${this.albedoScaling};\n`;
        codeString += `${this._codeVariableName}.linkSheenWithAlbedo = ${this.linkSheenWithAlbedo};\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.albedoScaling = this.albedoScaling;
        serializationObject.linkSheenWithAlbedo = this.linkSheenWithAlbedo;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.albedoScaling = serializationObject.albedoScaling;
        this.linkSheenWithAlbedo = serializationObject.linkSheenWithAlbedo;
    }
}
__decorate([
    editableInPropertyPage("Albedo scaling", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES", { embedded: true, notifiers: { update: true } })
], SheenBlock.prototype, "albedoScaling", void 0);
__decorate([
    editableInPropertyPage("Link sheen with albedo", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES", { embedded: true, notifiers: { update: true } })
], SheenBlock.prototype, "linkSheenWithAlbedo", void 0);
RegisterClass("BABYLON.SheenBlock", SheenBlock);
//# sourceMappingURL=sheenBlock.js.map