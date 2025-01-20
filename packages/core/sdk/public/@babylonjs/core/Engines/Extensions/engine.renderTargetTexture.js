import { ThinEngine } from "../../Engines/thinEngine.js";
ThinEngine.prototype.setDepthStencilTexture = function (channel, uniform, texture, name) {
    if (channel === undefined) {
        return;
    }
    if (uniform) {
        this._boundUniforms[channel] = uniform;
    }
    if (!texture || !texture.depthStencilTexture) {
        this._setTexture(channel, null, undefined, undefined, name);
    }
    else {
        this._setTexture(channel, texture, false, true, name);
    }
};
//# sourceMappingURL=engine.renderTargetTexture.js.map