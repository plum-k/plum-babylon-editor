import { ThinEngine } from "../../Engines/thinEngine.js";
// back-compat
import { allocateAndCopyTypedBuffer } from "../../Engines/abstractEngine.functions.js";
export { allocateAndCopyTypedBuffer };
ThinEngine.prototype._readTexturePixelsSync = function (texture, width, height, faceIndex = -1, level = 0, buffer = null, flushRenderer = true, noDataConversion = false, x = 0, y = 0) {
    const gl = this._gl;
    if (!gl) {
        throw new Error("Engine does not have gl rendering context.");
    }
    if (!this._dummyFramebuffer) {
        const dummy = gl.createFramebuffer();
        if (!dummy) {
            throw new Error("Unable to create dummy framebuffer");
        }
        this._dummyFramebuffer = dummy;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._dummyFramebuffer);
    if (faceIndex > -1) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._hardwareTexture?.underlyingResource, level);
    }
    else {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture?.underlyingResource, level);
    }
    let readType = texture.type !== undefined ? this._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;
    if (!noDataConversion) {
        switch (readType) {
            case gl.UNSIGNED_BYTE:
                if (!buffer) {
                    buffer = new Uint8Array(4 * width * height);
                }
                readType = gl.UNSIGNED_BYTE;
                break;
            default:
                if (!buffer) {
                    buffer = new Float32Array(4 * width * height);
                }
                readType = gl.FLOAT;
                break;
        }
    }
    else if (!buffer) {
        buffer = allocateAndCopyTypedBuffer(texture.type, 4 * width * height);
    }
    if (flushRenderer) {
        this.flushFramebuffer();
    }
    gl.readPixels(x, y, width, height, gl.RGBA, readType, buffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._currentFramebuffer);
    return buffer;
};
ThinEngine.prototype._readTexturePixels = function (texture, width, height, faceIndex = -1, level = 0, buffer = null, flushRenderer = true, noDataConversion = false, x = 0, y = 0) {
    return Promise.resolve(this._readTexturePixelsSync(texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion, x, y));
};
//# sourceMappingURL=engine.readTexture.js.map