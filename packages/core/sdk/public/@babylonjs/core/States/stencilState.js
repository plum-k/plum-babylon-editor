
/**
 * @internal
 **/
export class StencilState {
    constructor() {
        this.reset();
    }
    reset() {
        this.enabled = false;
        this.mask = 0xff;
        this.func = StencilState.ALWAYS;
        this.funcRef = 1;
        this.funcMask = 0xff;
        this.opStencilFail = StencilState.KEEP;
        this.opDepthFail = StencilState.KEEP;
        this.opStencilDepthPass = StencilState.REPLACE;
    }
    get stencilFunc() {
        return this.func;
    }
    set stencilFunc(value) {
        this.func = value;
    }
    get stencilFuncRef() {
        return this.funcRef;
    }
    set stencilFuncRef(value) {
        this.funcRef = value;
    }
    get stencilFuncMask() {
        return this.funcMask;
    }
    set stencilFuncMask(value) {
        this.funcMask = value;
    }
    get stencilOpStencilFail() {
        return this.opStencilFail;
    }
    set stencilOpStencilFail(value) {
        this.opStencilFail = value;
    }
    get stencilOpDepthFail() {
        return this.opDepthFail;
    }
    set stencilOpDepthFail(value) {
        this.opDepthFail = value;
    }
    get stencilOpStencilDepthPass() {
        return this.opStencilDepthPass;
    }
    set stencilOpStencilDepthPass(value) {
        this.opStencilDepthPass = value;
    }
    get stencilMask() {
        return this.mask;
    }
    set stencilMask(value) {
        this.mask = value;
    }
    get stencilTest() {
        return this.enabled;
    }
    set stencilTest(value) {
        this.enabled = value;
    }
}
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
StencilState.ALWAYS = 519;
/** Passed to stencilOperation to specify that stencil value must be kept */
StencilState.KEEP = 7680;
/** Passed to stencilOperation to specify that stencil value must be replaced */
StencilState.REPLACE = 7681;
//# sourceMappingURL=stencilState.js.map