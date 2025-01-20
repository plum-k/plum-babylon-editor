import { Tools } from "../../Misc/tools.js";
import { AutoReleaseWorkerPool } from "../../Misc/workerPool.js";
import { initializeWebWorker } from "./dracoCompressionWorker.js";
/**
 * @internal
 */
export function _GetDefaultNumWorkers() {
    if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
        return 1;
    }
    // Use 50% of the available logical processors but capped at 4.
    return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
}
/**
 * @internal
 */
export function _IsConfigurationAvailable(config) {
    return !!((config.wasmUrl && (config.wasmBinary || config.wasmBinaryUrl) && typeof WebAssembly === "object") || config.fallbackUrl);
    // TODO: Account for jsModule
}
/**
 * Base class for a Draco codec.
 * @internal
 */
export class DracoCodec {
    /**
     * Constructor
     * @param configuration The configuration for the DracoCodec instance.
     */
    constructor(configuration) {
        // check if the codec binary and worker pool was injected
        // Note - it is expected that the developer checked if WebWorker, WebAssembly and the URL object are available
        if (configuration.workerPool) {
            // Set the promise accordingly
            this._workerPoolPromise = Promise.resolve(configuration.workerPool);
            return;
        }
        // to avoid making big changes to the code here, if wasmBinary is provided use it in the wasmBinaryPromise
        const wasmBinaryProvided = configuration.wasmBinary;
        const numberOfWorkers = configuration.numWorkers ?? _GetDefaultNumWorkers();
        const useWorkers = numberOfWorkers && typeof Worker === "function" && typeof URL === "function";
        const urlNeeded = useWorkers || !configuration.jsModule;
        // code maintained here for back-compat with no changes
        const codecInfo = configuration.wasmUrl && configuration.wasmBinaryUrl && typeof WebAssembly === "object"
            ? {
                url: urlNeeded ? Tools.GetBabylonScriptURL(configuration.wasmUrl, true) : "",
                wasmBinaryPromise: wasmBinaryProvided
                    ? Promise.resolve(wasmBinaryProvided)
                    : Tools.LoadFileAsync(Tools.GetBabylonScriptURL(configuration.wasmBinaryUrl, true)),
            }
            : {
                url: urlNeeded ? Tools.GetBabylonScriptURL(configuration.fallbackUrl) : "",
                wasmBinaryPromise: Promise.resolve(undefined),
            };
        // If using workers, initialize a worker pool with either the wasm or url?
        if (useWorkers) {
            this._workerPoolPromise = codecInfo.wasmBinaryPromise.then((wasmBinary) => {
                const workerContent = this._getWorkerContent();
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                return new AutoReleaseWorkerPool(numberOfWorkers, () => {
                    const worker = new Worker(workerBlobUrl);
                    return initializeWebWorker(worker, wasmBinary, codecInfo.url);
                });
            });
        }
        else {
            this._modulePromise = codecInfo.wasmBinaryPromise.then(async (wasmBinary) => {
                if (!this._isModuleAvailable()) {
                    if (!configuration.jsModule) {
                        if (!codecInfo.url) {
                            throw new Error("Draco codec module is not available");
                        }
                        await Tools.LoadBabylonScriptAsync(codecInfo.url);
                    }
                }
                return this._createModuleAsync(wasmBinary, configuration.jsModule);
            });
        }
    }
    /**
     * Returns a promise that resolves when ready. Call this manually to ensure the draco codec is ready before use.
     * @returns a promise that resolves when ready
     */
    async whenReadyAsync() {
        if (this._workerPoolPromise) {
            await this._workerPoolPromise;
            return;
        }
        if (this._modulePromise) {
            await this._modulePromise;
            return;
        }
    }
    /**
     * Stop all async operations and release resources.
     */
    dispose() {
        if (this._workerPoolPromise) {
            this._workerPoolPromise.then((workerPool) => {
                workerPool.dispose();
            });
        }
        delete this._workerPoolPromise;
        delete this._modulePromise;
    }
}
//# sourceMappingURL=dracoCodec.js.map