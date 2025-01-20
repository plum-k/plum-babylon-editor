/**
 * @internal
 **/
export class DepthCullingState {
    /**
     * Initializes the state.
     * @param reset
     */
    constructor(reset = true) {
        this._isDepthTestDirty = false;
        this._isDepthMaskDirty = false;
        this._isDepthFuncDirty = false;
        this._isCullFaceDirty = false;
        this._isCullDirty = false;
        this._isZOffsetDirty = false;
        this._isFrontFaceDirty = false;
        if (reset) {
            this.reset();
        }
    }
    get isDirty() {
        return (this._isDepthFuncDirty ||
            this._isDepthTestDirty ||
            this._isDepthMaskDirty ||
            this._isCullFaceDirty ||
            this._isCullDirty ||
            this._isZOffsetDirty ||
            this._isFrontFaceDirty);
    }
    get zOffset() {
        return this._zOffset;
    }
    set zOffset(value) {
        if (this._zOffset === value) {
            return;
        }
        this._zOffset = value;
        this._isZOffsetDirty = true;
    }
    get zOffsetUnits() {
        return this._zOffsetUnits;
    }
    set zOffsetUnits(value) {
        if (this._zOffsetUnits === value) {
            return;
        }
        this._zOffsetUnits = value;
        this._isZOffsetDirty = true;
    }
    get cullFace() {
        return this._cullFace;
    }
    set cullFace(value) {
        if (this._cullFace === value) {
            return;
        }
        this._cullFace = value;
        this._isCullFaceDirty = true;
    }
    get cull() {
        return this._cull;
    }
    set cull(value) {
        if (this._cull === value) {
            return;
        }
        this._cull = value;
        this._isCullDirty = true;
    }
    get depthFunc() {
        return this._depthFunc;
    }
    set depthFunc(value) {
        if (this._depthFunc === value) {
            return;
        }
        this._depthFunc = value;
        this._isDepthFuncDirty = true;
    }
    get depthMask() {
        return this._depthMask;
    }
    set depthMask(value) {
        if (this._depthMask === value) {
            return;
        }
        this._depthMask = value;
        this._isDepthMaskDirty = true;
    }
    get depthTest() {
        return this._depthTest;
    }
    set depthTest(value) {
        if (this._depthTest === value) {
            return;
        }
        this._depthTest = value;
        this._isDepthTestDirty = true;
    }
    get frontFace() {
        return this._frontFace;
    }
    set frontFace(value) {
        if (this._frontFace === value) {
            return;
        }
        this._frontFace = value;
        this._isFrontFaceDirty = true;
    }
    reset() {
        this._depthMask = true;
        this._depthTest = true;
        this._depthFunc = null;
        this._cullFace = null;
        this._cull = null;
        this._zOffset = 0;
        this._zOffsetUnits = 0;
        this._frontFace = null;
        this._isDepthTestDirty = true;
        this._isDepthMaskDirty = true;
        this._isDepthFuncDirty = false;
        this._isCullFaceDirty = false;
        this._isCullDirty = false;
        this._isZOffsetDirty = true;
        this._isFrontFaceDirty = false;
    }
    apply(gl) {
        if (!this.isDirty) {
            return;
        }
        // Cull
        if (this._isCullDirty) {
            if (this.cull) {
                gl.enable(gl.CULL_FACE);
            }
            else {
                gl.disable(gl.CULL_FACE);
            }
            this._isCullDirty = false;
        }
        // Cull face
        if (this._isCullFaceDirty) {
            gl.cullFace(this.cullFace);
            this._isCullFaceDirty = false;
        }
        // Depth mask
        if (this._isDepthMaskDirty) {
            gl.depthMask(this.depthMask);
            this._isDepthMaskDirty = false;
        }
        // Depth test
        if (this._isDepthTestDirty) {
            if (this.depthTest) {
                gl.enable(gl.DEPTH_TEST);
            }
            else {
                gl.disable(gl.DEPTH_TEST);
            }
            this._isDepthTestDirty = false;
        }
        // Depth func
        if (this._isDepthFuncDirty) {
            gl.depthFunc(this.depthFunc);
            this._isDepthFuncDirty = false;
        }
        // zOffset
        if (this._isZOffsetDirty) {
            if (this.zOffset || this.zOffsetUnits) {
                gl.enable(gl.POLYGON_OFFSET_FILL);
                gl.polygonOffset(this.zOffset, this.zOffsetUnits);
            }
            else {
                gl.disable(gl.POLYGON_OFFSET_FILL);
            }
            this._isZOffsetDirty = false;
        }
        // Front face
        if (this._isFrontFaceDirty) {
            gl.frontFace(this.frontFace);
            this._isFrontFaceDirty = false;
        }
    }
}
//# sourceMappingURL=depthCullingState.js.map