import { ThinEngine } from "../../Engines/thinEngine.js";
import { WebGLDataBuffer } from "../../Meshes/WebGL/webGLDataBuffer.js";
ThinEngine.prototype.createUniformBuffer = function (elements, _label) {
    const ubo = this._gl.createBuffer();
    if (!ubo) {
        throw new Error("Unable to create uniform buffer");
    }
    const result = new WebGLDataBuffer(ubo);
    this.bindUniformBuffer(result);
    if (elements instanceof Float32Array) {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, elements, this._gl.STATIC_DRAW);
    }
    else {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(elements), this._gl.STATIC_DRAW);
    }
    this.bindUniformBuffer(null);
    result.references = 1;
    return result;
};
ThinEngine.prototype.createDynamicUniformBuffer = function (elements, _label) {
    const ubo = this._gl.createBuffer();
    if (!ubo) {
        throw new Error("Unable to create dynamic uniform buffer");
    }
    const result = new WebGLDataBuffer(ubo);
    this.bindUniformBuffer(result);
    if (elements instanceof Float32Array) {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, elements, this._gl.DYNAMIC_DRAW);
    }
    else {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(elements), this._gl.DYNAMIC_DRAW);
    }
    this.bindUniformBuffer(null);
    result.references = 1;
    return result;
};
ThinEngine.prototype.updateUniformBuffer = function (uniformBuffer, elements, offset, count) {
    this.bindUniformBuffer(uniformBuffer);
    if (offset === undefined) {
        offset = 0;
    }
    if (count === undefined) {
        if (elements instanceof Float32Array) {
            this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, elements);
        }
        else {
            this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, new Float32Array(elements));
        }
    }
    else {
        if (elements instanceof Float32Array) {
            this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, elements.subarray(offset, offset + count));
        }
        else {
            this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, new Float32Array(elements).subarray(offset, offset + count));
        }
    }
    this.bindUniformBuffer(null);
};
ThinEngine.prototype.bindUniformBuffer = function (buffer) {
    this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, buffer ? buffer.underlyingResource : null);
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.bindUniformBufferBase = function (buffer, location, name) {
    this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, location, buffer ? buffer.underlyingResource : null);
};
ThinEngine.prototype.bindUniformBlock = function (pipelineContext, blockName, index) {
    const program = pipelineContext.program;
    const uniformLocation = this._gl.getUniformBlockIndex(program, blockName);
    if (uniformLocation !== 0xffffffff) {
        this._gl.uniformBlockBinding(program, uniformLocation, index);
    }
};
//# sourceMappingURL=engine.uniformBuffer.js.map