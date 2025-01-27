const TypedArrayToWriteMethod = new Map([
    [Int8Array, (d, b, v) => d.setInt8(b, v)],
    [Uint8Array, (dv, bo, v) => dv.setUint8(bo, v)],
    [Uint8ClampedArray, (dv, bo, v) => dv.setUint8(bo, v)],
    [Int16Array, (dv, bo, v) => dv.setInt16(bo, v, true)],
    [Uint16Array, (dv, bo, v) => dv.setUint16(bo, v, true)],
    [Int32Array, (dv, bo, v) => dv.setInt32(bo, v, true)],
    [Uint32Array, (dv, bo, v) => dv.setUint32(bo, v, true)],
    [Float32Array, (dv, bo, v) => dv.setFloat32(bo, v, true)],
    [Float64Array, (dv, bo, v) => dv.setFloat64(bo, v, true)],
]);
/** @internal */
export class DataWriter {
    writeTypedArray(value) {
        this._checkGrowBuffer(value.byteLength);
        const setMethod = TypedArrayToWriteMethod.get(value.constructor);
        for (let i = 0; i < value.length; i++) {
            setMethod(this._dataView, this._byteOffset, value[i]);
            this._byteOffset += value.BYTES_PER_ELEMENT;
        }
    }
    constructor(byteLength) {
        this._data = new Uint8Array(byteLength);
        this._dataView = new DataView(this._data.buffer);
        this._byteOffset = 0;
    }
    get byteOffset() {
        return this._byteOffset;
    }
    getOutputData() {
        return new Uint8Array(this._data.buffer, 0, this._byteOffset);
    }
    writeUInt8(value) {
        this._checkGrowBuffer(1);
        this._dataView.setUint8(this._byteOffset, value);
        this._byteOffset++;
    }
    writeInt8(value) {
        this._checkGrowBuffer(1);
        this._dataView.setInt8(this._byteOffset, value);
        this._byteOffset++;
    }
    writeInt16(entry) {
        this._checkGrowBuffer(2);
        this._dataView.setInt16(this._byteOffset, entry, true);
        this._byteOffset += 2;
    }
    writeUInt16(value) {
        this._checkGrowBuffer(2);
        this._dataView.setUint16(this._byteOffset, value, true);
        this._byteOffset += 2;
    }
    writeInt32(entry) {
        this._checkGrowBuffer(4);
        this._dataView.setInt32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    }
    writeUInt32(value) {
        this._checkGrowBuffer(4);
        this._dataView.setUint32(this._byteOffset, value, true);
        this._byteOffset += 4;
    }
    writeFloat32(value) {
        this._checkGrowBuffer(4);
        this._dataView.setFloat32(this._byteOffset, value, true);
        this._byteOffset += 4;
    }
    writeFloat64(value) {
        this._checkGrowBuffer(8);
        this._dataView.setFloat64(this._byteOffset, value, true);
        this._byteOffset += 8;
    }
    _checkGrowBuffer(byteLength) {
        const newByteLength = this.byteOffset + byteLength;
        if (newByteLength > this._data.byteLength) {
            const newData = new Uint8Array(newByteLength * 2);
            newData.set(this._data);
            this._data = newData;
            this._dataView = new DataView(this._data.buffer);
        }
    }
}
//# sourceMappingURL=dataWriter.js.map