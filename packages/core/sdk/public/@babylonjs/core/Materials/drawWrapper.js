import { TimingTools } from "../Misc/timingTools.js";
/** @internal */
export class DrawWrapper {
    static GetEffect(effect) {
        return effect.getPipelineContext === undefined ? effect.effect : effect;
    }
    constructor(engine, createMaterialContext = true) {
        /**
         * @internal
         * Specifies if the effect was previously ready
         */
        this._wasPreviouslyReady = false;
        /**
         * @internal
         * Forces the code from bindForSubMesh to be fully run the next time it is called
         */
        this._forceRebindOnNextCall = true;
        /**
         * @internal
         * Specifies if the effect was previously using instances
         */
        this._wasPreviouslyUsingInstances = null;
        this.effect = null;
        this.defines = null;
        this.drawContext = engine.createDrawContext();
        if (createMaterialContext) {
            this.materialContext = engine.createMaterialContext();
        }
    }
    setEffect(effect, defines, resetContext = true) {
        this.effect = effect;
        if (defines !== undefined) {
            this.defines = defines;
        }
        if (resetContext) {
            this.drawContext?.reset();
        }
    }
    /**
     * Dispose the effect wrapper and its resources
     * @param immediate if the effect should be disposed immediately or on the next frame.
     * If dispose() is not called during a scene or engine dispose, we want to delay the dispose of the underlying effect. Mostly to give a chance to user code to reuse the effect in some way.
     */
    dispose(immediate = false) {
        if (this.effect) {
            const effect = this.effect;
            if (immediate) {
                effect.dispose();
            }
            else {
                TimingTools.SetImmediate(() => {
                    effect.getEngine().onEndFrameObservable.addOnce(() => {
                        effect.dispose();
                    });
                });
            }
            this.effect = null;
        }
        this.drawContext?.dispose();
    }
}
//# sourceMappingURL=drawWrapper.js.map