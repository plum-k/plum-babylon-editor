/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
const _RegisteredTypes = {};
/**
 * @internal
 */
export function RegisterClass(className, type) {
    _RegisteredTypes[className] = type;
}
/**
 * @internal
 */
export function GetClass(fqdn) {
    return _RegisteredTypes[fqdn];
}
/**
 * @internal
 */
export function GetClassName(obj) {
    for (const key in _RegisteredTypes) {
        if (obj instanceof _RegisteredTypes[key] && !key.includes("Abstract")) {
            return key;
        }
    }
    return "Unknown";
}
//# sourceMappingURL=typeStore.js.map