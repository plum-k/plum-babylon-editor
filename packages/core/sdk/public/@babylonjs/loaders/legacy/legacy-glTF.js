import * as FileLoader from "../glTF/glTFFileLoader.js";
import * as Validation from "../glTF/glTFValidation.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    for (const key in FileLoader) {
        globalObject.BABYLON[key] = FileLoader[key];
    }
    for (const key in Validation) {
        globalObject.BABYLON[key] = Validation[key];
    }
}
export * from "../glTF/glTFFileLoader.js";
export * from "../glTF/glTFValidation.js";
//# sourceMappingURL=legacy-glTF.js.map