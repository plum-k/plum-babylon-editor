/* eslint-disable import/no-internal-modules */
import * as Exporters from "../glTF/glTFFileExporter.js";
import * as Datas from "../glTF/2.0/glTFData.js";
import * as Serializers from "../glTF/2.0/glTFSerializer.js";
import * as Extensions from "../glTF/2.0/Extensions/index.js";
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
    BABYLON.GLTF2.Exporter = BABYLON.GLTF2.Exporter || {};
    BABYLON.GLTF2.Exporter.Extensions = BABYLON.GLTF2.Exporter.Extensions || {};
    const keys = [];
    for (const key in Exporters) {
        BABYLON[key] = Exporters[key];
        keys.push(key);
    }
    for (const key in Datas) {
        BABYLON[key] = Datas[key];
        keys.push(key);
    }
    for (const key in Serializers) {
        BABYLON[key] = Serializers[key];
        keys.push(key);
    }
    for (const key in Extensions) {
        BABYLON.GLTF2.Exporter.Extensions[key] = Extensions[key];
        keys.push(key);
    }
    for (const key in GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }
        BABYLON.GLTF2.Exporter[key] = GLTF2[key];
    }
}
export * from "../glTF/glTFFileExporter.js";
export * from "../glTF/2.0/index.js";
//# sourceMappingURL=legacy-glTF2Serializer.js.map