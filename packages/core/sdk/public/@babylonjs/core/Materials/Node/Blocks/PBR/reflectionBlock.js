import { __decorate } from "../../../../tslib.es6.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject.js";
import { ReflectionTextureBaseBlock } from "../Dual/reflectionTextureBaseBlock.js";
import { Texture } from "../../../Textures/texture.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { Logger } from "../../../../Misc/logger.js";
/**
 * Block used to implement the reflection module of the PBR material
 */
export class ReflectionBlock extends ReflectionTextureBaseBlock {
    _onGenerateOnlyFragmentCodeChanged() {
        if (this.position.isConnected) {
            this.generateOnlyFragmentCode = !this.generateOnlyFragmentCode;
            Logger.Error("The position input must not be connected to be able to switch!");
            return false;
        }
        this._setTarget();
        return true;
    }
    _setTarget() {
        super._setTarget();
        this.getInputByName("position").target = this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.Vertex;
        if (this.generateOnlyFragmentCode) {
            this.forceIrradianceInFragment = true;
        }
    }
    /**
     * Create a new ReflectionBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Defines if the material uses spherical harmonics vs spherical polynomials for the
         * diffuse part of the IBL.
         */
        this.useSphericalHarmonics = true;
        /**
         * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
         */
        this.forceIrradianceInFragment = false;
        this._isUnique = true;
        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("reflection", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflection", this, 1 /* NodeMaterialConnectionPointDirection.Output */, ReflectionBlock, "ReflectionBlock"));
        this.position.addExcludedConnectionPointFromAllowedTypes(NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ReflectionBlock";
    }
    /**
     * Gets the position input component
     */
    get position() {
        return this._inputs[0];
    }
    /**
     * Gets the world position input component
     */
    get worldPosition() {
        return this.worldPositionConnectionPoint;
    }
    /**
     * Gets the world normal input component
     */
    get worldNormal() {
        return this.worldNormalConnectionPoint;
    }
    /**
     * Gets the world input component
     */
    get world() {
        return this._inputs[1];
    }
    /**
     * Gets the camera (or eye) position component
     */
    get cameraPosition() {
        return this.cameraPositionConnectionPoint;
    }
    /**
     * Gets the view input component
     */
    get view() {
        return this.viewConnectionPoint;
    }
    /**
     * Gets the color input component
     */
    get color() {
        return this._inputs[2];
    }
    /**
     * Gets the reflection object output component
     */
    get reflection() {
        return this._outputs[0];
    }
    /**
     * Returns true if the block has a texture (either its own texture or the environment texture from the scene, if set)
     */
    get hasTexture() {
        return !!this._getTexture();
    }
    /**
     * Gets the reflection color (either the name of the variable if the color input is connected, else a default value)
     */
    get reflectionColor() {
        return this.color.isConnected ? this.color.associatedVariableName : "vec3(1., 1., 1.)";
    }
    _getTexture() {
        if (this.texture) {
            return this.texture;
        }
        return this._scene.environmentTexture;
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        super.prepareDefines(mesh, nodeMaterial, defines);
        const reflectionTexture = this._getTexture();
        const reflection = reflectionTexture && reflectionTexture.getTextureMatrix;
        defines.setValue("REFLECTION", reflection, true);
        if (!reflection) {
            return;
        }
        defines.setValue(this._defineLODReflectionAlpha, reflectionTexture.lodLevelInAlpha, true);
        defines.setValue(this._defineLinearSpecularReflection, reflectionTexture.linearSpecularLOD, true);
        defines.setValue(this._defineOppositeZ, this._scene.useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ, true);
        defines.setValue("SPHERICAL_HARMONICS", this.useSphericalHarmonics, true);
        defines.setValue("GAMMAREFLECTION", reflectionTexture.gammaSpace, true);
        defines.setValue("RGBDREFLECTION", reflectionTexture.isRGBD, true);
        if (reflectionTexture && reflectionTexture.coordinatesMode !== Texture.SKYBOX_MODE) {
            if (reflectionTexture.isCube) {
                defines.setValue("USESPHERICALFROMREFLECTIONMAP", true);
                defines.setValue("USEIRRADIANCEMAP", false);
                if (this.forceIrradianceInFragment || this._scene.getEngine().getCaps().maxVaryingVectors <= 8) {
                    defines.setValue("USESPHERICALINVERTEX", false);
                }
                else {
                    defines.setValue("USESPHERICALINVERTEX", true);
                }
            }
        }
    }
    bind(effect, nodeMaterial, mesh, subMesh) {
        super.bind(effect, nodeMaterial, mesh);
        const reflectionTexture = this._getTexture();
        if (!reflectionTexture || !subMesh) {
            return;
        }
        if (reflectionTexture.isCube) {
            effect.setTexture(this._cubeSamplerName, reflectionTexture);
        }
        else {
            effect.setTexture(this._2DSamplerName, reflectionTexture);
        }
        const width = reflectionTexture.getSize().width;
        effect.setFloat3(this._vReflectionMicrosurfaceInfosName, width, reflectionTexture.lodGenerationScale, reflectionTexture.lodGenerationOffset);
        effect.setFloat2(this._vReflectionFilteringInfoName, width, Math.log2(width));
        const defines = subMesh.materialDefines;
        const polynomials = reflectionTexture.sphericalPolynomial;
        if (defines.USESPHERICALFROMREFLECTIONMAP && polynomials) {
            if (defines.SPHERICAL_HARMONICS) {
                const preScaledHarmonics = polynomials.preScaledHarmonics;
                effect.setVector3("vSphericalL00", preScaledHarmonics.l00);
                effect.setVector3("vSphericalL1_1", preScaledHarmonics.l1_1);
                effect.setVector3("vSphericalL10", preScaledHarmonics.l10);
                effect.setVector3("vSphericalL11", preScaledHarmonics.l11);
                effect.setVector3("vSphericalL2_2", preScaledHarmonics.l2_2);
                effect.setVector3("vSphericalL2_1", preScaledHarmonics.l2_1);
                effect.setVector3("vSphericalL20", preScaledHarmonics.l20);
                effect.setVector3("vSphericalL21", preScaledHarmonics.l21);
                effect.setVector3("vSphericalL22", preScaledHarmonics.l22);
            }
            else {
                effect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                effect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                effect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                effect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x, polynomials.xx.y - polynomials.zz.y, polynomials.xx.z - polynomials.zz.z);
                effect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x, polynomials.yy.y - polynomials.zz.y, polynomials.yy.z - polynomials.zz.z);
                effect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                effect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                effect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                effect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
            }
        }
    }
    /**
     * Gets the code to inject in the vertex shader
     * @param state current state of the node material building
     * @returns the shader code
     */
    handleVertexSide(state) {
        let code = super.handleVertexSide(state);
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        state._emitFunctionFromInclude("harmonicsFunctions", `//${this.name}`, {
            replaceStrings: [
                { search: /uniform vec3 vSphericalL00;[\s\S]*?uniform vec3 vSphericalL22;/g, replace: "" },
                { search: /uniform vec3 vSphericalX;[\s\S]*?uniform vec3 vSphericalZX;/g, replace: "" },
            ],
        });
        const reflectionVectorName = state._getFreeVariableName("reflectionVector");
        this._vEnvironmentIrradianceName = state._getFreeVariableName("vEnvironmentIrradiance");
        state._emitVaryingFromString(this._vEnvironmentIrradianceName, NodeMaterialBlockConnectionPointTypes.Vector3, "defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)");
        state._emitUniformFromString("vSphericalL00", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL1_1", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL10", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL11", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL2_2", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL2_1", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL20", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL21", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL22", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalX", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalY", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalZ", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalXX_ZZ", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalYY_ZZ", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalZZ", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalXY", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalYZ", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalZX", NodeMaterialBlockConnectionPointTypes.Vector3, "SPHERICAL_HARMONICS", true);
        code += `#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
                ${state._declareLocalVar(reflectionVectorName, NodeMaterialBlockConnectionPointTypes.Vector3)} = (${(isWebGPU ? "uniforms." : "") + this._reflectionMatrixName} * vec4${state.fSuffix}(normalize(${this.worldNormal.associatedVariableName}).xyz, 0)).xyz;
                #ifdef ${this._defineOppositeZ}
                    ${reflectionVectorName}.z *= -1.0;
                #endif
                ${isWebGPU ? "vertexOutputs." : ""}${this._vEnvironmentIrradianceName} = computeEnvironmentIrradiance(${reflectionVectorName});
            #endif\n`;
        return code;
    }
    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @param normalVarName name of the existing variable corresponding to the normal
     * @returns the shader code
     */
    getCode(state, normalVarName) {
        let code = "";
        this.handleFragmentSideInits(state);
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        state._emitFunctionFromInclude("harmonicsFunctions", `//${this.name}`, {
            replaceStrings: [
                { search: /uniform vec3 vSphericalL00;[\s\S]*?uniform vec3 vSphericalL22;/g, replace: "" },
                { search: /uniform vec3 vSphericalX;[\s\S]*?uniform vec3 vSphericalZX;/g, replace: "" },
            ],
        });
        if (!isWebGPU) {
            state._emitFunction("sampleReflection", `
                #ifdef ${this._define3DName}
                    #define sampleReflection(s, c) textureCube(s, c)
                #else
                    #define sampleReflection(s, c) texture2D(s, c)
                #endif\n`, `//${this.name}`);
            state._emitFunction("sampleReflectionLod", `
                #ifdef ${this._define3DName}
                    #define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
                #else
                    #define sampleReflectionLod(s, c, l) texture2DLodEXT(s, c, l)
                #endif\n`, `//${this.name}`);
        }
        const computeReflectionCoordsFunc = isWebGPU
            ? `
            fn computeReflectionCoordsPBR(worldPos: vec4f, worldNormal: vec3f) -> vec3f {
                ${this.handleFragmentSideCodeReflectionCoords(state, "worldNormal", "worldPos", true, true)}
                return ${this._reflectionVectorName};
            }\n`
            : `
            vec3 computeReflectionCoordsPBR(vec4 worldPos, vec3 worldNormal) {
                ${this.handleFragmentSideCodeReflectionCoords(state, "worldNormal", "worldPos", true, true)}
                return ${this._reflectionVectorName};
            }\n`;
        state._emitFunction("computeReflectionCoordsPBR", computeReflectionCoordsFunc, `//${this.name}`);
        this._vReflectionMicrosurfaceInfosName = state._getFreeVariableName("vReflectionMicrosurfaceInfos");
        state._emitUniformFromString(this._vReflectionMicrosurfaceInfosName, NodeMaterialBlockConnectionPointTypes.Vector3);
        this._vReflectionInfosName = state._getFreeVariableName("vReflectionInfos");
        this._vReflectionFilteringInfoName = state._getFreeVariableName("vReflectionFilteringInfo");
        state._emitUniformFromString(this._vReflectionFilteringInfoName, NodeMaterialBlockConnectionPointTypes.Vector2);
        code += `#ifdef REFLECTION
            ${state._declareLocalVar(this._vReflectionInfosName, NodeMaterialBlockConnectionPointTypes.Vector2)} = vec2${state.fSuffix}(1., 0.);

            ${isWebGPU ? "var reflectionOut: reflectionOutParams" : "reflectionOutParams reflectionOut"};

            reflectionOut = reflectionBlock(
                ${this.generateOnlyFragmentCode ? this._worldPositionNameInFragmentOnlyMode : (isWebGPU ? "input." : "") + "v_" + this.worldPosition.associatedVariableName}.xyz
                , ${normalVarName}
                , alphaG
                , ${(isWebGPU ? "uniforms." : "") + this._vReflectionMicrosurfaceInfosName}
                , ${this._vReflectionInfosName}
                , ${this.reflectionColor}
            #ifdef ANISOTROPIC
                ,anisotropicOut
            #endif
            #if defined(${this._defineLODReflectionAlpha}) && !defined(${this._defineSkyboxName})
                ,NdotVUnclamped
            #endif
            #ifdef ${this._defineLinearSpecularReflection}
                , roughness
            #endif
            #ifdef ${this._define3DName}
                , ${this._cubeSamplerName}
                ${isWebGPU ? `, ${this._cubeSamplerName}Sampler` : ""}
            #else
                , ${this._2DSamplerName}
                ${isWebGPU ? `, ${this._2DSamplerName}Sampler` : ""}
            #endif
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                , ${isWebGPU ? "input." : ""}${this._vEnvironmentIrradianceName}
            #endif
            #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
                    , ${this._reflectionMatrixName}
            #endif
            #ifdef USEIRRADIANCEMAP
                , irradianceSampler         // ** not handled **
                ${isWebGPU ? `, irradianceSamplerSampler` : ""}
            #endif
            #ifndef LODBASEDMICROSFURACE
                #ifdef ${this._define3DName}
                    , ${this._cubeSamplerName}
                    ${isWebGPU ? `, ${this._cubeSamplerName}Sampler` : ""}
                    , ${this._cubeSamplerName}
                    ${isWebGPU ? `, ${this._cubeSamplerName}Sampler` : ""}
                #else
                    , ${this._2DSamplerName}
                    ${isWebGPU ? `, ${this._2DSamplerName}Sampler` : ""}
                    , ${this._2DSamplerName}                    
                    ${isWebGPU ? `, ${this._2DSamplerName}Sampler` : ""}
                #endif
            #endif
            #ifdef REALTIME_FILTERING
                , ${this._vReflectionFilteringInfoName}
                #ifdef IBL_CDF_FILTERING
                    , icdfSampler         // ** not handled **
                    ${isWebGPU ? `, icdfSamplerSampler` : ""}
                #endif
            #endif
            );
        #endif\n`;
        return code;
    }
    _buildBlock(state) {
        this._scene = state.sharedData.scene;
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            this._defineLODReflectionAlpha = state._getFreeDefineName("LODINREFLECTIONALPHA");
            this._defineLinearSpecularReflection = state._getFreeDefineName("LINEARSPECULARREFLECTION");
        }
        return this;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        if (this.texture) {
            codeString += `${this._codeVariableName}.texture.gammaSpace = ${this.texture.gammaSpace};\n`;
        }
        codeString += `${this._codeVariableName}.useSphericalHarmonics = ${this.useSphericalHarmonics};\n`;
        codeString += `${this._codeVariableName}.forceIrradianceInFragment = ${this.forceIrradianceInFragment};\n`;
        return codeString;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.useSphericalHarmonics = this.useSphericalHarmonics;
        serializationObject.forceIrradianceInFragment = this.forceIrradianceInFragment;
        serializationObject.gammaSpace = this.texture?.gammaSpace ?? true;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.useSphericalHarmonics = serializationObject.useSphericalHarmonics;
        this.forceIrradianceInFragment = serializationObject.forceIrradianceInFragment;
        if (this.texture) {
            this.texture.gammaSpace = serializationObject.gammaSpace;
        }
    }
}
__decorate([
    editableInPropertyPage("Spherical Harmonics", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { update: true } })
], ReflectionBlock.prototype, "useSphericalHarmonics", void 0);
__decorate([
    editableInPropertyPage("Force irradiance in fragment", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { update: true } })
], ReflectionBlock.prototype, "forceIrradianceInFragment", void 0);
RegisterClass("BABYLON.ReflectionBlock", ReflectionBlock);
//# sourceMappingURL=reflectionBlock.js.map