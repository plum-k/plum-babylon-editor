import { AbstractEngine } from "../abstractEngine.js";
AbstractEngine.prototype.createDepthStencilTexture = function (size, options, rtWrapper) {
    if (options.isCube) {
        const width = size.width || size;
        return this._createDepthStencilCubeTexture(width, options);
    }
    else {
        return this._createDepthStencilTexture(size, options, rtWrapper);
    }
};
//# sourceMappingURL=abstractEngine.texture.js.map