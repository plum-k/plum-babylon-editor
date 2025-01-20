import { Tools } from "@babylonjs/core/Misc/tools.js";
function GetMimeType(fileName) {
    if (fileName.endsWith(".glb")) {
        return "model/gltf-binary";
    }
    else if (fileName.endsWith(".bin")) {
        return "application/octet-stream";
    }
    else if (fileName.endsWith(".gltf")) {
        return "model/gltf+json";
    }
    else if (fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")) {
        return "image/jpeg" /* ImageMimeType.JPEG */;
    }
    else if (fileName.endsWith(".png")) {
        return "image/png" /* ImageMimeType.PNG */;
    }
    else if (fileName.endsWith(".webp")) {
        return "image/webp" /* ImageMimeType.WEBP */;
    }
    return undefined;
}
/**
 * Class for holding and downloading glTF file data
 */
export class GLTFData {
    constructor() {
        /**
         * Object which contains the file name as the key and its data as the value
         */
        this.files = {};
    }
    /**
     * @deprecated Use files instead
     */
    get glTFFiles() {
        return this.files;
    }
    /**
     * Downloads the glTF data as files based on their names and data
     */
    downloadFiles() {
        for (const key in this.files) {
            const value = this.files[key];
            const blob = new Blob([value], { type: GetMimeType(key) });
            Tools.Download(blob, key);
        }
    }
}
//# sourceMappingURL=glTFData.js.map