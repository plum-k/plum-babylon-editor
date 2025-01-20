import { FrameGraphPostProcessTask } from "./postProcessTask.js";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "../../../PostProcesses/thinPassPostProcess.js";
/**
 * Task which applies a pass post process.
 */
export class FrameGraphPassTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new pass task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the pass effect. If not provided, a new one will be created.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinPassPostProcess(name, frameGraph.engine));
    }
}
/**
 * Task which applies a pass cube post process.
 */
export class FrameGraphPassCubeTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new pass cube task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the pass cube effect. If not provided, a new one will be created.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinPassCubePostProcess(name, frameGraph.engine));
    }
}
//# sourceMappingURL=passTask.js.map