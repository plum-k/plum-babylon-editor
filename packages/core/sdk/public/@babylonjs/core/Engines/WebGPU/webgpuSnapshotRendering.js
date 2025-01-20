
/** @internal */
export class WebGPUSnapshotRendering {
    constructor(engine, renderingMode, bundleList) {
        this._record = false;
        this._play = false;
        this._playBundleListIndex = 0;
        this._allBundleLists = [];
        this._enabled = false;
        this._engine = engine;
        this._mode = renderingMode;
        this._bundleList = bundleList;
    }
    get enabled() {
        return this._enabled;
    }
    get play() {
        return this._play;
    }
    get record() {
        return this._record;
    }
    set enabled(activate) {
        this._allBundleLists.length = 0;
        this._record = this._enabled = activate;
        this._play = false;
        if (activate) {
            this._modeSaved = this._mode;
            this._mode = 0; // need to reset to standard for the recording pass to avoid some code being bypassed
        }
    }
    get mode() {
        return this._mode;
    }
    set mode(mode) {
        if (this._record) {
            this._modeSaved = mode;
        }
        else {
            this._mode = mode;
        }
    }
    endRenderPass(currentRenderPass) {
        if (!this._record && !this._play) {
            // Snapshot rendering mode is not enabled
            return false;
        }
        let bundleList;
        if (this._record) {
            bundleList = this._bundleList.clone();
            this._allBundleLists.push(bundleList);
            this._bundleList.reset();
        }
        else {
            // We are playing the snapshot
            if (this._playBundleListIndex >= this._allBundleLists.length) {
                throw new Error(`Invalid playBundleListIndex! Your snapshot is no longer valid for the current frame, you should recreate a new one. playBundleListIndex=${this._playBundleListIndex}, allBundleLists.length=${this._allBundleLists.length}}`);
            }
            bundleList = this._allBundleLists[this._playBundleListIndex++];
        }
        bundleList.run(currentRenderPass);
        if (this._mode === 1) {
            this._engine._reportDrawCall(bundleList.numDrawCalls);
        }
        return true;
    }
    endFrame() {
        if (this._record) {
            // We stop recording and switch to replay mode for the next frames
            this._record = false;
            this._play = true;
            this._mode = this._modeSaved;
        }
        this._playBundleListIndex = 0;
    }
    reset() {
        if (this._record) {
            this._mode = this._modeSaved;
        }
        this.enabled = false;
        this.enabled = true;
    }
}
//# sourceMappingURL=webgpuSnapshotRendering.js.map