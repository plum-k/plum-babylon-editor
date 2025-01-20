import { AbstractEngine } from "../abstractEngine.js";
AbstractEngine.prototype.getInputElement = function () {
    return this._renderingCanvas;
};
AbstractEngine.prototype.getRenderingCanvasClientRect = function () {
    if (!this._renderingCanvas) {
        return null;
    }
    return this._renderingCanvas.getBoundingClientRect();
};
AbstractEngine.prototype.getInputElementClientRect = function () {
    if (!this._renderingCanvas) {
        return null;
    }
    return this.getInputElement().getBoundingClientRect();
};
AbstractEngine.prototype.getAspectRatio = function (viewportOwner, useScreen = false) {
    const viewport = viewportOwner.viewport;
    return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
};
AbstractEngine.prototype.getScreenAspectRatio = function () {
    return this.getRenderWidth(true) / this.getRenderHeight(true);
};
AbstractEngine.prototype._verifyPointerLock = function () {
    this._onPointerLockChange?.();
};
//# sourceMappingURL=abstractEngine.dom.js.map