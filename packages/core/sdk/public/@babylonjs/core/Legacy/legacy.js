/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
import * as BABYLON from "../index.js";
import * as DebugImport from "../Debug/index.js";
/**
 * Legacy support, defining window.BABYLON (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    globalObject.BABYLON = globalObject.BABYLON || {};
    const BABYLONGLOBAL = globalObject.BABYLON;
    if (!BABYLONGLOBAL.Debug) {
        BABYLONGLOBAL.Debug = BABYLONGLOBAL.Debug || {};
        for (const key in DebugImport) {
            if (!BABYLONGLOBAL.Debug[key]) {
                BABYLONGLOBAL.Debug[key] = DebugImport[key];
            }
        }
    }
    for (const key in BABYLON) {
        if (!BABYLONGLOBAL[key]) {
            BABYLONGLOBAL[key] = BABYLON[key];
        }
    }
}
export * from "../index.js";
export const Debug = {
    AxesViewer: BABYLON.AxesViewer,
    BoneAxesViewer: BABYLON.BoneAxesViewer,
    PhysicsViewer: BABYLON.PhysicsViewer,
    SkeletonViewer: BABYLON.SkeletonViewer,
};
//# sourceMappingURL=legacy.js.map