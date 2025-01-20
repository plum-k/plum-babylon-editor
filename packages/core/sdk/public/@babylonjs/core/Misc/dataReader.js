import { Decode } from "./stringTools.js";
/**
 * Utility class for reading from a data buffer
 */
export class DataReader {
    /**
     * Constructor
     * @param buffer The buffer to read
     */
    constructor(buffer) {
        /**
         * The current byte offset from the beginning of the data buffer.
         */
        this.byteOffset = 0;
        this.buffer = buffer;
    }
    /**
     * Loads the given byte length.
     * @param byteLength The byte length to load
     * @returns A promise that resolves when the load is complete
     */
    loadAsync(byteLength) {
        return this.buffer.readAsync(this.byteOffset, byteLength).then((data) => {
            this._dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
            this._dataByteOffset = 0;
        });
    }
    /**
     * Read a unsigned 32-bit integer from the currently loaded data range.
     * @returns The 32-bit integer read
     */
    readUint32() {
        const value = this._dataView.getUint32(this._dataByteOffset, true);
        this._dataByteOffset += 4;
        this.byteOffset += 4;
        return value;
    }
    /**
     * Read a byte array from the currently loaded data range.
     * @param byteLength The byte length to read
     * @returns The byte array read
     */
    readUint8Array(byteLength) {
        const value = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._dataByteOffset, byteLength);
        this._dataByteOffset += byteLength;
        this.byteOffset += byteLength;
        return value;
    }
    /**
     * Read a string from the currently loaded data range.
     * @param byteLength The byte length to read
     * @returns The string read
     */
    readString(byteLength) {
        return Decode(this.readUint8Array(byteLength));
    }
    /**
     * Skips the given byte length the currently loaded data range.
     * @param byteLength The byte length to skip
     */
    skipBytes(byteLength) {
        this._dataByteOffset += byteLength;
        this.byteOffset += byteLength;
    }
}
//# sourceMappingURL=dataReader.js.map