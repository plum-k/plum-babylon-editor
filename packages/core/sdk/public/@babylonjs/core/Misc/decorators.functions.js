// eslint-disable-next-line @typescript-eslint/naming-convention
const __mergedStore = {};
// eslint-disable-next-line @typescript-eslint/naming-convention
const __decoratorInitialStore = {};
/** @internal */
export function GetDirectStore(target) {
    const classKey = target.getClassName();
    if (!__decoratorInitialStore[classKey]) {
        __decoratorInitialStore[classKey] = {};
    }
    return __decoratorInitialStore[classKey];
}
/**
 * @returns the list of properties flagged as serializable
 * @param target host object
 */
export function GetMergedStore(target) {
    const classKey = target.getClassName();
    if (__mergedStore[classKey]) {
        return __mergedStore[classKey];
    }
    __mergedStore[classKey] = {};
    const store = __mergedStore[classKey];
    let currentTarget = target;
    let currentKey = classKey;
    while (currentKey) {
        const initialStore = __decoratorInitialStore[currentKey];
        for (const property in initialStore) {
            store[property] = initialStore[property];
        }
        let parent;
        let done = false;
        do {
            parent = Object.getPrototypeOf(currentTarget);
            if (!parent.getClassName) {
                done = true;
                break;
            }
            if (parent.getClassName() !== currentKey) {
                break;
            }
            currentTarget = parent;
        } while (parent);
        if (done) {
            break;
        }
        currentKey = parent.getClassName();
        currentTarget = parent;
    }
    return store;
}
//# sourceMappingURL=decorators.functions.js.map