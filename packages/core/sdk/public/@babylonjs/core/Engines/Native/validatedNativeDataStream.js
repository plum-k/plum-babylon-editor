import { NativeEngine } from "../nativeEngine.js";
import { NativeDataStream } from "./nativeDataStream.js";
NativeEngine._createNativeDataStream = function () {
    if (_native.NativeDataStream.VALIDATION_ENABLED) {
        return new ValidatedNativeDataStream();
    }
    else {
        return new NativeDataStream();
    }
};
/**
 * Validated Native Data Stream
 */
export class ValidatedNativeDataStream extends NativeDataStream {
    constructor() {
        super();
    }
    writeUint32(value) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_UINT_32);
        super.writeUint32(value);
    }
    writeInt32(value) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_INT_32);
        super.writeInt32(value);
    }
    writeFloat32(value) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_FLOAT_32);
        super.writeFloat32(value);
    }
    writeUint32Array(values) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_UINT_32_ARRAY);
        super.writeUint32Array(values);
    }
    writeInt32Array(values) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_INT_32_ARRAY);
        super.writeInt32Array(values);
    }
    writeFloat32Array(values) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_FLOAT_32_ARRAY);
        super.writeFloat32Array(values);
    }
    writeNativeData(handle) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_NATIVE_DATA);
        super.writeNativeData(handle);
    }
    writeBoolean(value) {
        super.writeUint32(_native.NativeDataStream.VALIDATION_BOOLEAN);
        super.writeBoolean(value);
    }
}
//# sourceMappingURL=validatedNativeDataStream.js.map