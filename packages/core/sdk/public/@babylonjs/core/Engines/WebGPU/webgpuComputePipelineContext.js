/** @internal */
export class WebGPUComputePipelineContext {
    get isAsync() {
        return false;
    }
    get isReady() {
        if (this.isAsync) {
            // When async mode is implemented, this should return true if the pipeline is ready
            return false;
        }
        // In synchronous mode, we return false, the readiness being determined by ComputeEffect
        return false;
    }
    constructor(engine) {
        this._name = "unnamed";
        this.engine = engine;
    }
    _getComputeShaderCode() {
        return this.sources?.compute;
    }
    dispose() { }
}
//# sourceMappingURL=webgpuComputePipelineContext.js.map