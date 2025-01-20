import { __decorate } from "../../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, serializeAsColor3, expandToProperty, serializeAsTexture, serializeAsVector3, serializeAsImageProcessingConfiguration } from "../../Misc/decorators.js";
import { SmartArray } from "../../Misc/smartArray.js";
import { Logger } from "../../Misc/logger.js";
import { Vector3, Vector4 } from "../../Maths/math.vector.js";
import { VertexBuffer } from "../../Buffers/buffer.js";
import { MaterialDefines } from "../../Materials/materialDefines.js";
import { PushMaterial } from "../../Materials/pushMaterial.js";
import { ImageProcessingConfiguration } from "../../Materials/imageProcessingConfiguration.js";
import { Texture } from "../../Materials/Textures/texture.js";

import { RegisterClass } from "../../Misc/typeStore.js";
import { MaterialFlags } from "../materialFlags.js";
import { Color3 } from "../../Maths/math.color.js";
import { EffectFallbacks } from "../effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "../clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, BindTextureMatrix, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMergedUV, PrepareDefinesForMisc, PrepareDefinesForMultiview, PrepareUniformsAndSamplersList, } from "../materialHelper.functions.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";
/**
 * Background material defines definition.
 * @internal Mainly internal Use
 */
class BackgroundMaterialDefines extends MaterialDefines {
    /**
     * Constructor of the defines.
     */
    constructor() {
        super();
        /**
         * True if the diffuse texture is in use.
         */
        this.DIFFUSE = false;
        /**
         * The direct UV channel to use.
         */
        this.DIFFUSEDIRECTUV = 0;
        /**
         * True if the diffuse texture is in gamma space.
         */
        this.GAMMADIFFUSE = false;
        /**
         * True if the diffuse texture has opacity in the alpha channel.
         */
        this.DIFFUSEHASALPHA = false;
        /**
         * True if you want the material to fade to transparent at grazing angle.
         */
        this.OPACITYFRESNEL = false;
        /**
         * True if an extra blur needs to be added in the reflection.
         */
        this.REFLECTIONBLUR = false;
        /**
         * True if you want the material to fade to reflection at grazing angle.
         */
        this.REFLECTIONFRESNEL = false;
        /**
         * True if you want the material to falloff as far as you move away from the scene center.
         */
        this.REFLECTIONFALLOFF = false;
        /**
         * False if the current Webgl implementation does not support the texture lod extension.
         */
        this.TEXTURELODSUPPORT = false;
        /**
         * True to ensure the data are premultiplied.
         */
        this.PREMULTIPLYALPHA = false;
        /**
         * True if the texture contains cooked RGB values and not gray scaled multipliers.
         */
        this.USERGBCOLOR = false;
        /**
         * True if highlight and shadow levels have been specified. It can help ensuring the main perceived color
         * stays aligned with the desired configuration.
         */
        this.USEHIGHLIGHTANDSHADOWCOLORS = false;
        /**
         * True if only shadows must be rendered
         */
        this.BACKMAT_SHADOWONLY = false;
        /**
         * True to add noise in order to reduce the banding effect.
         */
        this.NOISE = false;
        /**
         * is the reflection texture in BGR color scheme?
         * Mainly used to solve a bug in ios10 video tag
         */
        this.REFLECTIONBGR = false;
        /**
         * True if ground projection has been enabled.
         */
        this.PROJECTED_GROUND = false;
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
        this.EXPOSURE = false;
        this.MULTIVIEW = false;
        // Reflection.
        this.REFLECTION = false;
        this.REFLECTIONMAP_3D = false;
        this.REFLECTIONMAP_SPHERICAL = false;
        this.REFLECTIONMAP_PLANAR = false;
        this.REFLECTIONMAP_CUBIC = false;
        this.REFLECTIONMAP_PROJECTION = false;
        this.REFLECTIONMAP_SKYBOX = false;
        this.REFLECTIONMAP_EXPLICIT = false;
        this.REFLECTIONMAP_EQUIRECTANGULAR = false;
        this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
        this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
        this.INVERTCUBICMAP = false;
        this.REFLECTIONMAP_OPPOSITEZ = false;
        this.LODINREFLECTIONALPHA = false;
        this.GAMMAREFLECTION = false;
        this.RGBDREFLECTION = false;
        this.EQUIRECTANGULAR_RELFECTION_FOV = false;
        // Default BJS.
        this.MAINUV1 = false;
        this.MAINUV2 = false;
        this.UV1 = false;
        this.UV2 = false;
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.POINTSIZE = false;
        this.FOG = false;
        this.NORMAL = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.INSTANCES = false;
        this.SHADOWFLOAT = false;
        this.LOGARITHMICDEPTH = false;
        this.NONUNIFORMSCALING = false;
        this.ALPHATEST = false;
        this.rebuild();
    }
}
/**
 * Background material used to create an efficient environment around your scene.
 * #157MGZ: simple test
 */
