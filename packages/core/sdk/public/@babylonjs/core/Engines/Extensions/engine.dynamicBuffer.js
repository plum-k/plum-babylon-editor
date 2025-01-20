import { ThinEngine } from "../../Engines/thinEngine.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.updateDynamicIndexBuffer = function (indexBuffer, indices, offset = 0) {
    // Force cache update
    this._currentBoundBuffer[this._gl.ELEMENT_ARRAY_BUFFER] = null;
    this.bindIndexBuffer(indexBuffer);
    let view;
    if (indexBuffer.is32Bits) {
        // anything else than Uint32Array needs to be converted to Uint32Array
        view = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
    }
    else {
        // anything else than Uint16Array needs to be converted to Uint16Array
        view = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
    }
    this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, view, this._gl.DYNAMIC_DRAW);
    this._resetIndexBufferBinding();
};
ThinEngine.prototype.updateDynamicVertexBuffer = function (vertexBuffer, data, byteOffset, byteLength) {
    this.bindArrayBuffer(vertexBuffer);
    if (byteOffset === undefined) {
        byteOffset = 0;
    }
    const dataLength = data.byteLength || data.length;
    if (byteLength === undefined || (byteLength >= dataLength && byteOffset === 0)) {
        if (data instanceof Array) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data));
        }
        else {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, data);
        }
    }
    else {
        if (data instanceof Array) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(data).subarray(byteOffset, byteOffset + byteLength));
        }
        else {
            if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data, byteOffset, byteLength);
            }
            else {
                data = new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
            }
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
        }
    }
    this._resetVertexBufferBinding();
};
//# sourceMappingURL=engine.dynamicBuffer.js.map