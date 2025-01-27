import { DataWriter } from "./dataWriter.js";
function getHighestByteAlignment(byteLength) {
    if (byteLength % 4 === 0)
        return 4;
    if (byteLength % 2 === 0)
        return 2;
    return 1;
}
/**
 * Utility class to centralize the management of binary data, bufferViews, and the objects that reference them.
 * @internal
 */
export class BufferManager {
    constructor() {
        /**
         * Maps a bufferView to its data
         */
        this._bufferViewToData = new Map();
        /**
         * Maps a bufferView to glTF objects that reference it via a "bufferView" property (e.g. accessors, images)
         */
        this._bufferViewToProperties = new Map();
        /**
         * Maps an accessor to its bufferView
         */
        this._accessorToBufferView = new Map();
    }
    /**
     * Generates a binary buffer from the stored bufferViews. Also populates the bufferViews list.
     * @param bufferViews The list of bufferViews to be populated while writing the binary
     * @returns The binary buffer
     */
    generateBinary(bufferViews) {
        // Construct a DataWriter with the total byte length to prevent resizing
        let totalByteLength = 0;
        this._bufferViewToData.forEach((data) => {
            totalByteLength += data.byteLength;
        });
        const dataWriter = new DataWriter(totalByteLength);
        // Order the bufferViews in descending order of their alignment requirements
        const orderedBufferViews = Array.from(this._bufferViewToData.keys()).sort((a, b) => getHighestByteAlignment(b.byteLength) - getHighestByteAlignment(a.byteLength));
        // Fill in the bufferViews list and missing bufferView index references while writing the binary
        for (const bufferView of orderedBufferViews) {
            bufferView.byteOffset = dataWriter.byteOffset;
            bufferViews.push(bufferView);
            const bufferViewIndex = bufferViews.length - 1;
            const properties = this.getPropertiesWithBufferView(bufferView);
            for (const object of properties) {
                object.bufferView = bufferViewIndex;
            }
            dataWriter.writeTypedArray(this._bufferViewToData.get(bufferView));
            this._bufferViewToData.delete(bufferView); // Try to free up memory ASAP
        }
        return dataWriter.getOutputData();
    }
    /**
     * Creates a buffer view based on the supplied arguments
     * @param data a TypedArray to create the bufferView for
     * @param byteStride byte distance between consecutive elements
     * @returns bufferView for glTF
     */
    createBufferView(data, byteStride) {
        const bufferView = {
            buffer: 0,
            byteOffset: undefined, // byteOffset will be set later, when we write the binary and decide bufferView ordering
            byteLength: data.byteLength,
            byteStride: byteStride,
        };
        this._bufferViewToData.set(bufferView, data);
        return bufferView;
    }
    /**
     * Creates an accessor based on the supplied arguments and assigns it to the bufferView
     * @param bufferView The glTF bufferView referenced by this accessor
     * @param type The type of the accessor
     * @param componentType The datatype of components in the attribute
     * @param count The number of attributes referenced by this accessor
     * @param byteOffset The offset relative to the start of the bufferView in bytes
     * @param minMax Minimum and maximum value of each component in this attribute
     * @param normalized Specifies whether integer data values are normalized before usage
     * @returns accessor for glTF
     */
    createAccessor(bufferView, type, componentType, count, byteOffset, minMax, normalized) {
        this._verifyBufferView(bufferView);
        const accessor = {
            bufferView: undefined, // bufferView will be set to a real index later, once we write the binary and decide bufferView ordering
            componentType: componentType,
            count: count,
            type: type,
            min: minMax?.min,
            max: minMax?.max,
            normalized: normalized,
            byteOffset: byteOffset,
        };
        this.setBufferView(accessor, bufferView);
        this._accessorToBufferView.set(accessor, bufferView);
        return accessor;
    }
    /**
     * Assigns a bufferView to a glTF object that references it
     * @param object The glTF object
     * @param bufferView The bufferView to assign
     */
    setBufferView(object, bufferView) {
        this._verifyBufferView(bufferView);
        const properties = this.getPropertiesWithBufferView(bufferView);
        properties.push(object);
    }
    /**
     * Removes buffer view from the binary data, as well as from all its known references
     * @param bufferView the bufferView to remove
     */
    removeBufferView(bufferView) {
        const properties = this.getPropertiesWithBufferView(bufferView);
        for (const object of properties) {
            if (object.bufferView !== undefined) {
                delete object.bufferView;
            }
        }
        this._bufferViewToData.delete(bufferView);
        this._bufferViewToProperties.delete(bufferView);
        this._accessorToBufferView.forEach((bv, accessor) => {
            if (bv === bufferView) {
                // Additionally, remove byteOffset from accessor referencing this bufferView
                if (accessor.byteOffset !== undefined) {
                    delete accessor.byteOffset;
                }
                this._accessorToBufferView.delete(accessor);
            }
        });
    }
    getBufferView(accessor) {
        const bufferView = this._accessorToBufferView.get(accessor);
        this._verifyBufferView(bufferView);
        return bufferView;
    }
    getPropertiesWithBufferView(bufferView) {
        this._verifyBufferView(bufferView);
        this._bufferViewToProperties.set(bufferView, this._bufferViewToProperties.get(bufferView) ?? []);
        return this._bufferViewToProperties.get(bufferView);
    }
    getData(bufferView) {
        this._verifyBufferView(bufferView);
        return this._bufferViewToData.get(bufferView);
    }
    _verifyBufferView(bufferView) {
        if (bufferView === undefined || !this._bufferViewToData.has(bufferView)) {
            throw new Error(`BufferView ${bufferView} not found in BufferManager.`);
        }
    }
}
//# sourceMappingURL=bufferManager.js.map