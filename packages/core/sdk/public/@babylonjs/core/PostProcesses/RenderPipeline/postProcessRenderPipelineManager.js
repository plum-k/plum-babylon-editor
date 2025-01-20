/**
 * PostProcessRenderPipelineManager class
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
 */
export class PostProcessRenderPipelineManager {
    /**
     * Initializes a PostProcessRenderPipelineManager
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
     */
    constructor() {
        this._renderPipelines = {};
    }
    /**
     * Gets the list of supported render pipelines
     */
    get supportedPipelines() {
        const result = [];
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                if (pipeline.isSupported) {
                    result.push(pipeline);
                }
            }
        }
        return result;
    }
    /**
     * Adds a pipeline to the manager
     * @param renderPipeline The pipeline to add
     */
    addPipeline(renderPipeline) {
        this._renderPipelines[renderPipeline._name] = renderPipeline;
    }
    /**
     * Remove the pipeline from the manager
     * @param renderPipelineName the name of the pipeline to remove
     */
    removePipeline(renderPipelineName) {
        delete this._renderPipelines[renderPipelineName];
    }
    /**
     * Attaches a camera to the pipeline
     * @param renderPipelineName The name of the pipeline to attach to
     * @param cameras the camera to attach
     * @param unique if the camera can be attached multiple times to the pipeline
     */
    attachCamerasToRenderPipeline(renderPipelineName, cameras, unique = false) {
        const renderPipeline = this._renderPipelines[renderPipelineName];
        if (!renderPipeline) {
            return;
        }
        renderPipeline._attachCameras(cameras, unique);
    }
    /**
     * Detaches a camera from the pipeline
     * @param renderPipelineName The name of the pipeline to detach from
     * @param cameras the camera to detach
     */
    detachCamerasFromRenderPipeline(renderPipelineName, cameras) {
        const renderPipeline = this._renderPipelines[renderPipelineName];
        if (!renderPipeline) {
            return;
        }
        renderPipeline._detachCameras(cameras);
    }
    /**
     * Enables an effect by name on a pipeline
     * @param renderPipelineName the name of the pipeline to enable the effect in
     * @param renderEffectName the name of the effect to enable
     * @param cameras the cameras that the effect should be enabled on
     */
    enableEffectInPipeline(renderPipelineName, renderEffectName, cameras) {
        const renderPipeline = this._renderPipelines[renderPipelineName];
        if (!renderPipeline) {
            return;
        }
        renderPipeline._enableEffect(renderEffectName, cameras);
    }
    /**
     * Disables an effect by name on a pipeline
     * @param renderPipelineName the name of the pipeline to disable the effect in
     * @param renderEffectName the name of the effect to disable
     * @param cameras the cameras that the effect should be disabled on
     */
    disableEffectInPipeline(renderPipelineName, renderEffectName, cameras) {
        const renderPipeline = this._renderPipelines[renderPipelineName];
        if (!renderPipeline) {
            return;
        }
        renderPipeline._disableEffect(renderEffectName, cameras);
    }
    /**
     * Updates the state of all contained render pipelines and disposes of any non supported pipelines
     */
    update() {
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                if (!pipeline.isSupported) {
                    pipeline.dispose();
                    delete this._renderPipelines[renderPipelineName];
                }
                else {
                    pipeline._update();
                }
            }
        }
    }
    /** @internal */
    _rebuild() {
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                pipeline._rebuild();
            }
        }
    }
    /**
     * Disposes of the manager and pipelines
     */
    dispose() {
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                pipeline.dispose();
            }
        }
    }
}
//# sourceMappingURL=postProcessRenderPipelineManager.js.map