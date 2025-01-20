import { DataBuffer } from "./dataBuffer.js";
import { Logger } from "../Misc/logger.js";

import { EnumerateFloatValues, GetFloatData, GetTypeByteLength } from "./bufferUtils.js";
/**
 * Class used to store data that will be store in GPU memory
 */
export class Buffer {
    /**
     * Gets a boolean indicating if the Buffer is disposed
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Constructor
     * @param engine the engine
     * @param data the data to use for this buffer
     * @param updatable whether the data is updatable
     * @param stride the stride (optional)
     * @param postponeInternalCreation whether to postpone creating the internal WebGL buffer (optional)
     * @param instanced whether the buffer is instanced (optional)
     * @param useBytes set to true if the stride in in bytes (optional)
     * @param divisor sets an optional divisor for instances (1 by default)
     * @param label defines the label of the buffer (for debug purpose)
     */
    constructor(engine, data, updatable, stride = 0, postponeInternalCreation = false, instanced = false, useBytes = false, divisor, label) {
        this._isAlreadyOwned = false;
        this._isDisposed = false;
        if (engine && engine.getScene) {
            // old versions of VertexBuffer accepted 'mesh' instead of 'engine'
            this._engine = engine.getScene().getEngine();
        }
        else {
            this._engine = engine;
        }
        this._updatable = updatable;
        this._instanced = instanced;
        this._divisor = divisor || 1;
        this._label = label;
        if (data instanceof DataBuffer) {
            this._data = null;
            this._buffer = data;
        }
        else {
            this._data = data;
            this._buffer = null;
        }
        this.byteStride = useBytes ? stride : stride * Float32Array.BYTES_PER_ELEMENT;
        if (!postponeInternalCreation) {
            // by default
            this.create();
        }
    }
    /**
     * Create a new VertexBuffer based on the current buffer
     * @param kind defines the vertex buffer kind (position, normal, etc.)
     * @param offset defines offset in the buffer (0 by default)
     * @param size defines the size in floats of attributes (position is 3 for instance)
     * @param stride defines the stride size in floats in the buffer (the offset to apply to reach next value when data is interleaved)
     * @param instanced defines if the vertex buffer contains indexed data
     * @param useBytes defines if the offset and stride are in bytes     *
     * @param divisor sets an optional divisor for instances (1 by default)
     * @returns the new vertex buffer
     */
    createVertexBuffer(kind, offset, size, stride, instanced, useBytes = false, divisor) {
        const byteOffset = useBytes ? offset : offset * Float32Array.BYTES_PER_ELEMENT;
        const byteStride = stride ? (useBytes ? stride : stride * Float32Array.BYTES_PER_ELEMENT) : this.byteStride;
        // a lot of these parameters are ignored as they are overridden by the buffer
        return new VertexBuffer(this._engine, this, kind, this._updatable, true, byteStride, instanced === undefined ? this._instanced : instanced, byteOffset, size, undefined, undefined, true, this._divisor || divisor);
    }
    // Properties
    /**
     * Gets a boolean indicating if the Buffer is updatable?
     * @returns true if the buffer is updatable
     */
    isUpdatable() {
        return this._updatable;
    }
    /**
     * Gets current buffer's data
     * @returns a DataArray or null
     */
    getData() {
        return this._data;
    }
    /**
     * Gets underlying native buffer
     * @returns underlying native buffer
     */
    getBuffer() {
        return this._buffer;
    }
    /**
     * Gets the stride in float32 units (i.e. byte stride / 4).
     * May not be an integer if the byte stride is not divisible by 4.
     * @returns the stride in float32 units
     * @deprecated Please use byteStride instead.
     */
    getStrideSize() {
        return this.byteStride / Float32Array.BYTES_PER_ELEMENT;
    }
    // Methods
    /**
     * Store data into the buffer. Creates the buffer if not used already.
     * If the buffer was already used, it will be updated only if it is updatable, otherwise it will do nothing.
     * @param data defines the data to store
     */
    create(data = null) {
        if (!data && this._buffer) {
            return; // nothing to do
        }
        data = data || this._data;
        if (!data) {
            return;
        }
        if (!this._buffer) {
            // create buffer
            if (this._updatable) {
                this._buffer = this._engine.createDynamicVertexBuffer(data, this._label);
                this._data = data;
            }
            else {
                this._buffer = this._engine.createVertexBuffer(data, undefined, this._label);
            }
        }
        else if (this._updatable) {
            // update buffer
            this._engine.updateDynamicVertexBuffer(this._buffer, data);
            this._data = data;
        }
    }
    /** @internal */
    _rebuild() {
        if (!this._data) {
            if (!this._buffer) {
                // Buffer was not yet created, nothing to do
                return;
            }
            if (this._buffer.capacity > 0) {
                // We can at least recreate the buffer with the right size, even if we don't have the data
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(this._buffer.capacity, this._label);
                }
                else {
                    this._buffer = this._engine.createVertexBuffer(this._buffer.capacity, undefined, this._label);
                }
                return;
            }
            Logger.Warn(`Missing data for buffer "${this._label}" ${this._buffer ? "(uniqueId: " + this._buffer.uniqueId + ")" : ""}. Buffer reconstruction failed.`);
            this._buffer = null;
        }
        else {
            this._buffer = null;
            this.create(this._data);
        }
    }
    /**
     * Update current buffer data
     * @param data defines the data to store
     */
    update(data) {
        this.create(data);
    }
    /**
     * Updates the data directly.
     * @param data the new data
     * @param offset the new offset
     * @param vertexCount the vertex count (optional)
     * @param useBytes set to true if the offset is in bytes
     */
    updateDirectly(data, offset, vertexCount, useBytes = false) {
        if (!this._buffer) {
            return;
        }
        if (this._updatable) {
            // update buffer
            this._engine.updateDynamicVertexBuffer(this._buffer, data, useBytes ? offset : offset * Float32Array.BYTES_PER_ELEMENT, vertexCount ? vertexCount * this.byteStride : undefined);
            if (offset === 0 && vertexCount === undefined) {
                // Keep the data if we easily can
                this._data = data;
            }
            else {
                this._data = null;
            }
        }
    }
    /** @internal */
    _increaseReferences() {
        if (!this._buffer) {
            return;
        }
        if (!this._isAlreadyOwned) {
            this._isAlreadyOwned = true;
            return;
        }
        this._buffer.references++;
    }
    /**
     * Release all resources
     */
    dispose() {
        if (!this._buffer) {
            return;
        }
        // The data buffer has an internal counter as this buffer can be used by several VertexBuffer objects
        // This means that we only flag it as disposed when all references are released (when _releaseBuffer will return true)
        if (this._engine._releaseBuffer(this._buffer)) {
            this._isDisposed = true;
            this._data = null;
            this._buffer = null;
        }
    }
}
/**
 * Specialized buffer used to store vertex data
 */
