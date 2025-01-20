import { GetEnvInfo, UploadEnvLevelsAsync, UploadEnvSpherical } from "../../../Misc/environmentTextureTools.js";
/**
 * Implementation of the ENV Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _ENVTextureLoader {
    constructor() {
        /**
         * Defines whether the loader supports cascade loading the different faces.
         */
        this.supportCascades = false;
    }
    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    loadCubeData(data, texture, createPolynomials, onLoad, onError) {
        if (Array.isArray(data)) {
            return;
        }
        const info = GetEnvInfo(data);
        if (info) {
            texture.width = info.width;
            texture.height = info.width;
            try {
                UploadEnvSpherical(texture, info);
                UploadEnvLevelsAsync(texture, data, info).then(() => {
                    texture.isReady = true;
                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();
                    if (onLoad) {
                        onLoad();
                    }
                }, (reason) => {
                    onError?.("Can not upload environment levels", reason);
                });
            }
            catch (e) {
                onError?.("Can not upload environment file", e);
            }
        }
        else if (onError) {
            onError("Can not parse the environment file", null);
        }
    }
    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     */
    loadData() {
        // eslint-disable-next-line no-throw-literal
        throw ".env not supported in 2d.";
    }
}
//# sourceMappingURL=envTextureLoader.js.map