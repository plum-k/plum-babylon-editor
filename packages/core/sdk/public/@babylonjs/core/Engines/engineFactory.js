import { Engine } from "./engine.js";
import { NullEngine } from "./nullEngine.js";
import { WebGPUEngine } from "./webgpuEngine.js";
/**
 * Helper class to create the best engine depending on the current hardware
 */
export class EngineFactory {
    /**
     * Creates an engine based on the capabilities of the underlying hardware
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the context dependencies
     * @returns a promise that resolves with the created engine
     */
    static async CreateAsync(canvas, options) {
        const supported = await WebGPUEngine.IsSupportedAsync;
        if (supported) {
            return WebGPUEngine.CreateAsync(canvas, options);
        }
        if (Engine.IsSupported) {
            return new Engine(canvas, undefined, options);
        }
        return new NullEngine(options);
    }
}
//# sourceMappingURL=engineFactory.js.map