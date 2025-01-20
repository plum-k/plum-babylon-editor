/**
 * Class used to store configuration data associated with pointer picking
 */
export class PointerPickingConfiguration {
    constructor() {
        /**
         * Gets or sets a predicate used to select candidate meshes for a pointer down event
         */
        this.pointerDownFastCheck = false;
        /**
         * Gets or sets a predicate used to select candidate meshes for a pointer up event
         */
        this.pointerUpFastCheck = false;
        /**
         * Gets or sets a predicate used to select candidate meshes for a pointer move event
         */
        this.pointerMoveFastCheck = false;
        /**
         * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer move event occurs.
         */
        this.skipPointerMovePicking = false;
        /**
         * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer down event occurs.
         */
        this.skipPointerDownPicking = false;
        /**
         * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer up event occurs.  Off by default.
         */
        this.skipPointerUpPicking = false;
    }
}
//# sourceMappingURL=pointerPickingConfiguration.js.map