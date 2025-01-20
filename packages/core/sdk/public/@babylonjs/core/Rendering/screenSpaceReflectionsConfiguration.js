
/**
 * Contains all parameters needed for the prepass to perform
 * screen space reflections
 */
export class ScreenSpaceReflectionsConfiguration {
    constructor() {
        /**
         * Is ssr enabled
         */
        this.enabled = false;
        /**
         * Name of the configuration
         */
        this.name = "screenSpaceReflections";
        /**
         * Textures that should be present in the MRT for this effect to work
         */
        this.texturesRequired = [6, 3, 1];
    }
}
//# sourceMappingURL=screenSpaceReflectionsConfiguration.js.map