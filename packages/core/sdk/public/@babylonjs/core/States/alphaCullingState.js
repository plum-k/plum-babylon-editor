/**
 * @internal
 **/
export class AlphaState {
    /**
     * Initializes the state.
     */
    constructor() {
        this._blendFunctionParameters = new Array(4);
        this._blendEquationParameters = new Array(2);
        this._blendConstants = new Array(4);
        this._isBlendConstantsDirty = false;
        this._alphaBlend = false;
        this._isAlphaBlendDirty = false;
        this._isBlendFunctionParametersDirty = false;
        this._isBlendEquationParametersDirty = false;
        this.reset();
    }
    get isDirty() {
        return this._isAlphaBlendDirty || this._isBlendFunctionParametersDirty || this._isBlendEquationParametersDirty;
    }
    get alphaBlend() {
        return this._alphaBlend;
    }
    set alphaBlend(value) {
        if (this._alphaBlend === value) {
            return;
        }
        this._alphaBlend = value;
        this._isAlphaBlendDirty = true;
    }
    setAlphaBlendConstants(r, g, b, a) {
        if (this._blendConstants[0] === r && this._blendConstants[1] === g && this._blendConstants[2] === b && this._blendConstants[3] === a) {
            return;
        }
        this._blendConstants[0] = r;
        this._blendConstants[1] = g;
        this._blendConstants[2] = b;
        this._blendConstants[3] = a;
        this._isBlendConstantsDirty = true;
    }
    setAlphaBlendFunctionParameters(value0, value1, value2, value3) {
        if (this._blendFunctionParameters[0] === value0 &&
            this._blendFunctionParameters[1] === value1 &&
            this._blendFunctionParameters[2] === value2 &&
            this._blendFunctionParameters[3] === value3) {
            return;
        }
        this._blendFunctionParameters[0] = value0;
        this._blendFunctionParameters[1] = value1;
        this._blendFunctionParameters[2] = value2;
        this._blendFunctionParameters[3] = value3;
        this._isBlendFunctionParametersDirty = true;
    }
    setAlphaEquationParameters(rgb, alpha) {
        if (this._blendEquationParameters[0] === rgb && this._blendEquationParameters[1] === alpha) {
            return;
        }
        this._blendEquationParameters[0] = rgb;
        this._blendEquationParameters[1] = alpha;
        this._isBlendEquationParametersDirty = true;
    }
    reset() {
        this._alphaBlend = false;
        this._blendFunctionParameters[0] = null;
        this._blendFunctionParameters[1] = null;
        this._blendFunctionParameters[2] = null;
        this._blendFunctionParameters[3] = null;
        this._blendEquationParameters[0] = null;
        this._blendEquationParameters[1] = null;
        this._blendConstants[0] = null;
        this._blendConstants[1] = null;
        this._blendConstants[2] = null;
        this._blendConstants[3] = null;
        this._isAlphaBlendDirty = true;
        this._isBlendFunctionParametersDirty = false;
        this._isBlendEquationParametersDirty = false;
        this._isBlendConstantsDirty = false;
    }
    apply(gl) {
        if (!this.isDirty) {
            return;
        }
        // Alpha blend
        if (this._isAlphaBlendDirty) {
            if (this._alphaBlend) {
                gl.enable(gl.BLEND);
            }
            else {
                gl.disable(gl.BLEND);
            }
            this._isAlphaBlendDirty = false;
        }
        // Alpha function
        if (this._isBlendFunctionParametersDirty) {
            gl.blendFuncSeparate(this._blendFunctionParameters[0], this._blendFunctionParameters[1], this._blendFunctionParameters[2], this._blendFunctionParameters[3]);
            this._isBlendFunctionParametersDirty = false;
        }
        // Alpha equation
        if (this._isBlendEquationParametersDirty) {
            gl.blendEquationSeparate(this._blendEquationParameters[0], this._blendEquationParameters[1]);
            this._isBlendEquationParametersDirty = false;
        }
        // Constants
        if (this._isBlendConstantsDirty) {
            gl.blendColor(this._blendConstants[0], this._blendConstants[1], this._blendConstants[2], this._blendConstants[3]);
            this._isBlendConstantsDirty = false;
        }
    }
}
//# sourceMappingURL=alphaCullingState.js.map