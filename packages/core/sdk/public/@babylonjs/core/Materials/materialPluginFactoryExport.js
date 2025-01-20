import { DetailMapConfiguration } from "./material.detailMapConfiguration.js";
import { PBRAnisotropicConfiguration } from "./PBR/pbrAnisotropicConfiguration.js";
import { PBRBaseMaterial } from "./PBR/pbrBaseMaterial.js";
import { PBRBRDFConfiguration } from "./PBR/pbrBRDFConfiguration.js";
import { PBRClearCoatConfiguration } from "./PBR/pbrClearCoatConfiguration.js";
import { PBRIridescenceConfiguration } from "./PBR/pbrIridescenceConfiguration.js";
import { PBRSheenConfiguration } from "./PBR/pbrSheenConfiguration.js";
import { PBRSubSurfaceConfiguration } from "./PBR/pbrSubSurfaceConfiguration.js";
import { StandardMaterial } from "./standardMaterial.js";
/**
 * Creates an instance of the anisotropic plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRAnisotropicPlugin(material) {
    if (material instanceof PBRBaseMaterial) {
        return new PBRAnisotropicConfiguration(material);
    }
    return null;
}
/**
 * Creates an instance of the brdf plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRBRDFPlugin(material) {
    if (material instanceof PBRBaseMaterial) {
        return new PBRBRDFConfiguration(material);
    }
    return null;
}
/**
 * Creates an instance of the clear coat plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRClearCoatPlugin(material) {
    if (material instanceof PBRBaseMaterial) {
        return new PBRClearCoatConfiguration(material);
    }
    return null;
}
/**
 * Creates an instance of the iridescence plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRIridescencePlugin(material) {
    if (material instanceof PBRBaseMaterial) {
        return new PBRIridescenceConfiguration(material);
    }
    return null;
}
/**
 * Creates an instance of the sheen plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRSheenPlugin(material) {
    if (material instanceof PBRBaseMaterial) {
        return new PBRSheenConfiguration(material);
    }
    return null;
}
/**
 * Creates an instance of the sub surface plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRSubSurfacePlugin(material) {
    if (material instanceof PBRBaseMaterial) {
        return new PBRSubSurfaceConfiguration(material);
    }
    return null;
}
/**
 * Creates an instance of the detail map plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createDetailMapPlugin(material) {
    if (material instanceof PBRBaseMaterial || material instanceof StandardMaterial) {
        return new DetailMapConfiguration(material);
    }
    return null;
}
//# sourceMappingURL=materialPluginFactoryExport.js.map