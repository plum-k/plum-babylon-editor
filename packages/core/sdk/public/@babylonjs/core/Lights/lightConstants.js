/** Defines the cross module constantsused by lights to avoid circular dependencies */
export class LightConstants {
    /**
     * Sort function to order lights for rendering.
     * @param a First Light object to compare to second.
     * @param b Second Light object to compare first.
     * @returns -1 to reduce's a's index relative to be, 0 for no change, 1 to increase a's index relative to b.
     */
    static CompareLightsPriority(a, b) {
        //shadow-casting lights have priority over non-shadow-casting lights
        //the renderPriority is a secondary sort criterion
        if (a.shadowEnabled !== b.shadowEnabled) {
            return (b.shadowEnabled ? 1 : 0) - (a.shadowEnabled ? 1 : 0);
        }
        return b.renderPriority - a.renderPriority;
    }
}
/**
 * Falloff Default: light is falling off following the material specification:
 * standard material is using standard falloff whereas pbr material can request special falloff per materials.
 */
LightConstants.FALLOFF_DEFAULT = 0;
/**
 * Falloff Physical: light is falling off following the inverse squared distance law.
 */
LightConstants.FALLOFF_PHYSICAL = 1;
/**
 * Falloff gltf: light is falling off as described in the gltf moving to PBR document
 * to enhance interoperability with other engines.
 */
LightConstants.FALLOFF_GLTF = 2;
/**
 * Falloff Standard: light is falling off like in the standard material
 * to enhance interoperability with other materials.
 */
LightConstants.FALLOFF_STANDARD = 3;
//lightmapMode Consts
/**
 * If every light affecting the material is in this lightmapMode,
 * material.lightmapTexture adds or multiplies
 * (depends on material.useLightmapAsShadowmap)
 * after every other light calculations.
 */
LightConstants.LIGHTMAP_DEFAULT = 0;
/**
 * material.lightmapTexture as only diffuse lighting from this light
 * adds only specular lighting from this light
 * adds dynamic shadows
 */
LightConstants.LIGHTMAP_SPECULAR = 1;
/**
 * material.lightmapTexture as only lighting
 * no light calculation from this light
 * only adds dynamic shadows from this light
 */
LightConstants.LIGHTMAP_SHADOWSONLY = 2;
// Intensity Mode Consts
/**
 * Each light type uses the default quantity according to its type:
 *      point/spot lights use luminous intensity
 *      directional lights use illuminance
 */
LightConstants.INTENSITYMODE_AUTOMATIC = 0;
/**
 * lumen (lm)
 */
LightConstants.INTENSITYMODE_LUMINOUSPOWER = 1;
/**
 * candela (lm/sr)
 */
LightConstants.INTENSITYMODE_LUMINOUSINTENSITY = 2;
/**
 * lux (lm/m^2)
 */
LightConstants.INTENSITYMODE_ILLUMINANCE = 3;
/**
 * nit (cd/m^2)
 */
LightConstants.INTENSITYMODE_LUMINANCE = 4;
// Light types ids const.
/**
 * Light type const id of the point light.
 */
LightConstants.LIGHTTYPEID_POINTLIGHT = 0;
/**
 * Light type const id of the directional light.
 */
LightConstants.LIGHTTYPEID_DIRECTIONALLIGHT = 1;
/**
 * Light type const id of the spot light.
 */
LightConstants.LIGHTTYPEID_SPOTLIGHT = 2;
/**
 * Light type const id of the hemispheric light.
 */
LightConstants.LIGHTTYPEID_HEMISPHERICLIGHT = 3;
//# sourceMappingURL=lightConstants.js.map