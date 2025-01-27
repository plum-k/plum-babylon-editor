import { FrameGraphPass } from "./Passes/pass.js";
import { FrameGraphRenderPass } from "./Passes/renderPass.js";
import { FrameGraphCullPass } from "./Passes/cullPass.js";
import { FrameGraphRenderContext } from "./frameGraphRenderContext.js";
import { FrameGraphContext } from "./frameGraphContext.js";
import { FrameGraphTextureManager } from "./frameGraphTextureManager.js";
import { Observable } from "../Misc/observable.js";
import { _retryWithInterval } from "../Misc/timingTools.js";
import { Logger } from "../Misc/logger.js";
var FrameGraphPassType;
(function (FrameGraphPassType) {
    FrameGraphPassType[FrameGraphPassType["Normal"] = 0] = "Normal";
    FrameGraphPassType[FrameGraphPassType["Render"] = 1] = "Render";
    FrameGraphPassType[FrameGraphPassType["Cull"] = 2] = "Cull";
})(FrameGraphPassType || (FrameGraphPassType = {}));
/**
 * Class used to implement a frame graph
 * @experimental
 */
export class FrameGraph {
    /**
     * Gets the engine used by the frame graph
     */
    get engine() {
        return this._engine;
    }
    /**
     * Constructs the frame graph
     * @param engine defines the hosting engine
     * @param debugTextures defines a boolean indicating that textures created by the frame graph should be visible in the inspector
     * @param scene defines the scene the frame graph is associated with
     */
    constructor(engine, debugTextures = false, scene) {
        this._tasks = [];
        this._currentProcessedTask = null;
        this._isDisposed = false;
        /**
         * Observable raised when the node render graph is built
         */
        this.onBuildObservable = new Observable();
        this._engine = engine;
        this.textureManager = new FrameGraphTextureManager(this._engine, debugTextures, scene);
        this._passContext = new FrameGraphContext();
        this._renderContext = new FrameGraphRenderContext(this._engine, this.textureManager, scene);
    }
    /**
     * Gets a task by name
     * @param name Name of the task to get
     * @returns The task or undefined if not found
     */
    getTaskByName(name) {
        return this._tasks.find((t) => t.name === name);
    }
    /**
     * Adds a task to the frame graph
     * @param task Task to add
     */
    addTask(task) {
        if (this._currentProcessedTask !== null) {
            throw new Error(`FrameGraph.addTask: Can't add the task "${task.name}" while another task is currently building (task: ${this._currentProcessedTask.name}).`);
        }
        this._tasks.push(task);
    }
    /**
     * Adds a pass to a task. This method can only be called during a Task.record execution.
     * @param name The name of the pass
     * @param whenTaskDisabled If true, the pass will be added to the list of passes to execute when the task is disabled (default is false)
     * @returns The render pass created
     */
    addPass(name, whenTaskDisabled = false) {
        return this._addPass(name, FrameGraphPassType.Normal, whenTaskDisabled);
    }
    /**
     * Adds a render pass to a task. This method can only be called during a Task.record execution.
     * @param name The name of the pass
     * @param whenTaskDisabled If true, the pass will be added to the list of passes to execute when the task is disabled (default is false)
     * @returns The render pass created
     */
    addRenderPass(name, whenTaskDisabled = false) {
        return this._addPass(name, FrameGraphPassType.Render, whenTaskDisabled);
    }
    /**
     * Adds a cull pass to a task. This method can only be called during a Task.record execution.
     * @param name The name of the pass
     * @param whenTaskDisabled If true, the pass will be added to the list of passes to execute when the task is disabled (default is false)
     * @returns The cull pass created
     */
    addCullPass(name, whenTaskDisabled = false) {
        return this._addPass(name, FrameGraphPassType.Cull, whenTaskDisabled);
    }
    _addPass(name, passType, whenTaskDisabled = false) {
        if (!this._currentProcessedTask) {
            throw new Error("FrameGraph: A pass must be created during a Task.record execution only.");
        }
        let pass;
        switch (passType) {
            case FrameGraphPassType.Render:
                pass = new FrameGraphRenderPass(name, this._currentProcessedTask, this._renderContext, this._engine);
                break;
            case FrameGraphPassType.Cull:
                pass = new FrameGraphCullPass(name, this._currentProcessedTask, this._passContext, this._engine);
                break;
            default:
                pass = new FrameGraphPass(name, this._currentProcessedTask, this._passContext);
                break;
        }
        this._currentProcessedTask._addPass(pass, whenTaskDisabled);
        return pass;
    }
    /**
     * Builds the frame graph.
     * This method should be called after all tasks have been added to the frame graph (FrameGraph.addTask) and before the graph is executed (FrameGraph.execute).
     */
    build() {
        this.textureManager._releaseTextures(false);
        try {
            for (const task of this._tasks) {
                task._reset();
                this._currentProcessedTask = task;
                this.textureManager._isRecordingTask = true;
                task.record();
                this.textureManager._isRecordingTask = false;
                this._currentProcessedTask = null;
            }
            this.textureManager._allocateTextures();
            for (const task of this._tasks) {
                task._checkTask();
            }
            for (const task of this._tasks) {
                task.onTexturesAllocatedObservable.notifyObservers(this._renderContext);
            }
            this.onBuildObservable.notifyObservers(this);
        }
        catch (e) {
            this._tasks.length = 0;
            this._currentProcessedTask = null;
            this.textureManager._isRecordingTask = false;
            throw e;
        }
    }
    /**
     * Returns a promise that resolves when the frame graph is ready to be executed
     * This method must be called after the graph has been built (FrameGraph.build called)!
     * @param timeStep Time step in ms between retries (default is 16)
     * @param maxTimeout Maximum time in ms to wait for the graph to be ready (default is 30000)
     * @returns The promise that resolves when the graph is ready
     */
    whenReadyAsync(timeStep = 16, maxTimeout = 30000) {
        return new Promise((resolve, reject) => {
            _retryWithInterval(() => {
                let ready = this._renderContext._isReady();
                for (const task of this._tasks) {
                    ready = task.isReady() && ready;
                }
                return this._isDisposed || ready;
            }, () => {
                if (this._isDisposed) {
                    reject(FrameGraph.WhenReadyRejectionDisposed);
                }
                else {
                    resolve();
                }
            }, (err) => {
                if (err.stack) {
                    Logger.Error("FrameGraph: An unexpected error occurred while waiting for the frame graph to be ready.");
                    Logger.Error(err.stack);
                }
                else {
                    Logger.Error("FrameGraph: Timeout while waiting for the frame graph to be ready.");
                    if (err) {
                        Logger.Error(err);
                    }
                }
            }, timeStep, maxTimeout);
        });
    }
    /**
     * Executes the frame graph.
     */
    execute() {
        this._renderContext.bindRenderTarget();
        this.textureManager._updateHistoryTextures();
        for (const task of this._tasks) {
            const passes = task._getPasses();
            for (const pass of passes) {
                pass._execute();
            }
        }
    }
    /**
     * Clears the frame graph (remove the tasks and release the textures).
     * The frame graph can be built again after this method is called.
     */
    clear() {
        for (const task of this._tasks) {
            task._reset();
        }
        this._tasks.length = 0;
        this.textureManager._releaseTextures();
        this._currentProcessedTask = null;
    }
    /**
     * Disposes the frame graph
     */
    dispose() {
        this._isDisposed = true;
        this.clear();
        this.textureManager._dispose();
        this._renderContext._dispose();
    }
}
/**
 * Rejection message (from WhenReadyAsync) when the frame graph has been disposed
 */
FrameGraph.WhenReadyRejectionDisposed = "FrameGraph: The frame graph has been disposed.";
//# sourceMappingURL=frameGraph.js.map