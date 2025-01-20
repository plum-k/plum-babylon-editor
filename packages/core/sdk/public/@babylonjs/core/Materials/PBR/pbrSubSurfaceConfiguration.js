import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsTexture, expandToProperty, serializeAsColor3 } from "../../Misc/decorators.js";
import { Color3 } from "../../Maths/math.color.js";
import { MaterialFlags } from "../materialFlags.js";
import { TmpVectors } from "../../Maths/math.vector.js";
import { MaterialPluginBase } from "../materialPluginBase.js";

import { MaterialDefines } from "../materialDefines.js";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "../materialHelper.functions.js";
/**
 * @internal
 */
export class MaterialSubSurfaceDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.SUBSURFACE = false;
        this.SS_REFRACTION = false;
        this.SS_REFRACTION_USE_INTENSITY_FROM_THICKNESS = false;
        this.SS_TRANSLUCENCY = false;
        this.SS_TRANSLUCENCY_USE_INTENSITY_FROM_THICKNESS = false;
        this.SS_SCATTERING = false;
        this.SS_DISPERSION = false;
        this.SS_THICKNESSANDMASK_TEXTURE = false;
        this.SS_THICKNESSANDMASK_TEXTUREDIRECTUV = 0;
        this.SS_HAS_THICKNESS = false;
        this.SS_REFRACTIONINTENSITY_TEXTURE = false;
        this.SS_REFRACTIONINTENSITY_TEXTUREDIRECTUV = 0;
        this.SS_TRANSLUCENCYINTENSITY_TEXTURE = false;
        this.SS_TRANSLUCENCYINTENSITY_TEXTUREDIRECTUV = 0;
        this.SS_TRANSLUCENCYCOLOR_TEXTURE = false;
        this.SS_TRANSLUCENCYCOLOR_TEXTUREDIRECTUV = 0;
        this.SS_REFRACTIONMAP_3D = false;
        this.SS_REFRACTIONMAP_OPPOSITEZ = false;
        this.SS_LODINREFRACTIONALPHA = false;
        this.SS_GAMMAREFRACTION = false;
        this.SS_RGBDREFRACTION = false;
        this.SS_LINEARSPECULARREFRACTION = false;
        this.SS_LINKREFRACTIONTOTRANSPARENCY = false;
        this.SS_ALBEDOFORREFRACTIONTINT = false;
        this.SS_ALBEDOFORTRANSLUCENCYTINT = false;
        this.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = false;
        this.SS_USE_THICKNESS_AS_DEPTH = false;
        this.SS_USE_GLTF_TEXTURES = false;
    }
}
/**
 * Plugin that implements the sub surface component of the PBR material
 */
