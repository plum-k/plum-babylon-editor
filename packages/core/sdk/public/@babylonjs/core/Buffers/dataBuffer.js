/**
 * Class used to store gfx data (like WebGLBuffer)
 */
export class DataBuffer {
    /**
     * Gets the underlying buffer
     */
    get underlyingResource() {
        return null;
    }
    /**
     * Constructs the buffer
     */
    constructor() {
        /**
         * Gets or sets the number of objects referencing this buffer
         */
        this.references = 0;
        /** Gets or sets the size of the underlying buffer */
        this.capacity = 0;
        /**
         * Gets or sets a boolean indicating if the buffer contains 32bits indices
         */
        this.is32Bits = false;
        this.uniqueId = DataBuffer._Counter++;
    }
}
DataBuffer._Counter = 0;
//# sourceMappingURL=dataBuffer.js.map