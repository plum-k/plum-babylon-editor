import { AbstractEngine } from "./abstractEngine.js";
import { Logger } from "../Misc/logger.js";
import { WebGPUTextureHelper } from "./WebGPU/webgpuTextureHelper.js";
import { WebGPUPerfCounter } from "./WebGPU/webgpuPerfCounter.js";

/**
 * The base engine class for WebGPU
 */
export class ThinWebGPUEngine extends AbstractEngine {
    constructor() {
        super(...arguments);
        // TODO WEBGPU remove those variables when code stabilized
        /** @internal */
        this.dbgShowShaderCode = false;
        /** @internal */
        this.dbgSanityChecks = true;
        /** @internal */
        this.dbgVerboseLogsNumFrames = 10;
        /** @internal */
        this.dbgLogIfNotDrawWrapper = true;
        /** @internal */
        this.dbgShowEmptyEnableEffectCalls = true;
        /** @internal */
        this.dbgVerboseLogsForFirstFrames = false;
        /** @internal */
        this._currentRenderPass = null;
        this._snapshotRenderingMode = 0;
        /** @internal */
        this._timestampIndex = 0;
        /** @internal */
        this._debugStackRenderPass = [];
    }
    /**
     * Enables or disables GPU timing measurements.
     * Note that this is only supported if the "timestamp-query" extension is enabled in the options.
     */
    get enableGPUTimingMeasurements() {
        return this._timestampQuery.enable;
    }
    set enableGPUTimingMeasurements(enable) {
        if (this._timestampQuery.enable === enable) {
            return;
        }
        this.gpuTimeInFrameForMainPass = enable ? new WebGPUPerfCounter() : undefined;
        this._timestampQuery.enable = enable;
    }
    _currentPassIsMainPass() {
        return this._currentRenderTarget === null;
    }
    /** @internal */
    _endCurrentRenderPass() {
        if (!this._currentRenderPass) {
            return 0;
        }
        if (this._debugStackRenderPass.length !== 0) {
            for (let i = 0; i < this._debugStackRenderPass.length; ++i) {
                this._currentRenderPass.popDebugGroup();
            }
        }
        const currentPassIndex = this._currentPassIsMainPass() ? 2 : 1;
        if (!this._snapshotRendering.endRenderPass(this._currentRenderPass) && !this.compatibilityMode) {
            this._bundleList.run(this._currentRenderPass);
            this._bundleList.reset();
        }
        this._currentRenderPass.end();
        this._timestampQuery.endPass(this._timestampIndex, (this._currentRenderTarget && this._currentRenderTarget.gpuTimeInFrame
            ? this._currentRenderTarget.gpuTimeInFrame
            : this.gpuTimeInFrameForMainPass));
        this._timestampIndex += 2;
        if (this.dbgVerboseLogsForFirstFrames) {
            if (this._count === undefined) {
                this._count = 0;
            }
            if (!this._count || this._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log("frame #" +
                    this._count +
                    " - " +
                    (currentPassIndex === 2 ? "main" : "render target") +
                    " end pass" +
                    (currentPassIndex === 1 ? " - internalTexture.uniqueId=" + this._currentRenderTarget?.texture?.uniqueId : ""));
            }
        }
        this._debugPopGroup?.(0);
        this._currentRenderPass = null;
        return currentPassIndex;
    }
    /**
     * @internal
     */
    _generateMipmaps(texture, commandEncoder) {
        commandEncoder = commandEncoder ?? this._renderEncoder;
        const gpuHardwareTexture = texture._hardwareTexture;
        if (!gpuHardwareTexture) {
            return;
        }
        if (commandEncoder === this._renderEncoder) {
            // We must close the current pass (if any) because we are going to use the render encoder to generate the mipmaps (so, we are going to create a new render pass)
            this._endCurrentRenderPass();
        }
        const format = texture._hardwareTexture.format;
        const mipmapCount = WebGPUTextureHelper.ComputeNumMipmapLevels(texture.width, texture.height);
        if (this.dbgVerboseLogsForFirstFrames) {
            if (this._count === undefined) {
                this._count = 0;
            }
            if (!this._count || this._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log("frame #" +
                    this._count +
                    " - generate mipmaps - width=" +
                    texture.width +
                    ", height=" +
                    texture.height +
                    ", isCube=" +
                    texture.isCube +
                    ", command encoder=" +
                    (commandEncoder === this._renderEncoder ? "render" : "copy"));
            }
        }
        if (texture.isCube) {
            this._textureHelper.generateCubeMipmaps(gpuHardwareTexture, format, mipmapCount, commandEncoder);
        }
        else {
            this._textureHelper.generateMipmaps(gpuHardwareTexture, format, mipmapCount, 0, texture.is3D, commandEncoder);
        }
    }
}
//# sourceMappingURL=thinWebGPUEngine.js.map