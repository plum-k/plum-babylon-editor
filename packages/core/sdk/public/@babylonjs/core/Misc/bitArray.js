function getByteIndex(bitIndex) {
    return Math.floor(bitIndex / 8);
}
function getBitMask(bitIndex) {
    return 1 << bitIndex % 8;
}
/**
 * An fixed size array that effectively stores boolean values where each value is a single bit of backing data.
 * @remarks
 * All bits are initialized to false.
 */
export class BitArray {
    /**
     * Creates a new bit array with a fixed size.
     * @param size The number of bits to store.
     */
    constructor(size) {
        this.size = size;
        this._byteArray = new Uint8Array(Math.ceil(this.size / 8));
    }
    /**
     * Gets the current value at the specified index.
     * @param bitIndex The index to get the value from.
     * @returns The value at the specified index.
     */
    get(bitIndex) {
        if (bitIndex >= this.size) {
            throw new RangeError("Bit index out of range");
        }
        const byteIndex = getByteIndex(bitIndex);
        const bitMask = getBitMask(bitIndex);
        return (this._byteArray[byteIndex] & bitMask) !== 0;
    }
    /**
     * Sets the value at the specified index.
     * @param bitIndex The index to set the value at.
     * @param value The value to set.
     */
    set(bitIndex, value) {
        if (bitIndex >= this.size) {
            throw new RangeError("Bit index out of range");
        }
        const byteIndex = getByteIndex(bitIndex);
        const bitMask = getBitMask(bitIndex);
        if (value) {
            this._byteArray[byteIndex] |= bitMask;
        }
        else {
            this._byteArray[byteIndex] &= ~bitMask;
        }
    }
}
//# sourceMappingURL=bitArray.js.map