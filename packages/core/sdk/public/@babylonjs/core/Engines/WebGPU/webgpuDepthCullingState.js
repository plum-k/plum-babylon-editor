import { DepthCullingState } from "../../States/depthCullingState.js";
/**
 * @internal
 **/
export class WebGPUDepthCullingState extends DepthCullingState {
    /**
     * Initializes the state.
     * @param cache
     */
    constructor(cache) {
        super(false);
        this._cache = cache;
        this.reset();
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
        this._cache.setDepthBiasSlopeScale(value);
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
        this._cache.setDepthBias(value);
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
        this._cache.setCullFace(value ?? 1);
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
        this._cache.setCullEnabled(!!value);
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
        this._cache.setDepthCompare(value);
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
        this._cache.setDepthWriteEnabled(value);
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
        this._cache.setDepthTestEnabled(value);
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
        this._cache.setFrontFace(value ?? 2);
    }
    reset() {
        super.reset();
        this._cache.resetDepthCullingState();
    }
    apply() {
        // nothing to do
    }
}
//# sourceMappingURL=webgpuDepthCullingState.js.map