import { WebGPUTextureHelper } from "./webgpuTextureHelper.js";
/** @internal */
export class WebGPURenderItemViewport {
    constructor(x, y, w, h) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.w = Math.floor(w);
        this.h = Math.floor(h);
    }
    run(renderPass) {
        renderPass.setViewport(this.x, this.y, this.w, this.h, 0, 1);
    }
    clone() {
        return new WebGPURenderItemViewport(this.x, this.y, this.w, this.h);
    }
}
/** @internal */
export class WebGPURenderItemScissor {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    run(renderPass) {
        renderPass.setScissorRect(this.x, this.y, this.w, this.h);
    }
    clone() {
        return new WebGPURenderItemScissor(this.x, this.y, this.w, this.h);
    }
}
/** @internal */
export class WebGPURenderItemStencilRef {
    constructor(ref) {
        this.ref = ref;
    }
    run(renderPass) {
        renderPass.setStencilReference(this.ref);
    }
    clone() {
        return new WebGPURenderItemStencilRef(this.ref);
    }
}
/** @internal */
export class WebGPURenderItemBlendColor {
    constructor(color) {
        this.color = color;
    }
    run(renderPass) {
        renderPass.setBlendConstant(this.color);
    }
    clone() {
        return new WebGPURenderItemBlendColor(this.color);
    }
}
/** @internal */
export class WebGPURenderItemBeginOcclusionQuery {
    constructor(query) {
        this.query = query;
    }
    run(renderPass) {
        renderPass.beginOcclusionQuery(this.query);
    }
    clone() {
        return new WebGPURenderItemBeginOcclusionQuery(this.query);
    }
}
/** @internal */
export class WebGPURenderItemEndOcclusionQuery {
    constructor() { }
    run(renderPass) {
        renderPass.endOcclusionQuery();
    }
    clone() {
        return new WebGPURenderItemEndOcclusionQuery();
    }
}
class WebGPURenderItemBundles {
    constructor() {
        this.bundles = [];
    }
    run(renderPass) {
        renderPass.executeBundles(this.bundles);
    }
    clone() {
        const cloned = new WebGPURenderItemBundles();
        cloned.bundles = this.bundles;
        return cloned;
    }
}
/** @internal */
export class WebGPUBundleList {
    constructor(device) {
        this.numDrawCalls = 0;
        this._device = device;
        this._list = new Array(10);
        this._listLength = 0;
    }
    addBundle(bundle) {
        if (!this._currentItemIsBundle) {
            const item = new WebGPURenderItemBundles();
            this._list[this._listLength++] = item;
            this._currentBundleList = item.bundles;
            this._currentItemIsBundle = true;
        }
        if (bundle) {
            this._currentBundleList.push(bundle);
        }
    }
    _finishBundle() {
        if (this._currentItemIsBundle && this._bundleEncoder) {
            this._currentBundleList.push(this._bundleEncoder.finish());
            this._bundleEncoder = undefined;
            this._currentItemIsBundle = false;
        }
    }
    addItem(item) {
        this._finishBundle();
        this._list[this._listLength++] = item;
        this._currentItemIsBundle = false;
    }
    getBundleEncoder(colorFormats, depthStencilFormat, sampleCount) {
        if (!this._currentItemIsBundle) {
            this.addBundle();
            this._bundleEncoder = this._device.createRenderBundleEncoder({
                colorFormats,
                depthStencilFormat,
                sampleCount: WebGPUTextureHelper.GetSample(sampleCount),
            });
        }
        return this._bundleEncoder;
    }
    close() {
        this._finishBundle();
    }
    run(renderPass) {
        this.close();
        for (let i = 0; i < this._listLength; ++i) {
            this._list[i].run(renderPass);
        }
    }
    reset() {
        this._listLength = 0;
        this._currentItemIsBundle = false;
        this.numDrawCalls = 0;
    }
    clone() {
        this.close();
        const cloned = new WebGPUBundleList(this._device);
        cloned._list = new Array(this._listLength);
        cloned._listLength = this._listLength;
        cloned.numDrawCalls = this.numDrawCalls;
        for (let i = 0; i < this._listLength; ++i) {
            cloned._list[i] = this._list[i].clone();
        }
        return cloned;
    }
}
//# sourceMappingURL=webgpuBundleList.js.map