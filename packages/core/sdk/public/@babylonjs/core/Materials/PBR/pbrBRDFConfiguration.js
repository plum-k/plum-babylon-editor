import { __decorate } from "../../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */

import { serialize, expandToProperty } from "../../Misc/decorators.js";
import { MaterialDefines } from "../materialDefines.js";
import { MaterialPluginBase } from "../materialPluginBase.js";
/**
 * @internal
 */
export class MaterialBRDFDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.BRDF_V_HEIGHT_CORRELATED = false;
        this.MS_BRDF_ENERGY_CONSERVATION = false;
        this.SPHERICAL_HARMONICS = false;
        this.SPECULAR_GLOSSINESS_ENERGY_CONSERVATION = false;
        this.MIX_IBL_RADIANCE_WITH_IRRADIANCE = true;
    }
}
/**
 * Plugin that implements the BRDF component of the PBR material
 */
export class PBRBRDFConfiguration extends MaterialPluginBase {
    /** @internal */
    _markAllSubMeshesAsMiscDirty() {
        this._internalMarkAllSubMeshesAsMiscDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible() {
        return true;
    }
    constructor(material, addToPluginList = true) {
        super(material, "PBRBRDF", 90, new MaterialBRDFDefines(), addToPluginList);
        this._useEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_ENERGY_CONSERVATION;
        /**
         * Defines if the material uses energy conservation.
         */
        this.useEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_ENERGY_CONSERVATION;
        this._useSmithVisibilityHeightCorrelated = PBRBRDFConfiguration.DEFAULT_USE_SMITH_VISIBILITY_HEIGHT_CORRELATED;
        /**
         * LEGACY Mode set to false
         * Defines if the material uses height smith correlated visibility term.
         * If you intent to not use our default BRDF, you need to load a separate BRDF Texture for the PBR
         * You can either load https://assets.babylonjs.com/environments/uncorrelatedBRDF.png
         * or https://assets.babylonjs.com/environments/uncorrelatedBRDF.dds to have more precision
         * Not relying on height correlated will also disable energy conservation.
         */
        this.useSmithVisibilityHeightCorrelated = PBRBRDFConfiguration.DEFAULT_USE_SMITH_VISIBILITY_HEIGHT_CORRELATED;
        this._useSphericalHarmonics = PBRBRDFConfiguration.DEFAULT_USE_SPHERICAL_HARMONICS;
        /**
         * LEGACY Mode set to false
         * Defines if the material uses spherical harmonics vs spherical polynomials for the
         * diffuse part of the IBL.
         * The harmonics despite a tiny bigger cost has been proven to provide closer results
         * to the ground truth.
         */
        this.useSphericalHarmonics = PBRBRDFConfiguration.DEFAULT_USE_SPHERICAL_HARMONICS;
        this._useSpecularGlossinessInputEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_SPECULAR_GLOSSINESS_INPUT_ENERGY_CONSERVATION;
        /**
         * Defines if the material uses energy conservation, when the specular workflow is active.
         * If activated, the albedo color is multiplied with (1. - maxChannel(specular color)).
         * If deactivated, a material is only physically plausible, when (albedo color + specular color) < 1.
         * In the deactivated case, the material author has to ensure energy conservation, for a physically plausible rendering.
         */
        this.useSpecularGlossinessInputEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_SPECULAR_GLOSSINESS_INPUT_ENERGY_CONSERVATION;
        this._mixIblRadianceWithIrradiance = PBRBRDFConfiguration.DEFAULT_MIX_IBL_RADIANCE_WITH_IRRADIANCE;
        /**
         * Defines if IBL irradiance is used to augment rough radiance.
         * If activated, irradiance is blended into the radiance contribution when the material is rough.
         * This better approximates raytracing results for rough surfaces.
         */
        this.mixIblRadianceWithIrradiance = PBRBRDFConfiguration.DEFAULT_MIX_IBL_RADIANCE_WITH_IRRADIANCE;
        this._internalMarkAllSubMeshesAsMiscDirty = material._dirtyCallbacks[16];
        this._enable(true);
    }
    prepareDefines(defines) {
        defines.BRDF_V_HEIGHT_CORRELATED = this._useSmithVisibilityHeightCorrelated;
        defines.MS_BRDF_ENERGY_CONSERVATION = this._useEnergyConservation && this._useSmithVisibilityHeightCorrelated;
        defines.SPHERICAL_HARMONICS = this._useSphericalHarmonics;
        defines.SPECULAR_GLOSSINESS_ENERGY_CONSERVATION = this._useSpecularGlossinessInputEnergyConservation;
        defines.MIX_IBL_RADIANCE_WITH_IRRADIANCE = this._mixIblRadianceWithIrradiance;
    }
    getClassName() {
        return "PBRBRDFConfiguration";
    }
}
/**
 * Default value used for the energy conservation.
 * This should only be changed to adapt to the type of texture in scene.environmentBRDFTexture.
 */
PBRBRDFConfiguration.DEFAULT_USE_ENERGY_CONSERVATION = true;
/**
 * Default value used for the Smith Visibility Height Correlated mode.
 * This should only be changed to adapt to the type of texture in scene.environmentBRDFTexture.
 */
PBRBRDFConfiguration.DEFAULT_USE_SMITH_VISIBILITY_HEIGHT_CORRELATED = true;
/**
 * Default value used for the IBL diffuse part.
 * This can help switching back to the polynomials mode globally which is a tiny bit
 * less GPU intensive at the drawback of a lower quality.
 */
PBRBRDFConfiguration.DEFAULT_USE_SPHERICAL_HARMONICS = true;
/**
 * Default value used for activating energy conservation for the specular workflow.
 * If activated, the albedo color is multiplied with (1. - maxChannel(specular color)).
 * If deactivated, a material is only physically plausible, when (albedo color + specular color) < 1.
 */
PBRBRDFConfiguration.DEFAULT_USE_SPECULAR_GLOSSINESS_INPUT_ENERGY_CONSERVATION = true;
/**
 * Default value for whether IBL irradiance is used to augment rough radiance.
 * If activated, irradiance is blended into the radiance contribution when the material is rough.
 * This better approximates raytracing results for rough surfaces.
 */
PBRBRDFConfiguration.DEFAULT_MIX_IBL_RADIANCE_WITH_IRRADIANCE = true;
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRBRDFConfiguration.prototype, "useEnergyConservation", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRBRDFConfiguration.prototype, "useSmithVisibilityHeightCorrelated", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRBRDFConfiguration.prototype, "useSphericalHarmonics", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRBRDFConfiguration.prototype, "useSpecularGlossinessInputEnergyConservation", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], PBRBRDFConfiguration.prototype, "mixIblRadianceWithIrradiance", void 0);
//# sourceMappingURL=pbrBRDFConfiguration.js.map