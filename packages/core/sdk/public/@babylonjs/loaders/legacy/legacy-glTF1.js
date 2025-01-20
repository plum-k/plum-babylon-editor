/* eslint-disable import/no-internal-modules */
import * as GLTF1 from "../glTF/1.0/index.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    globalObject.BABYLON.GLTF1 = globalObject.BABYLON.GLTF1 || {};
    for (const key in GLTF1) {
        globalObject.BABYLON.GLTF1[key] = GLTF1[key];
    }
}
export { GLTF1 };
//# sourceMappingURL=legacy-glTF1.js.map