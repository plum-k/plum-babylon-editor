import { ThinWebGPUEngine } from "../../thinWebGPUEngine.js";
ThinWebGPUEngine.prototype.setDepthStencilTexture = function (channel, uniform, texture, name) {
    if (!texture || !texture.depthStencilTexture) {
        this._setTexture(channel, null, undefined, undefined, name);
    }
    else {
        this._setTexture(channel, texture, false, true, name);
    }
};
//# sourceMappingURL=engine.renderTargetTexture.js.map