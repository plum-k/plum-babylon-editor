const warnedMap = {};
/**
 * @internal
 */
export function _WarnImport(name, warnOnce = false) {
    if (warnOnce && warnedMap[name]) {
        return;
    }
    warnedMap[name] = true;
    return `${name} needs to be imported before as it contains a side-effect required by your code.`;
}
//# sourceMappingURL=devTools.js.map