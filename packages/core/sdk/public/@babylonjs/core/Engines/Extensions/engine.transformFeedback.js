import { Engine } from "../../Engines/engine.js";
/** @internal */
// eslint-disable-next-line no-var
export var _forceTransformFeedbackToBundle = true;
Engine.prototype.createTransformFeedback = function () {
    const transformFeedback = this._gl.createTransformFeedback();
    if (!transformFeedback) {
        throw new Error("Unable to create Transform Feedback");
    }
    return transformFeedback;
};
Engine.prototype.deleteTransformFeedback = function (value) {
    this._gl.deleteTransformFeedback(value);
};
Engine.prototype.bindTransformFeedback = function (value) {
    this._gl.bindTransformFeedback(this._gl.TRANSFORM_FEEDBACK, value);
};
Engine.prototype.beginTransformFeedback = function (usePoints = true) {
    this._gl.beginTransformFeedback(usePoints ? this._gl.POINTS : this._gl.TRIANGLES);
};
Engine.prototype.endTransformFeedback = function () {
    this._gl.endTransformFeedback();
};
Engine.prototype.setTranformFeedbackVaryings = function (program, value) {
    this._gl.transformFeedbackVaryings(program, value, this._gl.INTERLEAVED_ATTRIBS);
};
Engine.prototype.bindTransformFeedbackBuffer = function (value) {
    this._gl.bindBufferBase(this._gl.TRANSFORM_FEEDBACK_BUFFER, 0, value ? value.underlyingResource : null);
};
Engine.prototype.readTransformFeedbackBuffer = function (target) {
    this._gl.getBufferSubData(this._gl.TRANSFORM_FEEDBACK_BUFFER, 0, target);
};
//# sourceMappingURL=engine.transformFeedback.js.map