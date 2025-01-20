import { ILog2 } from "../../Maths/math.scalar.functions.js";
import { WebGPUTextureHelper } from "./webgpuTextureHelper.js";
/** @internal */
export class WebGPUHardwareTexture {
    get underlyingResource() {
        return this._webgpuTexture;
    }
    getMSAATexture(index) {
        return this._webgpuMSAATexture?.[index] ?? null;
    }
    setMSAATexture(texture, index) {
        if (!this._webgpuMSAATexture) {
            this._webgpuMSAATexture = [];
        }
        this._webgpuMSAATexture[index] = texture;
    }
    releaseMSAATexture(index) {
        if (this._webgpuMSAATexture) {
            if (index !== undefined) {
                this._engine._textureHelper.releaseTexture(this._webgpuMSAATexture[index]);
                delete this._webgpuMSAATexture[index];
            }
            else {
                for (const texture of this._webgpuMSAATexture) {
                    this._engine._textureHelper.releaseTexture(texture);
                }
                this._webgpuMSAATexture = null;
            }
        }
    }
    constructor(_engine, existingTexture = null) {
        this._engine = _engine;
        /** @internal */
        this._originalFormatIsRGB = false;
        this.format = "rgba8unorm" /* WebGPUConstants.TextureFormat.RGBA8Unorm */;
        this.textureUsages = 0;
        this.textureAdditionalUsages = 0;
        this._webgpuTexture = existingTexture;
        this._webgpuMSAATexture = null;
        this.view = null;
        this.viewForWriting = null;
    }
    set(hardwareTexture) {
        this._webgpuTexture = hardwareTexture;
    }
    setUsage(_textureSource, generateMipMaps, is2DArray, isCube, is3D, width, height, depth) {
        let viewDimension = "2d" /* WebGPUConstants.TextureViewDimension.E2d */;
        let arrayLayerCount = 1;
        if (isCube) {
            viewDimension = is2DArray ? "cube-array" /* WebGPUConstants.TextureViewDimension.CubeArray */ : "cube" /* WebGPUConstants.TextureViewDimension.Cube */;
            arrayLayerCount = 6 * (depth || 1);
        }
        else if (is3D) {
            viewDimension = "3d" /* WebGPUConstants.TextureViewDimension.E3d */;
            arrayLayerCount = 1;
        }
        else if (is2DArray) {
            viewDimension = "2d-array" /* WebGPUConstants.TextureViewDimension.E2dArray */;
            arrayLayerCount = depth;
        }
        const format = WebGPUTextureHelper.GetDepthFormatOnly(this.format);
        const aspect = WebGPUTextureHelper.HasDepthAndStencilAspects(this.format) ? "depth-only" /* WebGPUConstants.TextureAspect.DepthOnly */ : "all" /* WebGPUConstants.TextureAspect.All */;
        this.createView({
            label: `TextureView${is3D ? "3D" : isCube ? "Cube" : "2D"}${is2DArray ? "_Array" + arrayLayerCount : ""}_${width}x${height}_${generateMipMaps ? "wmips" : "womips"}_${this.format}_${viewDimension}`,
            format,
            dimension: viewDimension,
            mipLevelCount: generateMipMaps ? ILog2(Math.max(width, height)) + 1 : 1,
            baseArrayLayer: 0,
            baseMipLevel: 0,
            arrayLayerCount,
            aspect,
        });
    }
    createView(descriptor, createViewForWriting = false) {
        this.view = this._webgpuTexture.createView(descriptor);
        if (createViewForWriting && descriptor) {
            const saveNumMipMaps = descriptor.mipLevelCount;
            descriptor.mipLevelCount = 1;
            this.viewForWriting = this._webgpuTexture.createView(descriptor);
            descriptor.mipLevelCount = saveNumMipMaps;
        }
    }
    reset() {
        this._webgpuTexture = null;
        this._webgpuMSAATexture = null;
        this.view = null;
        this.viewForWriting = null;
    }
    release() {
        this._webgpuTexture?.destroy();
        this.releaseMSAATexture();
        this._copyInvertYTempTexture?.destroy();
        this.reset();
    }
}
//# sourceMappingURL=webgpuHardwareTexture.js.map