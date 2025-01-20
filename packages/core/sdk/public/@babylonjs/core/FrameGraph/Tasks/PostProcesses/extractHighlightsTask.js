import { ThinExtractHighlightsPostProcess } from "../../../PostProcesses/thinExtractHighlightsPostProcess.js";
import { FrameGraphPostProcessTask } from "./postProcessTask.js";
/**
 * Task used to extract highlights from a scene.
 */
export class FrameGraphExtractHighlightsTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new extract highlights task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinExtractHighlightsPostProcess(name, frameGraph.engine));
    }
}
//# sourceMappingURL=extractHighlightsTask.js.map