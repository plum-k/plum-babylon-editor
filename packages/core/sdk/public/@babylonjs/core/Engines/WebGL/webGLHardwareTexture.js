/** @internal */
export class WebGLHardwareTexture {
    get underlyingResource() {
        return this._webGLTexture;
    }
    constructor(existingTexture = null, context) {
        // There can be multiple buffers for a single WebGL texture because different layers of a 2DArrayTexture / 3DTexture
        // or different faces of a cube texture can be bound to different render targets at the same time.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this._MSAARenderBuffers = null;
        this._context = context;
        if (!existingTexture) {
            existingTexture = context.createTexture();
            if (!existingTexture) {
                throw new Error("Unable to create webGL texture");
            }
        }
        this.set(existingTexture);
    }
    setUsage() { }
    set(hardwareTexture) {
        this._webGLTexture = hardwareTexture;
    }
    reset() {
        this._webGLTexture = null;
        this._MSAARenderBuffers = null;
    }
    addMSAARenderBuffer(buffer) {
        if (!this._MSAARenderBuffers) {
            this._MSAARenderBuffers = [];
        }
        this._MSAARenderBuffers.push(buffer);
    }
    releaseMSAARenderBuffers() {
        if (this._MSAARenderBuffers) {
            for (const buffer of this._MSAARenderBuffers) {
                this._context.deleteRenderbuffer(buffer);
            }
            this._MSAARenderBuffers = null;
        }
    }
    getMSAARenderBuffer(index = 0) {
        return this._MSAARenderBuffers?.[index] ?? null;
    }
    release() {
        this.releaseMSAARenderBuffers();
        if (this._webGLTexture) {
            this._context.deleteTexture(this._webGLTexture);
        }
        this.reset();
    }
}
//# sourceMappingURL=webGLHardwareTexture.js.map