/* eslint-disable import/no-internal-modules */
import * as MatLib from "../index.js";
/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    for (const mat in MatLib) {
        globalObject.BABYLON[mat] = MatLib[mat];
    }
}
export * from "../index.js";
//# sourceMappingURL=legacy.js.map