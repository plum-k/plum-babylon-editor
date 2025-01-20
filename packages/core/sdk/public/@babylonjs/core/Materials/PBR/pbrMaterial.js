import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators.js";
import { GetEnvironmentBRDFTexture } from "../../Misc/brdfTextureTools.js";
import { Color3 } from "../../Maths/math.color.js";
import { PBRBaseMaterial } from "./pbrBaseMaterial.js";
import { RegisterClass } from "../../Misc/typeStore.js";
import { Material } from "../material.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";
/**
 * The Physically based material of BJS.
 *
 * This offers the main features of a standard PBR material.
 * For more information, please refer to the documentation :
 * https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introToPBR
 */
export class PBRMaterial extends PBRBaseMaterial {
    /**
     * Stores the refracted light information in a texture.
     */
    get refractionTexture() {
        return this.subSurface.refractionTexture;
    }
    set refractionTexture(value) {
        this.subSurface.refractionTexture = value;
        if (value) {
            this.subSurface.isRefractionEnabled = true;
        }
        else if (!this.subSurface.linkRefractionWithTransparency) {
            this.subSurface.isRefractionEnabled = false;
        }
    }
    /**
     * Index of refraction of the material base layer.
     * https://en.wikipedia.org/wiki/List_of_refractive_indices
     *
     * This does not only impact refraction but also the Base F0 of Dielectric Materials.
     *
     * From dielectric fresnel rules: F0 = square((iorT - iorI) / (iorT + iorI))
     */
    get indexOfRefraction() {
        return this.subSurface.indexOfRefraction;
    }
    set indexOfRefraction(value) {
        this.subSurface.indexOfRefraction = value;
    }
    /**
     * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
     */
    get invertRefractionY() {
        return this.subSurface.invertRefractionY;
    }
    set invertRefractionY(value) {
        this.subSurface.invertRefractionY = value;
    }
    /**
     * This parameters will make the material used its opacity to control how much it is refracting against not.
     * Materials half opaque for instance using refraction could benefit from this control.
     */
    get linkRefractionWithTransparency() {
        return this.subSurface.linkRefractionWithTransparency;
    }
    set linkRefractionWithTransparency(value) {
        this.subSurface.linkRefractionWithTransparency = value;
        if (value) {
            this.subSurface.isRefractionEnabled = true;
        }
    }
    /**
     * BJS is using an hardcoded light falloff based on a manually sets up range.
     * In PBR, one way to represents the falloff is to use the inverse squared root algorithm.
     * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
     */
    get usePhysicalLightFalloff() {
        return this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;
    }
    /**
     * BJS is using an hardcoded light falloff based on a manually sets up range.
     * In PBR, one way to represents the falloff is to use the inverse squared root algorithm.
     * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
     */
    set usePhysicalLightFalloff(value) {
        if (value !== this.usePhysicalLightFalloff) {
            // Ensure the effect will be rebuilt.
            this._markAllSubMeshesAsTexturesDirty();
            if (value) {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL;
            }
            else {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_STANDARD;
            }
        }
    }
    /**
     * In order to support the falloff compatibility with gltf, a special mode has been added
     * to reproduce the gltf light falloff.
     */
    get useGLTFLightFalloff() {
        return this._lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_GLTF;
    }
    /**
     * In order to support the falloff compatibility with gltf, a special mode has been added
     * to reproduce the gltf light falloff.
     */
    set useGLTFLightFalloff(value) {
        if (value !== this.useGLTFLightFalloff) {
            // Ensure the effect will be rebuilt.
            this._markAllSubMeshesAsTexturesDirty();
            if (value) {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_GLTF;
            }
            else {
                this._lightFalloff = PBRBaseMaterial.LIGHTFALLOFF_STANDARD;
            }
        }
    }
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
     * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
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
     * Instantiates a new PBRMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name, scene, forceGLSL = false) {
        super(name, scene, forceGLSL);
        /**
         * Intensity of the direct lights e.g. the four lights available in your scene.
         * This impacts both the direct diffuse and specular highlights.
         */
        this.directIntensity = 1.0;
        /**
         * Intensity of the emissive part of the material.
         * This helps controlling the emissive effect without modifying the emissive color.
         */
        this.emissiveIntensity = 1.0;
        /**
         * Intensity of the environment e.g. how much the environment will light the object
         * either through harmonics for rough material or through the reflection for shiny ones.
         */
        this.environmentIntensity = 1.0;
        /**
         * This is a special control allowing the reduction of the specular highlights coming from the
         * four lights of the scene. Those highlights may not be needed in full environment lighting.
         */
        this.specularIntensity = 1.0;
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        this.disableBumpMap = false;
        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        this.ambientTextureStrength = 1.0;
        /**
         * Defines how much the AO map is occluding the analytical lights (point spot...).
         * 1 means it completely occludes it
         * 0 mean it has no impact
         */
        this.ambientTextureImpactOnAnalyticalLights = PBRMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;
        /**
         * In metallic workflow, specifies an F0 factor to help configuring the material F0.
         * By default the indexOfrefraction is used to compute F0;
         *
         * This is used as a factor against the default reflectance at normal incidence to tweak it.
         *
         * F0 = defaultF0 * metallicF0Factor * metallicReflectanceColor;
         * F90 = metallicReflectanceColor;
         */
        this.metallicF0Factor = 1;
        /**
         * In metallic workflow, specifies an F0 color.
         * By default the F90 is always 1;
         *
         * Please note that this factor is also used as a factor against the default reflectance at normal incidence.
         *
         * F0 = defaultF0_from_IOR * metallicF0Factor * metallicReflectanceColor
         * F90 = metallicF0Factor;
         */
        this.metallicReflectanceColor = Color3.White();
        /**
         * Specifies that only the A channel from metallicReflectanceTexture should be used.
         * If false, both RGB and A channels will be used
         */
        this.useOnlyMetallicFromMetallicReflectanceTexture = false;
        /**
         * The color of a material in ambient lighting.
         */
        this.ambientColor = new Color3(0, 0, 0);
        /**
         * AKA Diffuse Color in other nomenclature.
         */
        this.albedoColor = new Color3(1, 1, 1);
        /**
         * AKA Specular Color in other nomenclature.
         */
        this.reflectivityColor = new Color3(1, 1, 1);
        /**
         * The color reflected from the material.
         */
        this.reflectionColor = new Color3(1.0, 1.0, 1.0);
        /**
         * The color emitted from the material.
         */
        this.emissiveColor = new Color3(0, 0, 0);
        /**
         * AKA Glossiness in other nomenclature.
         */
        this.microSurface = 1.0;
        /**
         * If true, the light map contains occlusion information instead of lighting info.
         */
        this.useLightmapAsShadowmap = false;
        /**
         * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
         */
        this.useAlphaFromAlbedoTexture = false;
        /**
         * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
         */
        this.forceAlphaTest = false;
        /**
         * Defines the alpha limits in alpha test mode.
         */
        this.alphaCutOff = 0.4;
        /**
         * Specifies that the material will keep the specular highlights over a transparent surface (only the most luminous ones).
         * A car glass is a good example of that. When sun reflects on it you can not see what is behind.
         */
        this.useSpecularOverAlpha = true;
        /**
         * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
         */
        this.useMicroSurfaceFromReflectivityMapAlpha = false;
        /**
         * Specifies if the metallic texture contains the roughness information in its alpha channel.
         */
        this.useRoughnessFromMetallicTextureAlpha = true;
        /**
         * Specifies if the metallic texture contains the roughness information in its green channel.
         * Needs useRoughnessFromMetallicTextureAlpha to be false.
         */
        this.useRoughnessFromMetallicTextureGreen = false;
        /**
         * Specifies if the metallic texture contains the metallness information in its blue channel.
         */
        this.useMetallnessFromMetallicTextureBlue = false;
        /**
         * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
         */
        this.useAmbientOcclusionFromMetallicTextureRed = false;
        /**
         * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
         */
        this.useAmbientInGrayScale = false;
        /**
         * In case the reflectivity map does not contain the microsurface information in its alpha channel,
         * The material will try to infer what glossiness each pixel should be.
         */
        this.useAutoMicroSurfaceFromReflectivityMap = false;
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
         * A car glass is a good example of that. When the street lights reflects on it you can not see what is behind.
         */
        this.useRadianceOverAlpha = true;
        /**
         * Allows using an object space normal map (instead of tangent space).
         */
        this.useObjectSpaceNormalMap = false;
        /**
         * Allows using the bump map in parallax mode.
         */
        this.useParallax = false;
        /**
         * Allows using the bump map in parallax occlusion mode.
         */
        this.useParallaxOcclusion = false;
        /**
         * Controls the scale bias of the parallax mode.
         */
        this.parallaxScaleBias = 0.05;
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        this.disableLighting = false;
        /**
         * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
         */
        this.forceIrradianceInFragment = false;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        this.maxSimultaneousLights = 4;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        this.invertNormalMapX = false;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        this.invertNormalMapY = false;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        this.twoSidedLighting = false;
        /**
         * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
         * And/Or occlude the blended part. (alpha is converted to gamma to compute the fresnel)
         */
        this.useAlphaFresnel = false;
        /**
         * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
         * And/Or occlude the blended part. (alpha stays linear to compute the fresnel)
         */
        this.useLinearAlphaFresnel = false;
        /**
         * Let user defines the brdf lookup texture used for IBL.
         * A default 8bit version is embedded but you could point at :
         * * Default texture: https://assets.babylonjs.com/environments/correlatedMSBRDF_RGBD.png
         * * Default 16bit pixel depth texture: https://assets.babylonjs.com/environments/correlatedMSBRDF.dds
         * * LEGACY Default None correlated https://assets.babylonjs.com/environments/uncorrelatedBRDF_RGBD.png
         * * LEGACY Default None correlated 16bit pixel depth https://assets.babylonjs.com/environments/uncorrelatedBRDF.dds
         */
        this.environmentBRDFTexture = null;
        /**
         * Force normal to face away from face.
         */
        this.forceNormalForward = false;
        /**
         * Enables specular anti aliasing in the PBR shader.
         * It will both interacts on the Geometry for analytical and IBL lighting.
         * It also prefilter the roughness map based on the bump values.
         */
        this.enableSpecularAntiAliasing = false;
        /**
         * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
         * makes the reflect vector face the model (under horizon).
         */
        this.useHorizonOcclusion = true;
        /**
         * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
         * too much the area relying on ambient texture to define their ambient occlusion.
         */
        this.useRadianceOcclusion = true;
        /**
         * If set to true, no lighting calculations will be applied.
         */
        this.unlit = false;
        /**
         * If sets to true, the decal map will be applied after the detail map. Else, it is applied before (default: false)
         */
        this.applyDecalMapAfterDetailMap = false;
        this._environmentBRDFTexture = GetEnvironmentBRDFTexture(this.getScene());
    }
    /**
     * @returns the name of this material class.
     */
    getClassName() {
        return "PBRMaterial";
    }
    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
     * @param rootUrl defines the root URL to use to load textures
     * @returns cloned material instance
     */
    clone(name, cloneTexturesOnlyOnce = true, rootUrl = "") {
        const clone = SerializationHelper.Clone(() => new PBRMaterial(name, this.getScene()), this, { cloneTexturesOnlyOnce });
        clone.id = name;
        clone.name = name;
        this.stencil.copyTo(clone.stencil);
        this._clonePlugins(clone, rootUrl);
        return clone;
    }
    /**
     * Serializes this PBR Material.
     * @returns - An object with the serialized material.
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.PBRMaterial";
        return serializationObject;
    }
    // Statics
    /**
     * Parses a PBR Material from a serialized object.
     * @param source - Serialized object.
     * @param scene - BJS scene instance.
     * @param rootUrl - url for the scene object
     * @returns - PBRMaterial
     */
    static Parse(source, scene, rootUrl) {
        const material = SerializationHelper.Parse(() => new PBRMaterial(source.name, scene), source, scene, rootUrl);
        if (source.stencil) {
            material.stencil.parse(source.stencil, scene, rootUrl);
        }
        Material._ParsePlugins(source, material, scene, rootUrl);
        // The code block below ensures backward compatibility with serialized materials before plugins are automatically serialized.
        if (source.clearCoat) {
            material.clearCoat.parse(source.clearCoat, scene, rootUrl);
        }
        if (source.anisotropy) {
            material.anisotropy.parse(source.anisotropy, scene, rootUrl);
        }
        if (source.brdf) {
            material.brdf.parse(source.brdf, scene, rootUrl);
        }
        if (source.sheen) {
            material.sheen.parse(source.sheen, scene, rootUrl);
        }
        if (source.subSurface) {
            material.subSurface.parse(source.subSurface, scene, rootUrl);
        }
        if (source.iridescence) {
            material.iridescence.parse(source.iridescence, scene, rootUrl);
        }
        return material;
    }
}
/**
 * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
 */
