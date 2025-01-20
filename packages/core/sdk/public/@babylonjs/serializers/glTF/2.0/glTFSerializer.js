import { GLTFExporter } from "./glTFExporter.js";
/**
 * Class for generating glTF data from a Babylon scene.
 */
export class GLTF2Export {
    /**
     * Exports the scene to .gltf file format
     * @param scene Babylon scene
     * @param fileName Name to use for the .gltf file
     * @param options Exporter options
     * @returns Returns the exported data
     */
    static async GLTFAsync(scene, fileName, options) {
        if (!options || !options.exportWithoutWaitingForScene) {
            await scene.whenReadyAsync();
        }
        const exporter = new GLTFExporter(scene, options);
        const data = await exporter.generateGLTFAsync(fileName.replace(/\.[^/.]+$/, ""));
        exporter.dispose();
        return data;
    }
    /**
     * Exports the scene to .glb file format
     * @param scene Babylon scene
     * @param fileName Name to use for the .glb file
     * @param options Exporter options
     * @returns Returns the exported data
     */
    static async GLBAsync(scene, fileName, options) {
        if (!options || !options.exportWithoutWaitingForScene) {
            await scene.whenReadyAsync();
        }
        const exporter = new GLTFExporter(scene, options);
        const data = await exporter.generateGLBAsync(fileName.replace(/\.[^/.]+$/, ""));
        exporter.dispose();
        return data;
    }
}
//# sourceMappingURL=glTFSerializer.js.map