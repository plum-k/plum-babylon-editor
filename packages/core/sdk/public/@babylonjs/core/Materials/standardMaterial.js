import { __decorate } from "../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, serializeAsColor3, expandToProperty, serializeAsFresnelParameters, serializeAsTexture } from "../Misc/decorators.js";
import { SmartArray } from "../Misc/smartArray.js";
import { Scene } from "../scene.js";
import { Color3 } from "../Maths/math.color.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { PrePassConfiguration } from "./prePassConfiguration.js";
import { ImageProcessingConfiguration } from "./imageProcessingConfiguration.js";
import { Material } from "../Materials/material.js";
import { MaterialDefines } from "../Materials/materialDefines.js";
import { PushMaterial } from "./pushMaterial.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { MaterialFlags } from "./materialFlags.js";

import { EffectFallbacks } from "./effectFallbacks.js";
import { DetailMapConfiguration } from "./material.detailMapConfiguration.js";
import { addClipPlaneUniforms, bindClipPlane } from "./clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, BindMorphTargetParameters, BindTextureMatrix, HandleFallbacksForShadows, PrepareAttributesForBakedVertexAnimation, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareAttributesForMorphTargets, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMergedUV, PrepareDefinesForMisc, PrepareDefinesForMultiview, PrepareDefinesForOIT, PrepareDefinesForPrePass, PrepareUniformsAndSamplersList, } from "./materialHelper.functions.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { MaterialHelperGeometryRendering } from "./materialHelper.geometryrendering.js";
const onCreatedEffectParameters = { effect: null, subMesh: null };
/** @internal */
export class StandardMaterialDefines extends MaterialDefines {
    /**
     * Initializes the Standard Material defines.
     * @param externalProperties The external properties
     */
    constructor(externalProperties) {
        super(externalProperties);
        this.MAINUV1 = false;
        this.MAINUV2 = false;
        this.MAINUV3 = false;
        this.MAINUV4 = false;
        this.MAINUV5 = false;
        this.MAINUV6 = false;
        this.DIFFUSE = false;
        this.DIFFUSEDIRECTUV = 0;
        this.BAKED_VERTEX_ANIMATION_TEXTURE = false;
        this.AMBIENT = false;
        this.AMBIENTDIRECTUV = 0;
        this.OPACITY = false;
        this.OPACITYDIRECTUV = 0;
        this.OPACITYRGB = false;
        this.REFLECTION = false;
        this.EMISSIVE = false;
        this.EMISSIVEDIRECTUV = 0;
        this.SPECULAR = false;
        this.SPECULARDIRECTUV = 0;
        this.BUMP = false;
        this.BUMPDIRECTUV = 0;
        this.PARALLAX = false;
        this.PARALLAX_RHS = false;
        this.PARALLAXOCCLUSION = false;
        this.SPECULAROVERALPHA = false;
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.ALPHATEST = false;
        this.DEPTHPREPASS = false;
        this.ALPHAFROMDIFFUSE = false;
        this.POINTSIZE = false;
        this.FOG = false;
        this.SPECULARTERM = false;
        this.DIFFUSEFRESNEL = false;
        this.OPACITYFRESNEL = false;
        this.REFLECTIONFRESNEL = false;
        this.REFRACTIONFRESNEL = false;
        this.EMISSIVEFRESNEL = false;
        this.FRESNEL = false;
        this.NORMAL = false;
        this.TANGENT = false;
        this.UV1 = false;
        this.UV2 = false;
        this.UV3 = false;
        this.UV4 = false;
        this.UV5 = false;
        this.UV6 = false;
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.BONETEXTURE = false;
        this.BONES_VELOCITY_ENABLED = false;
        this.INSTANCES = false;
        this.THIN_INSTANCES = false;
        this.INSTANCESCOLOR = false;
        this.GLOSSINESS = false;
        this.ROUGHNESS = false;
        this.EMISSIVEASILLUMINATION = false;
        this.LINKEMISSIVEWITHDIFFUSE = false;
        this.REFLECTIONFRESNELFROMSPECULAR = false;
        this.LIGHTMAP = false;
        this.LIGHTMAPDIRECTUV = 0;
        this.OBJECTSPACE_NORMALMAP = false;
        this.USELIGHTMAPASSHADOWMAP = false;
        this.REFLECTIONMAP_3D = false;
        this.REFLECTIONMAP_SPHERICAL = false;
        this.REFLECTIONMAP_PLANAR = false;
        this.REFLECTIONMAP_CUBIC = false;
        this.USE_LOCAL_REFLECTIONMAP_CUBIC = false;
        this.USE_LOCAL_REFRACTIONMAP_CUBIC = false;
        this.REFLECTIONMAP_PROJECTION = false;
        this.REFLECTIONMAP_SKYBOX = false;
        this.REFLECTIONMAP_EXPLICIT = false;
        this.REFLECTIONMAP_EQUIRECTANGULAR = false;
        this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
        this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
        this.REFLECTIONMAP_OPPOSITEZ = false;
        this.INVERTCUBICMAP = false;
        this.LOGARITHMICDEPTH = false;
        this.REFRACTION = false;
        this.REFRACTIONMAP_3D = false;
        this.REFLECTIONOVERALPHA = false;
        this.TWOSIDEDLIGHTING = false;
        this.SHADOWFLOAT = false;
        this.MORPHTARGETS = false;
        this.MORPHTARGETS_POSITION = false;
        this.MORPHTARGETS_NORMAL = false;
        this.MORPHTARGETS_TANGENT = false;
        this.MORPHTARGETS_UV = false;
        this.MORPHTARGETS_UV2 = false;
        this.MORPHTARGETTEXTURE_HASPOSITIONS = false;
        this.MORPHTARGETTEXTURE_HASNORMALS = false;
        this.MORPHTARGETTEXTURE_HASTANGENTS = false;
        this.MORPHTARGETTEXTURE_HASUVS = false;
        this.MORPHTARGETTEXTURE_HASUV2S = false;
        this.NUM_MORPH_INFLUENCERS = 0;
        this.MORPHTARGETS_TEXTURE = false;
        this.NONUNIFORMSCALING = false; // https://playground.babylonjs.com#V6DWIH
        this.PREMULTIPLYALPHA = false; // https://playground.babylonjs.com#LNVJJ7
        this.ALPHATEST_AFTERALLALPHACOMPUTATIONS = false;
        this.ALPHABLEND = true;
        this.PREPASS = false;
        this.PREPASS_COLOR = false;
        this.PREPASS_COLOR_INDEX = -1;
        this.PREPASS_IRRADIANCE = false;
        this.PREPASS_IRRADIANCE_INDEX = -1;
        this.PREPASS_ALBEDO = false;
        this.PREPASS_ALBEDO_INDEX = -1;
        this.PREPASS_ALBEDO_SQRT = false;
        this.PREPASS_ALBEDO_SQRT_INDEX = -1;
        this.PREPASS_DEPTH = false;
        this.PREPASS_DEPTH_INDEX = -1;
        this.PREPASS_SCREENSPACE_DEPTH = false;
        this.PREPASS_SCREENSPACE_DEPTH_INDEX = -1;
        this.PREPASS_NORMAL = false;
        this.PREPASS_NORMAL_INDEX = -1;
        this.PREPASS_NORMAL_WORLDSPACE = false;
        this.PREPASS_WORLD_NORMAL = false;
        this.PREPASS_WORLD_NORMAL_INDEX = -1;
        this.PREPASS_POSITION = false;
        this.PREPASS_POSITION_INDEX = -1;
        this.PREPASS_LOCAL_POSITION = false;
        this.PREPASS_LOCAL_POSITION_INDEX = -1;
        this.PREPASS_VELOCITY = false;
        this.PREPASS_VELOCITY_INDEX = -1;
        this.PREPASS_VELOCITY_LINEAR = false;
        this.PREPASS_VELOCITY_LINEAR_INDEX = -1;
        this.PREPASS_REFLECTIVITY = false;
        this.PREPASS_REFLECTIVITY_INDEX = -1;
        this.SCENE_MRT_COUNT = 0;
        this.RGBDLIGHTMAP = false;
        this.RGBDREFLECTION = false;
        this.RGBDREFRACTION = false;
        this.IMAGEPROCESSING = false;
        this.VIGNETTE = false;
        this.VIGNETTEBLENDMODEMULTIPLY = false;
        this.VIGNETTEBLENDMODEOPAQUE = false;
        this.TONEMAPPING = 0;
        this.CONTRAST = false;
        this.COLORCURVES = false;
        this.COLORGRADING = false;
        this.COLORGRADING3D = false;
        this.SAMPLER3DGREENDEPTH = false;
        this.SAMPLER3DBGRMAP = false;
        this.DITHER = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.MULTIVIEW = false;
        this.ORDER_INDEPENDENT_TRANSPARENCY = false;
        this.ORDER_INDEPENDENT_TRANSPARENCY_16BITS = false;
        this.CAMERA_ORTHOGRAPHIC = false;
        this.CAMERA_PERSPECTIVE = false;
        /**
         * If the reflection texture on this material is in linear color space
         * @internal
         */
        this.IS_REFLECTION_LINEAR = false;
        /**
         * If the refraction texture on this material is in linear color space
         * @internal
         */
        this.IS_REFRACTION_LINEAR = false;
        this.EXPOSURE = false;
        this.DECAL_AFTER_DETAIL = false;
        this.rebuild();
    }
    setReflectionMode(modeToEnable) {
        const modes = [
            "REFLECTIONMAP_CUBIC",
            "REFLECTIONMAP_EXPLICIT",
            "REFLECTIONMAP_PLANAR",
            "REFLECTIONMAP_PROJECTION",
            "REFLECTIONMAP_PROJECTION",
            "REFLECTIONMAP_SKYBOX",
            "REFLECTIONMAP_SPHERICAL",
            "REFLECTIONMAP_EQUIRECTANGULAR",
            "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
            "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED",
        ];
        for (const mode of modes) {
            this[mode] = mode === modeToEnable;
        }
    }
}
/**
 * This is the default material used in Babylon. It is the best trade off between quality
 * and performances.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
 */
