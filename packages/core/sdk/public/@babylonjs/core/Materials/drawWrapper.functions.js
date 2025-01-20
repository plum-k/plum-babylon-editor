/**
 * Detect if the effect is a DrawWrapper
 * @param effect defines the entity to test
 * @returns if the entity is a DrawWrapper
 */
export function IsWrapper(effect) {
    return effect.getPipelineContext === undefined;
}
//# sourceMappingURL=drawWrapper.functions.js.map