export class BackgroundMaterial extends PushMaterial {
    /**
     * Experimental Internal Use Only.
     *
     * Key light Color in "perceptual value" meaning the color you would like to see on screen.
     * This acts as a helper to set the primary color to a more "human friendly" value.
     * Conversion to linear space as well as exposure and tone mapping correction will be applied to keep the
     * output color as close as possible from the chosen value.
     * (This does not account for contrast color grading and color curves as they are considered post effect and not directly
     * part of lighting setup.)
     */
    get _perceptualColor() {
        return this.__perceptualColor;
    }
    set _perceptualColor(value) {
        this.__perceptualColor = value;
        this._computePrimaryColorFromPerceptualColor();
        this._markAllSubMeshesAsLightsDirty();
    }
    /**
     * Defines the level of the shadows (dark area of the reflection map) in order to help scaling the colors.
     * The color opposite to the primary color is used at the level chosen to define what the black area would look.
     */
    get primaryColorShadowLevel() {
        return this._primaryColorShadowLevel;
    }
    set primaryColorShadowLevel(value) {
        this._primaryColorShadowLevel = value;
        this._computePrimaryColors();
        this._markAllSubMeshesAsLightsDirty();
    }
    /**
     * Defines the level of the highlights (highlight area of the reflection map) in order to help scaling the colors.
     * The primary color is used at the level chosen to define what the white area would look.
     */
    get primaryColorHighlightLevel() {
        return this._primaryColorHighlightLevel;
    }
    set primaryColorHighlightLevel(value) {
        this._primaryColorHighlightLevel = value;
        this._computePrimaryColors();
        this._markAllSubMeshesAsLightsDirty();
    }
    /**
     * Sets the reflection reflectance fresnel values according to the default standard
     * empirically know to work well :-)
     */
    set reflectionStandardFresnelWeight(value) {
        let reflectionWeight = value;
        if (reflectionWeight < 0.5) {
            reflectionWeight = reflectionWeight * 2.0;
            this.reflectionReflectance0 = BackgroundMaterial.StandardReflectance0 * reflectionWeight;
            this.reflectionReflectance90 = BackgroundMaterial.StandardReflectance90 * reflectionWeight;
        }
        else {
            reflectionWeight = reflectionWeight * 2.0 - 1.0;
            this.reflectionReflectance0 = BackgroundMaterial.StandardReflectance0 + (1.0 - BackgroundMaterial.StandardReflectance0) * reflectionWeight;
            this.reflectionReflectance90 = BackgroundMaterial.StandardReflectance90 + (1.0 - BackgroundMaterial.StandardReflectance90) * reflectionWeight;
        }
    }
    /**
     * The current fov(field of view) multiplier, 0.0 - 2.0. Defaults to 1.0. Lower values "zoom in" and higher values "zoom out".
     * Best used when trying to implement visual zoom effects like fish-eye or binoculars while not adjusting camera fov.
     * Recommended to be keep at 1.0 except for special cases.
     */
    get fovMultiplier() {
        return this._fovMultiplier;
    }
    set fovMultiplier(value) {
        if (isNaN(value)) {
            value = 1.0;
        }
        this._fovMultiplier = Math.max(0.0, Math.min(2.0, value));
    }
    /**
     * Attaches a new image processing configuration to the PBR Material.
     * @param configuration (if null the scene configuration will be use)
     */
    _attachImageProcessingConfiguration(configuration) {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }
        // Detaches observer.
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        // Pick the scene configuration if needed.
        if (!configuration) {
            this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }
        // Attaches observer.
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._computePrimaryColorFromPerceptualColor();
                this._markAllSubMeshesAsImageProcessingDirty();
            });
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
        this.imageProcessingConfiguration.colorGradingTexture = value;
    }
    /**
     * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    get cameraColorCurves() {
        return this.imageProcessingConfiguration.colorCurves;
    }
    /**
     * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    set cameraColorCurves(value) {
        this.imageProcessingConfiguration.colorCurves = value;
    }
    /**
     * Instantiates a Background Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name, scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL);
        /**
         * Key light Color (multiply against the environment texture)
         */
        this.primaryColor = Color3.White();
        this._primaryColorShadowLevel = 0;
        this._primaryColorHighlightLevel = 0;
        /**
         * Reflection Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        this.reflectionTexture = null;
        /**
         * Reflection Texture level of blur.
         *
         * Can be use to reuse an existing HDR Texture and target a specific LOD to prevent authoring the
         * texture twice.
         */
        this.reflectionBlur = 0;
        /**
         * Diffuse Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        this.diffuseTexture = null;
        this._shadowLights = null;
        /**
         * Specify the list of lights casting shadow on the material.
         * All scene shadow lights will be included if null.
         */
        this.shadowLights = null;
        /**
         * Helps adjusting the shadow to a softer level if required.
         * 0 means black shadows and 1 means no shadows.
         */
        this.shadowLevel = 0;
        /**
         * In case of opacity Fresnel or reflection falloff, this is use as a scene center.
         * It is usually zero but might be interesting to modify according to your setup.
         */
        this.sceneCenter = Vector3.Zero();
        /**
         * This helps specifying that the material is falling off to the sky box at grazing angle.
         * This helps ensuring a nice transition when the camera goes under the ground.
         */
        this.opacityFresnel = true;
        /**
         * This helps specifying that the material is falling off from diffuse to the reflection texture at grazing angle.
         * This helps adding a mirror texture on the ground.
         */
        this.reflectionFresnel = false;
        /**
         * This helps specifying the falloff radius off the reflection texture from the sceneCenter.
         * This helps adding a nice falloff effect to the reflection if used as a mirror for instance.
         */
        this.reflectionFalloffDistance = 0.0;
        /**
         * This specifies the weight of the reflection against the background in case of reflection Fresnel.
         */
        this.reflectionAmount = 1.0;
        /**
         * This specifies the weight of the reflection at grazing angle.
         */
        this.reflectionReflectance0 = 0.05;
        /**
         * This specifies the weight of the reflection at a perpendicular point of view.
         */
        this.reflectionReflectance90 = 0.5;
        /**
         * Helps to directly use the maps channels instead of their level.
         */
        this.useRGBColor = true;
        /**
         * This helps reducing the banding effect that could occur on the background.
         */
        this.enableNoise = false;
        this._fovMultiplier = 1.0;
        /**
         * Enable the FOV adjustment feature controlled by fovMultiplier.
         */
        this.useEquirectangularFOV = false;
        this._maxSimultaneousLights = 4;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        this.maxSimultaneousLights = 4;
        this._shadowOnly = false;
        /**
         * Make the material only render shadows
         */
        this.shadowOnly = false;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        this._imageProcessingObserver = null;
        /**
         * Due to a bug in iOS10, video tags (which are using the background material) are in BGR and not RGB.
         * Setting this flag to true (not done automatically!) will convert it back to RGB.
         */
        this.switchToBGR = false;
        this._enableGroundProjection = false;
        /**
         * Enables the ground projection mode on the material.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/skybox#ground-projection
         */
        this.enableGroundProjection = false;
        /**
         * Defines the radius of the projected ground if enableGroundProjection is true.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/skybox#ground-projection
         */
        this.projectedGroundRadius = 1000;
        /**
         * Defines the height of the projected ground if enableGroundProjection is true.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/skybox#ground-projection
         */
        this.projectedGroundHeight = 10;
        // Temp values kept as cache in the material.
        this._renderTargets = new SmartArray(16);
        this._reflectionControls = Vector4.Zero();
        this._white = Color3.White();
        this._primaryShadowColor = Color3.Black();
        this._primaryHighlightColor = Color3.Black();
        this._shadersLoaded = false;
        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);
        this.getRenderTargetTextures = () => {
            this._renderTargets.reset();
            if (this._diffuseTexture && this._diffuseTexture.isRenderTarget) {
                this._renderTargets.push(this._diffuseTexture);
            }
            if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
                this._renderTargets.push(this._reflectionTexture);
            }
            return this._renderTargets;
        };
    }
    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    get hasRenderTargetTextures() {
        if (this._diffuseTexture && this._diffuseTexture.isRenderTarget) {
            return true;
        }
        if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            return true;
        }
        return false;
    }
    /**
     * The entire material has been created in order to prevent overdraw.
     * @returns false
     */
    needAlphaTesting() {
        return true;
    }
    /**
     * The entire material has been created in order to prevent overdraw.
     * @returns true if blending is enable
     */
    needAlphaBlending() {
        return this.alpha < 1 || (this._diffuseTexture != null && this._diffuseTexture.hasAlpha) || this._shadowOnly;
    }
    /**
     * Checks whether the material is ready to be rendered for a given mesh.
     * @param mesh The mesh to render
     * @param subMesh The submesh to check against
     * @param useInstances Specify wether or not the material is used with instances
     * @returns true if all the dependencies are ready (Textures, Effects...)
     */
    isReadyForSubMesh(mesh, subMesh, useInstances = false) {
        const drawWrapper = subMesh._drawWrapper;
        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new BackgroundMaterialDefines();
        }
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        // Lights
        PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights);
        defines._needNormals = true;
        // Multiview
        PrepareDefinesForMultiview(scene, defines);
        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (scene.getEngine().getCaps().textureLOD) {
                    defines.TEXTURELODSUPPORT = true;
                }
                if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    PrepareDefinesForMergedUV(this._diffuseTexture, defines, "DIFFUSE");
                    defines.DIFFUSEHASALPHA = this._diffuseTexture.hasAlpha;
                    defines.GAMMADIFFUSE = this._diffuseTexture.gammaSpace;
                    defines.OPACITYFRESNEL = this._opacityFresnel;
                }
                else {
                    defines.DIFFUSE = false;
                    defines.DIFFUSEDIRECTUV = 0;
                    defines.DIFFUSEHASALPHA = false;
                    defines.GAMMADIFFUSE = false;
                    defines.OPACITYFRESNEL = false;
                }
                const reflectionTexture = this._reflectionTexture;
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (!reflectionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                    defines.REFLECTION = true;
                    defines.GAMMAREFLECTION = reflectionTexture.gammaSpace;
                    defines.RGBDREFLECTION = reflectionTexture.isRGBD;
                    defines.REFLECTIONBLUR = this._reflectionBlur > 0;
                    defines.LODINREFLECTIONALPHA = reflectionTexture.lodLevelInAlpha;
                    defines.EQUIRECTANGULAR_RELFECTION_FOV = this.useEquirectangularFOV;
                    defines.REFLECTIONBGR = this.switchToBGR;
                    if (reflectionTexture.coordinatesMode === Texture.INVCUBIC_MODE) {
                        defines.INVERTCUBICMAP = true;
                    }
                    defines.REFLECTIONMAP_3D = reflectionTexture.isCube;
                    defines.REFLECTIONMAP_OPPOSITEZ = defines.REFLECTIONMAP_3D && this.getScene().useRightHandedSystem ? !reflectionTexture.invertZ : reflectionTexture.invertZ;
                    switch (reflectionTexture.coordinatesMode) {
                        case Texture.EXPLICIT_MODE:
                            defines.REFLECTIONMAP_EXPLICIT = true;
                            break;
                        case Texture.PLANAR_MODE:
                            defines.REFLECTIONMAP_PLANAR = true;
                            break;
                        case Texture.PROJECTION_MODE:
                            defines.REFLECTIONMAP_PROJECTION = true;
                            break;
                        case Texture.SKYBOX_MODE:
                            defines.REFLECTIONMAP_SKYBOX = true;
                            break;
                        case Texture.SPHERICAL_MODE:
                            defines.REFLECTIONMAP_SPHERICAL = true;
                            break;
                        case Texture.EQUIRECTANGULAR_MODE:
                            defines.REFLECTIONMAP_EQUIRECTANGULAR = true;
                            break;
                        case Texture.FIXED_EQUIRECTANGULAR_MODE:
                            defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = true;
                            break;
                        case Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                            defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = true;
                            break;
                        case Texture.CUBIC_MODE:
                        case Texture.INVCUBIC_MODE:
                        default:
                            defines.REFLECTIONMAP_CUBIC = true;
                            break;
                    }
                    if (this.reflectionFresnel) {
                        defines.REFLECTIONFRESNEL = true;
                        defines.REFLECTIONFALLOFF = this.reflectionFalloffDistance > 0;
                        this._reflectionControls.x = this.reflectionAmount;
                        this._reflectionControls.y = this.reflectionReflectance0;
                        this._reflectionControls.z = this.reflectionReflectance90;
                        this._reflectionControls.w = 1 / this.reflectionFalloffDistance;
                    }
                    else {
                        defines.REFLECTIONFRESNEL = false;
                        defines.REFLECTIONFALLOFF = false;
                    }
                }
                else {
                    defines.REFLECTION = false;
                    defines.REFLECTIONFRESNEL = false;
                    defines.REFLECTIONFALLOFF = false;
                    defines.REFLECTIONBLUR = false;
                    defines.REFLECTIONMAP_3D = false;
                    defines.REFLECTIONMAP_SPHERICAL = false;
                    defines.REFLECTIONMAP_PLANAR = false;
                    defines.REFLECTIONMAP_CUBIC = false;
                    defines.REFLECTIONMAP_PROJECTION = false;
                    defines.REFLECTIONMAP_SKYBOX = false;
                    defines.REFLECTIONMAP_EXPLICIT = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR = false;
                    defines.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
                    defines.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
                    defines.INVERTCUBICMAP = false;
                    defines.REFLECTIONMAP_OPPOSITEZ = false;
                    defines.LODINREFLECTIONALPHA = false;
                    defines.GAMMAREFLECTION = false;
                    defines.RGBDREFLECTION = false;
                }
            }
            defines.PREMULTIPLYALPHA = this.alphaMode === 7 || this.alphaMode === 8;
            defines.USERGBCOLOR = this._useRGBColor;
            defines.NOISE = this._enableNoise;
        }
        if (defines._areLightsDirty) {
            defines.USEHIGHLIGHTANDSHADOWCOLORS = !this._useRGBColor && (this._primaryColorShadowLevel !== 0 || this._primaryColorHighlightLevel !== 0);
            defines.BACKMAT_SHADOWONLY = this._shadowOnly;
        }
        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }
            this._imageProcessingConfiguration.prepareDefines(defines);
        }
        if (defines._areMiscDirty) {
            if (defines.REFLECTIONMAP_3D && this._enableGroundProjection) {
                defines.PROJECTED_GROUND = true;
                defines.REFLECTIONMAP_SKYBOX = true;
            }
            else {
                defines.PROJECTED_GROUND = false;
            }
        }
        // Misc.
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);
        // Attribs
        if (PrepareDefinesForAttributes(mesh, defines, false, true, false)) {
            if (mesh) {
                if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    mesh.createNormals(true);
                    Logger.Warn("BackgroundMaterial: Normals have been created for the mesh: " + mesh.name);
                }
            }
        }
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(0, "FOG");
            }
            if (defines.POINTSIZE) {
                fallbacks.addFallback(1, "POINTSIZE");
            }
            if (defines.MULTIVIEW) {
                fallbacks.addFallback(0, "MULTIVIEW");
            }
            HandleFallbacksForShadows(defines, fallbacks, this._maxSimultaneousLights);
            //Attributes
            const attribs = [VertexBuffer.PositionKind];
            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }
            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "mBones",
                "vPrimaryColor",
                "vPrimaryColorShadow",
                "vReflectionInfos",
                "reflectionMatrix",
                "vReflectionMicrosurfaceInfos",
                "fFovMultiplier",
                "shadowLevel",
                "alpha",
                "vBackgroundCenter",
                "vReflectionControl",
                "vDiffuseInfos",
                "diffuseMatrix",
                "projectedGroundInfos",
                "logarithmicDepthConstant",
            ];
            addClipPlaneUniforms(uniforms);
            const samplers = ["diffuseSampler", "reflectionSampler", "reflectionSamplerLow", "reflectionSamplerHigh"];
            const uniformBuffers = ["Material", "Scene"];
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
            const join = defines.toString();
            const effect = scene.getEngine().createEffect("background", {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights },
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: this._shadersLoaded
                    ? undefined
                    : async () => {
                        if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                            await Promise.all([import("../../ShadersWGSL/background.vertex.js"), import("../../ShadersWGSL/background.fragment.js")]);
                        }
                        else {
                            await Promise.all([import("../../Shaders/background.vertex.js"), import("../../Shaders/background.fragment.js")]);
                        }
                        this._shadersLoaded = true;
                    },
            }, engine);
            subMesh.setEffect(effect, defines, this._materialContext);
            this.buildUniformLayout();
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = useInstances;
        this._checkScenePerformancePriority();
        return true;
    }
    /**
     * Compute the primary color according to the chosen perceptual color.
     */
    _computePrimaryColorFromPerceptualColor() {
        if (!this.__perceptualColor) {
            return;
        }
        this._primaryColor.copyFrom(this.__perceptualColor);
        // Revert gamma space.
        this._primaryColor.toLinearSpaceToRef(this._primaryColor, this.getScene().getEngine().useExactSrgbConversions);
        // Revert image processing configuration.
        if (this._imageProcessingConfiguration) {
            // Revert Exposure.
            this._primaryColor.scaleToRef(1 / this._imageProcessingConfiguration.exposure, this._primaryColor);
        }
        this._computePrimaryColors();
    }
    /**
     * Compute the highlights and shadow colors according to their chosen levels.
     */
    _computePrimaryColors() {
        if (this._primaryColorShadowLevel === 0 && this._primaryColorHighlightLevel === 0) {
            return;
        }
        // Find the highlight color based on the configuration.
        this._primaryColor.scaleToRef(this._primaryColorShadowLevel, this._primaryShadowColor);
        this._primaryColor.subtractToRef(this._primaryShadowColor, this._primaryShadowColor);
        // Find the shadow color based on the configuration.
        this._white.subtractToRef(this._primaryColor, this._primaryHighlightColor);
        this._primaryHighlightColor.scaleToRef(this._primaryColorHighlightLevel, this._primaryHighlightColor);
        this._primaryColor.addToRef(this._primaryHighlightColor, this._primaryHighlightColor);
    }
    /**
     * Build the uniform buffer used in the material.
     */
    buildUniformLayout() {
        // Order is important !
        this._uniformBuffer.addUniform("vPrimaryColor", 4);
        this._uniformBuffer.addUniform("vPrimaryColorShadow", 4);
        this._uniformBuffer.addUniform("vDiffuseInfos", 2);
        this._uniformBuffer.addUniform("vReflectionInfos", 2);
        this._uniformBuffer.addUniform("diffuseMatrix", 16);
        this._uniformBuffer.addUniform("reflectionMatrix", 16);
        this._uniformBuffer.addUniform("vReflectionMicrosurfaceInfos", 3);
        this._uniformBuffer.addUniform("fFovMultiplier", 1);
        this._uniformBuffer.addUniform("pointSize", 1);
        this._uniformBuffer.addUniform("shadowLevel", 1);
        this._uniformBuffer.addUniform("alpha", 1);
        this._uniformBuffer.addUniform("vBackgroundCenter", 3);
        this._uniformBuffer.addUniform("vReflectionControl", 4);
        this._uniformBuffer.addUniform("projectedGroundInfos", 2);
        this._uniformBuffer.create();
    }
    /**
     * Unbind the material.
     */
    unbind() {
        if (this._diffuseTexture && this._diffuseTexture.isRenderTarget) {
            this._uniformBuffer.setTexture("diffuseSampler", null);
        }
        if (this._reflectionTexture && this._reflectionTexture.isRenderTarget) {
            this._uniformBuffer.setTexture("reflectionSampler", null);
        }
        super.unbind();
    }
    /**
     * Bind only the world matrix to the material.
     * @param world The world matrix to bind.
     */
    bindOnlyWorldMatrix(world) {
        this._activeEffect.setMatrix("world", world);
    }
    /**
     * Bind the material for a dedicated submesh (every used meshes will be considered opaque).
     * @param world The world matrix to bind.
     * @param mesh the mesh to bind for.
     * @param subMesh The submesh to bind for.
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
        // Matrices
        this.bindOnlyWorldMatrix(world);
        // Bones
        BindBonesParameters(mesh, this._activeEffect);
        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);
        if (mustRebind) {
            this._uniformBuffer.bindToEffect(effect, "Material");
            this.bindViewProjection(effect);
            const reflectionTexture = this._reflectionTexture;
            if (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync || subMesh._drawWrapper._forceRebindOnNextCall) {
                // Texture uniforms
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                        this._uniformBuffer.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                        BindTextureMatrix(this._diffuseTexture, this._uniformBuffer, "diffuse");
                    }
                    if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                        this._uniformBuffer.updateMatrix("reflectionMatrix", reflectionTexture.getReflectionTextureMatrix());
                        this._uniformBuffer.updateFloat2("vReflectionInfos", reflectionTexture.level, this._reflectionBlur);
                        this._uniformBuffer.updateFloat3("vReflectionMicrosurfaceInfos", reflectionTexture.getSize().width, reflectionTexture.lodGenerationScale, reflectionTexture.lodGenerationOffset);
                    }
                }
                if (this.shadowLevel > 0) {
                    this._uniformBuffer.updateFloat("shadowLevel", this.shadowLevel);
                }
                this._uniformBuffer.updateFloat("alpha", this.alpha);
                // Point size
                if (this.pointsCloud) {
                    this._uniformBuffer.updateFloat("pointSize", this.pointSize);
                }
                if (defines.USEHIGHLIGHTANDSHADOWCOLORS) {
                    this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryHighlightColor, 1.0);
                    this._uniformBuffer.updateColor4("vPrimaryColorShadow", this._primaryShadowColor, 1.0);
                }
                else {
                    this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryColor, 1.0);
                }
            }
            this._uniformBuffer.updateFloat("fFovMultiplier", this._fovMultiplier);
            // Textures
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    this._uniformBuffer.setTexture("diffuseSampler", this._diffuseTexture);
                }
                if (reflectionTexture && MaterialFlags.ReflectionTextureEnabled) {
                    if (defines.REFLECTIONBLUR && defines.TEXTURELODSUPPORT) {
                        this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture);
                    }
                    else if (!defines.REFLECTIONBLUR) {
                        this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture);
                    }
                    else {
                        this._uniformBuffer.setTexture("reflectionSampler", reflectionTexture._lodTextureMid || reflectionTexture);
                        this._uniformBuffer.setTexture("reflectionSamplerLow", reflectionTexture._lodTextureLow || reflectionTexture);
                        this._uniformBuffer.setTexture("reflectionSamplerHigh", reflectionTexture._lodTextureHigh || reflectionTexture);
                    }
                    if (defines.REFLECTIONFRESNEL) {
                        this._uniformBuffer.updateFloat3("vBackgroundCenter", this.sceneCenter.x, this.sceneCenter.y, this.sceneCenter.z);
                        this._uniformBuffer.updateFloat4("vReflectionControl", this._reflectionControls.x, this._reflectionControls.y, this._reflectionControls.z, this._reflectionControls.w);
                    }
                }
                if (defines.PROJECTED_GROUND) {
                    this._uniformBuffer.updateFloat2("projectedGroundInfos", this.projectedGroundRadius, this.projectedGroundHeight);
                }
            }
            // Clip plane
            bindClipPlane(this._activeEffect, this, scene);
            scene.bindEyePosition(effect);
        }
        else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._uniformBuffer.bindToEffect(effect, "Material");
            this._needToBindSceneUbo = true;
        }
        if (mustRebind || !this.isFrozen) {
            if (scene.lightsEnabled) {
                BindLights(scene, mesh, this._activeEffect, defines, this._maxSimultaneousLights);
            }
            // View
            this.bindView(effect);
            // Fog
            BindFogParameters(scene, mesh, this._activeEffect, true);
            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
            // image processing
            if (this._imageProcessingConfiguration) {
                this._imageProcessingConfiguration.bind(this._activeEffect);
            }
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
        this._uniformBuffer.update();
    }
    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this._reflectionTexture === texture) {
            return true;
        }
        if (this._diffuseTexture === texture) {
            return true;
        }
        return false;
    }
    /**
     * Dispose the material.
     * @param forceDisposeEffect Force disposal of the associated effect.
     * @param forceDisposeTextures Force disposal of the associated textures.
     */
    dispose(forceDisposeEffect = false, forceDisposeTextures = false) {
        if (forceDisposeTextures) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.reflectionTexture) {
                this.reflectionTexture.dispose();
            }
        }
        this._renderTargets.dispose();
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        super.dispose(forceDisposeEffect);
    }
    /**
     * Clones the material.
     * @param name The cloned name.
     * @returns The cloned material.
     */
    clone(name) {
        return SerializationHelper.Clone(() => new BackgroundMaterial(name, this.getScene()), this);
    }
    /**
     * Serializes the current material to its JSON representation.
     * @returns The JSON representation.
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.BackgroundMaterial";
        return serializationObject;
    }
    /**
     * Gets the class name of the material
     * @returns "BackgroundMaterial"
     */
    getClassName() {
        return "BackgroundMaterial";
    }
    /**
     * Parse a JSON input to create back a background material.
     * @param source The JSON data to parse
     * @param scene The scene to create the parsed material in
     * @param rootUrl The root url of the assets the material depends upon
     * @returns the instantiated BackgroundMaterial.
     */
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new BackgroundMaterial(source.name, scene), source, scene, rootUrl);
    }
}
/**
 * Standard reflectance value at parallel view angle.
 */
