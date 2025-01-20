import { FrameGraphCullPass } from "./Passes/cullPass.js";
import { FrameGraphRenderPass } from "./Passes/renderPass.js";
import { Observable } from "../Misc/observable.js";
/**
 * Represents a task in a frame graph.
 * @experimental
 */
export class FrameGraphTask {
    /**
     * The name of the task.
     */
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    /**
     * Whether the task is disabled.
     */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = value;
    }
    /**
     * Checks if the task is ready to be executed.
     * @returns True if the task is ready to be executed, else false.
     */
    isReady() {
        return true;
    }
    /**
     * Disposes of the task.
     */
    dispose() {
        this._reset();
        this.onTexturesAllocatedObservable.clear();
    }
    /**
     * Constructs a new frame graph task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     */
    constructor(name, frameGraph) {
        this._internalDependencies = [];
        this._passes = [];
        this._passesDisabled = [];
        this._disabled = false;
        /**
         * An observable that is triggered after the textures have been allocated.
         */
        this.onTexturesAllocatedObservable = new Observable();
        this.name = name;
        this._frameGraph = frameGraph;
        this._reset();
    }
    /** @internal */
    _reset() {
        this._passes.length = 0;
        this._passesDisabled.length = 0;
        this._internalDependencies.length = 0;
    }
    /** @internal */
    _addPass(pass, disabled) {
        if (disabled) {
            this._passesDisabled.push(pass);
        }
        else {
            this._passes.push(pass);
        }
    }
    /** @internal */
    _checkTask() {
        let outputTexture = null;
        let outputDepthTexture = null;
        let outputObjectList;
        for (const pass of this._passes) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                const handles = Array.isArray(pass.renderTarget) ? pass.renderTarget : [pass.renderTarget];
                outputTexture = [];
                for (const handle of handles) {
                    if (handle !== undefined) {
                        outputTexture.push(this._frameGraph.textureManager.getTextureFromHandle(handle));
                    }
                }
                outputDepthTexture = pass.renderTargetDepth !== undefined ? this._frameGraph.textureManager.getTextureFromHandle(pass.renderTargetDepth) : null;
            }
            else if (FrameGraphCullPass.IsCullPass(pass)) {
                outputObjectList = pass.objectList;
            }
        }
        let disabledOutputTexture = null;
        let disabledOutputTextureHandle = [];
        let disabledOutputDepthTexture = null;
        let disabledOutputObjectList;
        for (const pass of this._passesDisabled) {
            const errMsg = pass._isValid();
            if (errMsg) {
                throw new Error(`Pass "${pass.name}" is not valid. ${errMsg}`);
            }
            if (FrameGraphRenderPass.IsRenderPass(pass)) {
                const handles = Array.isArray(pass.renderTarget) ? pass.renderTarget : [pass.renderTarget];
                disabledOutputTexture = [];
                for (const handle of handles) {
                    if (handle !== undefined) {
                        disabledOutputTexture.push(this._frameGraph.textureManager.getTextureFromHandle(handle));
                    }
                }
                disabledOutputTextureHandle = handles;
                disabledOutputDepthTexture = pass.renderTargetDepth !== undefined ? this._frameGraph.textureManager.getTextureFromHandle(pass.renderTargetDepth) : null;
            }
            else if (FrameGraphCullPass.IsCullPass(pass)) {
                disabledOutputObjectList = pass.objectList;
            }
        }
        if (this._passesDisabled.length > 0) {
            if (!this._checkSameRenderTarget(outputTexture, disabledOutputTexture)) {
                let ok = true;
                for (const handle of disabledOutputTextureHandle) {
                    if (handle !== undefined && !this._frameGraph.textureManager.isHistoryTexture(handle)) {
                        ok = false;
                        break;
                    }
                }
                if (!ok) {
                    throw new Error(`The output texture of the task "${this.name}" is different when it is enabled or disabled.`);
                }
            }
            if (outputDepthTexture !== disabledOutputDepthTexture) {
                throw new Error(`The output depth texture of the task "${this.name}" is different when it is enabled or disabled.`);
            }
            if (outputObjectList !== disabledOutputObjectList) {
                throw new Error(`The output object list of the task "${this.name}" is different when it is enabled or disabled.`);
            }
        }
    }
    /** @internal */
    _getPasses() {
        return this.disabled && this._passesDisabled.length > 0 ? this._passesDisabled : this._passes;
    }
    _checkSameRenderTarget(src, dst) {
        if (src === null || dst === null) {
            return src === dst;
        }
        if (src.length !== dst.length) {
            return false;
        }
        for (let i = 0; i < src.length; i++) {
            if (src[i] !== dst[i]) {
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=frameGraphTask.js.map