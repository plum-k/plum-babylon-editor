/* eslint-disable @typescript-eslint/naming-convention */
import { registerSceneLoaderPlugin } from "@babylonjs/core/Loading/sceneLoader.js";
import { GLTFFileLoaderMetadata } from "./glTF/glTFFileLoader.metadata.js";
import { OBJFileLoaderMetadata } from "./OBJ/objFileLoader.metadata.js";
import { SPLATFileLoaderMetadata } from "./SPLAT/splatFileLoader.metadata.js";
import { STLFileLoaderMetadata } from "./STL/stlFileLoader.metadata.js";
import { registerBuiltInGLTFExtensions } from "./glTF/2.0/Extensions/dynamic.js";
/**
 * Registers the async plugin factories for all built-in loaders.
 * Loaders will be dynamically imported on demand, only when a SceneLoader load operation needs each respective loader.
 */
export function registerBuiltInLoaders() {
    // Register the glTF loader (2.0) specifically/only.
    registerSceneLoaderPlugin({
        ...GLTFFileLoaderMetadata,
        createPlugin: async (options) => {
            const { GLTFFileLoader } = await import("./glTF/2.0/glTFLoader.js");
            return new GLTFFileLoader(options[GLTFFileLoaderMetadata.name]);
        },
    });
    // Register the built-in glTF (2.0) extensions.
    registerBuiltInGLTFExtensions();
    // Register the OBJ loader.
    registerSceneLoaderPlugin({
        ...OBJFileLoaderMetadata,
        createPlugin: async () => {
            const { OBJFileLoader } = await import("./OBJ/objFileLoader.js");
            return new OBJFileLoader();
        },
    });
    // Register the SPLAT loader.
    registerSceneLoaderPlugin({
        ...SPLATFileLoaderMetadata,
        createPlugin: async (options) => {
            const { SPLATFileLoader } = await import("./SPLAT/splatFileLoader.js");
            return new SPLATFileLoader(options[SPLATFileLoaderMetadata.name]);
        },
    });
    // Register the STL loader.
    registerSceneLoaderPlugin({
        ...STLFileLoaderMetadata,
        createPlugin: async () => {
            const { STLFileLoader } = await import("./STL/stlFileLoader.js");
            return new STLFileLoader();
        },
    });
}
//# sourceMappingURL=dynamic.js.map