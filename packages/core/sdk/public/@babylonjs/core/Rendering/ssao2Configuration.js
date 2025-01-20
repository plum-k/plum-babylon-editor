
/**
 * Contains all parameters needed for the prepass to perform
 * screen space subsurface scattering
 */
export class SSAO2Configuration {
    constructor() {
        /**
         * Is subsurface enabled
         */
        this.enabled = false;
        /**
         * Name of the configuration
         */
        this.name = "ssao2";
        /**
         * Textures that should be present in the MRT for this effect to work
         */
        this.texturesRequired = [6, 5];
    }
}
//# sourceMappingURL=ssao2Configuration.js.map