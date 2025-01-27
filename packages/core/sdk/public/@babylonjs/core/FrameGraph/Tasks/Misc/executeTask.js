import { FrameGraphTask } from "../../frameGraphTask.js";
/**
 * Task used to execute a custom function.
 */
export class FrameGraphExecuteTask extends FrameGraphTask {
    /**
     * Creates a new execute task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name, frameGraph) {
        super(name, frameGraph);
    }
    record() {
        if (!this.func) {
            throw new Error("FrameGraphExecuteTask: Execute task must have a function.");
        }
        const pass = this._frameGraph.addPass(this.name);
        pass.setExecuteFunc((context) => {
            this.func(context);
        });
        const passDisabled = this._frameGraph.addPass(this.name + "_disabled", true);
        passDisabled.setExecuteFunc((context) => {
            this.funcDisabled?.(context);
        });
        return pass;
    }
}
//# sourceMappingURL=executeTask.js.map