BackgroundMaterial.StandardReflectance0 = 0.05;
/**
 * Standard reflectance value at grazing angle.
 */
BackgroundMaterial.StandardReflectance90 = 0.5;
__decorate([
    serializeAsColor3()
], BackgroundMaterial.prototype, "_primaryColor", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], BackgroundMaterial.prototype, "primaryColor", void 0);
__decorate([
    serializeAsColor3()
], BackgroundMaterial.prototype, "__perceptualColor", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_primaryColorShadowLevel", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_primaryColorHighlightLevel", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], BackgroundMaterial.prototype, "primaryColorHighlightLevel", null);
__decorate([
    serializeAsTexture()
], BackgroundMaterial.prototype, "_reflectionTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionTexture", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_reflectionBlur", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionBlur", void 0);
__decorate([
    serializeAsTexture()
], BackgroundMaterial.prototype, "_diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "shadowLights", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_shadowLevel", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "shadowLevel", void 0);
__decorate([
    serializeAsVector3()
], BackgroundMaterial.prototype, "_sceneCenter", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "sceneCenter", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_opacityFresnel", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "opacityFresnel", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_reflectionFresnel", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionFresnel", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_reflectionFalloffDistance", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionFalloffDistance", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_reflectionAmount", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionAmount", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_reflectionReflectance0", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionReflectance0", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_reflectionReflectance90", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "reflectionReflectance90", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_useRGBColor", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "useRGBColor", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_enableNoise", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "enableNoise", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], BackgroundMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "_shadowOnly", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], BackgroundMaterial.prototype, "shadowOnly", void 0);
__decorate([
    serializeAsImageProcessingConfiguration()
], BackgroundMaterial.prototype, "_imageProcessingConfiguration", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], BackgroundMaterial.prototype, "enableGroundProjection", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "projectedGroundRadius", void 0);
__decorate([
    serialize()
], BackgroundMaterial.prototype, "projectedGroundHeight", void 0);
RegisterClass("BABYLON.BackgroundMaterial", BackgroundMaterial);
//# sourceMappingURL=backgroundMaterial.js.map