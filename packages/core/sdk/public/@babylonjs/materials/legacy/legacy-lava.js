/* eslint-disable import/no-internal-modules */
import * as MatLib from "../lava/index.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const key in MatLib) {
        globalObject.BABYLON[key] = MatLib[key];
    }
}
export * from "../lava/index.js";
//# sourceMappingURL=legacy-lava.js.map