export class VertexBuffer {
    /**
     * Gets a boolean indicating if the Buffer is disposed
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Gets or sets the instance divisor when in instanced mode
     */
    get instanceDivisor() {
        return this._instanceDivisor;
    }
    set instanceDivisor(value) {
        const isInstanced = value != 0;
        this._instanceDivisor = value;
        if (isInstanced !== this._instanced) {
            this._instanced = isInstanced;
            this._computeHashCode();
        }
    }
    /**
     * Gets the max possible amount of vertices stored within the current vertex buffer.
     * We do not have the end offset or count so this will be too big for concatenated vertex buffers.
     * @internal
     */
    get _maxVerticesCount() {
        const data = this.getData();
        if (!data) {
            return 0;
        }
        if (Array.isArray(data)) {
            // data is a regular number[] with float values
            return data.length / (this.byteStride / 4) - this.byteOffset / 4;
        }
        return (data.byteLength - this.byteOffset) / this.byteStride;
    }
    /** @internal */
    constructor(engine, data, kind, updatableOrOptions, postponeInternalCreation, stride, instanced, offset, size, type, normalized = false, useBytes = false, divisor = 1, takeBufferOwnership = false) {
        /** @internal */
        this._isDisposed = false;
        let updatable = false;
        this.engine = engine;
        if (typeof updatableOrOptions === "object" && updatableOrOptions !== null) {
            updatable = updatableOrOptions.updatable ?? false;
            postponeInternalCreation = updatableOrOptions.postponeInternalCreation;
            stride = updatableOrOptions.stride;
            instanced = updatableOrOptions.instanced;
            offset = updatableOrOptions.offset;
            size = updatableOrOptions.size;
            type = updatableOrOptions.type;
            normalized = updatableOrOptions.normalized ?? false;
            useBytes = updatableOrOptions.useBytes ?? false;
            divisor = updatableOrOptions.divisor ?? 1;
            takeBufferOwnership = updatableOrOptions.takeBufferOwnership ?? false;
            this._label = updatableOrOptions.label;
        }
        else {
            updatable = !!updatableOrOptions;
        }
        if (data instanceof Buffer) {
            this._buffer = data;
            this._ownsBuffer = takeBufferOwnership;
        }
        else {
            this._buffer = new Buffer(engine, data, updatable, stride, postponeInternalCreation, instanced, useBytes, divisor, this._label);
            this._ownsBuffer = true;
        }
        this.uniqueId = VertexBuffer._Counter++;
        this._kind = kind;
        if (type === undefined) {
            const vertexData = this.getData();
            this.type = vertexData ? VertexBuffer.GetDataType(vertexData) : VertexBuffer.FLOAT;
        }
        else {
            this.type = type;
        }
        const typeByteLength = GetTypeByteLength(this.type);
        if (useBytes) {
            this._size = size || (stride ? stride / typeByteLength : VertexBuffer.DeduceStride(kind));
            this.byteStride = stride || this._buffer.byteStride || this._size * typeByteLength;
            this.byteOffset = offset || 0;
        }
        else {
            this._size = size || stride || VertexBuffer.DeduceStride(kind);
            this.byteStride = stride ? stride * typeByteLength : this._buffer.byteStride || this._size * typeByteLength;
            this.byteOffset = (offset || 0) * typeByteLength;
        }
        this.normalized = normalized;
        this._instanced = instanced !== undefined ? instanced : false;
        this._instanceDivisor = instanced ? divisor : 0;
        this._alignBuffer();
        this._computeHashCode();
    }
    _computeHashCode() {
        // note: cast to any because the property is declared readonly
        this.hashCode =
            ((this.type - 5120) << 0) +
                ((this.normalized ? 1 : 0) << 3) +
                (this._size << 4) +
                ((this._instanced ? 1 : 0) << 6) +
                /* keep 5 bits free */
                (this.byteStride << 12);
    }
    /** @internal */
    _rebuild() {
        this._buffer?._rebuild();
    }
    /**
     * Returns the kind of the VertexBuffer (string)
     * @returns a string
     */
    getKind() {
        return this._kind;
    }
    // Properties
    /**
     * Gets a boolean indicating if the VertexBuffer is updatable?
     * @returns true if the buffer is updatable
     */
    isUpdatable() {
        return this._buffer.isUpdatable();
    }
    /**
     * Gets current buffer's data
     * @returns a DataArray or null
     */
    getData() {
        return this._buffer.getData();
    }
    /**
     * Gets current buffer's data as a float array. Float data is constructed if the vertex buffer data cannot be returned directly.
     * @param totalVertices number of vertices in the buffer to take into account
     * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
     * @returns a float array containing vertex data
     */
    getFloatData(totalVertices, forceCopy) {
        const data = this.getData();
        if (!data) {
            return null;
        }
        return GetFloatData(data, this._size, this.type, this.byteOffset, this.byteStride, this.normalized, totalVertices, forceCopy);
    }
    /**
     * Gets underlying native buffer
     * @returns underlying native buffer
     */
    getBuffer() {
        return this._buffer.getBuffer();
    }
    /**
     * Gets the Buffer instance that wraps the native GPU buffer
     * @returns the wrapper buffer
     */
    getWrapperBuffer() {
        return this._buffer;
    }
    /**
     * Gets the stride in float32 units (i.e. byte stride / 4).
     * May not be an integer if the byte stride is not divisible by 4.
     * @returns the stride in float32 units
     * @deprecated Please use byteStride instead.
     */
    getStrideSize() {
        return this.byteStride / GetTypeByteLength(this.type);
    }
    /**
     * Returns the offset as a multiple of the type byte length.
     * @returns the offset in bytes
     * @deprecated Please use byteOffset instead.
     */
    getOffset() {
        return this.byteOffset / GetTypeByteLength(this.type);
    }
    /**
     * Returns the number of components or the byte size per vertex attribute
     * @param sizeInBytes If true, returns the size in bytes or else the size in number of components of the vertex attribute (default: false)
     * @returns the number of components
     */
    getSize(sizeInBytes = false) {
        return sizeInBytes ? this._size * GetTypeByteLength(this.type) : this._size;
    }
    /**
     * Gets a boolean indicating is the internal buffer of the VertexBuffer is instanced
     * @returns true if this buffer is instanced
     */
    getIsInstanced() {
        return this._instanced;
    }
    /**
     * Returns the instancing divisor, zero for non-instanced (integer).
     * @returns a number
     */
    getInstanceDivisor() {
        return this._instanceDivisor;
    }
    // Methods
    /**
     * Store data into the buffer. If the buffer was already used it will be either recreated or updated depending on isUpdatable property
     * @param data defines the data to store
     */
    create(data) {
        this._buffer.create(data);
        this._alignBuffer();
    }
    /**
     * Updates the underlying buffer according to the passed numeric array or Float32Array.
     * This function will create a new buffer if the current one is not updatable
     * @param data defines the data to store
     */
    update(data) {
        this._buffer.update(data);
        this._alignBuffer();
    }
    /**
     * Updates directly the underlying WebGLBuffer according to the passed numeric array or Float32Array.
     * Returns the directly updated WebGLBuffer.
     * @param data the new data
     * @param offset the new offset
     * @param useBytes set to true if the offset is in bytes
     */
    updateDirectly(data, offset, useBytes = false) {
        this._buffer.updateDirectly(data, offset, undefined, useBytes);
        this._alignBuffer();
    }
    /**
     * Disposes the VertexBuffer and the underlying WebGLBuffer.
     */
    dispose() {
        if (this._ownsBuffer) {
            this._buffer.dispose();
        }
        this._isDisposed = true;
    }
    /**
     * Enumerates each value of this vertex buffer as numbers.
     * @param count the number of values to enumerate
     * @param callback the callback function called for each value
     */
    forEach(count, callback) {
        EnumerateFloatValues(this._buffer.getData(), this.byteOffset, this.byteStride, this._size, this.type, count, this.normalized, (values, index) => {
            for (let i = 0; i < this._size; i++) {
                callback(values[i], index + i);
            }
        });
    }
    /** @internal */
    _alignBuffer() { }
    /**
     * Deduces the stride given a kind.
     * @param kind The kind string to deduce
     * @returns The deduced stride
     */
    static DeduceStride(kind) {
        switch (kind) {
            case VertexBuffer.UVKind:
            case VertexBuffer.UV2Kind:
            case VertexBuffer.UV3Kind:
            case VertexBuffer.UV4Kind:
            case VertexBuffer.UV5Kind:
            case VertexBuffer.UV6Kind:
                return 2;
            case VertexBuffer.NormalKind:
            case VertexBuffer.PositionKind:
                return 3;
            case VertexBuffer.ColorKind:
            case VertexBuffer.ColorInstanceKind:
            case VertexBuffer.MatricesIndicesKind:
            case VertexBuffer.MatricesIndicesExtraKind:
            case VertexBuffer.MatricesWeightsKind:
            case VertexBuffer.MatricesWeightsExtraKind:
            case VertexBuffer.TangentKind:
                return 4;
            default:
                throw new Error("Invalid kind '" + kind + "'");
        }
    }
    /**
     * Gets the vertex buffer type of the given data array.
     * @param data the data array
     * @returns the vertex buffer type
     */
    static GetDataType(data) {
        if (data instanceof Int8Array) {
            return VertexBuffer.BYTE;
        }
        else if (data instanceof Uint8Array) {
            return VertexBuffer.UNSIGNED_BYTE;
        }
        else if (data instanceof Int16Array) {
            return VertexBuffer.SHORT;
        }
        else if (data instanceof Uint16Array) {
            return VertexBuffer.UNSIGNED_SHORT;
        }
        else if (data instanceof Int32Array) {
            return VertexBuffer.INT;
        }
        else if (data instanceof Uint32Array) {
            return VertexBuffer.UNSIGNED_INT;
        }
        else {
            return VertexBuffer.FLOAT;
        }
    }
    /**
     * Gets the byte length of the given type.
     * @param type the type
     * @returns the number of bytes
     * @deprecated Use `getTypeByteLength` from `bufferUtils` instead
     */
    static GetTypeByteLength(type) {
        return GetTypeByteLength(type);
    }
    /**
     * Enumerates each value of the given parameters as numbers.
     * @param data the data to enumerate
     * @param byteOffset the byte offset of the data
     * @param byteStride the byte stride of the data
     * @param componentCount the number of components per element
     * @param componentType the type of the component
     * @param count the number of values to enumerate
     * @param normalized whether the data is normalized
     * @param callback the callback function called for each value
     * @deprecated Use `EnumerateFloatValues` from `bufferUtils` instead
     */
    static ForEach(data, byteOffset, byteStride, componentCount, componentType, count, normalized, callback) {
        EnumerateFloatValues(data, byteOffset, byteStride, componentCount, componentType, count, normalized, (values, index) => {
            for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                callback(values[componentIndex], index + componentIndex);
            }
        });
    }
    /**
     * Gets the given data array as a float array. Float data is constructed if the data array cannot be returned directly.
     * @param data the input data array
     * @param size the number of components
     * @param type the component type
     * @param byteOffset the byte offset of the data
     * @param byteStride the byte stride of the data
     * @param normalized whether the data is normalized
     * @param totalVertices number of vertices in the buffer to take into account
     * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
     * @returns a float array containing vertex data
     * @deprecated Use `GetFloatData` from `bufferUtils` instead
     */
    static GetFloatData(data, size, type, byteOffset, byteStride, normalized, totalVertices, forceCopy) {
        return GetFloatData(data, size, type, byteOffset, byteStride, normalized, totalVertices, forceCopy);
    }
}
VertexBuffer._Counter = 0;
/**
 * The byte type.
 */
