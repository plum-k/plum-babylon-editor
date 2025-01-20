import { MultiRenderTarget } from "./multiRenderTarget.js";
import { ImageProcessingPostProcess } from "../../PostProcesses/imageProcessingPostProcess.js";
/**
 * A multi render target designed to render the prepass.
 * Prepass is a scene component used to render information in multiple textures
 * alongside with the scene materials rendering.
 * Note : This is an internal class, and you should NOT need to instanciate this.
 * Only the `PrePassRenderer` should instanciate this class.
 * It is more likely that you need a regular `MultiRenderTarget`
 * @internal
 */
export class PrePassRenderTarget extends MultiRenderTarget {
    constructor(name, renderTargetTexture, size, count, scene, options) {
        super(name, size, count, scene, options);
        /**
         * @internal
         */
        this._beforeCompositionPostProcesses = [];
        /**
         * @internal
         */
        this._internalTextureDirty = false;
        /**
         * Is this render target enabled for prepass rendering
         */
        this.enabled = false;
        /**
         * Render target associated with this prePassRenderTarget
         * If this is `null`, it means this prePassRenderTarget is associated with the scene
         */
        this.renderTargetTexture = null;
        this.renderTargetTexture = renderTargetTexture;
    }
    /**
     * Creates a composition effect for this RT
     * @internal
     */
    _createCompositionEffect() {
        this.imageProcessingPostProcess = new ImageProcessingPostProcess("prePassComposition", 1, null, undefined, this._engine);
        this.imageProcessingPostProcess._updateParameters();
    }
    /**
     * Checks that the size of this RT is still adapted to the desired render size.
     * @internal
     */
    _checkSize() {
        const requiredWidth = this._engine.getRenderWidth(true);
        const requiredHeight = this._engine.getRenderHeight(true);
        const width = this.getRenderWidth();
        const height = this.getRenderHeight();
        if (width !== requiredWidth || height !== requiredHeight) {
            this.resize({ width: requiredWidth, height: requiredHeight });
            this._internalTextureDirty = true;
        }
    }
    /**
     * Changes the number of render targets in this MRT
     * Be careful as it will recreate all the data in the new texture.
     * @param count new texture count
     * @param options Specifies texture types and sampling modes for new textures
     * @param textureNames Specifies the names of the textures (optional)
     */
    updateCount(count, options, textureNames) {
        super.updateCount(count, options, textureNames);
        this._internalTextureDirty = true;
    }
    /**
     * Resets the post processes chains applied to this RT.
     * @internal
     */
    _resetPostProcessChain() {
        this._beforeCompositionPostProcesses.length = 0;
    }
    /**
     * Diposes this render target
     */
    dispose() {
        const scene = this._scene;
        super.dispose();
        if (scene && scene.prePassRenderer) {
            const index = scene.prePassRenderer.renderTargets.indexOf(this);
            if (index !== -1) {
                scene.prePassRenderer.renderTargets.splice(index, 1);
            }
        }
        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.dispose();
        }
        if (this.renderTargetTexture) {
            this.renderTargetTexture._prePassRenderTarget = null;
        }
        if (this._outputPostProcess) {
            this._outputPostProcess.autoClear = true;
            this._outputPostProcess.restoreDefaultInputTexture();
        }
    }
}
//# sourceMappingURL=prePassRenderTarget.js.map