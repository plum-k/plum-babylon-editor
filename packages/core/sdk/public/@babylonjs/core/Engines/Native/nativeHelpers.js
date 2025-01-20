import { ErrorCodes, RuntimeError } from "../../Misc/error.js";

import { VertexBuffer } from "../../Buffers/buffer.js";
export function getNativeTextureFormat(format, type) {
    switch (format) {
        // Depth (type is ignored)
        case 15:
            return _native.Engine.TEXTURE_FORMAT_D16;
        case 16:
            return _native.Engine.TEXTURE_FORMAT_D24;
        case 13:
            return _native.Engine.TEXTURE_FORMAT_D24S8;
        case 14:
            return _native.Engine.TEXTURE_FORMAT_D32F;
        // Compressed (type is ignored)
        case 36492:
            return _native.Engine.TEXTURE_FORMAT_BC7;
        case 36494:
            return _native.Engine.TEXTURE_FORMAT_BC6H;
        case 33779:
            return _native.Engine.TEXTURE_FORMAT_BC3;
        case 33778:
            return _native.Engine.TEXTURE_FORMAT_BC2;
        case 33777:
            return _native.Engine.TEXTURE_FORMAT_BC1;
        case 33776:
            return _native.Engine.TEXTURE_FORMAT_BC1;
        case 37808:
            return _native.Engine.TEXTURE_FORMAT_ASTC4x4;
        case 36196:
            return _native.Engine.TEXTURE_FORMAT_ETC1;
        case 37492:
            return _native.Engine.TEXTURE_FORMAT_ETC2;
        case 37496:
            return _native.Engine.TEXTURE_FORMAT_ETC2A;
        case 4: {
            switch (type) {
                case 0:
                    return _native.Engine.TEXTURE_FORMAT_RGB8;
                case 3:
                    return _native.Engine.TEXTURE_FORMAT_RGB8S;
                case 6:
                    return _native.Engine.TEXTURE_FORMAT_RGB8I;
                case 7:
                    return _native.Engine.TEXTURE_FORMAT_RGB8U;
            }
            break;
        }
        case 5: {
            switch (type) {
                case 0:
                    return _native.Engine.TEXTURE_FORMAT_RGBA8;
                case 1:
                    return _native.Engine.TEXTURE_FORMAT_RGBA32F;
                case 2:
                    return _native.Engine.TEXTURE_FORMAT_RGBA16F;
                case 3:
                    return _native.Engine.TEXTURE_FORMAT_RGBA8S;
                case 4:
                    return _native.Engine.TEXTURE_FORMAT_RGBA16I;
                case 5:
                    return _native.Engine.TEXTURE_FORMAT_RGBA16U;
                case 6:
                    return _native.Engine.TEXTURE_FORMAT_RGBA32I;
                case 7:
                    return _native.Engine.TEXTURE_FORMAT_RGBA32U;
            }
            break;
        }
        case 6: {
            switch (type) {
                case 0:
                    return _native.Engine.TEXTURE_FORMAT_R8;
                case 1:
                    return _native.Engine.TEXTURE_FORMAT_R32F;
                case 2:
                    return _native.Engine.TEXTURE_FORMAT_R16F;
                case 3:
                    return _native.Engine.TEXTURE_FORMAT_R8S;
                case 4:
                    return _native.Engine.TEXTURE_FORMAT_R16S;
                case 5:
                    return _native.Engine.TEXTURE_FORMAT_R16U;
                case 6:
                    return _native.Engine.TEXTURE_FORMAT_R32I;
                case 7:
                    return _native.Engine.TEXTURE_FORMAT_R32U;
            }
            break;
        }
        case 7: {
            switch (type) {
                case 0:
                    return _native.Engine.TEXTURE_FORMAT_RG8;
                case 1:
                    return _native.Engine.TEXTURE_FORMAT_RG32F;
                case 2:
                    return _native.Engine.TEXTURE_FORMAT_RG16F;
                case 3:
                    return _native.Engine.TEXTURE_FORMAT_RG8S;
                case 4:
                    return _native.Engine.TEXTURE_FORMAT_RG16S;
                case 5:
                    return _native.Engine.TEXTURE_FORMAT_RG16U;
                case 6:
                    return _native.Engine.TEXTURE_FORMAT_RG32I;
                case 7:
                    return _native.Engine.TEXTURE_FORMAT_RG32U;
            }
            break;
        }
        case 12: {
            switch (type) {
                case 0:
                    return _native.Engine.TEXTURE_FORMAT_BGRA8;
            }
            break;
        }
    }
    throw new RuntimeError(`Unsupported texture format or type: format ${format}, type ${type}.`, ErrorCodes.UnsupportedTextureError);
}
export function getNativeSamplingMode(samplingMode) {
    switch (samplingMode) {
        case 1:
            return _native.Engine.TEXTURE_NEAREST_NEAREST;
        case 2:
            return _native.Engine.TEXTURE_LINEAR_LINEAR;
        case 3:
            return _native.Engine.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
        case 4:
            return _native.Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
        case 5:
            return _native.Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
        case 6:
            return _native.Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
        case 7:
            return _native.Engine.TEXTURE_NEAREST_LINEAR;
        case 8:
            return _native.Engine.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
        case 9:
            return _native.Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
        case 10:
            return _native.Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
        case 11:
            return _native.Engine.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
        case 12:
            return _native.Engine.TEXTURE_LINEAR_NEAREST;
        default:
            throw new Error(`Unsupported sampling mode: ${samplingMode}.`);
    }
}
export function getNativeAddressMode(wrapMode) {
    switch (wrapMode) {
        case 1:
            return _native.Engine.ADDRESS_MODE_WRAP;
        case 0:
            return _native.Engine.ADDRESS_MODE_CLAMP;
        case 2:
            return _native.Engine.ADDRESS_MODE_MIRROR;
        default:
            throw new Error("Unexpected wrap mode: " + wrapMode + ".");
    }
}
export function getNativeStencilFunc(func) {
    switch (func) {
        case 513:
            return _native.Engine.STENCIL_TEST_LESS;
        case 515:
            return _native.Engine.STENCIL_TEST_LEQUAL;
        case 514:
            return _native.Engine.STENCIL_TEST_EQUAL;
        case 518:
            return _native.Engine.STENCIL_TEST_GEQUAL;
        case 516:
            return _native.Engine.STENCIL_TEST_GREATER;
        case 517:
            return _native.Engine.STENCIL_TEST_NOTEQUAL;
        case 512:
            return _native.Engine.STENCIL_TEST_NEVER;
        case 519:
            return _native.Engine.STENCIL_TEST_ALWAYS;
        default:
            throw new Error(`Unsupported stencil func mode: ${func}.`);
    }
}
export function getNativeStencilOpFail(opFail) {
    switch (opFail) {
        case 7680:
            return _native.Engine.STENCIL_OP_FAIL_S_KEEP;
        case 0:
            return _native.Engine.STENCIL_OP_FAIL_S_ZERO;
        case 7681:
            return _native.Engine.STENCIL_OP_FAIL_S_REPLACE;
        case 7682:
            return _native.Engine.STENCIL_OP_FAIL_S_INCR;
        case 7683:
            return _native.Engine.STENCIL_OP_FAIL_S_DECR;
        case 5386:
            return _native.Engine.STENCIL_OP_FAIL_S_INVERT;
        case 34055:
            return _native.Engine.STENCIL_OP_FAIL_S_INCRSAT;
        case 34056:
            return _native.Engine.STENCIL_OP_FAIL_S_DECRSAT;
        default:
            throw new Error(`Unsupported stencil OpFail mode: ${opFail}.`);
    }
}
export function getNativeStencilDepthFail(depthFail) {
    switch (depthFail) {
        case 7680:
            return _native.Engine.STENCIL_OP_FAIL_Z_KEEP;
        case 0:
            return _native.Engine.STENCIL_OP_FAIL_Z_ZERO;
        case 7681:
            return _native.Engine.STENCIL_OP_FAIL_Z_REPLACE;
        case 7682:
            return _native.Engine.STENCIL_OP_FAIL_Z_INCR;
        case 7683:
            return _native.Engine.STENCIL_OP_FAIL_Z_DECR;
        case 5386:
            return _native.Engine.STENCIL_OP_FAIL_Z_INVERT;
        case 34055:
            return _native.Engine.STENCIL_OP_FAIL_Z_INCRSAT;
        case 34056:
            return _native.Engine.STENCIL_OP_FAIL_Z_DECRSAT;
        default:
            throw new Error(`Unsupported stencil depthFail mode: ${depthFail}.`);
    }
}
export function getNativeStencilDepthPass(opPass) {
    switch (opPass) {
        case 7680:
            return _native.Engine.STENCIL_OP_PASS_Z_KEEP;
        case 0:
            return _native.Engine.STENCIL_OP_PASS_Z_ZERO;
        case 7681:
            return _native.Engine.STENCIL_OP_PASS_Z_REPLACE;
        case 7682:
            return _native.Engine.STENCIL_OP_PASS_Z_INCR;
        case 7683:
            return _native.Engine.STENCIL_OP_PASS_Z_DECR;
        case 5386:
            return _native.Engine.STENCIL_OP_PASS_Z_INVERT;
        case 34055:
            return _native.Engine.STENCIL_OP_PASS_Z_INCRSAT;
        case 34056:
            return _native.Engine.STENCIL_OP_PASS_Z_DECRSAT;
        default:
            throw new Error(`Unsupported stencil opPass mode: ${opPass}.`);
    }
}
export function getNativeAlphaMode(mode) {
    switch (mode) {
        case 0:
            return _native.Engine.ALPHA_DISABLE;
        case 1:
            return _native.Engine.ALPHA_ADD;
        case 2:
            return _native.Engine.ALPHA_COMBINE;
        case 3:
            return _native.Engine.ALPHA_SUBTRACT;
        case 4:
            return _native.Engine.ALPHA_MULTIPLY;
        case 5:
            return _native.Engine.ALPHA_MAXIMIZED;
        case 6:
            return _native.Engine.ALPHA_ONEONE;
        case 7:
            return _native.Engine.ALPHA_PREMULTIPLIED;
        case 8:
            return _native.Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
        case 9:
            return _native.Engine.ALPHA_INTERPOLATE;
        case 10:
            return _native.Engine.ALPHA_SCREENMODE;
        default:
            throw new Error(`Unsupported alpha mode: ${mode}.`);
    }
}
export function getNativeAttribType(type) {
    switch (type) {
        case VertexBuffer.BYTE:
            return _native.Engine.ATTRIB_TYPE_INT8;
        case VertexBuffer.UNSIGNED_BYTE:
            return _native.Engine.ATTRIB_TYPE_UINT8;
        case VertexBuffer.SHORT:
            return _native.Engine.ATTRIB_TYPE_INT16;
        case VertexBuffer.UNSIGNED_SHORT:
            return _native.Engine.ATTRIB_TYPE_UINT16;
        case VertexBuffer.FLOAT:
            return _native.Engine.ATTRIB_TYPE_FLOAT;
        default:
            throw new Error(`Unsupported attribute type: ${type}.`);
    }
}
//# sourceMappingURL=nativeHelpers.js.map