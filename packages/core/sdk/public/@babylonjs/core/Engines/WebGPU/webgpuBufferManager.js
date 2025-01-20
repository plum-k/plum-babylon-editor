import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer.js";
import { FromHalfFloat } from "../../Misc/textureTools.js";
import { allocateAndCopyTypedBuffer } from "../abstractEngine.functions.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebGPUConstants from "./webgpuConstants.js";
/** @internal */
export class WebGPUBufferManager {
    static _IsGPUBuffer(buffer) {
        return buffer.underlyingResource === undefined;
    }
    static _FlagsToString(flags, suffix = "") {
        let result = suffix;
        for (let i = 0; i <= 9; ++i) {
            if (flags & (1 << i)) {
                if (result) {
                    result += "_";
                }
                result += WebGPUConstants.BufferUsage[1 << i];
            }
        }
        return result;
    }
    constructor(engine, device) {
        this._deferredReleaseBuffers = [];
        this._engine = engine;
        this._device = device;
    }
    createRawBuffer(viewOrSize, flags, mappedAtCreation = false, label) {
        const alignedLength = viewOrSize.byteLength !== undefined ? (viewOrSize.byteLength + 3) & ~3 : (viewOrSize + 3) & ~3; // 4 bytes alignments (because of the upload which requires this)
        const verticesBufferDescriptor = {
            label: "BabylonWebGPUDevice" + this._engine.uniqueId + "_" + WebGPUBufferManager._FlagsToString(flags, label ?? "Buffer") + "_size" + alignedLength,
            mappedAtCreation,
            size: alignedLength,
            usage: flags,
        };
        return this._device.createBuffer(verticesBufferDescriptor);
    }
    createBuffer(viewOrSize, flags, label) {
        const isView = viewOrSize.byteLength !== undefined;
        const dataBuffer = new WebGPUDataBuffer();
        const labelId = "DataBufferUniqueId=" + dataBuffer.uniqueId;
        dataBuffer.buffer = this.createRawBuffer(viewOrSize, flags, undefined, label ? labelId + "-" + label : labelId);
        dataBuffer.references = 1;
        dataBuffer.capacity = isView ? viewOrSize.byteLength : viewOrSize;
        dataBuffer.engineId = this._engine.uniqueId;
        if (isView) {
            this.setSubData(dataBuffer, 0, viewOrSize);
        }
        return dataBuffer;
    }
    setRawData(buffer, dstByteOffset, src, srcByteOffset, byteLength) {
        this._device.queue.writeBuffer(buffer, dstByteOffset, src.buffer, srcByteOffset, byteLength);
    }
    setSubData(dataBuffer, dstByteOffset, src, srcByteOffset = 0, byteLength = 0) {
        const buffer = dataBuffer.underlyingResource;
        byteLength = byteLength || src.byteLength;
        byteLength = Math.min(byteLength, dataBuffer.capacity - dstByteOffset);
        // After Migration to Canary
        let chunkStart = src.byteOffset + srcByteOffset;
        let chunkEnd = chunkStart + byteLength;
        // 4 bytes alignments for upload
        const alignedLength = (byteLength + 3) & ~3;
        if (alignedLength !== byteLength) {
            const tempView = new Uint8Array(src.buffer.slice(chunkStart, chunkEnd));
            src = new Uint8Array(alignedLength);
            src.set(tempView);
            srcByteOffset = 0;
            chunkStart = 0;
            chunkEnd = alignedLength;
            byteLength = alignedLength;
        }
        // Chunk
        const maxChunk = 1024 * 1024 * 15;
        let offset = 0;
        while (chunkEnd - (chunkStart + offset) > maxChunk) {
            this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, maxChunk);
            offset += maxChunk;
        }
        this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, byteLength - offset);
    }
    _getHalfFloatAsFloatRGBAArrayBuffer(dataLength, arrayBuffer, destArray) {
        if (!destArray) {
            destArray = new Float32Array(dataLength);
        }
        const srcData = new Uint16Array(arrayBuffer);
        while (dataLength--) {
            destArray[dataLength] = FromHalfFloat(srcData[dataLength]);
        }
        return destArray;
    }
    readDataFromBuffer(gpuBuffer, size, width, height, bytesPerRow, bytesPerRowAligned, type = 0, offset = 0, buffer = null, destroyBuffer = true, noDataConversion = false) {
        const floatFormat = type === 1 ? 2 : type === 2 ? 1 : 0;
        const engineId = this._engine.uniqueId;
        return new Promise((resolve, reject) => {
            gpuBuffer.mapAsync(1 /* WebGPUConstants.MapMode.Read */, offset, size).then(() => {
                const copyArrayBuffer = gpuBuffer.getMappedRange(offset, size);
                let data = buffer;
                if (noDataConversion) {
                    if (data === null) {
                        data = allocateAndCopyTypedBuffer(type, size, true, copyArrayBuffer);
                    }
                    else {
                        data = allocateAndCopyTypedBuffer(type, data.buffer, undefined, copyArrayBuffer);
                    }
                }
                else {
                    if (data === null) {
                        switch (floatFormat) {
                            case 0: // byte format
                                data = new Uint8Array(size);
                                data.set(new Uint8Array(copyArrayBuffer));
                                break;
                            case 1: // half float
                                // TODO WEBGPU use computer shaders (or render pass) to make the conversion?
                                data = this._getHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer);
                                break;
                            case 2: // float
                                data = new Float32Array(size / 4);
                                data.set(new Float32Array(copyArrayBuffer));
                                break;
                        }
                    }
                    else {
                        switch (floatFormat) {
                            case 0: // byte format
                                data = new Uint8Array(data.buffer);
                                data.set(new Uint8Array(copyArrayBuffer));
                                break;
                            case 1: // half float
                                // TODO WEBGPU use computer shaders (or render pass) to make the conversion?
                                data = this._getHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer, buffer);
                                break;
                            case 2: // float
                                data = new Float32Array(data.buffer);
                                data.set(new Float32Array(copyArrayBuffer));
                                break;
                        }
                    }
                }
                if (bytesPerRow !== bytesPerRowAligned) {
                    // TODO WEBGPU use computer shaders (or render pass) to build the final buffer data?
                    if (floatFormat === 1 && !noDataConversion) {
                        // half float have been converted to float above
                        bytesPerRow *= 2;
                        bytesPerRowAligned *= 2;
                    }
                    const data2 = new Uint8Array(data.buffer);
                    let offset = bytesPerRow, offset2 = 0;
                    for (let y = 1; y < height; ++y) {
                        offset2 = y * bytesPerRowAligned;
                        for (let x = 0; x < bytesPerRow; ++x) {
                            data2[offset++] = data2[offset2++];
                        }
                    }
                    if (floatFormat !== 0 && !noDataConversion) {
                        data = new Float32Array(data2.buffer, 0, offset / 4);
                    }
                    else {
                        data = new Uint8Array(data2.buffer, 0, offset);
                    }
                }
                gpuBuffer.unmap();
                if (destroyBuffer) {
                    this.releaseBuffer(gpuBuffer);
                }
                resolve(data);
            }, (reason) => {
                if (this._engine.isDisposed || this._engine.uniqueId !== engineId) {
                    // The engine was disposed while waiting for the promise, or a context loss/restoration has occurred: don't reject
                    resolve(new Uint8Array());
                }
                else {
                    reject(reason);
                }
            });
        });
    }
    releaseBuffer(buffer) {
        if (WebGPUBufferManager._IsGPUBuffer(buffer)) {
            this._deferredReleaseBuffers.push(buffer);
            return true;
        }
        buffer.references--;
        if (buffer.references === 0) {
            this._deferredReleaseBuffers.push(buffer.underlyingResource);
            return true;
        }
        return false;
    }
    destroyDeferredBuffers() {
        for (let i = 0; i < this._deferredReleaseBuffers.length; ++i) {
            this._deferredReleaseBuffers[i].destroy();
        }
        this._deferredReleaseBuffers.length = 0;
    }
}
//# sourceMappingURL=webgpuBufferManager.js.map