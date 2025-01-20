
import { Logger } from "../Misc/logger.js";
function GetFloatValue(dataView, type, byteOffset, normalized) {
    switch (type) {
        case 5120: {
            let value = dataView.getInt8(byteOffset);
            if (normalized) {
                value = Math.max(value / 127, -1);
            }
            return value;
        }
        case 5121: {
            let value = dataView.getUint8(byteOffset);
            if (normalized) {
                value = value / 255;
            }
            return value;
        }
        case 5122: {
            let value = dataView.getInt16(byteOffset, true);
            if (normalized) {
                value = Math.max(value / 32767, -1);
            }
            return value;
        }
        case 5123: {
            let value = dataView.getUint16(byteOffset, true);
            if (normalized) {
                value = value / 65535;
            }
            return value;
        }
        case 5124: {
            return dataView.getInt32(byteOffset, true);
        }
        case 5125: {
            return dataView.getUint32(byteOffset, true);
        }
        case 5126: {
            return dataView.getFloat32(byteOffset, true);
        }
        default: {
            throw new Error(`Invalid component type ${type}`);
        }
    }
}
function SetFloatValue(dataView, type, byteOffset, normalized, value) {
    switch (type) {
        case 5120: {
            if (normalized) {
                value = Math.round(value * 127.0);
            }
            dataView.setInt8(byteOffset, value);
            break;
        }
        case 5121: {
            if (normalized) {
                value = Math.round(value * 255);
            }
            dataView.setUint8(byteOffset, value);
            break;
        }
        case 5122: {
            if (normalized) {
                value = Math.round(value * 32767);
            }
            dataView.setInt16(byteOffset, value, true);
            break;
        }
        case 5123: {
            if (normalized) {
                value = Math.round(value * 65535);
            }
            dataView.setUint16(byteOffset, value, true);
            break;
        }
        case 5124: {
            dataView.setInt32(byteOffset, value, true);
            break;
        }
        case 5125: {
            dataView.setUint32(byteOffset, value, true);
            break;
        }
        case 5126: {
            dataView.setFloat32(byteOffset, value, true);
            break;
        }
        default: {
            throw new Error(`Invalid component type ${type}`);
        }
    }
}
/**
 * Gets the byte length of the given type.
 * @param type the type
 * @returns the number of bytes
 */
export function GetTypeByteLength(type) {
    switch (type) {
        case 5120:
        case 5121:
            return 1;
        case 5122:
        case 5123:
            return 2;
        case 5124:
        case 5125:
        case 5126:
            return 4;
        default:
            throw new Error(`Invalid type '${type}'`);
    }
}
/**
 * Enumerates each value of the data array and calls the given callback.
 * @param data the data to enumerate
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param componentCount the number of components per element
 * @param componentType the type of the component
 * @param count the number of values to enumerate
 * @param normalized whether the data is normalized
 * @param callback the callback function called for each group of component values
 */
export function EnumerateFloatValues(data, byteOffset, byteStride, componentCount, componentType, count, normalized, callback) {
    const oldValues = new Array(componentCount);
    const newValues = new Array(componentCount);
    if (data instanceof Array) {
        let offset = byteOffset / 4;
        const stride = byteStride / 4;
        for (let index = 0; index < count; index += componentCount) {
            for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                oldValues[componentIndex] = newValues[componentIndex] = data[offset + componentIndex];
            }
            callback(newValues, index);
            for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                if (oldValues[componentIndex] !== newValues[componentIndex]) {
                    data[offset + componentIndex] = newValues[componentIndex];
                }
            }
            offset += stride;
        }
    }
    else {
        const dataView = data instanceof ArrayBuffer ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
        const componentByteLength = GetTypeByteLength(componentType);
        for (let index = 0; index < count; index += componentCount) {
            for (let componentIndex = 0, componentByteOffset = byteOffset; componentIndex < componentCount; componentIndex++, componentByteOffset += componentByteLength) {
                oldValues[componentIndex] = newValues[componentIndex] = GetFloatValue(dataView, componentType, componentByteOffset, normalized);
            }
            callback(newValues, index);
            for (let componentIndex = 0, componentByteOffset = byteOffset; componentIndex < componentCount; componentIndex++, componentByteOffset += componentByteLength) {
                if (oldValues[componentIndex] !== newValues[componentIndex]) {
                    SetFloatValue(dataView, componentType, componentByteOffset, normalized, newValues[componentIndex]);
                }
            }
            byteOffset += byteStride;
        }
    }
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
 */
