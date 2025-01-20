import { AbstractEngine } from "../../abstractEngine.js";

import "../../AbstractEngine/abstractEngine.alpha.js";
import { ThinWebGPUEngine } from "../../thinWebGPUEngine.js";
ThinWebGPUEngine.prototype.setAlphaMode = function (mode, noDepthWriteChange = false) {
    if (this._alphaMode === mode && ((mode === 0 && !this._alphaState.alphaBlend) || (mode !== 0 && this._alphaState.alphaBlend))) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === 0;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.setDepthWrite(depthMask);
                this._cacheRenderPipeline.setDepthWriteEnabled(depthMask);
            }
        }
        return;
    }
    switch (mode) {
        case 0:
            this._alphaState.alphaBlend = false;
            break;
        case 7:
            this._alphaState.setAlphaBlendFunctionParameters(1, 771, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 8:
            this._alphaState.setAlphaBlendFunctionParameters(1, 771, 1, 771);
            this._alphaState.alphaBlend = true;
            break;
        case 2:
            this._alphaState.setAlphaBlendFunctionParameters(770, 771, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 6:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 1:
            this._alphaState.setAlphaBlendFunctionParameters(770, 1, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 3:
            this._alphaState.setAlphaBlendFunctionParameters(0, 769, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 4:
            this._alphaState.setAlphaBlendFunctionParameters(774, 0, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 5:
            this._alphaState.setAlphaBlendFunctionParameters(770, 769, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 9:
            this._alphaState.setAlphaBlendFunctionParameters(32769, 32770, 32771, 32772);
            this._alphaState.alphaBlend = true;
            break;
        case 10:
            this._alphaState.setAlphaBlendFunctionParameters(1, 769, 1, 771);
            this._alphaState.alphaBlend = true;
            break;
        case 11:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 12:
            this._alphaState.setAlphaBlendFunctionParameters(772, 1, 0, 0);
            this._alphaState.alphaBlend = true;
            break;
        case 13:
            this._alphaState.setAlphaBlendFunctionParameters(775, 769, 773, 771);
            this._alphaState.alphaBlend = true;
            break;
        case 14:
            this._alphaState.setAlphaBlendFunctionParameters(1, 771, 1, 771);
            this._alphaState.alphaBlend = true;
            break;
        case 15:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 0);
            this._alphaState.alphaBlend = true;
            break;
        case 16:
            this._alphaState.setAlphaBlendFunctionParameters(775, 769, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case 17:
            // Same as ALPHA_COMBINE but accumulates (1 - alpha) values in the alpha channel for a later readout in order independant transparency
            this._alphaState.setAlphaBlendFunctionParameters(770, 771, 1, 771);
            this._alphaState.alphaBlend = true;
            break;
    }
    if (!noDepthWriteChange) {
        this.setDepthWrite(mode === 0);
        this._cacheRenderPipeline.setDepthWriteEnabled(mode === 0);
    }
    this._alphaMode = mode;
    this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
ThinWebGPUEngine.prototype.setAlphaEquation = function (equation) {
    AbstractEngine.prototype.setAlphaEquation.call(this, equation);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
//# sourceMappingURL=engine.alpha.js.map