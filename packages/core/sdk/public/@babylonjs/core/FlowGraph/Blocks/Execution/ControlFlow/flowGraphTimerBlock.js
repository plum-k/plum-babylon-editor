import { AdvancedTimer } from "../../../../Misc/timer.js";
import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock.js";
import { RichTypeNumber } from "../../../flowGraphRichTypes.js";
import { Tools } from "../../../../Misc/tools.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that provides two different output flows. One is started immediately once the block is executed,
 * and the other is executed after a set time. The timer for this block runs based on the scene's render loop.
 */
export class FlowGraphTimerBlock extends FlowGraphAsyncExecutionBlock {
    constructor(config) {
        super(config);
        this.timeout = this.registerDataInput("timeout", RichTypeNumber);
    }
    _preparePendingTasks(context) {
        const currentTimeout = this.timeout.getValue(context);
        if (currentTimeout !== undefined && currentTimeout >= 0) {
            const timers = context._getExecutionVariable(this, "runningTimers") || [];
            const scene = context.configuration.scene;
            const timer = new AdvancedTimer({
                timeout: currentTimeout,
                contextObservable: scene.onBeforeRenderObservable,
                onEnded: () => this._onEnded(timer, context),
            });
            timer.start();
            timers.push(timer);
            context._setExecutionVariable(this, "runningTimers", timers);
        }
    }
    /**
     * @internal
     */
    _execute(context) {
        this._startPendingTasks(context);
        this.out._activateSignal(context);
    }
    _onEnded(timer, context) {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        const index = timers.indexOf(timer);
        if (index !== -1) {
            timers.splice(index, 1);
        }
        else {
            Tools.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list");
        }
        context._removePendingBlock(this);
        this.done._activateSignal(context);
    }
    _cancelPendingTasks(context) {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        for (const timer of timers) {
            timer.dispose();
        }
        context._deleteExecutionVariable(this, "runningTimers");
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphTimerBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphTimerBlock.ClassName = "FGTimerBlock";
RegisterClass("FGTimerBlock", FlowGraphTimerBlock);
//# sourceMappingURL=flowGraphTimerBlock.js.map