export class PBRSubSurfaceConfiguration extends MaterialPluginBase {
    /**
     * Diffusion profile for subsurface scattering.
     * Useful for better scattering in the skins or foliages.
     */
    get scatteringDiffusionProfile() {
        if (!this._scene.subSurfaceConfiguration) {
            return null;
        }
        return this._scene.subSurfaceConfiguration.ssDiffusionProfileColors[this._scatteringDiffusionProfileIndex];
    }
    set scatteringDiffusionProfile(c) {
        if (!this._scene.enableSubSurfaceForPrePass()) {
            // Not supported
            return;
        }
        // addDiffusionProfile automatically checks for doubles
        if (c) {
            this._scatteringDiffusionProfileIndex = this._scene.subSurfaceConfiguration.addDiffusionProfile(c);
        }
    }
    /**
     * Index of refraction of the material's volume.
     * https://en.wikipedia.org/wiki/List_of_refractive_indices
     *
     * This ONLY impacts refraction. If not provided or given a non-valid value,
     * the volume will use the same IOR as the surface.
     */
    get volumeIndexOfRefraction() {
        if (this._volumeIndexOfRefraction >= 1.0) {
            return this._volumeIndexOfRefraction;
        }
        return this._indexOfRefraction;
    }
    set volumeIndexOfRefraction(value) {
        if (value >= 1.0) {
            this._volumeIndexOfRefraction = value;
        }
        else {
            this._volumeIndexOfRefraction = -1.0;
        }
    }
    /** @internal */
    _markAllSubMeshesAsTexturesDirty() {
        this._enable(this._isRefractionEnabled || this._isTranslucencyEnabled || this._isScatteringEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }
    /** @internal */
    _markScenePrePassDirty() {
        this._enable(this._isRefractionEnabled || this._isTranslucencyEnabled || this._isScatteringEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
        this._internalMarkScenePrePassDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible() {
        return true;
    }
    constructor(material, addToPluginList = true) {
        super(material, "PBRSubSurface", 130, new MaterialSubSurfaceDefines(), addToPluginList);
        this._isRefractionEnabled = false;
        /**
         * Defines if the refraction is enabled in the material.
         */
        this.isRefractionEnabled = false;
        this._isTranslucencyEnabled = false;
        /**
         * Defines if the translucency is enabled in the material.
         */
        this.isTranslucencyEnabled = false;
        this._isDispersionEnabled = false;
        /**
         * Defines if dispersion is enabled in the material.
         */
        this.isDispersionEnabled = false;
        this._isScatteringEnabled = false;
        /**
         * Defines if the sub surface scattering is enabled in the material.
         */
        this.isScatteringEnabled = false;
        this._scatteringDiffusionProfileIndex = 0;
        /**
         * Defines the refraction intensity of the material.
         * The refraction when enabled replaces the Diffuse part of the material.
         * The intensity helps transitioning between diffuse and refraction.
         */
        this.refractionIntensity = 1;
        /**
         * Defines the translucency intensity of the material.
         * When translucency has been enabled, this defines how much of the "translucency"
         * is added to the diffuse part of the material.
         */
        this.translucencyIntensity = 1;
        /**
         * When enabled, transparent surfaces will be tinted with the albedo colour (independent of thickness)
         */
        this.useAlbedoToTintRefraction = false;
        /**
         * When enabled, translucent surfaces will be tinted with the albedo colour (independent of thickness)
         */
        this.useAlbedoToTintTranslucency = false;
        this._thicknessTexture = null;
        /**
         * Stores the average thickness of a mesh in a texture (The texture is holding the values linearly).
         * The red (or green if useGltfStyleTextures=true) channel of the texture should contain the thickness remapped between 0 and 1.
         * 0 would mean minimumThickness
         * 1 would mean maximumThickness
         * The other channels might be use as a mask to vary the different effects intensity.
         */
        this.thicknessTexture = null;
        this._refractionTexture = null;
        /**
         * Defines the texture to use for refraction.
         */
        this.refractionTexture = null;
        /** @internal */
        this._indexOfRefraction = 1.5;
        /**
         * Index of refraction of the material base layer.
         * https://en.wikipedia.org/wiki/List_of_refractive_indices
         *
         * This does not only impact refraction but also the Base F0 of Dielectric Materials.
         *
         * From dielectric fresnel rules: F0 = square((iorT - iorI) / (iorT + iorI))
         */
        this.indexOfRefraction = 1.5;
        this._volumeIndexOfRefraction = -1.0;
        this._invertRefractionY = false;
        /**
         * Controls if refraction needs to be inverted on Y. This could be useful for procedural texture.
         */
        this.invertRefractionY = false;
        /** @internal */
        this._linkRefractionWithTransparency = false;
        /**
         * This parameters will make the material used its opacity to control how much it is refracting against not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        this.linkRefractionWithTransparency = false;
        /**
         * Defines the minimum thickness stored in the thickness map.
         * If no thickness map is defined, this value will be used to simulate thickness.
         */
        this.minimumThickness = 0;
        /**
         * Defines the maximum thickness stored in the thickness map.
         */
        this.maximumThickness = 1;
        /**
         * Defines that the thickness should be used as a measure of the depth volume.
         */
        this.useThicknessAsDepth = false;
        /**
         * Defines the volume tint of the material.
         * This is used for both translucency and scattering.
         */
        this.tintColor = Color3.White();
        /**
         * Defines the distance at which the tint color should be found in the media.
         * This is used for refraction only.
         */
        this.tintColorAtDistance = 1;
        /**
         * Defines the Abbe number for the volume.
         */
        this.dispersion = 0;
        /**
         * Defines how far each channel transmit through the media.
         * It is defined as a color to simplify it selection.
         */
        this.diffusionDistance = Color3.White();
        this._useMaskFromThicknessTexture = false;
        /**
         * Stores the intensity of the different subsurface effects in the thickness texture.
         * Note that if refractionIntensityTexture and/or translucencyIntensityTexture is provided it takes precedence over thicknessTexture + useMaskFromThicknessTexture
         * * the green (red if useGltfStyleTextures = true) channel is the refraction intensity.
         * * the blue (alpha if useGltfStyleTextures = true) channel is the translucency intensity.
         */
        this.useMaskFromThicknessTexture = false;
        this._refractionIntensityTexture = null;
        /**
         * Stores the intensity of the refraction. If provided, it takes precedence over thicknessTexture + useMaskFromThicknessTexture
         * * the green (red if useGltfStyleTextures = true) channel is the refraction intensity.
         */
        this.refractionIntensityTexture = null;
        this._translucencyIntensityTexture = null;
        /**
         * Stores the intensity of the translucency. If provided, it takes precedence over thicknessTexture + useMaskFromThicknessTexture
         * * the blue (alpha if useGltfStyleTextures = true) channel is the translucency intensity.
         */
        this.translucencyIntensityTexture = null;
        /**
         * Defines the translucency tint of the material.
         * If not set, the tint color will be used instead.
         */
        this.translucencyColor = null;
        this._translucencyColorTexture = null;
        /**
         * Defines the translucency tint color of the material as a texture.
         * This is multiplied against the translucency color to add variety and realism to the material.
         * If translucencyColor is not set, the tint color will be used instead.
         */
        this.translucencyColorTexture = null;
        this._useGltfStyleTextures = true;
        /**
         * Use channels layout used by glTF:
         * * thicknessTexture: the green (instead of red) channel is the thickness
         * * thicknessTexture/refractionIntensityTexture: the red (instead of green) channel is the refraction intensity
         * * thicknessTexture/translucencyIntensityTexture: the alpha (instead of blue) channel is the translucency intensity
         */
        this.useGltfStyleTextures = true;
        this._scene = material.getScene();
        this.registerForExtraEvents = true;
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
        this._internalMarkScenePrePassDirty = material._dirtyCallbacks[32];
    }
    isReadyForSubMesh(defines, scene) {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            return true;
        }
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                    if (!this._thicknessTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                if (this._translucencyColorTexture && MaterialFlags.TranslucencyColorTextureEnabled) {
                    if (!this._translucencyColorTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled) {
                    if (!this._translucencyIntensityTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                const refractionTexture = this._getRefractionTexture(scene);
                if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                    if (!refractionTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    prepareDefinesBeforeAttributes(defines, scene) {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            defines.SUBSURFACE = false;
            defines.SS_DISPERSION = false;
            defines.SS_TRANSLUCENCY = false;
            defines.SS_SCATTERING = false;
            defines.SS_REFRACTION = false;
            defines.SS_REFRACTION_USE_INTENSITY_FROM_THICKNESS = false;
            defines.SS_TRANSLUCENCY_USE_INTENSITY_FROM_THICKNESS = false;
            defines.SS_THICKNESSANDMASK_TEXTURE = false;
            defines.SS_THICKNESSANDMASK_TEXTUREDIRECTUV = 0;
            defines.SS_HAS_THICKNESS = false;
            defines.SS_REFRACTIONINTENSITY_TEXTURE = false;
            defines.SS_REFRACTIONINTENSITY_TEXTUREDIRECTUV = 0;
            defines.SS_TRANSLUCENCYINTENSITY_TEXTURE = false;
            defines.SS_TRANSLUCENCYINTENSITY_TEXTUREDIRECTUV = 0;
            defines.SS_REFRACTIONMAP_3D = false;
            defines.SS_REFRACTIONMAP_OPPOSITEZ = false;
            defines.SS_LODINREFRACTIONALPHA = false;
            defines.SS_GAMMAREFRACTION = false;
            defines.SS_RGBDREFRACTION = false;
            defines.SS_LINEARSPECULARREFRACTION = false;
            defines.SS_LINKREFRACTIONTOTRANSPARENCY = false;
            defines.SS_ALBEDOFORREFRACTIONTINT = false;
            defines.SS_ALBEDOFORTRANSLUCENCYTINT = false;
            defines.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = false;
            defines.SS_USE_THICKNESS_AS_DEPTH = false;
            defines.SS_USE_GLTF_TEXTURES = false;
            defines.SS_TRANSLUCENCYCOLOR_TEXTURE = false;
            defines.SS_TRANSLUCENCYCOLOR_TEXTUREDIRECTUV = 0;
            return;
        }
        if (defines._areTexturesDirty) {
            defines.SUBSURFACE = true;
            defines.SS_DISPERSION = this._isDispersionEnabled;
            defines.SS_TRANSLUCENCY = this._isTranslucencyEnabled;
            defines.SS_TRANSLUCENCY_USE_INTENSITY_FROM_THICKNESS = false;
            defines.SS_SCATTERING = this._isScatteringEnabled;
            defines.SS_THICKNESSANDMASK_TEXTURE = false;
            defines.SS_REFRACTIONINTENSITY_TEXTURE = false;
            defines.SS_TRANSLUCENCYINTENSITY_TEXTURE = false;
            defines.SS_HAS_THICKNESS = false;
            defines.SS_USE_GLTF_TEXTURES = false;
            defines.SS_REFRACTION = false;
            defines.SS_REFRACTION_USE_INTENSITY_FROM_THICKNESS = false;
            defines.SS_REFRACTIONMAP_3D = false;
            defines.SS_GAMMAREFRACTION = false;
            defines.SS_RGBDREFRACTION = false;
            defines.SS_LINEARSPECULARREFRACTION = false;
            defines.SS_REFRACTIONMAP_OPPOSITEZ = false;
            defines.SS_LODINREFRACTIONALPHA = false;
            defines.SS_LINKREFRACTIONTOTRANSPARENCY = false;
            defines.SS_ALBEDOFORREFRACTIONTINT = false;
            defines.SS_ALBEDOFORTRANSLUCENCYTINT = false;
            defines.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = false;
            defines.SS_USE_THICKNESS_AS_DEPTH = false;
            defines.SS_TRANSLUCENCYCOLOR_TEXTURE = false;
            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                        PrepareDefinesForMergedUV(this._thicknessTexture, defines, "SS_THICKNESSANDMASK_TEXTURE");
                    }
                    if (this._refractionIntensityTexture && MaterialFlags.RefractionIntensityTextureEnabled) {
                        PrepareDefinesForMergedUV(this._refractionIntensityTexture, defines, "SS_REFRACTIONINTENSITY_TEXTURE");
                    }
                    if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled) {
                        PrepareDefinesForMergedUV(this._translucencyIntensityTexture, defines, "SS_TRANSLUCENCYINTENSITY_TEXTURE");
                    }
                    if (this._translucencyColorTexture && MaterialFlags.TranslucencyColorTextureEnabled) {
                        PrepareDefinesForMergedUV(this._translucencyColorTexture, defines, "SS_TRANSLUCENCYCOLOR_TEXTURE");
                    }
                }
            }
            defines.SS_HAS_THICKNESS = this.maximumThickness - this.minimumThickness !== 0.0;
            defines.SS_USE_GLTF_TEXTURES = this._useGltfStyleTextures;
            defines.SS_REFRACTION_USE_INTENSITY_FROM_THICKNESS = this._useMaskFromThicknessTexture && !this._refractionIntensityTexture;
            defines.SS_TRANSLUCENCY_USE_INTENSITY_FROM_THICKNESS = this._useMaskFromThicknessTexture && !this._translucencyIntensityTexture;
            if (this._isRefractionEnabled) {
                if (scene.texturesEnabled) {
                    const refractionTexture = this._getRefractionTexture(scene);
                    if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                        defines.SS_REFRACTION = true;
                        defines.SS_REFRACTIONMAP_3D = refractionTexture.isCube;
                        defines.SS_GAMMAREFRACTION = refractionTexture.gammaSpace;
                        defines.SS_RGBDREFRACTION = refractionTexture.isRGBD;
                        defines.SS_LINEARSPECULARREFRACTION = refractionTexture.linearSpecularLOD;
                        defines.SS_REFRACTIONMAP_OPPOSITEZ = this._scene.useRightHandedSystem && refractionTexture.isCube ? !refractionTexture.invertZ : refractionTexture.invertZ;
                        defines.SS_LODINREFRACTIONALPHA = refractionTexture.lodLevelInAlpha;
                        defines.SS_LINKREFRACTIONTOTRANSPARENCY = this._linkRefractionWithTransparency;
                        defines.SS_ALBEDOFORREFRACTIONTINT = this.useAlbedoToTintRefraction;
                        defines.SS_USE_LOCAL_REFRACTIONMAP_CUBIC = refractionTexture.isCube && refractionTexture.boundingBoxSize;
                        defines.SS_USE_THICKNESS_AS_DEPTH = this.useThicknessAsDepth;
                    }
                }
            }
            if (this._isTranslucencyEnabled) {
                defines.SS_ALBEDOFORTRANSLUCENCYTINT = this.useAlbedoToTintTranslucency;
            }
        }
    }
    /**
     * Binds the material data (this function is called even if mustRebind() returns false)
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param scene defines the scene the material belongs to.
     * @param engine defines the engine the material belongs to.
     * @param subMesh the submesh to bind data for
     */
    hardBindForSubMesh(uniformBuffer, scene, engine, subMesh) {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            return;
        }
        // If min/max thickness is 0, avoid decompising to determine the scaled thickness (it's always zero).
        if (this.maximumThickness === 0.0 && this.minimumThickness === 0.0) {
            uniformBuffer.updateFloat2("vThicknessParam", 0, 0);
        }
        else {
            subMesh.getRenderingMesh().getWorldMatrix().decompose(TmpVectors.Vector3[0]);
            const thicknessScale = Math.max(Math.abs(TmpVectors.Vector3[0].x), Math.abs(TmpVectors.Vector3[0].y), Math.abs(TmpVectors.Vector3[0].z));
            uniformBuffer.updateFloat2("vThicknessParam", this.minimumThickness * thicknessScale, (this.maximumThickness - this.minimumThickness) * thicknessScale);
        }
    }
    bindForSubMesh(uniformBuffer, scene, engine, subMesh) {
        if (!this._isRefractionEnabled && !this._isTranslucencyEnabled && !this._isScatteringEnabled) {
            return;
        }
        const defines = subMesh.materialDefines;
        const isFrozen = this._material.isFrozen;
        const realTimeFiltering = this._material.realTimeFiltering;
        const lodBasedMicrosurface = defines.LODBASEDMICROSFURACE;
        const refractionTexture = this._getRefractionTexture(scene);
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                uniformBuffer.updateFloat2("vThicknessInfos", this._thicknessTexture.coordinatesIndex, this._thicknessTexture.level);
                BindTextureMatrix(this._thicknessTexture, uniformBuffer, "thickness");
            }
            if (this._refractionIntensityTexture && MaterialFlags.RefractionIntensityTextureEnabled && defines.SS_REFRACTIONINTENSITY_TEXTURE) {
                uniformBuffer.updateFloat2("vRefractionIntensityInfos", this._refractionIntensityTexture.coordinatesIndex, this._refractionIntensityTexture.level);
                BindTextureMatrix(this._refractionIntensityTexture, uniformBuffer, "refractionIntensity");
            }
            if (this._translucencyColorTexture && MaterialFlags.TranslucencyColorTextureEnabled && defines.SS_TRANSLUCENCYCOLOR_TEXTURE) {
                uniformBuffer.updateFloat2("vTranslucencyColorInfos", this._translucencyColorTexture.coordinatesIndex, this._translucencyColorTexture.level);
                BindTextureMatrix(this._translucencyColorTexture, uniformBuffer, "translucencyColor");
            }
            if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled && defines.SS_TRANSLUCENCYINTENSITY_TEXTURE) {
                uniformBuffer.updateFloat2("vTranslucencyIntensityInfos", this._translucencyIntensityTexture.coordinatesIndex, this._translucencyIntensityTexture.level);
                BindTextureMatrix(this._translucencyIntensityTexture, uniformBuffer, "translucencyIntensity");
            }
            if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                uniformBuffer.updateMatrix("refractionMatrix", refractionTexture.getRefractionTextureMatrix());
                let depth = 1.0;
                if (!refractionTexture.isCube) {
                    if (refractionTexture.depth) {
                        depth = refractionTexture.depth;
                    }
                }
                const width = refractionTexture.getSize().width;
                const refractionIor = this.volumeIndexOfRefraction;
                uniformBuffer.updateFloat4("vRefractionInfos", refractionTexture.level, 1 / refractionIor, depth, this._invertRefractionY ? -1 : 1);
                uniformBuffer.updateFloat4("vRefractionMicrosurfaceInfos", width, refractionTexture.lodGenerationScale, refractionTexture.lodGenerationOffset, 1.0 / this.indexOfRefraction);
                if (realTimeFiltering) {
                    uniformBuffer.updateFloat2("vRefractionFilteringInfo", width, Math.log2(width));
                }
                if (refractionTexture.boundingBoxSize) {
                    const cubeTexture = refractionTexture;
                    uniformBuffer.updateVector3("vRefractionPosition", cubeTexture.boundingBoxPosition);
                    uniformBuffer.updateVector3("vRefractionSize", cubeTexture.boundingBoxSize);
                }
            }
            if (this._isScatteringEnabled) {
                uniformBuffer.updateFloat("scatteringDiffusionProfile", this._scatteringDiffusionProfileIndex);
            }
            uniformBuffer.updateColor3("vDiffusionDistance", this.diffusionDistance);
            uniformBuffer.updateFloat4("vTintColor", this.tintColor.r, this.tintColor.g, this.tintColor.b, Math.max(0.00001, this.tintColorAtDistance));
            uniformBuffer.updateColor4("vTranslucencyColor", this.translucencyColor ?? this.tintColor, 0);
            uniformBuffer.updateFloat3("vSubSurfaceIntensity", this.refractionIntensity, this.translucencyIntensity, 0);
            uniformBuffer.updateFloat("dispersion", this.dispersion);
        }
        // Textures
        if (scene.texturesEnabled) {
            if (this._thicknessTexture && MaterialFlags.ThicknessTextureEnabled) {
                uniformBuffer.setTexture("thicknessSampler", this._thicknessTexture);
            }
            if (this._refractionIntensityTexture && MaterialFlags.RefractionIntensityTextureEnabled && defines.SS_REFRACTIONINTENSITY_TEXTURE) {
                uniformBuffer.setTexture("refractionIntensitySampler", this._refractionIntensityTexture);
            }
            if (this._translucencyIntensityTexture && MaterialFlags.TranslucencyIntensityTextureEnabled && defines.SS_TRANSLUCENCYINTENSITY_TEXTURE) {
                uniformBuffer.setTexture("translucencyIntensitySampler", this._translucencyIntensityTexture);
            }
            if (this._translucencyColorTexture && MaterialFlags.TranslucencyColorTextureEnabled && defines.SS_TRANSLUCENCYCOLOR_TEXTURE) {
                uniformBuffer.setTexture("translucencyColorSampler", this._translucencyColorTexture);
            }
            if (refractionTexture && MaterialFlags.RefractionTextureEnabled) {
                if (lodBasedMicrosurface) {
                    uniformBuffer.setTexture("refractionSampler", refractionTexture);
                }
                else {
                    uniformBuffer.setTexture("refractionSampler", refractionTexture._lodTextureMid || refractionTexture);
                    uniformBuffer.setTexture("refractionSamplerLow", refractionTexture._lodTextureLow || refractionTexture);
                    uniformBuffer.setTexture("refractionSamplerHigh", refractionTexture._lodTextureHigh || refractionTexture);
                }
            }
        }
    }
    /**
     * Returns the texture used for refraction or null if none is used.
     * @param scene defines the scene the material belongs to.
     * @returns - Refraction texture if present.  If no refraction texture and refraction
     * is linked with transparency, returns environment texture.  Otherwise, returns null.
     */
    _getRefractionTexture(scene) {
        if (this._refractionTexture) {
            return this._refractionTexture;
        }
        if (this._isRefractionEnabled) {
            return scene.environmentTexture;
        }
        return null;
    }
    /**
     * Returns true if alpha blending should be disabled.
     */
    get disableAlphaBlending() {
        return this._isRefractionEnabled && this._linkRefractionWithTransparency;
    }
    /**
     * Fills the list of render target textures.
     * @param renderTargets the list of render targets to update
     */
    fillRenderTargetTextures(renderTargets) {
        if (MaterialFlags.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
            renderTargets.push(this._refractionTexture);
        }
    }
    hasTexture(texture) {
        if (this._thicknessTexture === texture) {
            return true;
        }
        if (this._refractionTexture === texture) {
            return true;
        }
        if (this._refractionIntensityTexture === texture) {
            return true;
        }
        if (this._translucencyIntensityTexture === texture) {
            return true;
        }
        if (this._translucencyColorTexture === texture) {
            return true;
        }
        return false;
    }
    hasRenderTargetTextures() {
        if (MaterialFlags.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget) {
            return true;
        }
        return false;
    }
    getActiveTextures(activeTextures) {
        if (this._thicknessTexture) {
            activeTextures.push(this._thicknessTexture);
        }
        if (this._refractionTexture) {
            activeTextures.push(this._refractionTexture);
        }
        if (this._translucencyColorTexture) {
            activeTextures.push(this._translucencyColorTexture);
        }
        if (this._translucencyIntensityTexture) {
            activeTextures.push(this._translucencyIntensityTexture);
        }
    }
    getAnimatables(animatables) {
        if (this._thicknessTexture && this._thicknessTexture.animations && this._thicknessTexture.animations.length > 0) {
            animatables.push(this._thicknessTexture);
        }
        if (this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0) {
            animatables.push(this._refractionTexture);
        }
        if (this._translucencyColorTexture && this._translucencyColorTexture.animations && this._translucencyColorTexture.animations.length > 0) {
            animatables.push(this._translucencyColorTexture);
        }
        if (this._translucencyIntensityTexture && this._translucencyIntensityTexture.animations && this._translucencyIntensityTexture.animations.length > 0) {
            animatables.push(this._translucencyIntensityTexture);
        }
    }
    dispose(forceDisposeTextures) {
        if (forceDisposeTextures) {
            if (this._thicknessTexture) {
                this._thicknessTexture.dispose();
            }
            if (this._refractionTexture) {
                this._refractionTexture.dispose();
            }
            if (this._translucencyColorTexture) {
                this._translucencyColorTexture.dispose();
            }
            if (this._translucencyIntensityTexture) {
                this._translucencyIntensityTexture.dispose();
            }
        }
    }
    getClassName() {
        return "PBRSubSurfaceConfiguration";
    }
    addFallbacks(defines, fallbacks, currentRank) {
        if (defines.SS_SCATTERING) {
            fallbacks.addFallback(currentRank++, "SS_SCATTERING");
        }
        if (defines.SS_TRANSLUCENCY) {
            fallbacks.addFallback(currentRank++, "SS_TRANSLUCENCY");
        }
        return currentRank;
    }
    getSamplers(samplers) {
        samplers.push("thicknessSampler", "refractionIntensitySampler", "translucencyIntensitySampler", "refractionSampler", "refractionSamplerLow", "refractionSamplerHigh", "translucencyColorSampler");
    }
    getUniforms() {
        return {
            ubo: [
                { name: "vRefractionMicrosurfaceInfos", size: 4, type: "vec4" },
                { name: "vRefractionFilteringInfo", size: 2, type: "vec2" },
                { name: "vTranslucencyIntensityInfos", size: 2, type: "vec2" },
                { name: "vRefractionInfos", size: 4, type: "vec4" },
                { name: "refractionMatrix", size: 16, type: "mat4" },
                { name: "vThicknessInfos", size: 2, type: "vec2" },
                { name: "vRefractionIntensityInfos", size: 2, type: "vec2" },
                { name: "thicknessMatrix", size: 16, type: "mat4" },
                { name: "refractionIntensityMatrix", size: 16, type: "mat4" },
                { name: "translucencyIntensityMatrix", size: 16, type: "mat4" },
                { name: "vThicknessParam", size: 2, type: "vec2" },
                { name: "vDiffusionDistance", size: 3, type: "vec3" },
                { name: "vTintColor", size: 4, type: "vec4" },
                { name: "vSubSurfaceIntensity", size: 3, type: "vec3" },
                { name: "vRefractionPosition", size: 3, type: "vec3" },
                { name: "vRefractionSize", size: 3, type: "vec3" },
                { name: "scatteringDiffusionProfile", size: 1, type: "float" },
                { name: "dispersion", size: 1, type: "float" },
                { name: "vTranslucencyColor", size: 4, type: "vec4" },
                { name: "vTranslucencyColorInfos", size: 2, type: "vec2" },
                { name: "translucencyColorMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "isRefractionEnabled", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "isTranslucencyEnabled", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "isDispersionEnabled", void 0);
__decorate([
    serialize(),
    expandToProperty("_markScenePrePassDirty")
], PBRSubSurfaceConfiguration.prototype, "isScatteringEnabled", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "_scatteringDiffusionProfileIndex", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "refractionIntensity", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "translucencyIntensity", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "useAlbedoToTintRefraction", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "useAlbedoToTintTranslucency", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "thicknessTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "refractionTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "indexOfRefraction", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "_volumeIndexOfRefraction", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "volumeIndexOfRefraction", null);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "invertRefractionY", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "linkRefractionWithTransparency", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "minimumThickness", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "maximumThickness", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "useThicknessAsDepth", void 0);
__decorate([
    serializeAsColor3()
], PBRSubSurfaceConfiguration.prototype, "tintColor", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "tintColorAtDistance", void 0);
__decorate([
    serialize()
], PBRSubSurfaceConfiguration.prototype, "dispersion", void 0);
__decorate([
    serializeAsColor3()
], PBRSubSurfaceConfiguration.prototype, "diffusionDistance", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "useMaskFromThicknessTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "refractionIntensityTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "translucencyIntensityTexture", void 0);
__decorate([
    serializeAsColor3()
], PBRSubSurfaceConfiguration.prototype, "translucencyColor", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "translucencyColorTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRSubSurfaceConfiguration.prototype, "useGltfStyleTextures", void 0);
//# sourceMappingURL=pbrSubSurfaceConfiguration.js.map