import { Tools } from "../../Misc/tools.js";
// eslint-disable-next-line @typescript-eslint/naming-convention
let NumberOfWorkers = 0;
// eslint-disable-next-line @typescript-eslint/naming-convention
let WorkerTimeout = null;
/**
 * Meshopt compression (https://github.com/zeux/meshoptimizer)
 *
 * This class wraps the meshopt library from https://github.com/zeux/meshoptimizer/tree/master/js.
 *
 * **Encoder**
 *
 * The encoder is not currently implemented.
 *
 * **Decoder**
 *
 * By default, the configuration points to a copy of the meshopt files on the Babylon.js preview CDN (e.g. https://preview.babylonjs.com/meshopt_decoder.js).
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     MeshoptCompression.Configuration = {
 *         decoder: {
 *             url: "<url to the meshopt decoder library>"
 *         }
 *     };
 * ```
 */
export class MeshoptCompression {
    /**
     * Default instance for the meshoptimizer object.
     */
    static get Default() {
        if (!MeshoptCompression._Default) {
            MeshoptCompression._Default = new MeshoptCompression();
        }
        return MeshoptCompression._Default;
    }
    /**
     * Constructor
     */
    constructor() {
        const decoder = MeshoptCompression.Configuration.decoder;
        this._decoderModulePromise = Tools.LoadBabylonScriptAsync(decoder.url).then(() => {
            // Wait for WebAssembly compilation before resolving promise
            return MeshoptDecoder.ready;
        });
    }
    /**
     * Stop all async operations and release resources.
     */
    dispose() {
        delete this._decoderModulePromise;
    }
    /**
     * Decode meshopt data.
     * @see https://github.com/zeux/meshoptimizer/tree/master/js#decoder
     * @param source The input data.
     * @param count The number of elements.
     * @param stride The stride in bytes.
     * @param mode The compression mode.
     * @param filter The compression filter.
     * @returns a Promise<Uint8Array> that resolves to the decoded data
     */
    decodeGltfBufferAsync(source, count, stride, mode, filter) {
        return this._decoderModulePromise.then(async () => {
            if (NumberOfWorkers === 0) {
                MeshoptDecoder.useWorkers(1);
                NumberOfWorkers = 1;
            }
            const result = await MeshoptDecoder.decodeGltfBufferAsync(count, stride, source, mode, filter);
            // a simple debounce to avoid switching back and forth between workers and no workers while decoding
            if (WorkerTimeout !== null) {
                clearTimeout(WorkerTimeout);
            }
            WorkerTimeout = setTimeout(() => {
                MeshoptDecoder.useWorkers(0);
                NumberOfWorkers = 0;
                WorkerTimeout = null;
            }, 1000);
            return result;
        });
    }
}
/**
 * The configuration. Defaults to the following:
 * ```javascript
 * decoder: {
 *   url: "https://cdn.babylonjs.com/meshopt_decoder.js"
 * }
 * ```
 */
MeshoptCompression.Configuration = {
    decoder: {
        url: `${Tools._DefaultCdnUrl}/meshopt_decoder.js`,
    },
};
MeshoptCompression._Default = null;
//# sourceMappingURL=meshoptCompression.js.map