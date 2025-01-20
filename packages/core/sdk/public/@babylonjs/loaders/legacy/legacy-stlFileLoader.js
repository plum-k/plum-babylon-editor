/* eslint-disable import/no-internal-modules */
import * as Loaders from "../STL/index.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const key in Loaders) {
        if (!globalObject.BABYLON[key]) {
            globalObject.BABYLON[key] = Loaders[key];
        }
    }
}
export * from "../STL/index.js";
//# sourceMappingURL=legacy-stlFileLoader.js.map