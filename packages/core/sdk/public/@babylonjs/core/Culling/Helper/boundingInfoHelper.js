/**
 * Utility class to help with bounding info management
 * Warning: using the BoundingInfoHelper class may be slower than executing calculations on the CPU!
 * This will happen if there are a lot of meshes / few vertices (like with the BrainStem model)
 * The BoundingInfoHelper will perform better if there are few meshes / a lot of vertices
 *  https://playground.babylonjs.com/#QPOERJ#9: WebGL
 *  https://playground.babylonjs.com/#QPOERJ#10: WebGPU
 */
export class BoundingInfoHelper {
    /**
     * Creates a new BoundingInfoHelper
     * @param engine defines the engine to use
     */
    constructor(engine) {
        this._engine = engine;
    }
    async _initializePlatform() {
        if (!this._platform) {
            if (this._engine.getCaps().supportComputeShaders) {
                const module = await import("./computeShaderBoundingHelper.js");
                this._platform = new module.ComputeShaderBoundingHelper(this._engine);
            }
            else if (this._engine.getCaps().supportTransformFeedbacks) {
                const module = await import("./transformFeedbackBoundingHelper.js");
                this._platform = new module.TransformFeedbackBoundingHelper(this._engine);
            }
            else {
                throw new Error("Your engine does not support Compute Shaders or Transform Feedbacks");
            }
        }
    }
    /**
     * Compute the bounding info of a mesh / array of meshes using shaders
     * @param target defines the mesh(es) to update
     * @returns a promise that resolves when the bounding info is/are computed
     */
    async computeAsync(target) {
        await this._initializePlatform();
        return this._platform.processAsync(target);
    }
    /**
     * Register a mesh / array of meshes to be processed per batch
     * This method must be called before calling batchProcess (which can be called several times) and batchFetchResultsAsync
     * @param target defines the mesh(es) to be processed per batch
     * @returns a promise that resolves when the initialization is done
     */
    async batchInitializeAsync(target) {
        await this._initializePlatform();
        return this._platform.registerMeshListAsync(target);
    }
    /**
     * Processes meshes registered with batchRegisterAsync
     * If called multiple times, the second, third, etc calls will perform a union of the bounding boxes calculated in the previous calls
     */
    batchProcess() {
        this._platform.processMeshList();
    }
    /**
     * Update the bounding info of the meshes registered with batchRegisterAsync, after batchProcess has been called once or several times
     * @returns a promise that resolves when the bounding info is/are computed
     */
    async batchFetchResultsAsync() {
        return this._platform.fetchResultsForMeshListAsync();
    }
    /**
     * Dispose and release associated resources
     */
    dispose() {
        this._platform.dispose();
    }
}
//# sourceMappingURL=boundingInfoHelper.js.map