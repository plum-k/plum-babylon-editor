import { RegisterClass } from "../../../../Misc/typeStore.js";
import { FrameGraphPassCubeTask, FrameGraphPassTask } from "../../../Tasks/PostProcesses/passTask.js";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "../../../../PostProcesses/thinPassPostProcess.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the pass post process
 */
export class NodeRenderGraphPassPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphPassPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphPassTask(this.name, frameGraph, new ThinPassPostProcess(name, scene.getEngine()));
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphPassPostProcessBlock";
    }
}
RegisterClass("BABYLON.NodeRenderGraphPassPostProcessBlock", NodeRenderGraphPassPostProcessBlock);
/**
 * Block that implements the pass cube post process
 */
export class NodeRenderGraphPassCubePostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphPassCubePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphPassCubeTask(this.name, frameGraph, new ThinPassCubePostProcess(name, scene.getEngine()));
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphPassCubePostProcessBlock";
    }
}
RegisterClass("BABYLON.NodeRenderGraphPassCubePostProcessBlock", NodeRenderGraphPassCubePostProcessBlock);
//# sourceMappingURL=passPostProcessBlock.js.map