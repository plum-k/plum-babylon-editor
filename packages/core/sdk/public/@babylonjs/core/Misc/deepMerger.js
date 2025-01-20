// https://stackoverflow.com/a/48218209
/**
 * Merges a series of objects into a single object, deeply.
 * @param objects The objects to merge (objects later in the list take precedence).
 * @returns The merged object.
 */
export function deepMerge(...objects) {
    const isRecord = (obj) => !!obj && typeof obj === "object";
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach((key) => {
            const pVal = prev[key];
            const oVal = obj[key];
            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            }
            else if (isRecord(pVal) && isRecord(oVal)) {
                prev[key] = deepMerge(pVal, oVal);
            }
            else {
                prev[key] = oVal;
            }
        });
        return prev;
    }, {});
}
//# sourceMappingURL=deepMerger.js.map