export function GetFloatData(data, size, type, byteOffset, byteStride, normalized, totalVertices, forceCopy) {
    const tightlyPackedByteStride = size * GetTypeByteLength(type);
    const count = totalVertices * size;
    if (type !== 5126 || byteStride !== tightlyPackedByteStride) {
        const copy = new Float32Array(count);
        EnumerateFloatValues(data, byteOffset, byteStride, size, type, count, normalized, (values, index) => {
            for (let i = 0; i < size; i++) {
                copy[index + i] = values[i];
            }
        });
        return copy;
    }
    if (!(data instanceof Array || data instanceof Float32Array) || byteOffset !== 0 || data.length !== count) {
        if (data instanceof Array) {
            const offset = byteOffset / 4;
            return data.slice(offset, offset + count);
        }
        else if (data instanceof ArrayBuffer) {
            return new Float32Array(data, byteOffset, count);
        }
        else {
            const offset = data.byteOffset + byteOffset;
            if ((offset & 3) !== 0) {
                Logger.Warn("Float array must be aligned to 4-bytes border");
                forceCopy = true;
            }
            if (forceCopy) {
                return new Float32Array(data.buffer.slice(offset, offset + count * Float32Array.BYTES_PER_ELEMENT));
            }
            else {
                return new Float32Array(data.buffer, offset, count);
            }
        }
    }
    if (forceCopy) {
        return data.slice();
    }
    return data;
}
/**
 * Copies the given data array to the given float array.
 * @param input the input data array
 * @param size the number of components
 * @param type the component type
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param normalized whether the data is normalized
 * @param totalVertices number of vertices in the buffer to take into account
 * @param output the output float array
 */
export function CopyFloatData(input, size, type, byteOffset, byteStride, normalized, totalVertices, output) {
    const tightlyPackedByteStride = size * GetTypeByteLength(type);
    const count = totalVertices * size;
    if (output.length !== count) {
        throw new Error("Output length is not valid");
    }
    if (type !== 5126 || byteStride !== tightlyPackedByteStride) {
        EnumerateFloatValues(input, byteOffset, byteStride, size, type, count, normalized, (values, index) => {
            for (let i = 0; i < size; i++) {
                output[index + i] = values[i];
            }
        });
        return;
    }
    if (input instanceof Array) {
        const offset = byteOffset / 4;
        output.set(input, offset);
    }
    else if (input instanceof ArrayBuffer) {
        const floatData = new Float32Array(input, byteOffset, count);
        output.set(floatData);
    }
    else {
        const offset = input.byteOffset + byteOffset;
        if ((offset & 3) !== 0) {
            Logger.Warn("Float array must be aligned to 4-bytes border");
            output.set(new Float32Array(input.buffer.slice(offset, offset + count * Float32Array.BYTES_PER_ELEMENT)));
            return;
        }
        const floatData = new Float32Array(input.buffer, offset, count);
        output.set(floatData);
    }
}
/**
 * Utility function to determine if an IndicesArray is an Uint32Array.
 * @param indices The IndicesArray to check. If null, count is used instead.
 * @param count The number of indices
 * @returns True if the indices use 32 bits
 */
export function AreIndices32Bits(indices, count) {
    if (indices) {
        if (indices instanceof Array) {
            return indices.some((value) => value >= 65536);
        }
        return indices.BYTES_PER_ELEMENT === 4;
    }
    return count >= 65536;
}
//# sourceMappingURL=bufferUtils.js.map