import { Logger } from "../../../Misc/logger.js";
import { ComputeEffect } from "../../../Compute/computeEffect.js";
import { WebGPUEngine } from "../../webgpuEngine.js";
import { WebGPUComputeContext } from "../webgpuComputeContext.js";
import { WebGPUComputePipelineContext } from "../webgpuComputePipelineContext.js";
const computePassDescriptor = {};
WebGPUEngine.prototype.createComputeContext = function () {
    return new WebGPUComputeContext(this._device, this._cacheSampler);
};
WebGPUEngine.prototype.createComputeEffect = function (baseName, options) {
    const compute = typeof baseName === "string" ? baseName : baseName.computeToken || baseName.computeSource || baseName.computeElement || baseName.compute;
    const name = compute + "@" + options.defines;
    if (this._compiledComputeEffects[name]) {
        const compiledEffect = this._compiledComputeEffects[name];
        if (options.onCompiled && compiledEffect.isReady()) {
            options.onCompiled(compiledEffect);
        }
        return compiledEffect;
    }
    const effect = new ComputeEffect(baseName, options, this, name);
    this._compiledComputeEffects[name] = effect;
    return effect;
};
WebGPUEngine.prototype.createComputePipelineContext = function () {
    return new WebGPUComputePipelineContext(this);
};
WebGPUEngine.prototype.areAllComputeEffectsReady = function () {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];
        if (!effect.isReady()) {
            return false;
        }
    }
    return true;
};
WebGPUEngine.prototype.computeDispatch = function (effect, context, bindings, x, y = 1, z = 1, bindingsMapping, gpuPerfCounter) {
    this._computeDispatch(effect, context, bindings, x, y, z, undefined, undefined, bindingsMapping, gpuPerfCounter);
};
WebGPUEngine.prototype.computeDispatchIndirect = function (effect, context, bindings, buffer, offset = 0, bindingsMapping, gpuPerfCounter) {
    this._computeDispatch(effect, context, bindings, undefined, undefined, undefined, buffer, offset, bindingsMapping, gpuPerfCounter);
};
WebGPUEngine.prototype._computeDispatch = function (effect, context, bindings, x, y, z, buffer, offset, bindingsMapping, gpuPerfCounter) {
    this._endCurrentRenderPass();
    const contextPipeline = effect._pipelineContext;
    const computeContext = context;
    if (!contextPipeline.computePipeline) {
        contextPipeline.computePipeline = this._device.createComputePipeline({
            layout: "auto" /* WebGPUConstants.AutoLayoutMode.Auto */,
            compute: contextPipeline.stage,
        });
    }
    if (gpuPerfCounter) {
        this._timestampQuery.startPass(computePassDescriptor, this._timestampIndex);
    }
    const computePass = this._renderEncoder.beginComputePass(computePassDescriptor);
    computePass.setPipeline(contextPipeline.computePipeline);
    const bindGroups = computeContext.getBindGroups(bindings, contextPipeline.computePipeline, bindingsMapping);
    for (let i = 0; i < bindGroups.length; ++i) {
        const bindGroup = bindGroups[i];
        if (!bindGroup) {
            continue;
        }
        computePass.setBindGroup(i, bindGroup);
    }
    if (buffer !== undefined) {
        computePass.dispatchWorkgroupsIndirect(buffer.underlyingResource, offset);
    }
    else {
        if (x + y + z > 0) {
            computePass.dispatchWorkgroups(x, y, z);
        }
    }
    computePass.end();
    if (gpuPerfCounter) {
        this._timestampQuery.endPass(this._timestampIndex, gpuPerfCounter);
        this._timestampIndex += 2;
    }
};
WebGPUEngine.prototype.releaseComputeEffects = function () {
    for (const name in this._compiledComputeEffects) {
        const webGPUPipelineContextCompute = this._compiledComputeEffects[name].getPipelineContext();
        this._deleteComputePipelineContext(webGPUPipelineContextCompute);
    }
    this._compiledComputeEffects = {};
};
WebGPUEngine.prototype._prepareComputePipelineContext = function (pipelineContext, computeSourceCode, rawComputeSourceCode, defines, entryPoint) {
    const webGpuContext = pipelineContext;
    if (this.dbgShowShaderCode) {
        Logger.Log(defines);
        Logger.Log(computeSourceCode);
    }
    webGpuContext.sources = {
        compute: computeSourceCode,
        rawCompute: rawComputeSourceCode,
    };
    webGpuContext.stage = this._createComputePipelineStageDescriptor(computeSourceCode, defines, entryPoint);
};
WebGPUEngine.prototype._releaseComputeEffect = function (effect) {
    if (this._compiledComputeEffects[effect._key]) {
        delete this._compiledComputeEffects[effect._key];
        this._deleteComputePipelineContext(effect.getPipelineContext());
    }
};
WebGPUEngine.prototype._rebuildComputeEffects = function () {
    for (const key in this._compiledComputeEffects) {
        const effect = this._compiledComputeEffects[key];
        effect._pipelineContext = null;
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }
};
WebGPUEngine.prototype._executeWhenComputeStateIsCompiled = function (pipelineContext, action) {
    pipelineContext.stage.module.getCompilationInfo().then((info) => {
        const compilationMessages = {
            numErrors: 0,
            messages: [],
        };
        for (const message of info.messages) {
            if (message.type === "error") {
                compilationMessages.numErrors++;
            }
            compilationMessages.messages.push({
                type: message.type,
                text: message.message,
                line: message.lineNum,
                column: message.linePos,
                length: message.length,
                offset: message.offset,
            });
        }
        action(compilationMessages);
    });
};
WebGPUEngine.prototype._deleteComputePipelineContext = function (pipelineContext) {
    const webgpuPipelineContext = pipelineContext;
    if (webgpuPipelineContext) {
        pipelineContext.dispose();
    }
};
WebGPUEngine.prototype._createComputePipelineStageDescriptor = function (computeShader, defines, entryPoint) {
    if (defines) {
        defines = "//" + defines.split("\n").join("\n//") + "\n";
    }
    else {
        defines = "";
    }
    return {
        module: this._device.createShaderModule({
            code: defines + computeShader,
        }),
        entryPoint,
    };
};
//# sourceMappingURL=engine.computeShader.js.map