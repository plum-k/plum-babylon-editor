/**
 * Helper class used to generate session unique ID
 */
export class UniqueIdGenerator {
    /**
     * Gets an unique (relatively to the current scene) Id
     */
    static get UniqueId() {
        const result = this._UniqueIdCounter;
        this._UniqueIdCounter++;
        return result;
    }
}
// Statics
UniqueIdGenerator._UniqueIdCounter = 1;
//# sourceMappingURL=uniqueIdGenerator.js.map