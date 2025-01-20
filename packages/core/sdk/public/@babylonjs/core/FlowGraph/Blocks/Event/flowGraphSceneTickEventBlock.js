import { FlowGraphEventBlock } from "../../flowGraphEventBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that triggers on scene tick (before each render).
 */
export class FlowGraphSceneTickEventBlock extends FlowGraphEventBlock {
    /**
     * @internal
     */
    _preparePendingTasks(context) {
        if (!context._getExecutionVariable(this, "sceneBeforeRender")) {
            const scene = context.configuration.scene;
            const contextObserver = scene.onBeforeRenderObservable.add(() => {
                this._execute(context);
            });
            context._setExecutionVariable(this, "sceneBeforeRender", contextObserver);
        }
    }
    /**
     * @internal
     */
    _cancelPendingTasks(context) {
        const contextObserver = context._getExecutionVariable(this, "sceneBeforeRender");
        const scene = context.configuration.scene;
        scene.onBeforeRenderObservable.remove(contextObserver);
        context._deleteExecutionVariable(this, "sceneBeforeRender");
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphSceneTickEventBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphSceneTickEventBlock.ClassName = "FGSceneTickEventBlock";
RegisterClass(FlowGraphSceneTickEventBlock.ClassName, FlowGraphSceneTickEventBlock);
//# sourceMappingURL=flowGraphSceneTickEventBlock.js.map