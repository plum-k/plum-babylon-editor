/** @internal */
export class NativeDataStream {
    constructor() {
        const buffer = new ArrayBuffer(NativeDataStream.DEFAULT_BUFFER_SIZE);
        this._uint32s = new Uint32Array(buffer);
        this._int32s = new Int32Array(buffer);
        this._float32s = new Float32Array(buffer);
        this._length = NativeDataStream.DEFAULT_BUFFER_SIZE / 4;
        this._position = 0;
        this._nativeDataStream = new _native.NativeDataStream(() => {
            this._flush();
        });
    }
    /**
     * Writes a uint32 to the stream
     * @param value the value to write
     */
    writeUint32(value) {
        this._flushIfNecessary(1);
        this._uint32s[this._position++] = value;
    }
    /**
     * Writes an int32 to the stream
     * @param value the value to write
     */
    writeInt32(value) {
        this._flushIfNecessary(1);
        this._int32s[this._position++] = value;
    }
    /**
     * Writes a float32 to the stream
     * @param value the value to write
     */
    writeFloat32(value) {
        this._flushIfNecessary(1);
        this._float32s[this._position++] = value;
    }
    /**
     * Writes a uint32 array to the stream
     * @param values the values to write
     */
    writeUint32Array(values) {
        this._flushIfNecessary(1 + values.length);
        this._uint32s[this._position++] = values.length;
        this._uint32s.set(values, this._position);
        this._position += values.length;
    }
    /**
     * Writes an int32 array to the stream
     * @param values the values to write
     */
    writeInt32Array(values) {
        this._flushIfNecessary(1 + values.length);
        this._uint32s[this._position++] = values.length;
        this._int32s.set(values, this._position);
        this._position += values.length;
    }
    /**
     * Writes a float32 array to the stream
     * @param values the values to write
     */
    writeFloat32Array(values) {
        this._flushIfNecessary(1 + values.length);
        this._uint32s[this._position++] = values.length;
        this._float32s.set(values, this._position);
        this._position += values.length;
    }
    /**
     * Writes native data to the stream
     * @param handle the handle to the native data
     */
    writeNativeData(handle) {
        this._flushIfNecessary(handle.length);
        this._uint32s.set(handle, this._position);
        this._position += handle.length;
    }
    /**
     * Writes a boolean to the stream
     * @param value the value to write
     */
    writeBoolean(value) {
        this.writeUint32(value ? 1 : 0);
    }
    _flushIfNecessary(required) {
        if (this._position + required > this._length) {
            this._flush();
        }
    }
    _flush() {
        this._nativeDataStream.writeBuffer(this._uint32s.buffer, this._position);
        this._position = 0;
    }
}
// Must be multiple of 4!
// eslint-disable-next-line @typescript-eslint/naming-convention
NativeDataStream.DEFAULT_BUFFER_SIZE = 65536;
//# sourceMappingURL=nativeDataStream.js.map