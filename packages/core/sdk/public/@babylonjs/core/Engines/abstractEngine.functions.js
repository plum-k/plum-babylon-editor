import { _WarnImport } from "../Misc/devTools.js";
import { IsDocumentAvailable } from "../Misc/domManagement.js";

export const EngineFunctionContext = {};
/**
 * @internal
 */
export function _ConcatenateShader(source, defines, shaderVersion = "") {
    return shaderVersion + (defines ? defines + "\n" : "") + source;
}
/**
 * @internal
 */
export function _loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError, injectedLoadFile) {
    const loadFile = injectedLoadFile || EngineFunctionContext.loadFile;
    if (loadFile) {
        const request = loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        return request;
    }
    throw _WarnImport("FileTools");
}
/**
 * Gets host document
 * @param renderingCanvas if provided, the canvas' owner document will be returned
 * @returns the host document object
 */
export function getHostDocument(renderingCanvas = null) {
    if (renderingCanvas && renderingCanvas.ownerDocument) {
        return renderingCanvas.ownerDocument;
    }
    return IsDocumentAvailable() ? document : null;
}
/** @internal */
export function _getGlobalDefines(defines, isNDCHalfZRange, useReverseDepthBuffer, useExactSrgbConversions) {
    if (defines) {
        if (isNDCHalfZRange) {
            defines["IS_NDC_HALF_ZRANGE"] = "";
        }
        else {
            delete defines["IS_NDC_HALF_ZRANGE"];
        }
        if (useReverseDepthBuffer) {
            defines["USE_REVERSE_DEPTHBUFFER"] = "";
        }
        else {
            delete defines["USE_REVERSE_DEPTHBUFFER"];
        }
        if (useExactSrgbConversions) {
            defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
        }
        else {
            delete defines["USE_EXACT_SRGB_CONVERSIONS"];
        }
        return;
    }
    else {
        let s = "";
        if (isNDCHalfZRange) {
            s += "#define IS_NDC_HALF_ZRANGE";
        }
        if (useReverseDepthBuffer) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_REVERSE_DEPTHBUFFER";
        }
        if (useExactSrgbConversions) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_EXACT_SRGB_CONVERSIONS";
        }
        return s;
    }
}
/**
 * Allocate a typed array depending on a texture type. Optionally can copy existing data in the buffer.
 * @param type type of the texture
 * @param sizeOrDstBuffer size of the array OR an existing buffer that will be used as the destination of the copy (if copyBuffer is provided)
 * @param sizeInBytes true if the size of the array is given in bytes, false if it is the number of elements of the array
 * @param copyBuffer if provided, buffer to copy into the destination buffer (either a newly allocated buffer if sizeOrDstBuffer is a number or use sizeOrDstBuffer as the destination buffer otherwise)
 * @returns the allocated buffer or sizeOrDstBuffer if the latter is an ArrayBuffer
 */
export function allocateAndCopyTypedBuffer(type, sizeOrDstBuffer, sizeInBytes = false, copyBuffer) {
    switch (type) {
        case 3: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Int8Array(sizeOrDstBuffer) : new Int8Array(sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Int8Array(copyBuffer));
            }
            return buffer;
        }
        case 0: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint8Array(sizeOrDstBuffer) : new Uint8Array(sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Uint8Array(copyBuffer));
            }
            return buffer;
        }
        case 4: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Int16Array(sizeOrDstBuffer) : new Int16Array(sizeInBytes ? sizeOrDstBuffer / 2 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Int16Array(copyBuffer));
            }
            return buffer;
        }
        case 5:
        case 8:
        case 9:
        case 10:
        case 2: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint16Array(sizeOrDstBuffer) : new Uint16Array(sizeInBytes ? sizeOrDstBuffer / 2 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Uint16Array(copyBuffer));
            }
            return buffer;
        }
        case 6: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Int32Array(sizeOrDstBuffer) : new Int32Array(sizeInBytes ? sizeOrDstBuffer / 4 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Int32Array(copyBuffer));
            }
            return buffer;
        }
        case 7:
        case 11:
        case 12:
        case 13:
        case 14:
        case 15: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint32Array(sizeOrDstBuffer) : new Uint32Array(sizeInBytes ? sizeOrDstBuffer / 4 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Uint32Array(copyBuffer));
            }
            return buffer;
        }
        case 1: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Float32Array(sizeOrDstBuffer) : new Float32Array(sizeInBytes ? sizeOrDstBuffer / 4 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Float32Array(copyBuffer));
            }
            return buffer;
        }
    }
    const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint8Array(sizeOrDstBuffer) : new Uint8Array(sizeOrDstBuffer);
    if (copyBuffer) {
        buffer.set(new Uint8Array(copyBuffer));
    }
    return buffer;
}
//# sourceMappingURL=abstractEngine.functions.js.map