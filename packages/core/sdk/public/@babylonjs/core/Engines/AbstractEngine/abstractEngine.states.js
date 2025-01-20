import { AbstractEngine } from "../abstractEngine.js";

import "./abstractEngine.alpha.js";
AbstractEngine.prototype.getInputElement = function () {
    return this._renderingCanvas;
};
AbstractEngine.prototype.getDepthFunction = function () {
    return this._depthCullingState.depthFunc;
};
AbstractEngine.prototype.setDepthFunction = function (depthFunc) {
    this._depthCullingState.depthFunc = depthFunc;
};
AbstractEngine.prototype.setDepthFunctionToGreater = function () {
    this.setDepthFunction(516);
};
AbstractEngine.prototype.setDepthFunctionToGreaterOrEqual = function () {
    this.setDepthFunction(518);
};
AbstractEngine.prototype.setDepthFunctionToLess = function () {
    this.setDepthFunction(513);
};
AbstractEngine.prototype.setDepthFunctionToLessOrEqual = function () {
    this.setDepthFunction(515);
};
AbstractEngine.prototype.getDepthWrite = function () {
    return this._depthCullingState.depthMask;
};
AbstractEngine.prototype.setDepthWrite = function (enable) {
    this._depthCullingState.depthMask = enable;
};
AbstractEngine.prototype.getStencilBuffer = function () {
    return this._stencilState.stencilTest;
};
AbstractEngine.prototype.setStencilBuffer = function (enable) {
    this._stencilState.stencilTest = enable;
};
AbstractEngine.prototype.getStencilMask = function () {
    return this._stencilState.stencilMask;
};
AbstractEngine.prototype.setStencilMask = function (mask) {
    this._stencilState.stencilMask = mask;
};
AbstractEngine.prototype.getStencilFunction = function () {
    return this._stencilState.stencilFunc;
};
AbstractEngine.prototype.getStencilFunctionReference = function () {
    return this._stencilState.stencilFuncRef;
};
AbstractEngine.prototype.getStencilFunctionMask = function () {
    return this._stencilState.stencilFuncMask;
};
AbstractEngine.prototype.setStencilFunction = function (stencilFunc) {
    this._stencilState.stencilFunc = stencilFunc;
};
AbstractEngine.prototype.setStencilFunctionReference = function (reference) {
    this._stencilState.stencilFuncRef = reference;
};
AbstractEngine.prototype.setStencilFunctionMask = function (mask) {
    this._stencilState.stencilFuncMask = mask;
};
AbstractEngine.prototype.getStencilOperationFail = function () {
    return this._stencilState.stencilOpStencilFail;
};
AbstractEngine.prototype.getStencilOperationDepthFail = function () {
    return this._stencilState.stencilOpDepthFail;
};
AbstractEngine.prototype.getStencilOperationPass = function () {
    return this._stencilState.stencilOpStencilDepthPass;
};
AbstractEngine.prototype.setStencilOperationFail = function (operation) {
    this._stencilState.stencilOpStencilFail = operation;
};
AbstractEngine.prototype.setStencilOperationDepthFail = function (operation) {
    this._stencilState.stencilOpDepthFail = operation;
};
AbstractEngine.prototype.setStencilOperationPass = function (operation) {
    this._stencilState.stencilOpStencilDepthPass = operation;
};
AbstractEngine.prototype.cacheStencilState = function () {
    this._cachedStencilBuffer = this.getStencilBuffer();
    this._cachedStencilFunction = this.getStencilFunction();
    this._cachedStencilMask = this.getStencilMask();
    this._cachedStencilOperationPass = this.getStencilOperationPass();
    this._cachedStencilOperationFail = this.getStencilOperationFail();
    this._cachedStencilOperationDepthFail = this.getStencilOperationDepthFail();
    this._cachedStencilReference = this.getStencilFunctionReference();
};
AbstractEngine.prototype.restoreStencilState = function () {
    this.setStencilFunction(this._cachedStencilFunction);
    this.setStencilMask(this._cachedStencilMask);
    this.setStencilBuffer(this._cachedStencilBuffer);
    this.setStencilOperationPass(this._cachedStencilOperationPass);
    this.setStencilOperationFail(this._cachedStencilOperationFail);
    this.setStencilOperationDepthFail(this._cachedStencilOperationDepthFail);
    this.setStencilFunctionReference(this._cachedStencilReference);
};
AbstractEngine.prototype.setAlphaConstants = function (r, g, b, a) {
    this._alphaState.setAlphaBlendConstants(r, g, b, a);
};
AbstractEngine.prototype.getAlphaMode = function () {
    return this._alphaMode;
};
AbstractEngine.prototype.getAlphaEquation = function () {
    return this._alphaEquation;
};
//# sourceMappingURL=abstractEngine.states.js.map