PBRMaterial.PBRMATERIAL_OPAQUE = PBRBaseMaterial.PBRMATERIAL_OPAQUE;
/**
 * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
 */
PBRMaterial.PBRMATERIAL_ALPHATEST = PBRBaseMaterial.PBRMATERIAL_ALPHATEST;
/**
 * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
 */
PBRMaterial.PBRMATERIAL_ALPHABLEND = PBRBaseMaterial.PBRMATERIAL_ALPHABLEND;
/**
 * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
 * They are also discarded below the alpha cutoff threshold to improve performances.
 */
PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND = PBRBaseMaterial.PBRMATERIAL_ALPHATESTANDBLEND;
/**
 * Defines the default value of how much AO map is occluding the analytical lights
 * (point spot...).
 */
PBRMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS;
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "directIntensity", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "emissiveIntensity", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "environmentIntensity", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "specularIntensity", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "disableBumpMap", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "albedoTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "ambientTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "ambientTextureStrength", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "ambientTextureImpactOnAnalyticalLights", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], PBRMaterial.prototype, "opacityTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "reflectionTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "emissiveTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "reflectivityTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "metallicTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "metallic", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "roughness", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "metallicF0Factor", void 0);
__decorate([
    serializeAsColor3(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "metallicReflectanceColor", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useOnlyMetallicFromMetallicReflectanceTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "metallicReflectanceTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "reflectanceTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "microSurfaceTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "bumpTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", null)
], PBRMaterial.prototype, "lightmapTexture", void 0);
__decorate([
    serializeAsColor3("ambient"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "ambientColor", void 0);
__decorate([
    serializeAsColor3("albedo"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "albedoColor", void 0);
__decorate([
    serializeAsColor3("reflectivity"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "reflectivityColor", void 0);
__decorate([
    serializeAsColor3("reflection"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "reflectionColor", void 0);
__decorate([
    serializeAsColor3("emissive"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "emissiveColor", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "microSurface", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useLightmapAsShadowmap", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], PBRMaterial.prototype, "useAlphaFromAlbedoTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], PBRMaterial.prototype, "forceAlphaTest", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
], PBRMaterial.prototype, "alphaCutOff", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useSpecularOverAlpha", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useMicroSurfaceFromReflectivityMapAlpha", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useRoughnessFromMetallicTextureAlpha", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useRoughnessFromMetallicTextureGreen", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useMetallnessFromMetallicTextureBlue", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useAmbientOcclusionFromMetallicTextureRed", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useAmbientInGrayScale", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useAutoMicroSurfaceFromReflectivityMap", void 0);
__decorate([
    serialize()
], PBRMaterial.prototype, "usePhysicalLightFalloff", null);
__decorate([
    serialize()
], PBRMaterial.prototype, "useGLTFLightFalloff", null);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useRadianceOverAlpha", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useObjectSpaceNormalMap", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useParallax", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useParallaxOcclusion", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "parallaxScaleBias", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], PBRMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "forceIrradianceInFragment", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], PBRMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "invertNormalMapX", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "invertNormalMapY", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "twoSidedLighting", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useAlphaFresnel", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useLinearAlphaFresnel", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "environmentBRDFTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "forceNormalForward", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "enableSpecularAntiAliasing", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useHorizonOcclusion", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMaterial.prototype, "useRadianceOcclusion", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRMaterial.prototype, "unlit", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRMaterial.prototype, "applyDecalMapAfterDetailMap", void 0);
RegisterClass("BABYLON.PBRMaterial", PBRMaterial);
//# sourceMappingURL=pbrMaterial.js.map