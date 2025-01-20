import { DataBuffer } from "../../Buffers/dataBuffer.js";
/** @internal */
export class WebGLDataBuffer extends DataBuffer {
    constructor(resource) {
        super();
        this._buffer = resource;
    }
    get underlyingResource() {
        return this._buffer;
    }
}
//# sourceMappingURL=webGLDataBuffer.js.map