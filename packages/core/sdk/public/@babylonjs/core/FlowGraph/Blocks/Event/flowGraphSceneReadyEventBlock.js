import { FlowGraphEventBlock } from "../../flowGraphEventBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    /**
     * @internal
     */
    _preparePendingTasks(context) {
        if (!context._getExecutionVariable(this, "sceneReadyObserver")) {
            const scene = context.configuration.scene;
            const contextObserver = scene.onReadyObservable.add(() => {
                this._execute(context);
            });
            context._setExecutionVariable(this, "sceneReadyObserver", contextObserver);
        }
    }
    /**
     * @internal
     */
    _cancelPendingTasks(context) {
        const contextObserver = context._getExecutionVariable(this, "sceneReadyObserver");
        const scene = context.configuration.scene;
        scene.onReadyObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneReadyObserver");
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphSceneReadyEventBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphSceneReadyEventBlock.ClassName = "FGSceneReadyEventBlock";
RegisterClass("FGSceneReadyEventBlock", FlowGraphSceneReadyEventBlock);
//# sourceMappingURL=flowGraphSceneReadyEventBlock.js.map