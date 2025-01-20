import { __decorate } from "../tslib.es6.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";

import { serialize } from "../Misc/decorators.js";
/**
 * Class that holds the different stencil states of a material
 * Usage example: https://playground.babylonjs.com/#CW5PRI#10
 */
export class MaterialStencilState {
    /**
     * Creates a material stencil state instance
     */
    constructor() {
        this.reset();
    }
    /**
     * Resets all the stencil states to default values
     */
    reset() {
        this.enabled = false;
        this.mask = 0xff;
        this.func = 519;
        this.funcRef = 1;
        this.funcMask = 0xff;
        this.opStencilFail = 7680;
        this.opDepthFail = 7680;
        this.opStencilDepthPass = 7681;
    }
    /**
     * Gets or sets the stencil function
     */
    get func() {
        return this._func;
    }
    set func(value) {
        this._func = value;
    }
    /**
     * Gets or sets the stencil function reference
     */
    get funcRef() {
        return this._funcRef;
    }
    set funcRef(value) {
        this._funcRef = value;
    }
    /**
     * Gets or sets the stencil function mask
     */
    get funcMask() {
        return this._funcMask;
    }
    set funcMask(value) {
        this._funcMask = value;
    }
    /**
     * Gets or sets the operation when the stencil test fails
     */
    get opStencilFail() {
        return this._opStencilFail;
    }
    set opStencilFail(value) {
        this._opStencilFail = value;
    }
    /**
     * Gets or sets the operation when the depth test fails
     */
    get opDepthFail() {
        return this._opDepthFail;
    }
    set opDepthFail(value) {
        this._opDepthFail = value;
    }
    /**
     * Gets or sets the operation when the stencil+depth test succeeds
     */
    get opStencilDepthPass() {
        return this._opStencilDepthPass;
    }
    set opStencilDepthPass(value) {
        this._opStencilDepthPass = value;
    }
    /**
     * Gets or sets the stencil mask
     */
    get mask() {
        return this._mask;
    }
    set mask(value) {
        this._mask = value;
    }
    /**
     * Enables or disables the stencil test
     */
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        this._enabled = value;
    }
    /**
     * Get the current class name, useful for serialization or dynamic coding.
     * @returns "MaterialStencilState"
     */
    getClassName() {
        return "MaterialStencilState";
    }
    /**
     * Makes a duplicate of the current configuration into another one.
     * @param stencilState defines stencil state where to copy the info
     */
    copyTo(stencilState) {
        SerializationHelper.Clone(() => stencilState, this);
    }
    /**
     * Serializes this stencil configuration.
     * @returns - An object with the serialized config.
     */
    serialize() {
        return SerializationHelper.Serialize(this);
    }
    /**
     * Parses a stencil state configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    parse(source, scene, rootUrl) {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
__decorate([
    serialize()
], MaterialStencilState.prototype, "func", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "funcRef", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "funcMask", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "opStencilFail", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "opDepthFail", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "opStencilDepthPass", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "mask", null);
__decorate([
    serialize()
], MaterialStencilState.prototype, "enabled", null);
//# sourceMappingURL=materialStencilState.js.map