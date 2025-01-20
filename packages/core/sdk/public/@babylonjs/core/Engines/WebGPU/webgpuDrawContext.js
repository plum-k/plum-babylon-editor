import * as WebGPUConstants from "./webgpuConstants.js";
/** @internal */
export class WebGPUDrawContext {
    isDirty(materialContextUpdateId) {
        return this._isDirty || this._materialContextUpdateId !== materialContextUpdateId;
    }
    resetIsDirty(materialContextUpdateId) {
        this._isDirty = false;
        this._materialContextUpdateId = materialContextUpdateId;
    }
    get useInstancing() {
        return this._useInstancing;
    }
    set useInstancing(use) {
        if (this._useInstancing === use) {
            return;
        }
        if (!use) {
            if (this.indirectDrawBuffer) {
                this._bufferManager.releaseBuffer(this.indirectDrawBuffer);
            }
            this.indirectDrawBuffer = undefined;
            this._indirectDrawData = undefined;
        }
        else {
            this.indirectDrawBuffer = this._bufferManager.createRawBuffer(20, WebGPUConstants.BufferUsage.CopyDst | WebGPUConstants.BufferUsage.Indirect | WebGPUConstants.BufferUsage.Storage, undefined, "IndirectDrawBuffer");
            this._indirectDrawData = new Uint32Array(5);
            this._indirectDrawData[3] = 0;
            this._indirectDrawData[4] = 0;
        }
        this._useInstancing = use;
        this._currentInstanceCount = -1;
    }
    constructor(bufferManager) {
        this._bufferManager = bufferManager;
        this.uniqueId = WebGPUDrawContext._Counter++;
        this._useInstancing = false;
        this._currentInstanceCount = 0;
        this.reset();
    }
    reset() {
        this.buffers = {};
        this._isDirty = true;
        this._materialContextUpdateId = 0;
        this.fastBundle = undefined;
        this.bindGroups = undefined;
    }
    setBuffer(name, buffer) {
        this._isDirty || (this._isDirty = buffer?.uniqueId !== this.buffers[name]?.uniqueId);
        this.buffers[name] = buffer;
    }
    setIndirectData(indexOrVertexCount, instanceCount, firstIndexOrVertex) {
        if (instanceCount === this._currentInstanceCount || !this.indirectDrawBuffer || !this._indirectDrawData) {
            // The current buffer is already up to date so do nothing
            // Note that we only check for instanceCount and not indexOrVertexCount nor firstIndexOrVertex because those values
            // are supposed to not change during the lifetime of a draw context
            return;
        }
        this._currentInstanceCount = instanceCount;
        this._indirectDrawData[0] = indexOrVertexCount;
        this._indirectDrawData[1] = instanceCount;
        this._indirectDrawData[2] = firstIndexOrVertex;
        this._bufferManager.setRawData(this.indirectDrawBuffer, 0, this._indirectDrawData, 0, 20);
    }
    dispose() {
        if (this.indirectDrawBuffer) {
            this._bufferManager.releaseBuffer(this.indirectDrawBuffer);
            this.indirectDrawBuffer = undefined;
            this._indirectDrawData = undefined;
        }
        this.fastBundle = undefined;
        this.bindGroups = undefined;
        this.buffers = undefined;
    }
}
WebGPUDrawContext._Counter = 0;
//# sourceMappingURL=webgpuDrawContext.js.map