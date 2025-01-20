/* eslint-disable babylonjs/available */
/** @internal */
export class DataWriter {
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
    writeUInt32(entry) {
        this._checkGrowBuffer(4);
        this._dataView.setUint32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    }
    writeFloat32(value) {
        this._checkGrowBuffer(4);
        this._dataView.setFloat32(this._byteOffset, value, true);
        this._byteOffset += 4;
    }
    writeUint8Array(value) {
        this._checkGrowBuffer(value.byteLength);
        this._data.set(value, this._byteOffset);
        this._byteOffset += value.byteLength;
    }
    writeUint16Array(value) {
        this._checkGrowBuffer(value.byteLength);
        this._data.set(value, this._byteOffset);
        this._byteOffset += value.byteLength;
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