export class StandardMaterial extends PushMaterial {
    /**
     * Gets the image processing configuration used either in this material.
     */
    get imageProcessingConfiguration() {
        return this._imageProcessingConfiguration;
    }
    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    set imageProcessingConfiguration(value) {
        this._attachImageProcessingConfiguration(value);
        // Ensure the effect will be rebuilt.
        this._markAllSubMeshesAsTexturesDirty();
    }
    /**
     * Attaches a new image processing configuration to the Standard Material.
     * @param configuration
     */
    _attachImageProcessingConfiguration(configuration) {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }
        // Detaches observer
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        // Pick the scene configuration if needed
        if (!configuration) {
            this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }
        // Attaches observer
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }
    /**
     * Can this material render to prepass
     */
    get isPrePassCapable() {
        return !this.disableDepthWrite;
    }
    /**
     * Gets whether the color curves effect is enabled.
     */
    get cameraColorCurvesEnabled() {
        return this.imageProcessingConfiguration.colorCurvesEnabled;
    }
    /**
     * Sets whether the color curves effect is enabled.
     */
    set cameraColorCurvesEnabled(value) {
        this.imageProcessingConfiguration.colorCurvesEnabled = value;
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    get cameraColorGradingEnabled() {
        return this.imageProcessingConfiguration.colorGradingEnabled;
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    set cameraColorGradingEnabled(value) {
        this.imageProcessingConfiguration.colorGradingEnabled = value;
    }
    /**
     * Gets whether tonemapping is enabled or not.
     */
    get cameraToneMappingEnabled() {
        return this._imageProcessingConfiguration.toneMappingEnabled;
    }
    /**
     * Sets whether tonemapping is enabled or not
     */
    set cameraToneMappingEnabled(value) {
        this._imageProcessingConfiguration.toneMappingEnabled = value;
    }
    /**
     * The camera exposure used on this material.
     * This property is here and not in the camera to allow controlling exposure without full screen post process.
     * This corresponds to a photographic exposure.
     */
    get cameraExposure() {
        return this._imageProcessingConfiguration.exposure;
    }
    /**
     * The camera exposure used on this material.
     * This property is here and not in the camera to allow controlling exposure without full screen post process.
     * This corresponds to a photographic exposure.
     */
    set cameraExposure(value) {
        this._imageProcessingConfiguration.exposure = value;
    }
    /**
     * Gets The camera contrast used on this material.
     */
    get cameraContrast() {
        return this._imageProcessingConfiguration.contrast;
    }
    /**
     * Sets The camera contrast used on this material.
     */
    set cameraContrast(value) {
        this._imageProcessingConfiguration.contrast = value;
    }
    /**
     * Gets the Color Grading 2D Lookup Texture.
     */
    get cameraColorGradingTexture() {
        return this._imageProcessingConfiguration.colorGradingTexture;
    }
    /**
     * Sets the Color Grading 2D Lookup Texture.
     */
    set cameraColorGradingTexture(value) {
        this._imageProcessingConfiguration.colorGradingTexture = value;
    }
    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    get cameraColorCurves() {
        return this._imageProcessingConfiguration.colorCurves;
    }
    /**
     * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    set cameraColorCurves(value) {
        this._imageProcessingConfiguration.colorCurves = value;
    }
    /**
     * Can this material render to several textures at once
     */
    get canRenderToMRT() {
        return true;
    }
    /**
     * Instantiates a new standard material.
     * This is the default material used in Babylon. It is the best trade off between quality
     * and performances.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
     * @param name Define the name of the material in the scene
     * @param scene Define the scene the material belong to
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name, scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL || StandardMaterial.ForceGLSL);
        this._diffuseTexture = null;
        this._ambientTexture = null;
        this._opacityTexture = null;
        this._reflectionTexture = null;
        this._emissiveTexture = null;
        this._specularTexture = null;
        this._bumpTexture = null;
        this._lightmapTexture = null;
        this._refractionTexture = null;
        /**
         * The color of the material lit by the environmental background lighting.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#ambient-color-example
         */
        this.ambientColor = new Color3(0, 0, 0);
        /**
         * The basic color of the material as viewed under a light.
         */
        this.diffuseColor = new Color3(1, 1, 1);
        /**
         * Define how the color and intensity of the highlight given by the light in the material.
         */
        this.specularColor = new Color3(1, 1, 1);
        /**
         * Define the color of the material as if self lit.
         * This will be mixed in the final result even in the absence of light.
         */
        this.emissiveColor = new Color3(0, 0, 0);
        /**
         * Defines how sharp are the highlights in the material.
         * The bigger the value the sharper giving a more glossy feeling to the result.
         * Reversely, the smaller the value the blurrier giving a more rough feeling to the result.
         */
        this.specularPower = 64;
        this._useAlphaFromDiffuseTexture = false;
        this._useEmissiveAsIllumination = false;
        this._linkEmissiveWithDiffuse = false;
        this._useSpecularOverAlpha = false;
        this._useReflectionOverAlpha = false;
        this._disableLighting = false;
        this._useObjectSpaceNormalMap = false;
        this._useParallax = false;
        this._useParallaxOcclusion = false;
        /**
         * Apply a scaling factor that determine which "depth" the height map should reprensent. A value between 0.05 and 0.1 is reasonnable in Parallax, you can reach 0.2 using Parallax Occlusion.
         */
        this.parallaxScaleBias = 0.05;
        this._roughness = 0;
        /**
         * In case of refraction, define the value of the index of refraction.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
         */
        this.indexOfRefraction = 0.98;
        /**
         * Invert the refraction texture alongside the y axis.
         * It can be useful with procedural textures or probe for instance.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#how-to-obtain-reflections-and-refractions
         */
        this.invertRefractionY = true;
        /**
         * Defines the alpha limits in alpha test mode.
         */
        this.alphaCutOff = 0.4;
        this._useLightmapAsShadowmap = false;
        this._useReflectionFresnelFromSpecular = false;
        this._useGlossinessFromSpecularMapAlpha = false;
        this._maxSimultaneousLights = 4;
        this._invertNormalMapX = false;
        this._invertNormalMapY = false;
        this._twoSidedLighting = false;
        this._applyDecalMapAfterDetailMap = false;
        this._shadersLoaded = false;
        this._renderTargets = new SmartArray(16);
        this._globalAmbientColor = new Color3(0, 0, 0);
        this._cacheHasRenderTargetTextures = false;
        this.detailMap = new DetailMapConfiguration(this);
        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);
        this.prePassConfiguration = new PrePassConfiguration();
        this.getRenderTargetTextures = () => {
            this._renderTargets.reset();
            if (StandardMaterial.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._renderTargets.push(this._reflectionTexture);
            }
            if (StandardMaterial.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
                this._renderTargets.push(this._refractionTexture);
            }
            this._eventInfo.renderTargets = this._renderTargets;
            this._callbackPluginEventFillRenderTargetTextures(this._eventInfo);
            return this._renderTargets;
        };
    }
    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    get hasRenderTargetTextures() {
        if (StandardMaterial.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }
        if (StandardMaterial.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
            return true;
        }
        return this._cacheHasRenderTargetTextures;
    }
    /**
     * Gets the current class name of the material e.g. "StandardMaterial"
     * Mainly use in serialization.
     * @returns the class name
     */
    getClassName() {
        return "StandardMaterial";
    }
    /**
     * Specifies if the material will require alpha blending
     * @returns a boolean specifying if alpha blending is needed
     */
    needAlphaBlending() {
        if (this._disableAlphaBlending) {
            return false;
        }
        return (this.alpha < 1.0 ||
            this._opacityTexture != null ||
            this._shouldUseAlphaFromDiffuseTexture() ||
            (this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled));
    }
    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns a boolean specifying if an alpha test is needed.
     */
    needAlphaTesting() {
        if (this._forceAlphaTest) {
            return true;
        }
        return this._hasAlphaChannel() && (this._transparencyMode == null || this._transparencyMode === Material.MATERIAL_ALPHATEST);
    }
    /**
     * @returns whether or not the alpha value of the diffuse texture should be used for alpha blending.
     */
    _shouldUseAlphaFromDiffuseTexture() {
        return this._diffuseTexture != null && this._diffuseTexture.hasAlpha && this._useAlphaFromDiffuseTexture && this._transparencyMode !== Material.MATERIAL_OPAQUE;
    }
    /**
     * @returns whether or not there is a usable alpha channel for transparency.
     */
    _hasAlphaChannel() {
        return (this._diffuseTexture != null && this._diffuseTexture.hasAlpha) || this._opacityTexture != null;
    }
    /**
     * Get the texture used for alpha test purpose.
     * @returns the diffuse texture in case of the standard material.
     */
    getAlphaTestTexture() {
        return this._diffuseTexture;
    }
    /**
     * Get if the submesh is ready to be used and all its information available.
     * Child classes can use it to update shaders
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    isReadyForSubMesh(mesh, subMesh, useInstances = false) {
        if (!this._uniformBufferLayoutBuilt) {
            this.buildUniformLayout();
        }
        const drawWrapper = subMesh._drawWrapper;
        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            this._callbackPluginEventGeneric(4 /* MaterialPluginEvent.GetDefineNames */, this._eventInfo);
            subMesh.materialDefines = new StandardMaterialDefines(this._eventInfo.defineNames);
        }
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        // Lights
        defines._needNormals = PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
        // Multiview
        PrepareDefinesForMultiview(scene, defines);
        // PrePass
        const oit = this.needAlphaBlendingForMesh(mesh) && this.getScene().useOrderIndependentTransparency;
        PrepareDefinesForPrePass(scene, defines, this.canRenderToMRT && !oit);
        // Order independant transparency
        PrepareDefinesForOIT(scene, defines, oit);
        MaterialHelperGeometryRendering.PrepareDefines(engine.currentRenderPassId, mesh, defines);
        // Textures
        if (defines._areTexturesDirty) {
            this._eventInfo.hasRenderTargetTextures = false;
            this._callbackPluginEventHasRenderTargetTextures(this._eventInfo);
            this._cacheHasRenderTargetTextures = this._eventInfo.hasRenderTargetTextures;
            defines._needUVs = false;
            for (let i = 1; i <= 6; ++i) {
                defines["MAINUV" + i] = false;
            }
            if (scene.texturesEnabled) {
                defines.DIFFUSEDIRECTUV = 0;
                defines.BUMPDIRECTUV = 0;
                defines.AMBIENTDIRECTUV = 0;
                defines.OPACITYDIRECTUV = 0;
                defines.EMISSIVEDIRECTUV = 0;
                defines.SPECULARDIRECTUV = 0;
                defines.LIGHTMAPDIRECTUV = 0;
                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._diffuseTexture, defines, "DIFFUSE");
                    }
                }
                else {
                    defines.DIFFUSE = false;
                }
                if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    if (!this._ambientTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._ambientTexture, defines, "AMBIENT");
                    }
                }
                else {
                    defines.AMBIENT = false;
                }
                if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    if (!this._opacityTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._opacityTexture, defines, "OPACITY");
                        defines.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
                    }
                }
                else {
                    defines.OPACITY = false;
                }
                if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (!this._reflectionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        defines._needNormals = true;
                        defines.REFLECTION = true;
                        defines.ROUGHNESS = this._roughness > 0;
                        defines.REFLECTIONOVERALPHA = this._useReflectionOverAlpha;
                        defines.INVERTCUBICMAP = this._reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE;
                        defines.REFLECTIONMAP_3D = this._reflectionTexture.isCube;
                        defines.REFLECTIONMAP_OPPOSITEZ =
                            defines.REFLECTIONMAP_3D && this.getScene().useRightHandedSystem ? !this._reflectionTexture.invertZ : this._reflectionTexture.invertZ;
                        defines.RGBDREFLECTION = this._reflectionTexture.isRGBD;
                        switch (this._reflectionTexture.coordinatesMode) {
                            case Texture.EXPLICIT_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                                break;
                            case Texture.PLANAR_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_PLANAR");
                                break;
                            case Texture.PROJECTION_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_PROJECTION");
                                break;
                            case Texture.SKYBOX_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_SKYBOX");
                                break;
                            case Texture.SPHERICAL_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                                break;
                            case Texture.EQUIRECTANGULAR_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                                break;
                            case Texture.FIXED_EQUIRECTANGULAR_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                                break;
                            case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                                defines.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                                break;
                            case Texture.CUBIC_MODE:
                            case Texture.INVCUBIC_MODE:
                            default:
                                defines.setReflectionMode("REFLECTIONMAP_CUBIC");
                                break;
                        }
                        defines.USE_LOCAL_REFLECTIONMAP_CUBIC = this._reflectionTexture.boundingBoxSize ? true : false;
                    }
                }
                else {
                    defines.REFLECTION = false;
                    defines.REFLECTIONMAP_OPPOSITEZ = false;
                }
                if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    if (!this._emissiveTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._emissiveTexture, defines, "EMISSIVE");
                    }
                }
                else {
                    defines.EMISSIVE = false;
                }
                if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    if (!this._lightmapTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._lightmapTexture, defines, "LIGHTMAP");
                        defines.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap;
                        defines.RGBDLIGHTMAP = this._lightmapTexture.isRGBD;
                    }
                }
                else {
                    defines.LIGHTMAP = false;
                }
                if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    if (!this._specularTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._specularTexture, defines, "SPECULAR");
                        defines.GLOSSINESS = this._useGlossinessFromSpecularMapAlpha;
                    }
                }
                else {
                    defines.SPECULAR = false;
                }
                if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    // Bump texture can not be not blocking.
                    if (!this._bumpTexture.isReady()) {
                        return false;
                    }
                    else {
                        PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");
                        defines.PARALLAX = this._useParallax;
                        defines.PARALLAX_RHS = scene.useRightHandedSystem;
                        defines.PARALLAXOCCLUSION = this._useParallaxOcclusion;
                    }
                    defines.OBJECTSPACE_NORMALMAP = this._useObjectSpaceNormalMap;
                }
                else {
                    defines.BUMP = false;
                    defines.PARALLAX = false;
                    defines.PARALLAX_RHS = false;
                    defines.PARALLAXOCCLUSION = false;
                }
                if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (!this._refractionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.REFRACTION = true;
                        defines.REFRACTIONMAP_3D = this._refractionTexture.isCube;
                        defines.RGBDREFRACTION = this._refractionTexture.isRGBD;
                        defines.USE_LOCAL_REFRACTIONMAP_CUBIC = this._refractionTexture.boundingBoxSize ? true : false;
                    }
                }
                else {
                    defines.REFRACTION = false;
                }
                defines.TWOSIDEDLIGHTING = !this._backFaceCulling && this._twoSidedLighting;
            }
            else {
                defines.DIFFUSE = false;
                defines.AMBIENT = false;
                defines.OPACITY = false;
                defines.REFLECTION = false;
                defines.EMISSIVE = false;
                defines.LIGHTMAP = false;
                defines.BUMP = false;
                defines.REFRACTION = false;
            }
            defines.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture();
            defines.EMISSIVEASILLUMINATION = this._useEmissiveAsIllumination;
            defines.LINKEMISSIVEWITHDIFFUSE = this._linkEmissiveWithDiffuse;
            defines.SPECULAROVERALPHA = this._useSpecularOverAlpha;
            defines.PREMULTIPLYALPHA = this.alphaMode === 7 || this.alphaMode === 8;
            defines.ALPHATEST_AFTERALLALPHACOMPUTATIONS = this.transparencyMode !== null;
            defines.ALPHABLEND = this.transparencyMode === null || this.needAlphaBlendingForMesh(mesh); // check on null for backward compatibility
        }
        this._eventInfo.isReadyForSubMesh = true;
        this._eventInfo.defines = defines;
        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventIsReadyForSubMesh(this._eventInfo);
        if (!this._eventInfo.isReadyForSubMesh) {
            return false;
        }
        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }
            this._imageProcessingConfiguration.prepareDefines(defines);
            defines.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace;
            defines.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
        }
        if (defines._areFresnelDirty) {
            if (StandardMaterial.FresnelEnabled) {
                // Fresnel
                if (this._diffuseFresnelParameters ||
                    this._opacityFresnelParameters ||
                    this._emissiveFresnelParameters ||
                    this._refractionFresnelParameters ||
                    this._reflectionFresnelParameters) {
                    defines.DIFFUSEFRESNEL = this._diffuseFresnelParameters && this._diffuseFresnelParameters.isEnabled;
                    defines.OPACITYFRESNEL = this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;
                    defines.REFLECTIONFRESNEL = this._reflectionFresnelParameters && this._reflectionFresnelParameters.isEnabled;
                    defines.REFLECTIONFRESNELFROMSPECULAR = this._useReflectionFresnelFromSpecular;
                    defines.REFRACTIONFRESNEL = this._refractionFresnelParameters && this._refractionFresnelParameters.isEnabled;
                    defines.EMISSIVEFRESNEL = this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled;
                    defines._needNormals = true;
                    defines.FRESNEL = true;
                }
            }
            else {
                defines.FRESNEL = false;
            }
        }
        // Misc.
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh) || this._forceAlphaTest, defines, this._applyDecalMapAfterDetailMap);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);
        // External config
        this._eventInfo.defines = defines;
        this._eventInfo.mesh = mesh;
        this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo);
        // Attribs
        PrepareDefinesForAttributes(mesh, defines, true, true, true);
        // External config
        this._callbackPluginEventPrepareDefines(this._eventInfo);
        // Get correct effect
        let forceWasNotReadyPreviously = false;
        if (defines.isDirty) {
            const lightDisposed = defines._areLightsDisposed;
            defines.markAsProcessed();
            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.REFLECTION) {
                fallbacks.addFallback(0, "REFLECTION");
            }
            if (defines.SPECULAR) {
                fallbacks.addFallback(0, "SPECULAR");
            }
            if (defines.BUMP) {
                fallbacks.addFallback(0, "BUMP");
            }
            if (defines.PARALLAX) {
                fallbacks.addFallback(1, "PARALLAX");
            }
            if (defines.PARALLAX_RHS) {
                fallbacks.addFallback(1, "PARALLAX_RHS");
            }
            if (defines.PARALLAXOCCLUSION) {
                fallbacks.addFallback(0, "PARALLAXOCCLUSION");
            }
            if (defines.SPECULAROVERALPHA) {
                fallbacks.addFallback(0, "SPECULAROVERALPHA");
            }
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }
            if (defines.POINTSIZE) {
                fallbacks.addFallback(0, "POINTSIZE");
            }
            if (defines.LOGARITHMICDEPTH) {
                fallbacks.addFallback(0, "LOGARITHMICDEPTH");
            }
            HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);
            if (defines.SPECULARTERM) {
                fallbacks.addFallback(0, "SPECULARTERM");
            }
            if (defines.DIFFUSEFRESNEL) {
                fallbacks.addFallback(1, "DIFFUSEFRESNEL");
            }
            if (defines.OPACITYFRESNEL) {
                fallbacks.addFallback(2, "OPACITYFRESNEL");
            }
            if (defines.REFLECTIONFRESNEL) {
                fallbacks.addFallback(3, "REFLECTIONFRESNEL");
            }
            if (defines.EMISSIVEFRESNEL) {
                fallbacks.addFallback(4, "EMISSIVEFRESNEL");
            }
            if (defines.FRESNEL) {
                fallbacks.addFallback(4, "FRESNEL");
            }
            if (defines.MULTIVIEW) {
                fallbacks.addFallback(0, "MULTIVIEW");
            }
            //Attributes
            const attribs = [VertexBuffer.PositionKind];
            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }
            if (defines.TANGENT) {
                attribs.push(VertexBuffer.TangentKind);
            }
            for (let i = 1; i <= 6; ++i) {
                if (defines["UV" + i]) {
                    attribs.push(`uv${i === 1 ? "" : i}`);
                }
            }
            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            PrepareAttributesForMorphTargets(attribs, mesh, defines);
            PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines);
            let shaderName = "default";
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vAmbientColor",
                "vDiffuseColor",
                "vSpecularColor",
                "vEmissiveColor",
                "visibility",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vDiffuseInfos",
                "vAmbientInfos",
                "vOpacityInfos",
                "vReflectionInfos",
                "vEmissiveInfos",
                "vSpecularInfos",
                "vBumpInfos",
                "vLightmapInfos",
                "vRefractionInfos",
                "mBones",
                "diffuseMatrix",
                "ambientMatrix",
                "opacityMatrix",
                "reflectionMatrix",
                "emissiveMatrix",
                "specularMatrix",
                "bumpMatrix",
                "normalMatrix",
                "lightmapMatrix",
                "refractionMatrix",
                "diffuseLeftColor",
                "diffuseRightColor",
                "opacityParts",
                "reflectionLeftColor",
                "reflectionRightColor",
                "emissiveLeftColor",
                "emissiveRightColor",
                "refractionLeftColor",
                "refractionRightColor",
                "vReflectionPosition",
                "vReflectionSize",
                "vRefractionPosition",
                "vRefractionSize",
                "logarithmicDepthConstant",
                "vTangentSpaceParams",
                "alphaCutOff",
                "boneTextureWidth",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
            ];
            const samplers = [
                "diffuseSampler",
                "ambientSampler",
                "opacitySampler",
                "reflectionCubeSampler",
                "reflection2DSampler",
                "emissiveSampler",
                "specularSampler",
                "bumpSampler",
                "lightmapSampler",
                "refractionCubeSampler",
                "refraction2DSampler",
                "boneSampler",
                "morphTargets",
                "oitDepthSampler",
                "oitFrontColorSampler",
            ];
            const uniformBuffers = ["Material", "Scene", "Mesh"];
            const indexParameters = { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS };
            this._eventInfo.fallbacks = fallbacks;
            this._eventInfo.fallbackRank = 0;
            this._eventInfo.defines = defines;
            this._eventInfo.uniforms = uniforms;
            this._eventInfo.attributes = attribs;
            this._eventInfo.samplers = samplers;
            this._eventInfo.uniformBuffersNames = uniformBuffers;
            this._eventInfo.customCode = undefined;
            this._eventInfo.mesh = mesh;
            this._eventInfo.indexParameters = indexParameters;
            this._callbackPluginEventGeneric(128 /* MaterialPluginEvent.PrepareEffect */, this._eventInfo);
            MaterialHelperGeometryRendering.AddUniformsAndSamplers(uniforms, samplers);
            PrePassConfiguration.AddUniforms(uniforms);
            PrePassConfiguration.AddSamplers(samplers);
            if (ImageProcessingConfiguration) {
                ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
            }
            PrepareUniformsAndSamplersList({
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: this._maxSimultaneousLights,
            });
            addClipPlaneUniforms(uniforms);
            const csnrOptions = {};
            if (this.customShaderNameResolve) {
                shaderName = this.customShaderNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines, attribs, csnrOptions);
            }
            const join = defines.toString();
            const previousEffect = subMesh.effect;
            let effect = scene.getEngine().createEffect(shaderName, {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters,
                processFinalCode: csnrOptions.processFinalCode,
                processCodeAfterIncludes: this._eventInfo.customCode,
                multiTarget: defines.PREPASS,
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: this._shadersLoaded
                    ? undefined
                    : async () => {
                        if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                            await Promise.all([import("../ShadersWGSL/default.vertex.js"), import("../ShadersWGSL/default.fragment.js")]);
                        }
                        else {
                            await Promise.all([import("../Shaders/default.vertex.js"), import("../Shaders/default.fragment.js")]);
                        }
                        this._shadersLoaded = true;
                    },
            }, engine);
            this._eventInfo.customCode = undefined;
            if (effect) {
                if (this._onEffectCreatedObservable) {
                    onCreatedEffectParameters.effect = effect;
                    onCreatedEffectParameters.subMesh = subMesh;
                    this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
                }
                // Use previous effect while new one is compiling
                if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
                    effect = previousEffect;
                    defines.markAsUnprocessed();
                    forceWasNotReadyPreviously = this.isFrozen;
                    if (lightDisposed) {
                        // re register in case it takes more than one frame.
                        defines._areLightsDisposed = true;
                        return false;
                    }
                }
                else {
                    scene.resetCachedMaterial();
                    subMesh.setEffect(effect, defines, this._materialContext);
                }
            }
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = forceWasNotReadyPreviously ? false : true;
        drawWrapper._wasPreviouslyUsingInstances = useInstances;
        this._checkScenePerformancePriority();
        return true;
    }
    /**
     * Builds the material UBO layouts.
     * Used internally during the effect preparation.
     */
    buildUniformLayout() {
        // Order is important !
        const ubo = this._uniformBuffer;
        ubo.addUniform("diffuseLeftColor", 4);
        ubo.addUniform("diffuseRightColor", 4);
        ubo.addUniform("opacityParts", 4);
        ubo.addUniform("reflectionLeftColor", 4);
        ubo.addUniform("reflectionRightColor", 4);
        ubo.addUniform("refractionLeftColor", 4);
        ubo.addUniform("refractionRightColor", 4);
        ubo.addUniform("emissiveLeftColor", 4);
        ubo.addUniform("emissiveRightColor", 4);
        ubo.addUniform("vDiffuseInfos", 2);
        ubo.addUniform("vAmbientInfos", 2);
        ubo.addUniform("vOpacityInfos", 2);
        ubo.addUniform("vReflectionInfos", 2);
        ubo.addUniform("vReflectionPosition", 3);
        ubo.addUniform("vReflectionSize", 3);
        ubo.addUniform("vEmissiveInfos", 2);
        ubo.addUniform("vLightmapInfos", 2);
        ubo.addUniform("vSpecularInfos", 2);
        ubo.addUniform("vBumpInfos", 3);
        ubo.addUniform("diffuseMatrix", 16);
        ubo.addUniform("ambientMatrix", 16);
        ubo.addUniform("opacityMatrix", 16);
        ubo.addUniform("reflectionMatrix", 16);
        ubo.addUniform("emissiveMatrix", 16);
        ubo.addUniform("lightmapMatrix", 16);
        ubo.addUniform("specularMatrix", 16);
        ubo.addUniform("bumpMatrix", 16);
        ubo.addUniform("vTangentSpaceParams", 2);
        ubo.addUniform("pointSize", 1);
        ubo.addUniform("alphaCutOff", 1);
        ubo.addUniform("refractionMatrix", 16);
        ubo.addUniform("vRefractionInfos", 4);
        ubo.addUniform("vRefractionPosition", 3);
        ubo.addUniform("vRefractionSize", 3);
        ubo.addUniform("vSpecularColor", 4);
        ubo.addUniform("vEmissiveColor", 3);
        ubo.addUniform("vDiffuseColor", 4);
        ubo.addUniform("vAmbientColor", 3);
        super.buildUniformLayout();
    }
    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    bindForSubMesh(world, mesh, subMesh) {
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (!defines) {
            return;
        }
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;
        // Matrices Mesh.
        mesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
        mesh.transferToEffect(world);
        // Binding unconditionally
        this._uniformBuffer.bindToEffect(effect, "Material");
        this.prePassConfiguration.bindForSubMesh(this._activeEffect, scene, mesh, world, this.isFrozen);
        MaterialHelperGeometryRendering.Bind(scene.getEngine().currentRenderPassId, this._activeEffect, mesh, world);
        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventHardBindForSubMesh(this._eventInfo);
        // Normal Matrix
        if (defines.OBJECTSPACE_NORMALMAP) {
            world.toNormalMatrix(this._normalMatrix);
            this.bindOnlyNormalMatrix(this._normalMatrix);
        }
        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);
        // Bones
        BindBonesParameters(mesh, effect);
        const ubo = this._uniformBuffer;
        if (mustRebind) {
            this.bindViewProjection(effect);
            if (!ubo.useUbo || !this.isFrozen || !ubo.isSync || subMesh._drawWrapper._forceRebindOnNextCall) {
                if (StandardMaterial.FresnelEnabled && defines.FRESNEL) {
                    // Fresnel
                    if (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled) {
                        ubo.updateColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power);
                        ubo.updateColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias);
                    }
                    if (this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled) {
                        ubo.updateColor4("opacityParts", new Color3(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power);
                    }
                    if (this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled) {
                        ubo.updateColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power);
                        ubo.updateColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias);
                    }
                    if (this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled) {
                        ubo.updateColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power);
                        ubo.updateColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias);
                    }
                    if (this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled) {
                        ubo.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power);
                        ubo.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias);
                    }
                }
                // Textures
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        ubo.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                        BindTextureMatrix(this._diffuseTexture, ubo, "diffuse");
                    }
                    if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                        ubo.updateFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level);
                        BindTextureMatrix(this._ambientTexture, ubo, "ambient");
                    }
                    if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                        ubo.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                        BindTextureMatrix(this._opacityTexture, ubo, "opacity");
                    }
                    if (this._hasAlphaChannel()) {
                        ubo.updateFloat("alphaCutOff", this.alphaCutOff);
                    }
                    if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                        ubo.updateFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness);
                        ubo.updateMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix());
                        if (this._reflectionTexture.boundingBoxSize) {
                            const cubeTexture = this._reflectionTexture;
                            ubo.updateVector3("vReflectionPosition", cubeTexture.boundingBoxPosition);
                            ubo.updateVector3("vReflectionSize", cubeTexture.boundingBoxSize);
                        }
                    }
                    if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                        ubo.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level);
                        BindTextureMatrix(this._emissiveTexture, ubo, "emissive");
                    }
                    if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                        ubo.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level);
                        BindTextureMatrix(this._lightmapTexture, ubo, "lightmap");
                    }
                    if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                        ubo.updateFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level);
                        BindTextureMatrix(this._specularTexture, ubo, "specular");
                    }
                    if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                        ubo.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, this.parallaxScaleBias);
                        BindTextureMatrix(this._bumpTexture, ubo, "bump");
                        if (scene._mirroredCameraPosition) {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1.0 : -1.0, this._invertNormalMapY ? 1.0 : -1.0);
                        }
                        else {
                            ubo.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1.0 : 1.0, this._invertNormalMapY ? -1.0 : 1.0);
                        }
                    }
                    if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                        let depth = 1.0;
                        if (!this._refractionTexture.isCube) {
                            ubo.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix());
                            if (this._refractionTexture.depth) {
                                depth = this._refractionTexture.depth;
                            }
                        }
                        ubo.updateFloat4("vRefractionInfos", this._refractionTexture.level, this.indexOfRefraction, depth, this.invertRefractionY ? -1 : 1);
                        if (this._refractionTexture.boundingBoxSize) {
                            const cubeTexture = this._refractionTexture;
                            ubo.updateVector3("vRefractionPosition", cubeTexture.boundingBoxPosition);
                            ubo.updateVector3("vRefractionSize", cubeTexture.boundingBoxSize);
                        }
                    }
                }
                // Point size
                if (this.pointsCloud) {
                    ubo.updateFloat("pointSize", this.pointSize);
                }
                ubo.updateColor4("vSpecularColor", this.specularColor, this.specularPower);
                ubo.updateColor3("vEmissiveColor", StandardMaterial.EmissiveTextureEnabled ? this.emissiveColor : Color3.BlackReadOnly);
                ubo.updateColor4("vDiffuseColor", this.diffuseColor, this.alpha);
                scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);
                ubo.updateColor3("vAmbientColor", this._globalAmbientColor);
            }
            // Textures
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    effect.setTexture("diffuseSampler", this._diffuseTexture);
                }
                if (this._ambientTexture && StandardMaterial.AmbientTextureEnabled) {
                    effect.setTexture("ambientSampler", this._ambientTexture);
                }
                if (this._opacityTexture && StandardMaterial.OpacityTextureEnabled) {
                    effect.setTexture("opacitySampler", this._opacityTexture);
                }
                if (this._reflectionTexture && StandardMaterial.ReflectionTextureEnabled) {
                    if (this._reflectionTexture.isCube) {
                        effect.setTexture("reflectionCubeSampler", this._reflectionTexture);
                    }
                    else {
                        effect.setTexture("reflection2DSampler", this._reflectionTexture);
                    }
                }
                if (this._emissiveTexture && StandardMaterial.EmissiveTextureEnabled) {
                    effect.setTexture("emissiveSampler", this._emissiveTexture);
                }
                if (this._lightmapTexture && StandardMaterial.LightmapTextureEnabled) {
                    effect.setTexture("lightmapSampler", this._lightmapTexture);
                }
                if (this._specularTexture && StandardMaterial.SpecularTextureEnabled) {
                    effect.setTexture("specularSampler", this._specularTexture);
                }
                if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                    effect.setTexture("bumpSampler", this._bumpTexture);
                }
                if (this._refractionTexture && StandardMaterial.RefractionTextureEnabled) {
                    if (this._refractionTexture.isCube) {
                        effect.setTexture("refractionCubeSampler", this._refractionTexture);
                    }
                    else {
                        effect.setTexture("refraction2DSampler", this._refractionTexture);
                    }
                }
            }
            // OIT with depth peeling
            if (this.getScene().useOrderIndependentTransparency && this.needAlphaBlendingForMesh(mesh)) {
                this.getScene().depthPeelingRenderer.bind(effect);
            }
            this._eventInfo.subMesh = subMesh;
            this._callbackPluginEventBindForSubMesh(this._eventInfo);
            // Clip plane
            bindClipPlane(effect, this, scene);
            // Colors
            this.bindEyePosition(effect);
        }
        else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }
        if (mustRebind || !this.isFrozen) {
            // Lights
            if (scene.lightsEnabled && !this._disableLighting) {
                BindLights(scene, mesh, effect, defines, this._maxSimultaneousLights);
            }
            // View
            if ((scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) ||
                this._reflectionTexture ||
                this._refractionTexture ||
                mesh.receiveShadows ||
                defines.PREPASS) {
                this.bindView(effect);
            }
            // Fog
            BindFogParameters(scene, mesh, effect);
            // Morph targets
            if (defines.NUM_MORPH_INFLUENCERS) {
                BindMorphTargetParameters(mesh, effect);
            }
            if (defines.BAKED_VERTEX_ANIMATION_TEXTURE) {
                mesh.bakedVertexAnimationManager?.bind(effect, defines.INSTANCES);
            }
            // Log. depth
            if (this.useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
            // image processing
            if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
        ubo.update();
    }
    /**
     * Get the list of animatables in the material.
     * @returns the list of animatables object used in the material
     */
    getAnimatables() {
        const results = super.getAnimatables();
        if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
            results.push(this._diffuseTexture);
        }
        if (this._ambientTexture && this._ambientTexture.animations && this._ambientTexture.animations.length > 0) {
            results.push(this._ambientTexture);
        }
        if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
            results.push(this._opacityTexture);
        }
        if (this._reflectionTexture && this._reflectionTexture.animations && this._reflectionTexture.animations.length > 0) {
            results.push(this._reflectionTexture);
        }
        if (this._emissiveTexture && this._emissiveTexture.animations && this._emissiveTexture.animations.length > 0) {
            results.push(this._emissiveTexture);
        }
        if (this._specularTexture && this._specularTexture.animations && this._specularTexture.animations.length > 0) {
            results.push(this._specularTexture);
        }
        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            results.push(this._bumpTexture);
        }
        if (this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0) {
            results.push(this._lightmapTexture);
        }
        if (this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0) {
            results.push(this._refractionTexture);
        }
        return results;
    }
    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
        }
        if (this._ambientTexture) {
            activeTextures.push(this._ambientTexture);
        }
        if (this._opacityTexture) {
            activeTextures.push(this._opacityTexture);
        }
        if (this._reflectionTexture) {
            activeTextures.push(this._reflectionTexture);
        }
        if (this._emissiveTexture) {
            activeTextures.push(this._emissiveTexture);
        }
        if (this._specularTexture) {
            activeTextures.push(this._specularTexture);
        }
        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }
        if (this._lightmapTexture) {
            activeTextures.push(this._lightmapTexture);
        }
        if (this._refractionTexture) {
            activeTextures.push(this._refractionTexture);
        }
        return activeTextures;
    }
    /**
     * Specifies if the material uses a texture
     * @param texture defines the texture to check against the material
     * @returns a boolean specifying if the material uses the texture
     */
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this._diffuseTexture === texture) {
            return true;
        }
        if (this._ambientTexture === texture) {
            return true;
        }
        if (this._opacityTexture === texture) {
            return true;
        }
        if (this._reflectionTexture === texture) {
            return true;
        }
        if (this._emissiveTexture === texture) {
            return true;
        }
        if (this._specularTexture === texture) {
            return true;
        }
        if (this._bumpTexture === texture) {
            return true;
        }
        if (this._lightmapTexture === texture) {
            return true;
        }
        if (this._refractionTexture === texture) {
            return true;
        }
        return false;
    }
    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     */
    dispose(forceDisposeEffect, forceDisposeTextures) {
        if (forceDisposeTextures) {
            this._diffuseTexture?.dispose();
            this._ambientTexture?.dispose();
            this._opacityTexture?.dispose();
            this._reflectionTexture?.dispose();
            this._emissiveTexture?.dispose();
            this._specularTexture?.dispose();
            this._bumpTexture?.dispose();
            this._lightmapTexture?.dispose();
            this._refractionTexture?.dispose();
        }
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        super.dispose(forceDisposeEffect, forceDisposeTextures);
    }
    /**
     * Makes a duplicate of the material, and gives it a new name
     * @param name defines the new name for the duplicated material
     * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
     * @param rootUrl defines the root URL to use to load textures
     * @returns the cloned material
     */
    clone(name, cloneTexturesOnlyOnce = true, rootUrl = "") {
        const result = SerializationHelper.Clone(() => new StandardMaterial(name, this.getScene()), this, { cloneTexturesOnlyOnce });
        result.name = name;
        result.id = name;
        this.stencil.copyTo(result.stencil);
        this._clonePlugins(result, rootUrl);
        return result;
    }
    /**
     * Creates a standard material from parsed material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new standard material
     */
    static Parse(source, scene, rootUrl) {
        const material = SerializationHelper.Parse(() => new StandardMaterial(source.name, scene), source, scene, rootUrl);
        if (source.stencil) {
            material.stencil.parse(source.stencil, scene, rootUrl);
        }
        Material._ParsePlugins(source, material, scene, rootUrl);
        return material;
    }
    // Flags used to enable or disable a type of texture for all Standard Materials
    /**
     * Are diffuse textures enabled in the application.
     */
    static get DiffuseTextureEnabled() {
        return MaterialFlags.DiffuseTextureEnabled;
    }
    static set DiffuseTextureEnabled(value) {
        MaterialFlags.DiffuseTextureEnabled = value;
    }
    /**
     * Are detail textures enabled in the application.
     */
    static get DetailTextureEnabled() {
        return MaterialFlags.DetailTextureEnabled;
    }
    static set DetailTextureEnabled(value) {
        MaterialFlags.DetailTextureEnabled = value;
    }
    /**
     * Are ambient textures enabled in the application.
     */
    static get AmbientTextureEnabled() {
        return MaterialFlags.AmbientTextureEnabled;
    }
    static set AmbientTextureEnabled(value) {
        MaterialFlags.AmbientTextureEnabled = value;
    }
    /**
     * Are opacity textures enabled in the application.
     */
    static get OpacityTextureEnabled() {
        return MaterialFlags.OpacityTextureEnabled;
    }
    static set OpacityTextureEnabled(value) {
        MaterialFlags.OpacityTextureEnabled = value;
    }
    /**
     * Are reflection textures enabled in the application.
     */
    static get ReflectionTextureEnabled() {
        return MaterialFlags.ReflectionTextureEnabled;
    }
    static set ReflectionTextureEnabled(value) {
        MaterialFlags.ReflectionTextureEnabled = value;
    }
    /**
     * Are emissive textures enabled in the application.
     */
    static get EmissiveTextureEnabled() {
        return MaterialFlags.EmissiveTextureEnabled;
    }
    static set EmissiveTextureEnabled(value) {
        MaterialFlags.EmissiveTextureEnabled = value;
    }
    /**
     * Are specular textures enabled in the application.
     */
    static get SpecularTextureEnabled() {
        return MaterialFlags.SpecularTextureEnabled;
    }
    static set SpecularTextureEnabled(value) {
        MaterialFlags.SpecularTextureEnabled = value;
    }
    /**
     * Are bump textures enabled in the application.
     */
    static get BumpTextureEnabled() {
        return MaterialFlags.BumpTextureEnabled;
    }
    static set BumpTextureEnabled(value) {
        MaterialFlags.BumpTextureEnabled = value;
    }
    /**
     * Are lightmap textures enabled in the application.
     */
    static get LightmapTextureEnabled() {
        return MaterialFlags.LightmapTextureEnabled;
    }
    static set LightmapTextureEnabled(value) {
        MaterialFlags.LightmapTextureEnabled = value;
    }
    /**
     * Are refraction textures enabled in the application.
     */
    static get RefractionTextureEnabled() {
        return MaterialFlags.RefractionTextureEnabled;
    }
    static set RefractionTextureEnabled(value) {
        MaterialFlags.RefractionTextureEnabled = value;
    }
    /**
     * Are color grading textures enabled in the application.
     */
    static get ColorGradingTextureEnabled() {
        return MaterialFlags.ColorGradingTextureEnabled;
    }
    static set ColorGradingTextureEnabled(value) {
        MaterialFlags.ColorGradingTextureEnabled = value;
    }
    /**
     * Are fresnels enabled in the application.
     */
    static get FresnelEnabled() {
        return MaterialFlags.FresnelEnabled;
    }
    static set FresnelEnabled(value) {
        MaterialFlags.FresnelEnabled = value;
    }
}
/**
 * Force all the standard materials to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
StandardMaterial.ForceGLSL = false;
__decorate([
    serializeAsTexture("diffuseTexture")
], StandardMaterial.prototype, "_diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], StandardMaterial.prototype, "diffuseTexture", void 0);
__decorate([
    serializeAsTexture("ambientTexture")
], StandardMaterial.prototype, "_ambientTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "ambientTexture", void 0);
__decorate([
    serializeAsTexture("opacityTexture")
], StandardMaterial.prototype, "_opacityTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], StandardMaterial.prototype, "opacityTexture", void 0);
__decorate([
    serializeAsTexture("reflectionTexture")
], StandardMaterial.prototype, "_reflectionTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "reflectionTexture", void 0);
__decorate([
    serializeAsTexture("emissiveTexture")
], StandardMaterial.prototype, "_emissiveTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "emissiveTexture", void 0);
__decorate([
    serializeAsTexture("specularTexture")
], StandardMaterial.prototype, "_specularTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "specularTexture", void 0);
__decorate([
    serializeAsTexture("bumpTexture")
], StandardMaterial.prototype, "_bumpTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "bumpTexture", void 0);
__decorate([
    serializeAsTexture("lightmapTexture")
], StandardMaterial.prototype, "_lightmapTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "lightmapTexture", void 0);
__decorate([
    serializeAsTexture("refractionTexture")
], StandardMaterial.prototype, "_refractionTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "refractionTexture", void 0);
__decorate([
    serializeAsColor3("ambient")
], StandardMaterial.prototype, "ambientColor", void 0);
__decorate([
    serializeAsColor3("diffuse")
], StandardMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serializeAsColor3("specular")
], StandardMaterial.prototype, "specularColor", void 0);
__decorate([
    serializeAsColor3("emissive")
], StandardMaterial.prototype, "emissiveColor", void 0);
__decorate([
    serialize()
], StandardMaterial.prototype, "specularPower", void 0);
__decorate([
    serialize("useAlphaFromDiffuseTexture")
], StandardMaterial.prototype, "_useAlphaFromDiffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], StandardMaterial.prototype, "useAlphaFromDiffuseTexture", void 0);
__decorate([
    serialize("useEmissiveAsIllumination")
], StandardMaterial.prototype, "_useEmissiveAsIllumination", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useEmissiveAsIllumination", void 0);
__decorate([
    serialize("linkEmissiveWithDiffuse")
], StandardMaterial.prototype, "_linkEmissiveWithDiffuse", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "linkEmissiveWithDiffuse", void 0);
__decorate([
    serialize("useSpecularOverAlpha")
], StandardMaterial.prototype, "_useSpecularOverAlpha", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useSpecularOverAlpha", void 0);
__decorate([
    serialize("useReflectionOverAlpha")
], StandardMaterial.prototype, "_useReflectionOverAlpha", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useReflectionOverAlpha", void 0);
__decorate([
    serialize("disableLighting")
], StandardMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], StandardMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("useObjectSpaceNormalMap")
], StandardMaterial.prototype, "_useObjectSpaceNormalMap", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useObjectSpaceNormalMap", void 0);
__decorate([
    serialize("useParallax")
], StandardMaterial.prototype, "_useParallax", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useParallax", void 0);
__decorate([
    serialize("useParallaxOcclusion")
], StandardMaterial.prototype, "_useParallaxOcclusion", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useParallaxOcclusion", void 0);
__decorate([
    serialize()
], StandardMaterial.prototype, "parallaxScaleBias", void 0);
__decorate([
    serialize("roughness")
], StandardMaterial.prototype, "_roughness", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "roughness", void 0);
__decorate([
    serialize()
], StandardMaterial.prototype, "indexOfRefraction", void 0);
__decorate([
    serialize()
], StandardMaterial.prototype, "invertRefractionY", void 0);
__decorate([
    serialize()
], StandardMaterial.prototype, "alphaCutOff", void 0);
__decorate([
    serialize("useLightmapAsShadowmap")
], StandardMaterial.prototype, "_useLightmapAsShadowmap", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useLightmapAsShadowmap", void 0);
__decorate([
    serializeAsFresnelParameters("diffuseFresnelParameters")
], StandardMaterial.prototype, "_diffuseFresnelParameters", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsFresnelDirty")
], StandardMaterial.prototype, "diffuseFresnelParameters", void 0);
__decorate([
    serializeAsFresnelParameters("opacityFresnelParameters")
], StandardMaterial.prototype, "_opacityFresnelParameters", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsFresnelAndMiscDirty")
], StandardMaterial.prototype, "opacityFresnelParameters", void 0);
__decorate([
    serializeAsFresnelParameters("reflectionFresnelParameters")
], StandardMaterial.prototype, "_reflectionFresnelParameters", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsFresnelDirty")
], StandardMaterial.prototype, "reflectionFresnelParameters", void 0);
__decorate([
    serializeAsFresnelParameters("refractionFresnelParameters")
], StandardMaterial.prototype, "_refractionFresnelParameters", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsFresnelDirty")
], StandardMaterial.prototype, "refractionFresnelParameters", void 0);
__decorate([
    serializeAsFresnelParameters("emissiveFresnelParameters")
], StandardMaterial.prototype, "_emissiveFresnelParameters", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsFresnelDirty")
], StandardMaterial.prototype, "emissiveFresnelParameters", void 0);
__decorate([
    serialize("useReflectionFresnelFromSpecular")
], StandardMaterial.prototype, "_useReflectionFresnelFromSpecular", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsFresnelDirty")
], StandardMaterial.prototype, "useReflectionFresnelFromSpecular", void 0);
__decorate([
    serialize("useGlossinessFromSpecularMapAlpha")
], StandardMaterial.prototype, "_useGlossinessFromSpecularMapAlpha", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "useGlossinessFromSpecularMapAlpha", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], StandardMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], StandardMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize("invertNormalMapX")
], StandardMaterial.prototype, "_invertNormalMapX", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "invertNormalMapX", void 0);
__decorate([
    serialize("invertNormalMapY")
], StandardMaterial.prototype, "_invertNormalMapY", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "invertNormalMapY", void 0);
__decorate([
    serialize("twoSidedLighting")
], StandardMaterial.prototype, "_twoSidedLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], StandardMaterial.prototype, "twoSidedLighting", void 0);
__decorate([
    serialize("applyDecalMapAfterDetailMap")
], StandardMaterial.prototype, "_applyDecalMapAfterDetailMap", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], StandardMaterial.prototype, "applyDecalMapAfterDetailMap", void 0);
RegisterClass("BABYLON.StandardMaterial", StandardMaterial);
Scene.DefaultMaterialFactory = (scene) => {
    return new StandardMaterial("default material", scene);
};
//# sourceMappingURL=standardMaterial.js.map