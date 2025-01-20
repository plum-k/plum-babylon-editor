import { ThinBlackAndWhitePostProcess } from "../../../PostProcesses/thinBlackAndWhitePostProcess.js";
import { FrameGraphPostProcessTask } from "./postProcessTask.js";
/**
 * Task which applies a black and white post process.
 */
export class FrameGraphBlackAndWhiteTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new black and white task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the black and white effect. If not provided, a new one will be created.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBlackAndWhitePostProcess(name, frameGraph.engine));
    }
}
//# sourceMappingURL=blackAndWhiteTask.js.map