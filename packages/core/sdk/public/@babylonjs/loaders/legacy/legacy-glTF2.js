/* eslint-disable import/no-internal-modules */
import * as Extensions from "../glTF/2.0/Extensions/index.js";
import * as Interfaces from "../glTF/2.0/glTFLoaderInterfaces.js";
import * as GLTF2 from "../glTF/2.0/index.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    const BABYLON = globalObject.BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Loader = BABYLON.GLTF2.Loader || {};
    BABYLON.GLTF2.Loader.Extensions = BABYLON.GLTF2.Loader.Extensions || {};
    const keys = [];
    for (const key in Extensions) {
        BABYLON.GLTF2.Loader.Extensions[key] = Extensions[key];
        keys.push(key);
    }
    for (const key in Interfaces) {
        BABYLON.GLTF2.Loader[key] = Interfaces[key];
        keys.push(key);
    }
    for (const key in GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }
        BABYLON.GLTF2[key] = GLTF2[key];
    }
}
export { GLTF2 };
//# sourceMappingURL=legacy-glTF2.js.map