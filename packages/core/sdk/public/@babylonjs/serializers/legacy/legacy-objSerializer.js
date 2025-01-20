/* eslint-disable import/no-internal-modules */
import * as Serializers from "../OBJ/index.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const serializer in Serializers) {
        globalObject.BABYLON[serializer] = Serializers[serializer];
    }
}
export * from "../OBJ/index.js";
//# sourceMappingURL=legacy-objSerializer.js.map