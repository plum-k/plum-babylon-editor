import { ThinEngine } from "../../Engines/thinEngine.js";
import { AbstractEngine } from "../abstractEngine.js";
/** @internal */
export var ComputeBindingType;
(function (ComputeBindingType) {
    ComputeBindingType[ComputeBindingType["Texture"] = 0] = "Texture";
    ComputeBindingType[ComputeBindingType["StorageTexture"] = 1] = "StorageTexture";
    ComputeBindingType[ComputeBindingType["UniformBuffer"] = 2] = "UniformBuffer";
    ComputeBindingType[ComputeBindingType["StorageBuffer"] = 3] = "StorageBuffer";
    ComputeBindingType[ComputeBindingType["TextureWithoutSampler"] = 4] = "TextureWithoutSampler";
    ComputeBindingType[ComputeBindingType["Sampler"] = 5] = "Sampler";
    ComputeBindingType[ComputeBindingType["ExternalTexture"] = 6] = "ExternalTexture";
    ComputeBindingType[ComputeBindingType["DataBuffer"] = 7] = "DataBuffer";
})(ComputeBindingType || (ComputeBindingType = {}));
ThinEngine.prototype.createComputeEffect = function (baseName, options) {
    throw new Error("createComputeEffect: This engine does not support compute shaders!");
};
ThinEngine.prototype.createComputePipelineContext = function () {
    throw new Error("createComputePipelineContext: This engine does not support compute shaders!");
};
ThinEngine.prototype.createComputeContext = function () {
    return undefined;
};
ThinEngine.prototype.computeDispatch = function (effect, context, bindings, x, y, z, bindingsMapping) {
    throw new Error("computeDispatch: This engine does not support compute shaders!");
};
ThinEngine.prototype.computeDispatchIndirect = function (effect, context, bindings, buffer, offset, bindingsMapping) {
    throw new Error("computeDispatchIndirect: This engine does not support compute shaders!");
};
ThinEngine.prototype.areAllComputeEffectsReady = function () {
    return true;
};
ThinEngine.prototype.releaseComputeEffects = function () { };
ThinEngine.prototype._prepareComputePipelineContext = function (pipelineContext, computeSourceCode, rawComputeSourceCode, defines, entryPoint) { };
ThinEngine.prototype._rebuildComputeEffects = function () { };
AbstractEngine.prototype._executeWhenComputeStateIsCompiled = function (pipelineContext, action) {
    action(null);
};
ThinEngine.prototype._releaseComputeEffect = function (effect) { };
ThinEngine.prototype._deleteComputePipelineContext = function (pipelineContext) { };
//# sourceMappingURL=engine.computeShader.js.map