VertexBuffer.BYTE = 5120;
/**
 * The unsigned byte type.
 */
VertexBuffer.UNSIGNED_BYTE = 5121;
/**
 * The short type.
 */
VertexBuffer.SHORT = 5122;
/**
 * The unsigned short type.
 */
VertexBuffer.UNSIGNED_SHORT = 5123;
/**
 * The integer type.
 */
VertexBuffer.INT = 5124;
/**
 * The unsigned integer type.
 */
VertexBuffer.UNSIGNED_INT = 5125;
/**
 * The float type.
 */
VertexBuffer.FLOAT = 5126;
// Enums
/**
 * Positions
 */
VertexBuffer.PositionKind = `position`;
/**
 * Normals
 */
VertexBuffer.NormalKind = `normal`;
/**
 * Tangents
 */
VertexBuffer.TangentKind = `tangent`;
/**
 * Texture coordinates
 */
VertexBuffer.UVKind = `uv`;
/**
 * Texture coordinates 2
 */
VertexBuffer.UV2Kind = `uv2`;
/**
 * Texture coordinates 3
 */
VertexBuffer.UV3Kind = `uv3`;
/**
 * Texture coordinates 4
 */
VertexBuffer.UV4Kind = `uv4`;
/**
 * Texture coordinates 5
 */
VertexBuffer.UV5Kind = `uv5`;
/**
 * Texture coordinates 6
 */
VertexBuffer.UV6Kind = `uv6`;
/**
 * Colors
 */
VertexBuffer.ColorKind = `color`;
/**
 * Instance Colors
 */
VertexBuffer.ColorInstanceKind = `instanceColor`;
/**
 * Matrix indices (for bones)
 */
VertexBuffer.MatricesIndicesKind = `matricesIndices`;
/**
 * Matrix weights (for bones)
 */
VertexBuffer.MatricesWeightsKind = `matricesWeights`;
/**
 * Additional matrix indices (for bones)
 */
VertexBuffer.MatricesIndicesExtraKind = `matricesIndicesExtra`;
/**
 * Additional matrix weights (for bones)
 */
VertexBuffer.MatricesWeightsExtraKind = `matricesWeightsExtra`;
//# sourceMappingURL=buffer.js.map