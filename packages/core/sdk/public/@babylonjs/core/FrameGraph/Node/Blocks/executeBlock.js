import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes.js";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock.js";
import { FrameGraphExecuteTask } from "../../Tasks/Misc/executeTask.js";
/**
 * Block used to execute a custom function in the frame graph
 */
export class NodeRenderGraphExecuteBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Creates a new NodeRenderGraphExecuteBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        const dependencies = this._addDependenciesInput();
        dependencies.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.Camera | NodeRenderGraphBlockConnectionPointTypes.ShadowLight | NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ResourceContainer);
        this._frameGraphTask = new FrameGraphExecuteTask(name, frameGraph);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphExecuteBlock";
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
}
RegisterClass("BABYLON.NodeRenderGraphExecuteBlock", NodeRenderGraphExecuteBlock);
//# sourceMappingURL=executeBlock.js.map