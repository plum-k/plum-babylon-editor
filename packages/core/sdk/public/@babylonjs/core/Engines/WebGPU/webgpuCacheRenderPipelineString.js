import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline.js";
/**
 * Class not used, WebGPUCacheRenderPipelineTree is faster
 * @internal
 */
export class WebGPUCacheRenderPipelineString extends WebGPUCacheRenderPipeline {
    _getRenderPipeline(param) {
        const hash = this._states.join();
        param.token = hash;
        param.pipeline = WebGPUCacheRenderPipelineString._Cache[hash];
    }
    _setRenderPipeline(param) {
        WebGPUCacheRenderPipelineString._Cache[param.token] = param.pipeline;
    }
}
WebGPUCacheRenderPipelineString._Cache = {};
//# sourceMappingURL=webgpuCacheRenderPipelineString.js.map