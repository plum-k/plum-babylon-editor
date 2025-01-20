
/**
 * Configuration needed for prepass-capable materials
 */
export class PrePassConfiguration {
    constructor() {
        /**
         * Previous world matrices of meshes carrying this material
         * Used for computing velocity
         */
        this.previousWorldMatrices = {};
        /**
         * Previous bones of meshes carrying this material
         * Used for computing velocity
         */
        this.previousBones = {};
    }
    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    static AddUniforms(uniforms) {
        uniforms.push("previousWorld", "previousViewProjection", "mPreviousBones");
    }
    /**
     * Add the required samplers to the current list.
     * @param samplers defines the current sampler list.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static AddSamplers(samplers) {
        // pass
    }
    /**
     * Binds the material data.
     * @param effect defines the effect to update
     * @param scene defines the scene the material belongs to.
     * @param mesh The mesh
     * @param world World matrix of this mesh
     * @param isFrozen Is the material frozen
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bindForSubMesh(effect, scene, mesh, world, isFrozen) {
        if (scene.prePassRenderer && scene.prePassRenderer.enabled && scene.prePassRenderer.currentRTisSceneRT) {
            if (scene.prePassRenderer.getIndex(2) !== -1 ||
                scene.prePassRenderer.getIndex(11) !== -1) {
                if (!this.previousWorldMatrices[mesh.uniqueId]) {
                    this.previousWorldMatrices[mesh.uniqueId] = world.clone();
                }
                if (!this.previousViewProjection) {
                    this.previousViewProjection = scene.getTransformMatrix().clone();
                    this.currentViewProjection = scene.getTransformMatrix().clone();
                }
                const engine = scene.getEngine();
                if (this.currentViewProjection.updateFlag !== scene.getTransformMatrix().updateFlag) {
                    // First update of the prepass configuration for this rendering pass
                    this._lastUpdateFrameId = engine.frameId;
                    this.previousViewProjection.copyFrom(this.currentViewProjection);
                    this.currentViewProjection.copyFrom(scene.getTransformMatrix());
                }
                else if (this._lastUpdateFrameId !== engine.frameId) {
                    // The scene transformation did not change from the previous frame (so no camera motion), we must update previousViewProjection accordingly
                    this._lastUpdateFrameId = engine.frameId;
                    this.previousViewProjection.copyFrom(this.currentViewProjection);
                }
                effect.setMatrix("previousWorld", this.previousWorldMatrices[mesh.uniqueId]);
                effect.setMatrix("previousViewProjection", this.previousViewProjection);
                this.previousWorldMatrices[mesh.uniqueId] = world.clone();
            }
        }
    }
}
//# sourceMappingURL=prePassConfiguration.js.map